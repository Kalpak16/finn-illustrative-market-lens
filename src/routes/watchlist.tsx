import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CompanySearch } from "@/components/finn/CompanySearch";
import { Sparkline } from "@/components/finn/PriceChart";
import { DemoBadge, EmptyState, PageHeader } from "@/components/finn/primitives";
import { Button } from "@/components/ui/button";
import { companyName } from "@/lib/finn/data/companies";
import { getMarketSnapshot, hasMarketData } from "@/lib/finn/data/market";
import { getResearch } from "@/lib/finn/data/research";
import { inr, pct, toneOf } from "@/lib/finn/format";
import { actions, useFinnState, useScoredAnnouncements } from "@/lib/finn/store";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { title: "Watchlist — FINN" },
      { name: "description", content: "Track companies outside your portfolio with EOD prices, latest announcements and research status." },
      { property: "og:title", content: "Watchlist — FINN" },
      { property: "og:description", content: "Your research universe beyond the portfolio." },
    ],
  }),
  component: Watchlist,
});

function Watchlist() {
  const { watchlist, holdings } = useFinnState();
  const anns = useScoredAnnouncements();
  return (
    <div>
      <PageHeader
        title="Watchlist"
        subtitle={<>Companies outside your portfolio · <DemoBadge label="Synthetic EOD" /></>}
        right={
          <CompanySearch
            className="w-full sm:w-72"
            placeholder="Add any NSE ticker…"
            onSelect={(t) => {
              if (holdings.some((h) => h.ticker === t)) return toast.info(`${t} is already in your portfolio`);
              if (watchlist.includes(t)) return toast.info(`${t} is already on your watchlist`);
              actions.addWatch(t);
              toast.success(`${t} added to watchlist`);
            }}
          />
        }
      />
      {watchlist.length === 0 ? (
        <EmptyState icon={<Eye className="size-6" />} title="No companies on your watchlist" body="Add any NSE ticker to track filings and EOD price moves." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {watchlist.map((t) => {
            const m = hasMarketData(t) ? getMarketSnapshot(t) : null;
            const latest = anns.find((a) => a.ticker === t);
            const researched = !!getResearch(t);
            return (
              <div key={t} className="panel flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link to="/company/$ticker" params={{ ticker: t }} className="min-w-0">
                    <div className="num font-semibold hover:text-primary">{t}</div>
                    <div className="truncate text-xs text-muted-foreground">{companyName(t)}</div>
                  </Link>
                  {m && <Sparkline data={m.history.slice(-30)} positive={m.changePct >= 0} />}
                </div>
                {m ? (
                  <div className="num mt-3 flex items-baseline gap-3">
                    <span className="text-lg font-semibold">{inr(m.close)}</span>
                    <span className={`text-sm ${toneOf(m.changePct)}`}>{pct(m.changePct)}</span>
                    <span className="ml-auto text-[11px] text-muted-foreground">EOD {m.asOf}</span>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-muted-foreground">Price: Not available</div>
                )}
                <div className="mt-3 flex-1 rounded-lg border border-border bg-surface p-2.5 text-xs">
                  <div className="eyebrow mb-1">Latest important announcement</div>
                  {latest ? <span>{latest.headline}</span> : <span className="text-muted-foreground">None in the current window.</span>}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-xs ${researched ? "text-positive" : "text-muted-foreground"}`}>{researched ? "Research report available" : "Not yet researched"}</span>
                  <div className="flex gap-1">
                    <button
                      aria-label={`Remove ${t}`}
                      onClick={() => {
                        actions.removeWatch(t);
                        toast(`${t} removed`, { action: { label: "Undo", onClick: () => actions.addWatch(t) } });
                      }}
                      className="rounded p-1.5 text-muted-foreground hover:bg-negative/10 hover:text-negative"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    <Button size="sm" asChild>
                      <Link to="/research" search={{ ticker: t }}>Analyse</Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
