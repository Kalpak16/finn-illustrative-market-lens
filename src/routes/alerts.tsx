import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DemoBadge, EmptyState, PageHeader, Section } from "@/components/finn/primitives";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { actions, useFinnState, useTriggeredAlerts } from "@/lib/finn/store";
import type { AlertRule, AnnouncementCategory, Sector } from "@/lib/finn/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts & Rules — FINN" },
      { name: "description", content: "Configure alert rules on filings, priority, price moves and volume, and see why each fired." },
      { property: "og:title", content: "Alerts & Rules — FINN" },
      { property: "og:description", content: "A configurable, explainable alert engine." },
    ],
  }),
  component: Alerts,
});

const CATS: AnnouncementCategory[] = ["Results", "M&A", "Management", "Litigation", "Fundraising", "Dividend", "Capex", "Credit rating", "Other"];

const blank = (): AlertRule => ({
  id: "r" + Date.now(),
  name: "",
  enabled: true,
  tickers: [],
  sectors: [],
  categories: [],
  minPriority: null,
  minPriceMovePct: null,
  minVolumeMultiple: null,
  match: "any",
});

function describe(r: AlertRule) {
  const scope = [r.tickers.length ? r.tickers.join(", ") : null, r.sectors.length ? r.sectors.join(", ") + " sector" : null].filter(Boolean).join(" · ") || "Any tracked company";
  const conds = [
    r.categories.length ? `files ${r.categories.join("/")}` : null,
    r.minPriority != null ? `priority ≥ ${r.minPriority}` : null,
    r.minPriceMovePct != null ? `price moves ≥ ±${r.minPriceMovePct}%` : null,
    r.minVolumeMultiple != null ? `volume ≥ ${r.minVolumeMultiple}x 20D avg` : null,
  ].filter(Boolean);
  return `${scope}: ${conds.join(r.match === "all" ? " AND " : " OR ") || "no conditions"}`;
}

function NumField({ label, value, onChange, step = 1 }: { label: string; value: number | null; onChange: (v: number | null) => void; step?: number }) {
  return (
    <label className="block text-xs">
      <span className="text-muted-foreground">{label}</span>
      <input
        type="number"
        step={step}
        value={value ?? ""}
        placeholder="Off"
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="num mt-1 h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60"
      />
    </label>
  );
}

