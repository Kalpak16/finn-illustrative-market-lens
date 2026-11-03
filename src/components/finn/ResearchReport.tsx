import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { GuidanceStatus, ResearchReport as R } from "@/lib/finn/types";
import { cn } from "@/lib/utils";
import { ChartTooltip } from "./PriceChart";
import { DemoBadge, Section, SourceCite } from "./primitives";

const STATUS_STYLE: Record<GuidanceStatus, string> = {
  Delivered: "border-positive/40 bg-positive/10 text-positive",
  "Partially delivered": "border-warning/40 bg-warning/10 text-warning",
  Missed: "border-negative/40 bg-negative/10 text-negative",
  "Not yet measurable": "border-border bg-muted text-muted-foreground",
};
const axis = { fill: "var(--muted-foreground)", fontSize: 10 };
const fmtCr = (v: number) => "₹" + Math.round(v).toLocaleString("en-IN") + " cr";

export function ResearchReportView({ r }: { r: R }) {
  const [view, setView] = useState<"annual" | "quarterly">("annual");
  const series = (view === "annual" ? r.annual : r.quarterly).map((p) => ({ ...p, margin: +((p.ebitda / p.revenue) * 100).toFixed(1) }));
  const cash = r.annual.map((y) => ({ ...y, conv: y.pat > 0 && y.ocf != null ? +((y.ocf / y.pat) * 100).toFixed(0) : null }));
  const divergent = cash.filter((c) => c.conv != null && c.conv < 80).length;

  return (
    <div className="space-y-4">
      <header className="panel p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <DemoBadge label="Synthetic research example" /> <span>{r.basis}</span>
        </div>
        <div className="mt-2 text-lg font-semibold tracking-tight">{r.ticker} · Equity research note</div>
        <p className="mt-1 text-xs text-muted-foreground">Sections A–H. Every figure links to its source document; FINN does not issue ratings or price targets.</p>
      </header>

      <Section title="A. Business snapshot">
        <div className="grid gap-4 md:grid-cols-[1fr_260px]">
          <div className="space-y-2 text-sm">
            <p>{r.business.description}</p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Business model: </span>
              {r.business.model}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {r.business.drivers.map((d) => (
                <span key={d} className="rounded-md border border-border px-2 py-0.5 text-xs">
                  {d}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="eyebrow">Revenue by segment</div>
            {r.business.segments.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-xs">
                <span className="w-28 truncate">{s.name}</span>
                <div className="h-1.5 flex-1 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${s.share}%` }} />
                </div>
                <span className="num w-8 text-right">{s.share}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <SourceCite source={r.business.source} />
        </div>
      </Section>

      <Section title={`B. Financial snapshot · ${r.snapshot.period} · ${r.snapshot.unit}`}>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-5">
          {r.snapshot.items.map((i) => (
            <div key={i.label} className="bg-surface p-2.5">
              <div className="eyebrow">{i.label}</div>
              <div className={cn("num mt-1 text-sm font-semibold", i.value.startsWith("Insufficient") && "text-xs font-normal text-warning")}>{i.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <SourceCite source={r.snapshot.source} />
        </div>
      </Section>

      <Section
        title="C. Financial trajectory"
        action={
          <div className="flex rounded-md border border-border p-0.5 text-xs">
            {(["annual", "quarterly"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={cn("rounded px-2 py-0.5 capitalize", view === v ? "bg-accent text-foreground" : "text-muted-foreground")}>
                {v}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={series}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="period" tick={axis} tickLine={false} axisLine={false} />
                <YAxis tick={axis} tickLine={false} axisLine={false} width={60} tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} />
                <Tooltip cursor={{ fill: "var(--accent)" }} content={<ChartTooltip fmt={fmtCr} />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="revenue" name="Revenue" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="ebitda" name="EBITDA" fill="var(--chart-5)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="pat" name="PAT" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={series}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="period" tick={axis} tickLine={false} axisLine={false} />
                <YAxis yAxisId="m" tick={axis} tickLine={false} axisLine={false} width={36} unit="%" />
                <YAxis yAxisId="c" orientation="right" tick={axis} tickLine={false} axisLine={false} width={50} tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} />
                <Tooltip content={<ChartTooltip fmt={(v, n) => (n === "EBITDA margin" ? v + "%" : fmtCr(v))} />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="m" dataKey="margin" name="EBITDA margin" stroke="var(--warning)" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="c" dataKey="ocf" name="Operating cash flow" stroke="var(--positive)" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {view === "quarterly" && series.some((s) => s.ocf == null) && (
          <p className="mt-2 text-xs text-warning">Quarterly operating cash flow: Not available in quarterly filings.</p>
        )}
        <ul className="mt-3 space-y-1 text-sm">
          {r.trajectoryNotes.map((n) => (
            <li key={n} className="flex gap-2">
              <span className="text-primary">›</span>
              {n}
            </li>
          ))}
        </ul>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="D. Balance sheet analysis">
          <table className="w-full text-sm">
            <tbody>
              {r.balanceSheet.map((b) => (
                <tr key={b.label} className="border-b border-border/60 last:border-0">
                  <td className="py-1.5 text-muted-foreground">{b.label}</td>
                  <td className={cn("num py-1.5 text-right", b.value.startsWith("Insufficient") && "text-xs text-warning")}>{b.value}</td>
                  <td className="w-6 py-1.5 text-right">
                    {b.flag && <span className={cn("inline-block size-2 rounded-full", b.flag === "ok" ? "bg-positive" : b.flag === "watch" ? "bg-warning" : "bg-negative")} title={b.flag} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="mt-3 space-y-1 text-sm">
            {r.balanceNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Section>

        <Section title="E. Cash quality">
          <div className="h-44">
            <ResponsiveContainer>
              <BarChart data={cash}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="period" tick={axis} tickLine={false} axisLine={false} />
                <YAxis tick={axis} tickLine={false} axisLine={false} width={50} tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} />
                <Tooltip cursor={{ fill: "var(--accent)" }} content={<ChartTooltip fmt={fmtCr} />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="pat" name="PAT" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="ocf" name="OCF" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="fcf" name="FCF" fill="var(--chart-3)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="num mt-2 flex flex-wrap gap-2 text-xs">
            {cash.map((c) => (
              <span key={c.period} className={cn("rounded border px-1.5 py-0.5", c.conv == null ? "border-border text-muted-foreground" : c.conv >= 100 ? "border-positive/40 text-positive" : c.conv >= 80 ? "border-border" : "border-negative/40 text-negative")} title={c.conv == null ? "Not meaningful: PAT was zero or negative" : undefined}>
                {c.period} OCF/PAT {c.conv == null ? "n.m." : `${c.conv}%`}
              </span>
            ))}
          </div>
          <p className="mt-2 text-sm">
            {divergent >= 2
              ? `Persistent divergence: OCF below 80% of PAT in ${divergent} of ${cash.length} years.`
              : "Accounting profits are broadly converting to operating cash. Watch FCF after capex."}
          </p>
        </Section>
      </div>

      <Section
        title="F. Narrative vs Numbers"
        className="border-primary/30"
        action={<span className="hidden text-[11px] text-muted-foreground sm:inline">What management said vs what the filings show</span>}
      >
        {(() => {
          const counts = (["Delivered", "Partially delivered", "Missed", "Not yet measurable"] as GuidanceStatus[]).map((k) => ({ k, n: r.narrative.filter((x) => x.status === k).length }));
          const measurable = r.narrative.filter((x) => x.status !== "Not yet measurable").length;
          const delivered = counts[0].n + counts[1].n * 0.5;
          return (
            <div className="mb-4 grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
              <div>
                <div className="eyebrow">Credibility scorecard</div>
                <div className="num mt-1 text-2xl font-semibold">
                  {measurable ? Math.round((delivered / measurable) * 100) : "—"}
                  {measurable > 0 && <span className="text-sm text-muted-foreground">%</span>}
                </div>
                <div className="text-[11px] text-muted-foreground">of measurable promises kept (partial = ½)</div>
              </div>
              <div>
                <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                  {counts.map(({ k, n }) =>
                    n ? <div key={k} className={cn("h-full", k === "Delivered" ? "bg-positive" : k === "Missed" ? "bg-negative" : k === "Partially delivered" ? "bg-warning" : "bg-muted-foreground/40")} style={{ width: `${(n / r.narrative.length) * 100}%` }} /> : null,
                  )}
                </div>
                <div className="num mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {counts.map(({ k, n }) => (
                    <span key={k} className="text-muted-foreground"><span className="font-semibold text-foreground">{n}</span> {k.toLowerCase()}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
        <ol className="divide-y divide-border rounded-lg border border-border">
          {r.narrative.map((n, i) => (
            <li key={n.statement} className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_9rem]">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><span className="num mr-1">{i + 1}.</span>Management said · {n.period}</div>
                <p className="mt-1 text-sm">“{n.statement.replace(/^["“]+|["”]+$/g, "")}”</p>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Numbers show</div>
                <p className="mt-1 text-sm">{n.outcome}</p>
                <div className="mt-1.5"><SourceCite source={n.evidence} /></div>
              </div>
              <div className="md:text-right">
                <span className={cn("inline-block whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-semibold", STATUS_STYLE[n.status])}>{n.status}</span>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">Vague statements are never treated as numerical commitments; they are marked “Not yet measurable” and excluded from the score.</p>
      </Section>

      <Section title="G. Management guidance">
        <div className="grid gap-2 md:grid-cols-2">
          {r.guidance.map((g) => (
            <div key={g.text} className="rounded-lg border border-border bg-surface p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold">{g.topic}</span>
                <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase", g.type === "Numerical" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>{g.type}</span>
              </div>
              <p className="text-sm">{g.text}</p>
              <div className="mt-2">
                <SourceCite source={g.source} compact />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="H. Bull vs Bear">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-positive/30 bg-positive/5 p-3">
            <div className="eyebrow mb-2 text-positive">Bull case</div>
            <ul className="space-y-1.5 text-sm">
              {r.bull.map((b) => (
                <li key={b} className="border-l-2 border-positive/40 pl-2">{b}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-negative/30 bg-negative/5 p-3">
            <div className="eyebrow mb-2 text-negative">Bear case</div>
            <ul className="space-y-1.5 text-sm">
              {r.bear.map((b) => (
                <li key={b} className="border-l-2 border-negative/40 pl-2">{b}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-4">
          <div className="eyebrow mb-2">Questions an investor should investigate next</div>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {r.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">FINN does not issue buy/sell recommendations.</p>
      </Section>
    </div>
  );
}
