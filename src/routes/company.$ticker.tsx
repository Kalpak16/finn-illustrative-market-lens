import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AnnouncementCard, AnnouncementSheet } from "@/components/finn/Announcement";
import { Assistant } from "@/components/finn/Assistant";
import { PriceVolumeChart } from "@/components/finn/PriceChart";
import { CompanyAvatar, DemoBadge, Section, Stat } from "@/components/finn/primitives";
import { Button } from "@/components/ui/button";
import { findCompany } from "@/lib/finn/data/companies";
import { ANNOUNCEMENTS } from "@/lib/finn/data/announcements";
import { getMarketSnapshot, hasMarketData } from "@/lib/finn/data/market";
import { getResearch } from "@/lib/finn/data/research";
import { compact, inr, pct, toneOf } from "@/lib/finn/format";
import { scoreAnnouncement } from "@/lib/finn/scoring";
import { actions, DEMO_NOW, useFinnState } from "@/lib/finn/store";
import type { ScoredAnnouncement } from "@/lib/finn/types";

export const Route = createFileRoute("/company/$ticker")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.ticker.toUpperCase()} — Company profile · FINN` },
      { name: "description", content: `Filings, EOD price and volume, and research for NSE: ${params.ticker.toUpperCase()}.` },
      { property: "og:title", content: `${params.ticker.toUpperCase()} — FINN` },
      { property: "og:description", content: "Company intelligence profile." },
    ],
  }),
  component: CompanyPage,
});

function CompanyPage() {
  const ticker = Route.useParams().ticker.toUpperCase();
  const { holdings, watchlist, settings } = useFinnState();
  const [open, setOpen] = useState<ScoredAnnouncement | null>(null);
  const c = findCompany(ticker);
  const hasData = hasMarketData(ticker);
  const m = getMarketSnapshot(ticker);
  const inPort = holdings.some((h) => h.ticker === ticker);
  const anns = ANNOUNCEMENTS.filter((a) => a.ticker === ticker)
    .map((a) => scoreAnnouncement(a, { now: DEMO_NOW, inPortfolio: inPort, weights: settings.weights }))
    .sort((a, b) => b.score - a.score);
  const report = getResearch(ticker);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <CompanyAvatar ticker={ticker} className="size-11" />
        <div className="mr-auto">
          <h1 className="text-xl font-semibold">{c?.name ?? ticker}</h1>
          <div className="text-sm text-muted-foreground">
            <span className="num">NSE: {ticker}</span>
            {c && ` · ${c.sector}`}
            {!c && " · not in demo universe"}
          </div>
        </div>
        {!inPort && hasData && (
          <Button variant="secondary" size="sm" onClick={() => (actions.addHolding(ticker), toast.success(`${ticker} added to portfolio`))}>
            <Plus className="size-3.5" /> Portfolio
          </Button>
        )}
        {!inPort && !watchlist.includes(ticker) && (
          <Button variant="secondary" size="sm" onClick={() => (actions.addWatch(ticker), toast.success(`${ticker} added to watchlist`))}>
            <Plus className="size-3.5" /> Watchlist
          </Button>
        )}
        <Button size="sm" asChild>
          <Link to="/research" search={{ ticker }}>
            Open research
          </Link>
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-5">
          {!hasData ? (
            <Section title="Price & volume (EOD)">
              <p className="text-sm text-muted-foreground">Market data not available for {ticker} in demo mode. No market-data source is connected, so FINN shows no price rather than inventing one.</p>
            </Section>
          ) : (
          <Section title="Price & volume (EOD)" action={<DemoBadge label="Synthetic EOD" />}>
            <div className="mb-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label={`Close · ${m.asOf}`} value={inr(m.close)} />
              <Stat label="Daily change" value={<span className={toneOf(m.changePct)}>{pct(m.changePct)}</span>} />
              <Stat label="Volume" value={compact(m.volume)} sub={`20D avg ${compact(Math.round(m.avgVolume20))}`} />
              <Stat label="Volume multiple" value={<span className={m.volumeMultiple >= settings.volumeMultiple ? "text-warning" : ""}>{m.volumeMultiple.toFixed(2)}x</span>} />
            </div>
            <PriceVolumeChart data={m.history} />
            <div className="mt-1 text-[11px] text-muted-foreground">{m.source}</div>
          </Section>
          )}

          <div>
            <h2 className="mb-3 text-base font-semibold">Developments</h2>
            {anns.length ? (
              <div className="space-y-3">
                {anns.map((a) => (
                  <AnnouncementCard key={a.id} a={a} onOpen={() => setOpen(a)} />
                ))}
              </div>
            ) : (
              <div className="panel p-4 text-sm text-muted-foreground">No sample announcements loaded for {ticker}.</div>
            )}
          </div>
        </div>
        <aside>
          <Assistant report={report} ticker={ticker} />
        </aside>
      </div>
      <AnnouncementSheet a={open} onClose={() => setOpen(null)} />
    </div>
  );
}
