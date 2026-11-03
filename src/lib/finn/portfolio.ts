import { getMarketSnapshot } from "./data/market";
import type { Holding } from "./types";

export function portfolioTotals(holdings: Holding[]) {
  let value = 0;
  let prev = 0;
  for (const h of holdings) {
    const m = getMarketSnapshot(h.ticker);
    value += h.quantity * m.close;
    prev += h.quantity * m.prevClose;
  }
  const change = value - prev;
  return { value, change, changePct: prev ? (change / prev) * 100 : 0 };
}

export function portfolioHistory(holdings: Holding[], days = 90) {
  const snaps = holdings.map((h) => ({ q: h.quantity, s: getMarketSnapshot(h.ticker) }));
  if (!snaps.length) return [];
  const len = snaps[0].s.history.length;
  return snaps[0].s.history.slice(-days).map((bar, i) => {
    const idx = len - Math.min(days, len) + i;
    return { date: bar.date, value: Math.round(snaps.reduce((sum, x) => sum + x.q * (x.s.history[idx]?.close ?? 0), 0)) };
  });
}
