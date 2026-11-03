import type { MarketSnapshot, PriceBar } from "../types";

/**
 * SYNTHETIC end-of-day market data for demo mode.
 * Generated deterministically from the ticker so values are stable across reloads.
 * Never presented as live or real exchange prices.
 */
export const DEMO_MARKET_SOURCE = "Synthetic EOD (demo) — not real market data";
export const DEMO_AS_OF = "2026-11-02";

const BASE_PRICE: Record<string, number> = {
  RELIANCE: 1420, HDFCBANK: 1710, ICICIBANK: 1290, INFY: 1580, TCS: 3620, WIPRO: 270,
  LT: 3650, BHARTIARTL: 1880, ITC: 425, TATAMOTORS: 720, MARUTI: 12400, SUNPHARMA: 1760,
  TITAN: 3450, NTPC: 345, ADANIENT: 2480, ASIANPAINT: 2390, SBIN: 820, ZOMATO: 265,
  TRENT: 5400, BEL: 395, HAL: 4600, POLYCAB: 6900, VARUNBEV: 520,
};

/** Final-day overrides that create the demo "unusual activity" examples. */
const LAST_DAY_SHOCK: Record<string, { move: number; volMult: number }> = {
  TATAMOTORS: { move: -4.6, volMult: 3.1 },
  ADANIENT: { move: 5.2, volMult: 2.6 },
  INFY: { move: 1.4, volMult: 2.4 },
  RELIANCE: { move: 2.1, volMult: 1.7 },
  SUNPHARMA: { move: -3.4, volMult: 1.3 },
};

function seeded(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function tradingDays(end: string, n: number): string[] {
  const out: string[] = [];
  const d = new Date(end + "T00:00:00Z");
  while (out.length < n) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) out.unshift(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return out;
}

const cache = new Map<string, MarketSnapshot>();

export function avg(nums: number[]) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

/** Pure helper: compute snapshot fields from an OHLCV history (oldest → newest). */
export function computeSnapshot(ticker: string, history: PriceBar[], source: string): MarketSnapshot {
  const last = history[history.length - 1];
  const prev = history[history.length - 2] ?? last;
  const prior20 = history.slice(-21, -1).map((b) => b.volume);
  const avgVolume20 = avg(prior20);
  return {
    ticker,
    asOf: last.date,
    close: last.close,
    prevClose: prev.close,
    changePct: ((last.close - prev.close) / prev.close) * 100,
    volume: last.volume,
    avgVolume20,
    volumeMultiple: avgVolume20 ? last.volume / avgVolume20 : 0,
    history,
    source,
  };
}

export function getMarketSnapshot(ticker: string): MarketSnapshot {
  const t = ticker.toUpperCase();
  const hit = cache.get(t);
  if (hit) return hit;
  const rnd = seeded(t);
  const days = tradingDays(DEMO_AS_OF, 120);
  let price = (BASE_PRICE[t] ?? 200 + Math.floor(rnd() * 3000)) * (0.88 + rnd() * 0.08);
  const baseVol = Math.round(200000 + rnd() * 6_000_000);
  const drift = (rnd() - 0.42) * 0.0025;
  const history: PriceBar[] = days.map((date, i) => {
    const isLast = i === days.length - 1;
    const shock = LAST_DAY_SHOCK[t];
    let move = drift + (rnd() - 0.5) * 0.026;
    let vol = baseVol * (0.7 + rnd() * 0.6);
    if (isLast) {
      if (shock) {
        move = shock.move / 100;
        vol = baseVol * shock.volMult;
      } else {
        move = (rnd() - 0.5) * 0.03;
      }
    }
    price = price * (1 + move);
    return { date, close: Math.round(price * 100) / 100, volume: Math.round(vol) };
  });
  const snap = computeSnapshot(t, history, DEMO_MARKET_SOURCE);
  cache.set(t, snap);
  return snap;
}

/** Demo market data exists only for symbols in the seeded universe. */
export function hasMarketData(ticker: string): boolean {
  return ticker.toUpperCase() in BASE_PRICE;
}
