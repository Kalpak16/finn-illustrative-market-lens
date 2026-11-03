import type { Calculation, Chunk, DocMeta, MetricFact, MetricName } from "./types";

/**
 * Deterministic metric extraction. Finds "<label> ... <number>" patterns and
 * records the unit and reporting period found in the same chunk. Nothing here
 * is produced by the language model.
 */
const LABELS: { metric: MetricName; re: RegExp }[] = [
  { metric: "Revenue", re: /\b(revenue from operations|total revenue|revenue|net sales|total income from operations)\b/i },
  { metric: "EBITDA", re: /\b(ebitda)\b/i },
  { metric: "PBT", re: /\b(profit before tax|pbt)\b/i },
  { metric: "PAT", re: /\b(profit after tax|net profit|profit for the (?:year|period|quarter)|pat)\b/i },
  { metric: "EPS", re: /\b(earnings per share|eps)\b/i },
  { metric: "Operating cash flow", re: /\b(net cash (?:generated |flow )?from operating activities|cash flow from operations|operating cash flow)\b/i },
  { metric: "Capex", re: /\b(capital expenditure|capex)\b/i },
  { metric: "Total debt", re: /\b(total debt|total borrowings|gross debt)\b/i },
  { metric: "Cash", re: /\b(cash and cash equivalents)\b/i },
];

const NUM = /(?:₹|rs\.?|inr)?\s*\(?(-?\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|-?\d+(?:\.\d+)?)\)?\s*(crore|cr\.?|lakh|million|mn|billion|bn)?/i;

export function detectUnit(text: string): string {
  const t = text.toLowerCase();
  if (/(₹|rs\.?|inr)\s*(in\s*)?crores?|\bin\s*crores?|crore/.test(t)) return "₹ crore";
  if (/(₹|rs\.?|inr)\s*(in\s*)?lakhs?|\blakhs?\b/.test(t)) return "₹ lakh";
  if (/(₹|rs\.?|inr)\s*(in\s*)?millions?|\bmillions?\b|\bmn\b/.test(t)) return "₹ million";
  if (/billions?|\bbn\b/.test(t)) return "₹ billion";
  return "unknown";
}

