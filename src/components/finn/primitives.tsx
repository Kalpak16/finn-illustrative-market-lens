import { ExternalLink, FlaskConical } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Priority, SourceRef } from "@/lib/finn/types";

export function DemoBadge({ className, label = "Demo data" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning",
        className,
      )}
      title="Synthetic sample data — not live market information or actual filings"
    >
      <FlaskConical className="size-3" />
      {label}
    </span>
  );
}

const PRIORITY_STYLE: Record<Priority, string> = {
  critical: "border-negative/40 bg-negative/10 text-negative",
  important: "border-warning/40 bg-warning/10 text-warning",
  low: "border-border bg-muted text-muted-foreground",
};
export const PRIORITY_LABEL: Record<Priority, string> = { critical: "Critical", important: "Important", low: "Low priority" };

export function PriorityBadge({ priority, score }: { priority: Priority; score?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold", PRIORITY_STYLE[priority])}>
      <span className={cn("size-1.5 rounded-full", priority === "critical" ? "bg-negative" : priority === "important" ? "bg-warning" : "bg-muted-foreground")} />
      {PRIORITY_LABEL[priority]}
      {score != null && <span className="num opacity-80">{score}</span>}
    </span>
  );
}

export function CompanyAvatar({ ticker, className }: { ticker: string; className?: string }) {
  return (
    <div
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-[11px] font-bold tracking-tight text-primary",
        className,
      )}
    >
      {ticker.replace(/[^A-Z]/g, "").slice(0, 2)}
    </div>
  );
}

export function SourceCite({ source, compact }: { source: SourceRef; compact?: boolean }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className="group inline-flex max-w-full items-start gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
    >
      <ExternalLink className="mt-0.5 size-3 shrink-0" />
      <span className="min-w-0">
        <span className="font-medium text-foreground/85 group-hover:text-primary">{source.document}</span>
        {!compact && (
          <>
            {" · "}
            {source.period}
            {source.location && ` · ${source.location}`}
          </>
        )}
      </span>
    </a>
  );
}

export function Section({ title, action, children, className }: { title: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("panel p-4", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: string }) {
  return (
    <div className="min-w-0">
      <div className="eyebrow">{label}</div>
      <div className={cn("num mt-1 truncate text-lg font-semibold", tone)}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-12 text-center">
      <div className="mb-3 text-muted-foreground">{icon}</div>
      <div className="font-medium">{title}</div>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