function RuleDialog({ rule, onClose }: { rule: AlertRule | null; onClose: () => void }) {
  const { holdings } = useFinnState();
  const [r, setR] = useState<AlertRule | null>(rule);
  if (rule && r?.id !== rule.id) setR(rule);
  const sectors = [...new Set(holdings.map((h) => h.sector))] as Sector[];
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  return (
    <Dialog open={!!rule} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{rule && rule.name ? "Edit rule" : "Create rule"}</DialogTitle>
        </DialogHeader>
        {r && (
          <div className="space-y-4">
            <input
              value={r.name}
              onChange={(e) => setR({ ...r, name: e.target.value })}
              placeholder="Rule name"
              className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60"
            />
            <div>
              <div className="eyebrow mb-1.5">Companies (empty = any)</div>
              <input
                value={r.tickers.join(", ")}
                onChange={(e) => setR({ ...r, tickers: e.target.value.toUpperCase().split(/[,\s]+/).filter(Boolean) })}
                placeholder="e.g. INFY, TCS"
                className="num h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <div className="eyebrow mb-1.5">Sectors (empty = any)</div>
              <div className="flex flex-wrap gap-1.5">
                {sectors.map((s) => (
                  <button key={s} onClick={() => setR({ ...r, sectors: toggle(r.sectors, s) })} className={cn("rounded-md border px-2 py-0.5 text-xs", r.sectors.includes(s) ? "border-primary/50 bg-primary/15 text-primary" : "border-border text-muted-foreground")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="eyebrow mb-1.5">Announcement categories</div>
              <div className="flex flex-wrap gap-1.5">
                {CATS.map((c) => (
                  <button key={c} onClick={() => setR({ ...r, categories: toggle(r.categories, c) })} className={cn("rounded-md border px-2 py-0.5 text-xs", r.categories.includes(c) ? "border-primary/50 bg-primary/15 text-primary" : "border-border text-muted-foreground")}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <NumField label="Min priority" value={r.minPriority} onChange={(v) => setR({ ...r, minPriority: v })} />
              <NumField label="Price move %" value={r.minPriceMovePct} step={0.5} onChange={(v) => setR({ ...r, minPriceMovePct: v })} />
              <NumField label="Volume multiple" value={r.minVolumeMultiple} step={0.1} onChange={(v) => setR({ ...r, minVolumeMultiple: v })} />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Trigger when</span>
              {(["any", "all"] as const).map((m) => (
                <button key={m} onClick={() => setR({ ...r, match: m })} className={cn("rounded-md border px-2 py-0.5", r.match === m ? "border-primary/50 bg-primary/15 text-primary" : "border-border text-muted-foreground")}>
                  {m === "any" ? "any condition" : "all conditions"}
                </button>
              ))}
            </div>
            <p className="rounded-lg bg-surface p-2 text-xs text-muted-foreground">{describe(r)}</p>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!r) return;
              if (!r.name.trim()) return toast.error("Give the rule a name");
              if (!r.categories.length && r.minPriority == null && r.minPriceMovePct == null && r.minVolumeMultiple == null) return toast.error("Add at least one condition");
              actions.upsertRule(r);
              toast.success("Rule saved");
              onClose();
            }}
          >
            Save rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Alerts() {
  const { rules } = useFinnState();
  const triggered = useTriggeredAlerts();
  const [editing, setEditing] = useState<AlertRule | null>(null);

  return (
    <div>
      <PageHeader
        title="Alerts & Rules"
        subtitle="Rules are evaluated in-app against the latest available data. External push notifications are not configured."
        right={
          <Button onClick={() => setEditing(blank())}>
            <Plus className="size-4" /> New rule
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section title={`Rules (${rules.length})`}>
          {rules.length === 0 ? (
            <EmptyState icon={<Zap className="size-6" />} title="No rules" body="Create a rule to be alerted on filings, priority, price or volume." />
          ) : (
            <ul className="space-y-2">
              {rules.map((r) => {
                const hits = triggered.filter((t) => t.ruleId === r.id).length;
                return (
                  <li key={r.id} className={cn("rounded-lg border border-border bg-surface p-3", !r.enabled && "opacity-60")}>
                    <div className="flex items-center gap-2">
                      <Switch checked={r.enabled} onCheckedChange={(v) => actions.upsertRule({ ...r, enabled: v })} aria-label="Enable rule" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.name}</span>
                      {r.enabled && <span className="num rounded bg-primary/15 px-1.5 text-xs text-primary">{hits} hit{hits === 1 ? "" : "s"}</span>}
                      <button aria-label="Edit rule" onClick={() => setEditing(r)} className="rounded p-1 text-muted-foreground hover:text-foreground">
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        aria-label="Delete rule"
                        onClick={() => {
                          actions.deleteRule(r.id);
                          toast("Rule deleted", { action: { label: "Undo", onClick: () => actions.upsertRule(r) } });
                        }}
                        className="rounded p-1 text-muted-foreground hover:text-negative"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{describe(r)}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section title={`Triggered alerts (${triggered.length})`} action={<DemoBadge label="Demo data" />}>
          {triggered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No enabled rule matches the current data.</p>
          ) : (
            <ul className="space-y-2">
              {triggered.map((t, i) => (
                <li key={i} className="rounded-lg border border-border bg-surface p-3">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 text-sm">
                    <span>
                      <span className="num font-semibold">{t.ticker}</span> <span className="text-muted-foreground">· {t.ruleName}</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">data as of {t.at}</span>
                  </div>
                  <div className="eyebrow mt-2">Why it triggered</div>
                  <ul className="mt-1 space-y-0.5 break-words text-xs">
                    {t.reasons.map((r, j) => (
                      <li key={j}>• {r}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
      <RuleDialog rule={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
