import type { Chunk, DocMeta, Passage } from "./types";

/** Financial synonym expansion so "profit" finds "PAT", etc. */
const SYNONYMS: Record<string, string[]> = {
  revenue: ["revenue", "sales", "turnover", "income from operations", "top line"],
  profit: ["profit", "pat", "net income", "earnings"],
  pat: ["pat", "profit after tax", "net profit"],
  ebitda: ["ebitda", "operating profit", "operating margin"],
  margin: ["margin", "margins", "ebitda", "operating"],
  cash: ["cash", "cash flow", "operating activities", "free cash"],
  debt: ["debt", "borrowings", "leverage", "net debt"],
  guidance: ["guidance", "expect", "target", "outlook", "aim", "plan", "will", "guide"],
  capex: ["capex", "capital expenditure", "investment", "capacity"],
  growth: ["growth", "grew", "increase", "yoy"],
  risk: ["risk", "headwind", "pressure", "decline", "challenge", "uncertain"],
};

const STOP = new Set("the a an of in on for to and or is are was were be by with at as from that this it its what how has have did does do which their our we".split(" "));

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9%.\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

export function expandQuery(q: string): string[] {
  const base = tokenize(q);
  const extra = base.flatMap((t) => SYNONYMS[t] ?? []).flatMap(tokenize);
  return [...new Set([...base, ...extra])];
}

/** Deterministic BM25 retrieval over chunks. */
export function retrieve(query: string, chunks: Chunk[], docs: DocMeta[], k = 8): Passage[] {
  const terms = expandQuery(query);
  if (!terms.length || !chunks.length) return [];
  const toks = chunks.map((c) => tokenize(c.text));
  const avgdl = toks.reduce((s, t) => s + t.length, 0) / toks.length || 1;
  const df = new Map<string, number>();
  for (const t of toks) for (const term of new Set(t)) df.set(term, (df.get(term) ?? 0) + 1);
  const N = chunks.length;
  const k1 = 1.4;
  const b = 0.75;
  const docById = new Map(docs.map((d) => [d.id, d]));
  const scored = chunks.map((c, i) => {
    const tf = new Map<string, number>();
    for (const t of toks[i]) tf.set(t, (tf.get(t) ?? 0) + 1);
    let score = 0;
    for (const term of terms) {
      const f = tf.get(term);
      if (!f) continue;
      const n = df.get(term) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * toks[i].length) / avgdl)));
    }
    // numbers matter in financial passages
    if (/\d[\d,]*\.?\d*/.test(c.text)) score *= 1.05;
    return { c, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ c, score }) => {
      const d = docById.get(c.docId);
      return { ...c, score, docName: d?.name ?? "Unknown document", kind: d?.kind ?? "annual_report", period: d?.period ?? "", url: d?.url };
    });
}
