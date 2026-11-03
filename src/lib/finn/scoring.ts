import type { Announcement, AnnouncementCategory, Priority, ScoredAnnouncement, Settings } from "./types";

/** Base importance of each category, 0–1. */
export const CATEGORY_WEIGHT: Record<AnnouncementCategory, number> = {
  Results: 0.9,
  "Credit rating": 0.85,
  "M&A": 0.8,
  Fundraising: 0.75,
  Litigation: 0.7,
  Management: 0.6,
  Capex: 0.6,
  Dividend: 0.3,
  Other: 0.15,
};

export const DEFAULT_WEIGHTS: Settings["weights"] = {
  category: 20,
  materiality: 25,
  earnings: 15,
  balanceSheet: 12,
  strategic: 10,
  recency: 10,
  portfolio: 8,
};

/** Recency decays linearly to 0 over 7 days. */
export function recencyFactor(filedAt: string, now: Date): number {
  const hours = (now.getTime() - new Date(filedAt).getTime()) / 36e5;
  if (hours <= 0) return 1;
  return Math.max(0, 1 - hours / (24 * 7));
}

export function priorityOf(score: number): Priority {
  if (score >= 70) return "critical";
  if (score >= 45) return "important";
  return "low";
}

export function scoreAnnouncement(
  a: Announcement,
  ctx: { now: Date; inPortfolio: boolean; weights: Settings["weights"] },
): ScoredAnnouncement {
  const w = ctx.weights;
  const parts: Record<string, number> = {
    Category: CATEGORY_WEIGHT[a.category] * w.category,
    Materiality: a.factors.materiality * w.materiality,
    "Earnings impact": a.factors.earningsImpact * w.earnings,
    "Balance sheet": a.factors.balanceSheetImpact * w.balanceSheet,
    Strategic: a.factors.strategic * w.strategic,
    Recency: recencyFactor(a.filedAt, ctx.now) * w.recency,
    Portfolio: (ctx.inPortfolio ? 1 : 0.3) * w.portfolio,
  };
  const total = Object.values(w).reduce((s, v) => s + v, 0) || 1;
  const raw = Object.values(parts).reduce((s, v) => s + v, 0);
  const score = Math.round((raw / total) * 100);
  const breakdown = Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, Math.round((v / total) * 100)]));
  return { ...a, score, priority: priorityOf(score), breakdown };
}

const DRIVER_LABEL: Record<string, string> = {
  Category: "filing type",
  Materiality: "financial materiality",
  "Earnings impact": "earnings impact",
  "Balance sheet": "balance-sheet impact",
  Strategic: "strategic importance",
  Recency: "recency",
  Portfolio: "portfolio exposure",
};

/** Top contributors to a score, largest first, as plain-language labels with points. */
export function rankDrivers(a: Pick<ScoredAnnouncement, "breakdown">, n = 3): { label: string; points: number }[] {
  return Object.entries(a.breakdown)
    .filter(([, v]) => v > 0)
    .sort((x, y) => y[1] - x[1])
    .slice(0, n)
    .map(([k, v]) => ({ label: DRIVER_LABEL[k] ?? k, points: v }));
}

export function priorityThreshold(p: Priority): string {
  return p === "critical" ? "score ≥ 70" : p === "important" ? "score 45–69" : "score < 45";
}
