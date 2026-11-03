import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { DemoBadge, PageHeader, Section } from "@/components/finn/primitives";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_WEIGHTS } from "@/lib/finn/scoring";
import { actions, resetDemo, useFinnState } from "@/lib/finn/store";
import type { Settings as S } from "@/lib/finn/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — FINN" },
      { name: "description", content: "Tune FINN's relevance scoring weights, market-activity thresholds and data sources." },
      { property: "og:title", content: "Settings — FINN" },
      { property: "og:description", content: "Configure your intelligence engine." },
    ],
  }),
  component: Settings,
});

const WEIGHT_LABELS: Record<keyof S["weights"], string> = {
  category: "Announcement category",
  materiality: "Financial materiality",
  earnings: "Earnings impact",
  balanceSheet: "Balance-sheet impact",
  strategic: "Strategic importance",
  recency: "Recency",
  portfolio: "Portfolio relevance",
};

function Settings() {
  const { settings } = useFinnState();
  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader title="Settings" />

      <Section title="Profile">
        <label className="block text-sm">
          <span className="text-muted-foreground">Display name</span>
          <input
            value={settings.displayName}
            onChange={(e) => actions.updateSettings({ displayName: e.target.value || "Investor" })}
            className="mt-1 h-9 w-full max-w-xs rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60"
          />
        </label>
      </Section>

      <Section title="Unusual market activity thresholds">
        <div className="space-y-5">
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>Daily price move</span>
              <span className="num">±{settings.priceThresholdPct.toFixed(1)}%</span>
            </div>
            <Slider min={1} max={10} step={0.5} value={[settings.priceThresholdPct]} onValueChange={([v]) => actions.updateSettings({ priceThresholdPct: v })} />
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>Volume vs 20-day average</span>
              <span className="num">{settings.volumeMultiple.toFixed(1)}x</span>
            </div>
            <Slider min={1.2} max={5} step={0.1} value={[settings.volumeMultiple]} onValueChange={([v]) => actions.updateSettings({ volumeMultiple: v })} />
          </div>
        </div>
      </Section>

      <Section
        title="Relevance scoring weights"
        action={
          <Button size="sm" variant="ghost" onClick={() => actions.updateSettings({ weights: DEFAULT_WEIGHTS })}>
            Reset weights
          </Button>
        }
      >
        <p className="mb-4 text-xs text-muted-foreground">Relative weights are normalised to a 0–100 priority score. Critical ≥ 70, Important ≥ 45.</p>
        <div className="space-y-4">
          {(Object.keys(WEIGHT_LABELS) as (keyof S["weights"])[]).map((k) => (
            <div key={k}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span>{WEIGHT_LABELS[k]}</span>
                <span className="num text-muted-foreground">{settings.weights[k]}</span>
              </div>
              <Slider min={0} max={40} step={1} value={[settings.weights[k]]} onValueChange={([v]) => actions.updateSettings({ weights: { ...settings.weights, [k]: v } })} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Data sources">
        <ul className="space-y-2 text-sm">
          {[
            ["Market data (EOD OHLCV)", "Synthetic demo adapter"],
            ["NSE/BSE filings", "Sample announcements"],
            ["Annual reports & transcripts", "Synthetic research examples"],
            ["Push notifications", "Not configured — in-app evaluation only"],
          ].map(([k, v]) => (
            <li key={k} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <span>{k}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {v} <DemoBadge label="Demo" />
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Demo workspace">
        <p className="mb-3 text-sm text-muted-foreground">Restore the seeded 18-company portfolio, watchlist, rules and default settings.</p>
        <Button
          variant="secondary"
          onClick={() => {
            resetDemo();
            toast.success("Demo workspace restored");
          }}
        >
          Reset demo data
        </Button>
      </Section>
    </div>
  );
}
