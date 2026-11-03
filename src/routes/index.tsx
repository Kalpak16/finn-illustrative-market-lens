import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Inbox } from "lucide-react";
import { useMemo, useState } from "react";
import { AnnouncementCard, AnnouncementSheet } from "@/components/finn/Announcement";
import { MarketActivity } from "@/components/finn/MarketActivity";
import { DemoBadge, EmptyState, Stat } from "@/components/finn/primitives";

import { fmtDate, fmtDateTime, inr, pct, toneOf } from "@/lib/finn/format";
import { portfolioTotals } from "@/lib/finn/portfolio";
import { DEMO_NOW, useFinnState, useScoredAnnouncements } from "@/lib/finn/store";
import type { AnnouncementCategory, Priority, ScoredAnnouncement } from "@/lib/finn/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Intelligence Feed — FINN" },
      { name: "description", content: "Prioritised, source-backed developments across your portfolio: what happened, why it matters, what to investigate." },
      { property: "og:title", content: "Intelligence Feed — FINN" },
      { property: "og:description", content: "What happened, what matters, and what to look at first." },
    ],
  }),
  component: Feed,
});

const PRIORITY_FILTERS: { key: "all" | Priority; label: string }[] = [
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "important", label: "Important" },
  { key: "low", label: "Low priority" },
];
const CATEGORY_FILTERS: { key: AnnouncementCategory; label: string }[] = [
  { key: "Results", label: "Results" },
  { key: "M&A", label: "M&A" },
  { key: "Management", label: "Management changes" },
  { key: "Litigation", label: "Litigation" },
  { key: "Fundraising", label: "Fundraising" },
  { key: "Dividend", label: "Dividends" },
  { key: "Capex", label: "Capex" },
  { key: "Credit rating", label: "Credit rating" },
  { key: "Other", label: "Other" },
];
type Window = "1" | "3" | "7" | "custom";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-md border px-2.5 py-1 text-xs transition-colors",
        active ? "border-primary/50 bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function greeting() {
  const h = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Feed() {
  const { holdings, settings } = useFinnState();
  const all = useScoredAnnouncements();
  const [prio, setPrio] = useState<"all" | Priority>("all");
  const [cats, setCats] = useState<AnnouncementCategory[]>([]);
  const [win, setWin] = useState<Window>("7");
  const [from, setFrom] = useState("2026-10-27");
  const [to, setTo] = useState("2026-11-03");
  const [showOther, setShowOther] = useState(false);
  const [open, setOpen] = useState<ScoredAnnouncement | null>(null);

  const totals = portfolioTotals(holdings);
  const portSet = new Set(holdings.map((h) => h.ticker));

  const filtered = useMemo(() => {
    let start: number, end: number;
    if (win === "custom") {
      start = new Date(from + "T00:00:00+05:30").getTime();
      end = new Date(to + "T23:59:59+05:30").getTime();
    } else {
      end = DEMO_NOW.getTime();
      start = end - Number(win) * 864e5;
    }
    return all.filter((a) => {
      const t = new Date(a.filedAt).getTime();
      if (t < start || t > end) return false;
      if (prio !== "all" && a.priority !== prio) return false;
      if (cats.length && !cats.includes(a.category)) return false;
      return true;
    });
  }, [all, prio, cats, win, from, to]);

  const main = filtered.filter((a) => a.priority !== "low");
  const other = filtered.filter((a) => a.priority === "low");
  const critical = all.filter((a) => a.priority === "critical");
  const attention = new Set(all.filter((a) => a.priority !== "low").map((a) => a.ticker));

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs text-muted-foreground" suppressHydrationWarning>
            {fmtDate(new Date().toISOString())} · data window to {fmtDateTime(DEMO_NOW.toISOString())} IST
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight" suppressHydrationWarning>
            {greeting()}, {settings.displayName.trim() || "Investor"}.
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {critical.length} critical development{critical.length === 1 ? "" : "s"} need your attention first.
          </p>
        </div>
        <DemoBadge label="Demo workspace" />
      </div>

      <div className="panel mb-5 grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
        <Stat label="Portfolio value" value={inr(totals.value, 0)} sub={`${holdings.length} holdings · EOD`} />
        <Stat
          label="Daily change"
          value={<span className={toneOf(totals.change)}>{pct(totals.changePct)}</span>}
          sub={<span className={toneOf(totals.change)}>{inr(totals.change, 0)}</span>}
        />
        <Stat label="Important developments" value={all.filter((a) => a.priority !== "low").length} sub="Critical + important" />
        <Stat label="Companies needing attention" value={attention.size} sub={[...attention].slice(0, 3).join(", ")} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Your Daily Intelligence</h2>
            <span className="text-xs text-muted-foreground">{filtered.length} items · ranked by relevance</span>
          </div>

          {/* Filters */}
          <div className="panel mb-4 space-y-2.5 p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {PRIORITY_FILTERS.map((f) => (
                <Chip key={f.key} active={prio === f.key} onClick={() => setPrio(f.key)}>
                  {f.label}
                </Chip>
              ))}
              <span className="mx-1 h-4 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                {(["1", "3", "7", "custom"] as Window[]).map((w) => (
                  <Chip key={w} active={win === w} onClick={() => setWin(w)}>
                    {w === "1" ? "24h" : w === "custom" ? "Custom" : `${w} days`}
                  </Chip>
                ))}
              </div>
              {win === "custom" && (
                <div className="flex items-center gap-1 text-xs">
                  <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-border bg-surface px-2 py-1" aria-label="From date" />
                  <span className="text-muted-foreground">→</span>
                  <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-border bg-surface px-2 py-1" aria-label="To date" />
                </div>
              )}
            </div>
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
              {CATEGORY_FILTERS.map((c) => (
                <Chip
                  key={c.key}
                  active={cats.includes(c.key)}
                  onClick={() => setCats((cs) => (cs.includes(c.key) ? cs.filter((x) => x !== c.key) : [...cs, c.key]))}
                >
                  {c.label}
                </Chip>
              ))}
              {cats.length > 0 && (
                <button onClick={() => setCats([])} className="whitespace-nowrap px-2 text-xs text-primary">
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {main.length === 0 && other.length === 0 && (
              <EmptyState icon={<Inbox className="size-6" />} title="Nothing matches these filters" body="Widen the time window or clear category filters." />
            )}
            {main.map((a) => (
              <AnnouncementCard key={a.id} a={a} onOpen={() => setOpen(a)} />
            ))}

            {other.length > 0 && (
              <div className="panel">
                <button onClick={() => setShowOther((s) => !s)} className="flex w-full items-center justify-between px-4 py-3 text-sm">
                  <span>
                    <span className="font-semibold">Other updates</span>
                    <span className="num ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{other.length}</span>
                    <span className="ml-2 text-xs text-muted-foreground">Routine filings, collapsed</span>
                  </span>
                  <ChevronDown className={cn("size-4 transition-transform", showOther && "rotate-180")} />
                </button>
                {showOther && (
                  <ul className="border-t border-border">
                    {other.map((a) => (
                      <li key={a.id}>
                        <button onClick={() => setOpen(a)} className="flex w-full items-center gap-3 border-b border-border/60 px-4 py-2.5 text-left text-sm last:border-0 hover:bg-accent/50">
                          <span className="num w-24 shrink-0 text-xs font-semibold">{a.ticker}</span>
                          <span className="min-w-0 flex-1 truncate">{a.headline}</span>
                          <span className="hidden text-xs text-muted-foreground sm:inline">{a.category}</span>
                          <span className="num text-xs text-muted-foreground">{a.score}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <MarketActivity tickers={holdings.map((h) => h.ticker)} priceT={settings.priceThresholdPct} volT={settings.volumeMultiple} />
          <div className="panel p-4 text-xs text-muted-foreground">
            <div className="eyebrow mb-2">How FINN ranks</div>
            Scores blend category, financial materiality, earnings and balance-sheet impact, strategic importance, recency and
            portfolio relevance — not keyword counts. Tune weights in Settings.
            {!portSet.size && <p className="mt-2">Add holdings to see portfolio-relevant developments.</p>}
          </div>
        </aside>
      </div>

      <AnnouncementSheet a={open} onClose={() => setOpen(null)} />
    </div>
  );
}
