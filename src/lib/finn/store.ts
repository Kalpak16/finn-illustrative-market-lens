import { useMemo, useSyncExternalStore } from "react";
import { DEFAULT_RULES, evaluateRule } from "./alerts";
import { ANNOUNCEMENTS, DEMO_REFERENCE_NOW } from "./data/announcements";
import { PORTFOLIO_SEED, WATCHLIST_SEED, findCompany } from "./data/companies";
import { getMarketSnapshot, hasMarketData } from "./data/market";
import { DEFAULT_WEIGHTS, scoreAnnouncement } from "./scoring";
import type { AlertRule, Holding, Settings } from "./types";

/** Local persistence (demo mode). Swap for a Cloud-backed adapter when enabled. */
export interface FinnState {
  holdings: Holding[];
  watchlist: string[];
  rules: AlertRule[];
  settings: Settings;
}

const KEY = "finn.state.v1";

export const DEFAULT_STATE: FinnState = {
  holdings: PORTFOLIO_SEED,
  watchlist: WATCHLIST_SEED,
  rules: DEFAULT_RULES,
  settings: { priceThresholdPct: 3, volumeMultiple: 2, weights: DEFAULT_WEIGHTS, displayName: "Investor" },
};

let state: FinnState = DEFAULT_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt storage */
  }
}

export function setState(update: (s: FinnState) => FinnState) {
  load();
  state = update(state);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l());
}

export function resetDemo() {
  setState(() => DEFAULT_STATE);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useFinnState(): FinnState {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state;
    },
    () => DEFAULT_STATE,
  );
}

export const actions = {
  /** Returns false when no demo market data exists for the symbol (cannot be valued). */
  addHolding(ticker: string): boolean {
    const t = ticker.trim().toUpperCase();
    const c = findCompany(t);
    if (!c || !hasMarketData(t)) return false;
    setState((s) =>
      s.holdings.some((h) => h.ticker === t) ? s : { ...s, holdings: [...s.holdings, { ...c, quantity: 100 }] },
    );
    return true;
  },
  removeHolding(ticker: string) {
    setState((s) => ({ ...s, holdings: s.holdings.filter((h) => h.ticker !== ticker) }));
  },
  addWatch(ticker: string) {
    const t = ticker.trim().toUpperCase();
    setState((s) => (s.watchlist.includes(t) ? s : { ...s, watchlist: [...s.watchlist, t] }));
  },
  removeWatch(ticker: string) {
    setState((s) => ({ ...s, watchlist: s.watchlist.filter((w) => w !== ticker) }));
  },
  upsertRule(rule: AlertRule) {
    setState((s) => ({
      ...s,
      rules: s.rules.some((r) => r.id === rule.id) ? s.rules.map((r) => (r.id === rule.id ? rule : r)) : [...s.rules, rule],
    }));
  },
  deleteRule(id: string) {
    setState((s) => ({ ...s, rules: s.rules.filter((r) => r.id !== id) }));
  },
  updateSettings(patch: Partial<Settings>) {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  },
};

/** Demo "now" is pinned to the seeded data window so recency stays meaningful. */
export const DEMO_NOW = new Date(DEMO_REFERENCE_NOW);

export function useScoredAnnouncements() {
  const { holdings, watchlist, settings } = useFinnState();
  return useMemo(() => {
    const port = new Set(holdings.map((h) => h.ticker));
    const tracked = new Set([...port, ...watchlist]);
    return ANNOUNCEMENTS.filter((a) => tracked.has(a.ticker))
      .map((a) => scoreAnnouncement(a, { now: DEMO_NOW, inPortfolio: port.has(a.ticker), weights: settings.weights }))
      .sort((a, b) => b.score - a.score);
  }, [holdings, watchlist, settings.weights]);
}

export function useTriggeredAlerts() {
  const { holdings, watchlist, rules } = useFinnState();
  const anns = useScoredAnnouncements();
  return useMemo(() => {
    // Tracked companies plus any company named explicitly in a rule.
    const tickers = new Set([...holdings.map((h) => h.ticker), ...watchlist, ...rules.flatMap((r) => r.tickers)]);
    const companies = [...tickers]
      .filter(hasMarketData)
      .map((t) => holdings.find((h) => h.ticker === t) ?? findCompany(t))
      .filter((c): c is NonNullable<typeof c> => !!c);
    return rules.flatMap((r) => evaluateRule(r, companies, anns, getMarketSnapshot));
  }, [holdings, watchlist, rules, anns]);
}
