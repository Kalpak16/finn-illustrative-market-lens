import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { companyName } from "@/lib/finn/data/companies";
import { getMarketSnapshot } from "@/lib/finn/data/market";
import { crore, fmtDateTime, inr, pct, toneOf } from "@/lib/finn/format";
import { priorityThreshold, rankDrivers } from "@/lib/finn/scoring";
import { useFinnState } from "@/lib/finn/store";
import type { ScoredAnnouncement } from "@/lib/finn/types";
import { cn } from "@/lib/utils";
import { PriceVolumeChart } from "./PriceChart";
import { CompanyAvatar, DemoBadge, PriorityBadge, SourceCite } from "./primitives";

export function MetricsGrid({ a }: { a: ScoredAnnouncement }) {
  if (!a.metrics) return null;
  return (
    <div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
        {a.metrics.map((m) => (
          <div key={m.label} className="bg-surface p-2.5">
            <div className="eyebrow">{m.label}</div>
            <div className="num mt-1 text-sm font-semibold">{crore(m.value)}</div>
            <div className="num mt-0.5 flex gap-2 text-[11px]">
              <span className={toneOf(m.qoq)}>QoQ {pct(m.qoq, 1)}</span>
              <span className={toneOf(m.yoy)}>YoY {pct(m.yoy, 1)}</span>
            </div>
          </div>
        ))}
      </div>
      {a.metricsBasis && <div className="mt-1 text-[11px] text-muted-foreground">{a.metricsBasis}</div>}
    </div>
  );
}

export function RankReason({ a, className }: { a: ScoredAnnouncement; className?: string }) {
  const d = rankDrivers(a);
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      <span className="font-medium text-foreground/80">Ranked {a.priority === "low" ? "low" : a.priority} ({a.score}/100)</span> — driven by{" "}
      {d.map((x, i) => (
        <span key={x.label}>
          {x.label} <span className="num">+{x.points}</span>
          {i < d.length - 2 ? ", " : i === d.length - 2 ? " and " : ""}
        </span>
      ))}
      .
    </p>
  );
}

