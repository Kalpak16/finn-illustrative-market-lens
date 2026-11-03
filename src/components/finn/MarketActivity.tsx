import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { companyName } from "@/lib/finn/data/companies";
import { getMarketSnapshot } from "@/lib/finn/data/market";
import { compact, inr, pct, toneOf } from "@/lib/finn/format";
import type { MarketSnapshot } from "@/lib/finn/types";
import { Sparkline } from "./PriceChart";
import { DemoBadge, Section } from "./primitives";

export function detectUnusual(m: MarketSnapshot, priceT: number, volT: number): string | null {
  const bigMove = Math.abs(m.changePct) >= priceT;
  const bigVol = m.volumeMultiple >= volT;
  if (bigMove && bigVol) return `Price moved ${pct(m.changePct)} on ${m.volumeMultiple.toFixed(1)}x average volume — unusual price + volume combination.`;
  if (bigMove) return `Price moved ${pct(m.changePct)}, beyond the ±${priceT}% threshold.`;
  if (bigVol) return `Volume ${m.volumeMultiple.toFixed(1)}x the 20-day average (threshold ${volT}x) without a large price move.`;
  return null;
}

export function MarketActivity({ tickers, priceT, volT }: { tickers: string[]; priceT: number; volT: number }) {
  const rows = tickers
    .map((t) => ({ m: getMarketSnapshot(t), why: "" }))
    .map((r) => ({ ...r, why: detectUnusual(r.m, priceT, volT) ?? "" }))
    .filter((r) => r.why)
    .sort((a, b) => b.m.volumeMultiple - a.m.volumeMultiple);
  const asOf = rows[0]?.m.asOf;
  return (
    <Section
      title={
        <span className="flex items-center gap-2">
          <Activity className="size-4 text-primary" /> Unusual market activity
        </span>
      }
      action={<span className="text-[11px] text-muted-foreground">EOD {asOf ?? "—"} · ±{priceT}% / {volT}x vol</span>}
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No holdings crossed your thresholds on the last trading day.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ m, why }) => (
            <li key={m.ticker} className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center justify-between gap-2">
                <Link to="/company/$ticker" params={{ ticker: m.ticker }} className="min-w-0">
                  <div className="num text-sm font-semibold hover:text-primary">{m.ticker}</div>
                  <div className="truncate text-xs text-muted-foreground">{companyName(m.ticker)}</div>
                </Link>
                <Sparkline data={m.history.slice(-30)} positive={m.changePct >= 0} />
                <div className="text-right">
                  <div className="num text-sm">{inr(m.close)}</div>
                  <div className={`num text-xs ${toneOf(m.changePct)}`}>{pct(m.changePct)}</div>
                </div>
              </div>
              <div className="num mt-2 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                <span>Vol {compact(m.volume)}</span>
                <span>20D avg {compact(Math.round(m.avgVolume20))}</span>
                <span className={m.volumeMultiple >= volT ? "text-warning" : ""}>{m.volumeMultiple.toFixed(2)}x</span>
              </div>
              <p className="mt-1.5 text-xs text-foreground/80">{why}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        <DemoBadge label="Synthetic EOD" /> End-of-day values, not real-time quotes.
      </div>
    </Section>
  );
}
