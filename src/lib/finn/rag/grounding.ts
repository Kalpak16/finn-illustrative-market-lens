import type { Claim, GuidanceRow } from "./types";

/**
 * Post-generation guards. Every claim the language model returns must:
 *  1. cite at least one passage that was actually retrieved, and
 *  2. only contain numbers that appear in its cited passages or in the
 *     deterministic calculations supplied to the model.
 * Claims failing either check are dropped — they are never shown.
 */

export function numbersIn(s: string): string[] {
  return (s.match(/-?\d[\d,]*\.?\d*/g) ?? [])
    .map((n) => n.replace(/,/g, "").replace(/\.$/, ""))
    .filter((n) => n.replace("-", "").length > 0)
    // ignore single digits (list markers, "Q2", etc.) and four-digit years
    .filter((n) => !/^-?\d$/.test(n) && !/^(19|20)\d{2}$/.test(n));
}

function normalisedNumbers(texts: string[]): Set<string> {
  const set = new Set<string>();
  for (const t of texts) for (const n of numbersIn(t)) {
    set.add(n);
    const f = Number(n);
    if (Number.isFinite(f)) {
      set.add(String(f));
      set.add(f.toFixed(1));
      set.add(String(Math.round(f)));
    }
  }
  return set;
}

export interface GuardResult<T> {
  kept: T[];
  dropped: { item: T; reason: string }[];
}

export function guardClaims(claims: Claim[], passages: Record<string, string>, calcTexts: string[]): GuardResult<Claim> {
  const calcNums = normalisedNumbers(calcTexts);
  const kept: Claim[] = [];
  const dropped: GuardResult<Claim>["dropped"] = [];
  for (const c of claims) {
    const cites = [...new Set(c.citations.filter((id) => id in passages))];
    if (!c.text.trim()) continue;
    if (cites.length === 0) {
      dropped.push({ item: c, reason: "No valid citation to a retrieved passage" });
      continue;
    }
    const allowed = normalisedNumbers(cites.map((id) => passages[id]));
    const bad = numbersIn(c.text).filter((n) => !allowed.has(n) && !allowed.has(String(Number(n))) && !calcNums.has(n) && !calcNums.has(String(Number(n))));
    if (bad.length) {
      dropped.push({ item: c, reason: `Number(s) not found in cited evidence: ${bad.join(", ")}` });
      continue;
    }
    kept.push({ text: c.text.trim(), citations: cites });
  }
  return { kept, dropped };
}

export function guardGuidance(rows: GuidanceRow[], passages: Record<string, string>, calcTexts: string[]): GuardResult<GuidanceRow> {
  const kept: GuidanceRow[] = [];
  const dropped: GuardResult<GuidanceRow>["dropped"] = [];
  for (const r of rows) {
    const st = guardClaims([{ text: r.statement, citations: r.statementCitations }], passages, calcTexts);
    if (!st.kept.length) {
      dropped.push({ item: r, reason: st.dropped[0]?.reason ?? "Statement not grounded" });
      continue;
    }
    const oc = guardClaims([{ text: r.outcome, citations: r.outcomeCitations }], passages, calcTexts);
    // An outcome without evidence downgrades to "Not yet measurable" rather than inventing a verdict.
    if (!oc.kept.length) {
      kept.push({ ...r, statementCitations: st.kept[0].citations, outcome: "Insufficient source evidence.", outcomeCitations: [], status: "Not yet measurable" });
    } else {
      kept.push({ ...r, statementCitations: st.kept[0].citations, outcomeCitations: oc.kept[0].citations });
    }
  }
  return { kept, dropped };
}
