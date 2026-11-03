import type { ResearchReport, SourceRef } from "./types";

export interface AssistantAnswer {
  intent: string;
  lines: string[];
  table?: { head: string[]; rows: string[][] };
  citations: SourceRef[];
  next: string;
}

/**
 * Grounded demo assistant: classifies intent, retrieves the matching sections of the
 * loaded report, computes simple ratios and answers ONLY from that evidence.
 * Swap `answer` for an LLM + RAG call when Lovable Cloud AI is enabled.
 */
export function answer(q: string, r: ResearchReport | undefined): AssistantAnswer {
  const s = q.toLowerCase();
  if (!r) {
    return {
      intent: "No documents",
      lines: ["Insufficient source evidence. No primary documents are loaded for this company yet, so FINN will not answer from general knowledge."],
      citations: [],
      next: "Add an official annual report or results URL in the Sources panel.",
    };
  }
  const snap = r.snapshot.source;

  if (/cash|convert|ocf|fcf|accrual/.test(s)) {
    const rows = r.annual.map((y) => [y.period, fmt(y.pat), fmt(y.ocf), `${((y.ocf / y.pat) * 100).toFixed(0)}%`, fmt(y.fcf)]);
    const avg = r.annual.reduce((a, y) => a + y.ocf / y.pat, 0) / r.annual.length;
    return {
      intent: "Cash quality",
      lines: [
        `Average OCF/PAT over ${r.annual.length} years: ${(avg * 100).toFixed(0)}%.`,
        avg >= 1 ? "Accounting profits are translating into operating cash." : "Operating cash persistently trails reported profit — investigate working capital and accruals.",
      ],
      table: { head: ["Year", "PAT", "OCF", "OCF/PAT", "FCF"], rows },
      citations: [snap],
      next: "Which working-capital items explain the gap between PAT and OCF?",
    };
  }
  if (/promis|guidance|said|commentary|contradict|narrative|deliver/.test(s)) {
    return {
      intent: "Narrative vs numbers",
      lines: [
        `${r.narrative.filter((n) => n.status === "Missed").length} missed, ${r.narrative.filter((n) => n.status === "Delivered").length} delivered of ${r.narrative.length} tracked statements.`,
      ],
      table: { head: ["Statement", "Outcome", "Status"], rows: r.narrative.map((n) => [n.statement, n.outcome, n.status]) },
      citations: r.narrative.map((n) => n.evidence),
      next: "Has management acknowledged the missed commitments on the latest call?",
    };
  }
  if (/margin/.test(s)) {
    const g = r.guidance.filter((x) => /margin/i.test(x.topic));
    return {
      intent: "Margin guidance",
      lines: [
        ...r.annual.slice(-3).map((y) => `${y.period}: EBITDA margin ${((y.ebitda / y.revenue) * 100).toFixed(1)}%`),
        ...g.map((x) => `${x.type} guidance — ${x.text}`),
      ],
      citations: [snap, ...g.map((x) => x.source)],
      next: "What cost levers has management identified to defend margins?",
    };
  }
  if (/quarter|latest|changed|last four|compare/.test(s)) {
    const qs = r.quarterly;
    const a = qs[qs.length - 1];
    const b = qs[qs.length - 2];
    return {
      intent: "Quarterly comparison",
      lines: [
        `${a.period} vs ${b.period}: revenue ${chg(a.revenue, b.revenue)}, EBITDA ${chg(a.ebitda, b.ebitda)}, PAT ${chg(a.pat, b.pat)}.`,
      ],
      table: {
        head: ["Quarter", "Revenue", "EBITDA", "Margin", "PAT"],
        rows: qs.map((x) => [x.period, fmt(x.revenue), fmt(x.ebitda), `${((x.ebitda / x.revenue) * 100).toFixed(1)}%`, fmt(x.pat)]),
      },
      citations: [snap],
      next: "Is the change driven by a single segment?",
    };
  }
  if (/debt|balance|leverage|working capital/.test(s)) {
    return {
      intent: "Balance sheet",
      lines: r.balanceNotes,
      table: { head: ["Item", "Value", "Flag"], rows: r.balanceSheet.map((b) => [b.label, b.value, b.flag ?? "—"]) },
      citations: [snap],
      next: "What are the debt maturities over the next 24 months?",
    };
  }
  if (/bull|bear|risk|case/.test(s)) {
    return {
      intent: "Bull vs bear",
      lines: [...r.bull.map((b) => `Bull — ${b}`), ...r.bear.map((b) => `Bear — ${b}`)],
      citations: r.sources.slice(0, 3),
      next: r.questions[0],
    };
  }
  return {
    intent: "Overview",
    lines: [r.business.description, ...r.trajectoryNotes.slice(0, 2)],
    citations: [r.business.source, snap],
    next: "Try: “Is revenue growth translating into cash?”",
  };
}

const fmt = (n: number | null) => (n == null ? "Not available" : Math.round(n).toLocaleString("en-IN"));
const chg = (a: number, b: number) => `${a >= b ? "+" : ""}${(((a - b) / b) * 100).toFixed(1)}%`;
