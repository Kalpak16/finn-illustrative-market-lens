import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpDown, Briefcase, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { CompanySearch } from "@/components/finn/CompanySearch";
import { ChartTooltip } from "@/components/finn/PriceChart";
import { DemoBadge, EmptyState, PageHeader, PriorityBadge, Section, Stat } from "@/components/finn/primitives";
import { Button } from "@/components/ui/button";
import { getMarketSnapshot } from "@/lib/finn/data/market";
import { compact, inr, pct, toneOf } from "@/lib/finn/format";
import { portfolioHistory, portfolioTotals } from "@/lib/finn/portfolio";
import { actions, resetDemo, useFinnState, useScoredAnnouncements } from "@/lib/finn/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "My Portfolio — FINN" },
      { name: "description", content: "Portfolio value, allocation, risk indicators and important developments across your holdings." },
      { property: "og:title", content: "My Portfolio — FINN" },
      { property: "og:description", content: "Institutional-quality portfolio monitoring." },
    ],
  }),
  component: Portfolio,
});

type SortKey = "ticker" | "name" | "sector" | "close" | "change" | "vol" | "updates" | "priority";
const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];

function Portfolio() {
  const { holdings, settings } = useFinnState();
  const anns = useScoredAnnouncements();
  const navigate = useNavigate();
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: "priority", dir: -1 });

  const totals = portfolioTotals(holdings);
  const history = useMemo(() => portfolioHistory(holdings, 90), [holdings]);

  const rows = useMemo(() => {
    const r = holdings.map((h) => {
      const m = getMarketSnapshot(h.ticker);
      const own = anns.filter((a) => a.ticker === h.ticker);
      const important = own.filter((a) => a.priority !== "low");
      const top = own[0];
      const risk =
        (top?.priority === "critical" ? 2 : 0) + (Math.abs(m.changePct) >= settings.priceThresholdPct ? 1 : 0) + (m.volumeMultiple >= settings.volumeMultiple ? 1 : 0);
      return { h, m, value: h.quantity * m.close, important: important.length, top, risk };
    });
    const get = (x: (typeof r)[number]) =>
      ({ ticker: x.h.ticker, name: x.h.name, sector: x.h.sector, close: x.m.close, change: x.m.changePct, vol: x.m.volumeMultiple, updates: x.important, priority: x.top?.score ?? 0 })[sort.k];
    return [...r].sort((a, b) => {
      const va = get(a), vb = get(b);
      return (typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number)) * sort.dir;
    });
  }, [holdings, anns, sort, settings]);

  const sectors = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => m.set(r.h.sector, (m.get(r.h.sector) ?? 0) + r.value));
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [rows]);

  const Th = ({ k, children, right }: { k: SortKey; children: React.ReactNode; right?: boolean }) => (
    <th className={cn("px-3 py-2 font-medium", right && "text-right")}>
      <button onClick={() => setSort((s) => ({ k, dir: s.k === k ? ((-s.dir) as 1 | -1) : -1 }))} className={cn("inline-flex items-center gap-1 hover:text-foreground", sort.k === k && "text-foreground")}>
        {children}
        <ArrowUpDown className="size-3" />
      </button>
    </th>
  );

  return (
    <div>
      <PageHeader
        title="My Portfolio"
        subtitle={<>EOD valuation · <DemoBadge label="Synthetic prices" /></>}
        right={
          <div className="flex w-full gap-2 sm:w-auto">
            <CompanySearch
              className="flex-1 sm:w-72"
              placeholder="Add company by NSE ticker…"
              onSelect={(t) => {
                if (holdings.some((h) => h.ticker === t)) return toast.info(`${t} is already in your portfolio`);
                if (!actions.addHolding(t)) return toast.error(`No demo market data for ${t}`, { description: "Only demo-universe companies can be valued in demo mode. Add it to the Watchlist instead." });
                toast.success(`${t} added to portfolio`);
              }}
            />
          </div>
        }
      />

      {holdings.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="size-6" />}
          title="Your portfolio is empty"
          body="Add NSE companies using the search above. FINN will start monitoring their filings and EOD price/volume immediately."
          action={<Button onClick={resetDemo}>Restore 18-company demo portfolio</Button>}
        />
      ) : (
        <>
          <div className="mb-5 grid gap-5 lg:grid-cols-[1fr_320px]">
            <Section title="Performance (90 trading days)" action={<span className="text-[11px] text-muted-foreground">Current holdings, back-filled</span>}>
              <div className="mb-3 grid grid-cols-3 gap-4">
                <Stat label="Total value" value={inr(totals.value, 0)} />
                <Stat label="Daily change" value={<span className={toneOf(totals.change)}>{pct(totals.changePct)}</span>} sub={inr(totals.change, 0)} />
                <Stat label="90D change" value={<span className={toneOf(history.length ? history[history.length - 1].value - history[0].value : 0)}>{history.length ? pct(((history[history.length - 1].value - history[0].value) / history[0].value) * 100) : "—"}</span>} />
              </div>
              <div className="h-48">
                <ResponsiveContainer>
                  <AreaChart data={history}>
                    <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={50} />
                    <YAxis hide domain={["auto", "auto"]} />
                    <Tooltip content={<ChartTooltip fmt={(v) => inr(v, 0)} />} />
                    <Area dataKey="value" name="Value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.1} strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="Sector allocation">
              <div className="h-36">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={sectors} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} stroke="var(--card)">
                      {sectors.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip fmt={(v) => `${((v / totals.value) * 100).toFixed(1)}%`} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1 text-xs">
                {sectors.map((s, i) => (
                  <li key={s.name} className="flex items-center gap-2">
                    <span className="size-2 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                    {s.name}
                    <span className="num ml-auto text-muted-foreground">{((s.value / totals.value) * 100).toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead className="border-b border-border bg-surface text-left text-xs text-muted-foreground">
                  <tr>
                    <Th k="ticker">Ticker</Th>
                    <Th k="name">Company</Th>
                    <Th k="sector">Sector</Th>
                    <Th k="close" right>Last close</Th>
                    <Th k="change" right>Daily chg</Th>
                    <Th k="vol" right>Vol vs avg</Th>
                    <Th k="updates" right>Updates</Th>
                    <Th k="priority">Priority</Th>
                    <th className="px-3 py-2 font-medium">Weight</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ h, m, value, important, top, risk }) => (
                    <tr
                      key={h.ticker}
                      onClick={() => navigate({ to: "/company/$ticker", params: { ticker: h.ticker } })}
                      className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-accent/40"
                    >
                      <td className="num px-3 py-2.5 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <span className={cn("size-1.5 rounded-full", risk >= 3 ? "bg-negative" : risk >= 1 ? "bg-warning" : "bg-positive")} title={`Risk indicator ${risk}/4`} />
                          {h.ticker}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">{h.name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{h.sector}</td>
                      <td className="num px-3 py-2.5 text-right">{inr(m.close)}</td>
                      <td className={cn("num px-3 py-2.5 text-right", toneOf(m.changePct))}>{pct(m.changePct)}</td>
                      <td className={cn("num px-3 py-2.5 text-right", m.volumeMultiple >= settings.volumeMultiple && "text-warning")} title={`${compact(m.volume)} vs ${compact(Math.round(m.avgVolume20))}`}>
                        {m.volumeMultiple.toFixed(2)}x
                      </td>
                      <td className="num px-3 py-2.5 text-right">{important || "—"}</td>
                      <td className="px-3 py-2.5">{top ? <PriorityBadge priority={top.priority} score={top.score} /> : <span className="text-xs text-muted-foreground">—</span>}</td>
                      <td className="num px-3 py-2.5 text-xs text-muted-foreground">{((value / totals.value) * 100).toFixed(1)}%</td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          aria-label={`Remove ${h.ticker}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            actions.removeHolding(h.ticker);
                            toast(`${h.ticker} removed`, { action: { label: "Undo", onClick: () => actions.addHolding(h.ticker) } });
                          }}
                          className="rounded p-1 text-muted-foreground hover:bg-negative/10 hover:text-negative"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Changes are saved on this device. Risk dot combines critical filings and price/volume threshold breaches. <Link to="/settings" className="text-primary">Adjust thresholds</Link>
          </p>
        </>
      )}
    </div>
  );
}
