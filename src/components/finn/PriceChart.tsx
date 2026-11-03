import { Area, AreaChart, Bar, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PriceBar } from "@/lib/finn/types";
import { compact, inr } from "@/lib/finn/format";

export function ChartTooltip({ active, payload, label, fmt }: { active?: boolean; payload?: any[]; label?: string; fmt?: (v: number, name: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 font-medium text-muted-foreground">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="size-2 rounded-sm" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="num ml-auto font-semibold">{p.value == null ? "Not available" : fmt ? fmt(p.value, p.name) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Sparkline({ data, positive }: { data: PriceBar[]; positive: boolean }) {
  const color = positive ? "var(--positive)" : "var(--negative)";
  return (
    <div className="h-8 w-24">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <Area dataKey="close" stroke={color} fill={color} fillOpacity={0.08} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PriceVolumeChart({ data, height = 220 }: { data: PriceBar[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={40} />
          <YAxis yAxisId="p" orientation="right" domain={["auto", "auto"]} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} width={50} />
          <YAxis yAxisId="v" hide domain={[0, (max: number) => max * 4]} />
          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            content={<ChartTooltip fmt={(v, n) => (n === "Volume" ? compact(v) : inr(v))} />}
          />
          <Bar yAxisId="v" dataKey="volume" name="Volume" fill="var(--muted-foreground)" fillOpacity={0.35} isAnimationActive={false} />
          <Area yAxisId="p" dataKey="close" name="Close" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.08} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
