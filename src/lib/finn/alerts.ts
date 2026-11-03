import type { AlertRule, Company, MarketSnapshot, ScoredAnnouncement, TriggeredAlert } from "./types";

export const DEFAULT_RULES: AlertRule[] = [
  {
    id: "r1",
    name: "Infosys results or 2x volume",
    enabled: true,
    tickers: ["INFY"],
    sectors: [],
    categories: ["Results"],
    minPriority: null,
    minPriceMovePct: null,
    minVolumeMultiple: 2,
    match: "any",
  },
  {
    id: "r2",
    name: "Any critical development in portfolio",
    enabled: true,
    tickers: [],
    sectors: [],
    categories: [],
    minPriority: 70,
    minPriceMovePct: null,
    minVolumeMultiple: null,
    match: "any",
  },
  {
    id: "r3",
    name: "Auto sector moves > 4%",
    enabled: false,
    tickers: [],
    sectors: ["Automobiles"],
    categories: [],
    minPriority: null,
    minPriceMovePct: 4,
    minVolumeMultiple: null,
    match: "any",
  },
];

/**
 * Evaluate one rule against available data. Scope (tickers/sectors) filters companies;
 * conditions (category, priority, price, volume) combine with ANY/ALL.
 */
export function evaluateRule(
  rule: AlertRule,
  companies: Company[],
  announcements: ScoredAnnouncement[],
  market: (ticker: string) => MarketSnapshot,
): TriggeredAlert[] {
  if (!rule.enabled) return [];
  const scope = companies.filter(
    (c) => (rule.tickers.length === 0 || rule.tickers.includes(c.ticker)) && (rule.sectors.length === 0 || rule.sectors.includes(c.sector)),
  );
  const out: TriggeredAlert[] = [];
  for (const c of scope) {
    const reasons: string[] = [];
    const checks: boolean[] = [];
    const anns = announcements.filter((a) => a.ticker === c.ticker);
    const m = market(c.ticker);

    if (rule.categories.length) {
      const hit = anns.filter((a) => rule.categories.includes(a.category));
      checks.push(hit.length > 0);
      hit.forEach((a) => reasons.push(`${a.category} filing: “${a.headline}”`));
    }
    if (rule.minPriority != null) {
      const hit = anns.filter((a) => a.score >= rule.minPriority!);
      checks.push(hit.length > 0);
      hit.forEach((a) => reasons.push(`Priority ${a.score} ≥ ${rule.minPriority}: “${a.headline}”`));
    }
    if (rule.minPriceMovePct != null) {
      const ok = Math.abs(m.changePct) >= rule.minPriceMovePct;
      checks.push(ok);
      if (ok) reasons.push(`Price moved ${m.changePct.toFixed(2)}% on ${m.asOf} (threshold ±${rule.minPriceMovePct}%)`);
    }
    if (rule.minVolumeMultiple != null) {
      const ok = m.volumeMultiple >= rule.minVolumeMultiple;
      checks.push(ok);
      if (ok) reasons.push(`Volume ${m.volumeMultiple.toFixed(2)}x 20-day average on ${m.asOf} (threshold ${rule.minVolumeMultiple}x)`);
    }
    if (checks.length === 0) continue;
    const fired = rule.match === "all" ? checks.every(Boolean) : checks.some(Boolean);
    if (fired) out.push({ ruleId: rule.id, ruleName: rule.name, ticker: c.ticker, reasons, at: m.asOf });
  }
  return out;
}