export function AnnouncementCard({ a, onOpen }: { a: ScoredAnnouncement; onOpen: () => void }) {
  return (
    <article
      className={cn(
        "panel relative overflow-hidden transition-colors hover:border-primary/40",
        a.priority === "critical" && "border-l-2 border-l-negative",
        a.priority === "important" && "border-l-2 border-l-warning",
      )}
    >
      <div className="p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <Link to="/company/$ticker" params={{ ticker: a.ticker }} className="font-semibold text-foreground hover:text-primary">
              {companyName(a.ticker)}
            </Link>
            <span className="num text-muted-foreground">{a.ticker}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{a.category}</span>
            <span className="text-muted-foreground">·</span>
            <span className="num text-muted-foreground">{fmtDateTime(a.filedAt)}</span>
          </div>
          <PriorityBadge priority={a.priority} score={a.score} />
        </div>
        <button onClick={onOpen} className="mt-2 block text-left text-base font-semibold leading-snug tracking-tight hover:text-primary">
          {a.headline}
        </button>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">
          <span className="font-semibold text-foreground">Why it matters: </span>
          {a.whyItMatters}
        </p>
        <RankReason a={a} className="mt-2" />
        {a.metrics && (
          <div className="mt-3">
            <MetricsGrid a={a} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 border-t border-border bg-surface/50 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <DemoBadge label="Sample" />
          <SourceCite source={a.source} compact />
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" asChild>
            <Link to="/research" search={{ ticker: a.ticker }}>Research</Link>
          </Button>
          <Button size="sm" onClick={onOpen}>
            Why should I care? <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}

export function AnnouncementSheet({ a, onClose }: { a: ScoredAnnouncement | null; onClose: () => void }) {
  const m = a ? getMarketSnapshot(a.ticker) : null;
  const { settings } = useFinnState();
  const totalW = Object.values(settings.weights).reduce((s, v) => s + v, 0) || 1;
  const maxPts: Record<string, number> = {
    Category: settings.weights.category,
    Materiality: settings.weights.materiality,
    "Earnings impact": settings.weights.earnings,
    "Balance sheet": settings.weights.balanceSheet,
    Strategic: settings.weights.strategic,
    Recency: settings.weights.recency,
    Portfolio: settings.weights.portfolio,
  };
  return (
    <Sheet open={!!a} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto border-border bg-background sm:max-w-xl">
        {a && m && (
          <>
            <SheetHeader className="p-0">
              <div className="flex items-center gap-2">
                <CompanyAvatar ticker={a.ticker} />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {companyName(a.ticker)} · <span className="num">{a.ticker}</span> · {a.category}
                  </div>
                  <PriorityBadge priority={a.priority} score={a.score} />
                </div>
              </div>
              <SheetTitle className="pt-2 text-left text-lg leading-snug">{a.headline}</SheetTitle>
              <DemoBadge label="Sample announcement — not an actual filing" />
            </SheetHeader>

            <div className="mt-5 space-y-4">
              <div className="eyebrow text-primary">Why should I care?</div>
              <ol className="divide-y divide-border rounded-lg border border-border bg-card">
                {[
                  ["What happened", a.whatHappened],
                  ["Why it matters", a.whyItMatters],
                  ["What it could change", a.implications],
                  ["What to investigate next", a.investigate],
                ].map(([t, body], i) => (
                  <li key={t} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2 p-3">
                    <span className="num text-xs font-semibold text-muted-foreground">{i + 1}</span>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t}</div>
                      <p className="mt-1 text-sm leading-relaxed">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="eyebrow mb-2">Evidence</div>
                <SourceCite source={a.source} />
                {a.source.excerpt && <blockquote className="mt-2 border-l-2 border-primary/50 pl-3 text-xs text-muted-foreground">“{a.source.excerpt}”</blockquote>}
              </div>

              {a.metrics && (
                <div>
                  <div className="eyebrow mb-2">Extracted results</div>
                  <MetricsGrid a={a} />
                </div>
              )}

              <div className="rounded-lg border border-border bg-card p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="eyebrow">Price & volume (EOD)</div>
                  <span className="text-[11px] text-muted-foreground">as of {m.asOf}</span>
                </div>
                <div className="num mb-2 flex gap-4 text-sm">
                  <span>{inr(m.close)}</span>
                  <span className={toneOf(m.changePct)}>{pct(m.changePct)}</span>
                  <span className="text-muted-foreground">Vol {m.volumeMultiple.toFixed(2)}x avg</span>
                </div>
                <PriceVolumeChart data={m.history.slice(-60)} height={180} />
                <div className="mt-1 text-[11px] text-muted-foreground">{m.source}</div>
              </div>

              <div className="rounded-lg border border-border bg-card p-3">
                <div className="eyebrow mb-1">Why it ranks here</div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Score <span className="num font-semibold text-foreground">{a.score}/100</span> → {a.priority} ({priorityThreshold(a.priority)}). Each factor earns up to its weight; weights are editable in Settings.
                </p>
                <div className="space-y-1.5">
                  {Object.entries(a.breakdown).map(([k, v]) => {
                    const max = Math.round((maxPts[k] ?? 0) / totalW * 100) || 1;
                    return (
                      <div key={k} className="grid grid-cols-[7rem_minmax(0,1fr)_3.5rem] items-center gap-2 text-xs">
                        <span className="text-muted-foreground">{k}</span>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (v / max) * 100)}%` }} />
                        </div>
                        <span className="num text-right">{v}<span className="text-muted-foreground">/{max}</span></span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button className="w-full" asChild>
                <Link to="/research" search={{ ticker: a.ticker }}>
                  Open {a.ticker} research <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