export function detectPeriod(text: string): string | null {
  const q = text.match(/\bQ([1-4])\s*[- ]?\s*FY\s*'?(\d{2,4})\b/i);
  if (q) return `Q${q[1]} FY${q[2].slice(-2)}`;
  const fy = text.match(/\bFY\s*'?(\d{2}(?:\d{2})?)(?:\s*-\s*\d{2})?\b/i);
  if (fy) return `FY${fy[1].slice(-2)}`;
  const ye = text.match(/year ended\s+(?:31(?:st)?\s+march|march\s+31(?:st)?),?\s+(\d{4})/i);
  if (ye) return `FY${ye[1].slice(-2)}`;
  const qe = text.match(/quarter ended\s+(?:\d{1,2}(?:st|nd|rd|th)?\s+)?(\w+)\s+(?:\d{1,2},?\s+)?(\d{4})/i);
  if (qe) return `Quarter ended ${qe[1]} ${qe[2]}`;
  return null;
}

function detectBasis(text: string): MetricFact["basis"] {
  if (/consolidated/i.test(text)) return "Consolidated";
  if (/standalone/i.test(text)) return "Standalone";
  return "Not stated";
}

export function parseNumber(s: string): number {
  const neg = s.startsWith("(") || s.startsWith("-");
  const n = Number(s.replace(/[(),\s-]/g, ""));
  return neg ? -n : n;
}

export function extractMetrics(chunks: Chunk[], docs: DocMeta[]): MetricFact[] {
  const docById = new Map(docs.map((d) => [d.id, d]));
  const out: MetricFact[] = [];
  const seen = new Set<string>();
  for (const c of chunks) {
    const doc = docById.get(c.docId);
    const chunkUnit = detectUnit(c.text);
    const chunkPeriod = detectPeriod(c.text);
    const basis = detectBasis(c.text);
    for (const line of c.text.split(/\n|(?<=\.)\s/)) {
      for (const { metric, re } of LABELS) {
        const m = line.match(re);
        if (!m || m.index == null) continue;
        const after = line.slice(m.index + m[0].length, m.index + m[0].length + 80);
        const n = after.match(NUM);
        if (!n) continue;
        const raw = n[1];
        const value = parseNumber(raw);
        // skip years, percentages and tiny note references
        if (!Number.isFinite(value) || (/^(19|20)\d{2}$/.test(raw) && !raw.includes(","))) continue;
        if (after.slice((n.index ?? 0) + n[0].length).trimStart().startsWith("%")) continue;
        if (Math.abs(value) < 1 && metric !== "EPS") continue;
        const inlineUnit = n[2] ? detectUnit(n[2]) : null;
        const unit = metric === "EPS" ? "₹ per share" : inlineUnit ?? chunkUnit;
        const period = detectPeriod(line) ?? chunkPeriod ?? doc?.period ?? "Not stated";
        const key = `${metric}|${value}|${period}|${c.docId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          id: `m${out.length}`,
          metric,
          value,
          unit,
          period,
          periodSource: detectPeriod(line) || chunkPeriod ? "detected" : "document",
          basis,
          chunkId: c.id,
          docId: c.docId,
          page: c.page,
          excerpt: line.trim().slice(0, 220),
        });
        break; // one metric per line
      }
    }
  }
  return out;
}

const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

/** Ordering key for periods like FY24, Q2 FY25. */
function periodKey(p: string): number | null {
  const q = p.match(/^Q([1-4]) FY(\d{2})$/);
  if (q) return Number(q[2]) * 10 + Number(q[1]);
  const fy = p.match(/^FY(\d{2})$/);
  if (fy) return Number(fy[1]) * 10 + 5;
  return null;
}

/**
 * Deterministic calculations from extracted facts. Only combines facts that share
 * unit and basis — never mixes consolidated/standalone or crore/lakh.
 */
export function computeCalculations(facts: MetricFact[]): Calculation[] {
  const calcs: Calculation[] = [];
  const pick = (metric: MetricName) => {
    // first fact per (period, unit, basis)
    const m = new Map<string, MetricFact>();
    for (const f of facts.filter((x) => x.metric === metric && x.unit !== "unknown")) {
      const k = `${f.period}|${f.unit}|${f.basis}`;
      if (!m.has(k)) m.set(k, f);
    }
    return [...m.values()];
  };
  const rev = pick("Revenue");
  const ebitda = pick("EBITDA");
  const pat = pick("PAT");
  const ocf = pick("Operating cash flow");

  const pair = (a: MetricFact[], b: MetricFact[]) =>
    a.flatMap((x) => b.filter((y) => y.period === x.period && y.unit === x.unit && y.basis === x.basis).slice(0, 1).map((y) => [x, y] as const));

  for (const [e, r] of pair(ebitda, rev)) {
    if (r.value) calcs.push({ label: `EBITDA margin · ${r.period}`, value: `${((e.value / r.value) * 100).toFixed(1)}%`, formula: `${fmt(e.value)} ÷ ${fmt(r.value)} (${r.unit}, ${r.basis})`, inputs: [e.id, r.id] });
  }
  for (const [p, r] of pair(pat, rev)) {
    if (r.value) calcs.push({ label: `PAT margin · ${r.period}`, value: `${((p.value / r.value) * 100).toFixed(1)}%`, formula: `${fmt(p.value)} ÷ ${fmt(r.value)} (${r.unit}, ${r.basis})`, inputs: [p.id, r.id] });
  }
  for (const [o, p] of pair(ocf, pat)) {
    if (p.value) calcs.push({ label: `OCF / PAT · ${p.period}`, value: `${((o.value / p.value) * 100).toFixed(0)}%`, formula: `${fmt(o.value)} ÷ ${fmt(p.value)} (${p.unit}, ${p.basis})`, inputs: [o.id, p.id] });
  }
  // growth between comparable periods
  for (const [name, list] of [["Revenue", rev], ["EBITDA", ebitda], ["PAT", pat]] as const) {
    const groups = new Map<string, MetricFact[]>();
    for (const f of list) {
      if (periodKey(f.period) == null) continue;
      const g = `${f.unit}|${f.basis}|${f.period.startsWith("Q") ? "Q" : "FY"}`;
      groups.set(g, [...(groups.get(g) ?? []), f]);
    }
    for (const g of groups.values()) {
      const s = g.sort((a, b) => periodKey(a.period)! - periodKey(b.period)!);
      for (let i = 1; i < s.length; i++) {
        const a = s[i - 1];
        const b = s[i];
        if (!a.value) continue;
        calcs.push({ label: `${name} growth · ${a.period} → ${b.period}`, value: `${(((b.value - a.value) / Math.abs(a.value)) * 100).toFixed(1)}%`, formula: `(${fmt(b.value)} − ${fmt(a.value)}) ÷ ${fmt(Math.abs(a.value))}`, inputs: [a.id, b.id] });
      }
    }
  }
  return calcs;
}
