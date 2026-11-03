import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { companyName } from "@/lib/finn/data/companies";
import { getMarketSnapshot } from "@/lib/finn/data/market";
import { crore, fmtDateTime, inr, pct, toneOf } from "@/lib/finn/format";
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

export function AnnouncementCard({ a, onOpen }: { a: ScoredAnnouncement; onOpen: () => void }) {
  return (
    <article
      className={cn(
        "panel group relative overflow-hidden p-4 transition-colors hover:border-primary/40",
        a.priority === "critical" && "before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-negative",
      )}
    >
      <div className="flex items-start gap-3">
        <CompanyAvatar ticker={a.ticker} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="font-semibold text-foreground">{companyName(a.ticker)}</span>
            <span className="num text-muted-foreground">{a.ticker}</span>
            <span className="rounded border border-border px-1.5 py-px text-muted-foreground">{a.category}</span>
            <span className="text-muted-foreground">{fmtDateTime(a.filedAt)}</span>
            <span className="ml-auto">
              <PriorityBadge priority={a.priority} score={a.score} />
            </span>
          </div>
          <button onClick={onOpen} className="mt-1.5 text-left text-[15px] font-semibold leading-snug hover:text-primary">
            {a.headline}
          </button>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
            <div>
              <div className="eyebrow mb-1">What happened</div>
              <p className="text-foreground/85">{a.whatHappened}</p>
            </div>
            <div>
              <div className="eyebrow mb-1">Why it matters</div>
              <p className="text-foreground/85">{a.whyItMatters}</p>
            </div>
            <div>
              <div className="eyebrow mb-1">Implications</div>
              <p className="text-foreground/85">{a.implications}</p>
            </div>
          </div>
          {a.metrics && (
            <div className="mt-3">
              <MetricsGrid a={a} />
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <div className="flex min-w-0 items-center gap-2">
              <DemoBadge label="Sample" />
              <SourceCite source={a.source} compact />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={onOpen}>
                Why should I care?
              </Button>
              <Button size="sm" asChild>
                <Link to="/research" search={{ ticker: a.ticker }}>
                  <Sparkles className="size-3.5" /> Investigate with FINN
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function AnnouncementSheet({ a, onClose }: { a: ScoredAnnouncement | null; onClose: () => void }) {
  const m = a ? getMarketSnapshot(a.ticker) : null;
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
              {[
                ["What happened?", a.whatHappened],
                ["Why does it matter?", a.whyItMatters],
                ["What should I investigate?", a.investigate],
              ].map(([t, body]) => (
                <div key={t} className="rounded-lg border border-border bg-card p-3">
                  <div className="eyebrow mb-1 text-primary">{t}</div>
                  <p className="text-sm">{body}</p>
                </div>
              ))}
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="eyebrow mb-1 text-primary">What evidence supports this?</div>
                <SourceCite source={a.source} />
                {a.source.excerpt && <p className="mt-2 border-l-2 border-border pl-2 text-xs italic text-muted-foreground">{a.source.excerpt}</p>}
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
                <div className="eyebrow mb-2">Why this score — relevance breakdown</div>
                <div className="space-y-1.5">
                  {Object.entries(a.breakdown).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 text-xs">
                      <span className="w-28 text-muted-foreground">{k}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, v * 4)}%` }} />
                      </div>
                      <span className="num w-6 text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full" asChild>
                <Link to="/research" search={{ ticker: a.ticker }}>
                  Investigate with FINN <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
