import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Briefcase, Eye, FlaskConical, Radar, Settings as SettingsIcon, SlidersHorizontal } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFinnState, useTriggeredAlerts } from "@/lib/finn/store";
import { cn } from "@/lib/utils";
import { CompanySearch } from "./CompanySearch";
import { DemoBadge } from "./primitives";

const NAV = [
  { to: "/", label: "Intelligence Feed", short: "Feed", icon: Radar },
  { to: "/portfolio", label: "My Portfolio", short: "Portfolio", icon: Briefcase },
  { to: "/research", label: "Research Lab", short: "Research", icon: FlaskConical },
  { to: "/alerts", label: "Alerts & Rules", short: "Alerts", icon: SlidersHorizontal },
  { to: "/watchlist", label: "Watchlist", short: "Watch", icon: Eye },
  { to: "/settings", label: "Settings", short: "Settings", icon: SettingsIcon },
] as const;

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="grid size-7 place-items-center rounded-md bg-primary text-[13px] font-black text-primary-foreground">F</div>
      <span className="text-[15px] font-bold tracking-tight">FINN</span>
    </Link>
  );
}

function useMarketStatus() {
  const [status, setStatus] = useState<{ open: boolean; label: string } | null>(null);
  useEffect(() => {
    const calc = () => {
      const ist = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const day = ist.getDay();
      const mins = ist.getHours() * 60 + ist.getMinutes();
      const open = day > 0 && day < 6 && mins >= 555 && mins < 930;
      setStatus({ open, label: open ? "NSE open" : "NSE closed" });
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, []);
  return status;
}

function isActive(path: string, to: string) {
  return to === "/" ? path === "/" : path.startsWith(to);
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const market = useMarketStatus();
  const alerts = useTriggeredAlerts();
  const { settings } = useFinnState();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-14 items-center px-4">
          <Logo />
        </div>
        <nav className="flex-1 space-y-0.5 px-2 py-2">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
                isActive(path, n.to) && "bg-sidebar-accent font-medium text-foreground",
              )}
            >
              <n.icon className={cn("size-4", isActive(path, n.to) && "text-primary")} />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="m-3 rounded-lg border border-sidebar-border p-3 text-xs text-muted-foreground">
          <DemoBadge className="mb-2" label="Demo mode" />
          <p>Seeded synthetic filings and EOD prices. Not live market data.</p>
        </div>
      </aside>

      <div className="lg:pl-56">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur">
          <div className="lg:hidden">
            <Logo />
          </div>
          <CompanySearch
            className="hidden max-w-md flex-1 sm:block"
            onSelect={(t) => navigate({ to: "/company/$ticker", params: { ticker: t } })}
          />
          <div className="ml-auto flex items-center gap-2">
            <DemoBadge className="hidden md:inline-flex" label="Demo mode" />
            {market && (
              <span className="hidden items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground sm:inline-flex">
                <span className={cn("size-1.5 rounded-full", market.open ? "bg-positive" : "bg-muted-foreground")} />
                {market.label}
              </span>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <button aria-label="Notifications" className="relative grid size-9 place-items-center rounded-lg border border-border hover:bg-accent">
                  <Bell className="size-4" />
                  {alerts.length > 0 && (
                    <span className="num absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-negative px-1 text-[10px] font-bold text-destructive-foreground">
                      {alerts.length}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="border-b border-border px-3 py-2 text-xs font-semibold">In-app alerts (evaluated, not pushed)</div>
                <ul className="max-h-72 overflow-auto">
                  {alerts.length === 0 && <li className="px-3 py-4 text-sm text-muted-foreground">No rules triggered.</li>}
                  {alerts.slice(0, 8).map((a, i) => (
                    <li key={i} className="border-b border-border/60 px-3 py-2 text-xs last:border-0">
                      <div className="font-medium">
                        <span className="num">{a.ticker}</span> · {a.ruleName}
                      </div>
                      <div className="mt-0.5 text-muted-foreground">{a.reasons[0]}</div>
                    </li>
                  ))}
                </ul>
                <Link to="/alerts" className="block border-t border-border px-3 py-2 text-xs text-primary hover:bg-accent">
                  View all alerts →
                </Link>
              </PopoverContent>
            </Popover>
            <Link
              to="/settings"
              aria-label="Profile and settings"
              className="grid size-9 place-items-center rounded-lg bg-secondary text-xs font-semibold"
            >
              {(settings.displayName.trim() || "Investor").slice(0, 2).toUpperCase()}
            </Link>
          </div>
        </header>

        <div className="border-b border-border px-4 py-2 sm:hidden">
          <CompanySearch onSelect={(t) => navigate({ to: "/company/$ticker", params: { ticker: t } })} />
        </div>

        <main className="mx-auto max-w-[1400px] px-4 pb-24 pt-5 lg:px-6 lg:pb-10">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-sidebar-border bg-sidebar lg:hidden">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground",
              isActive(path, n.to) && "text-primary",
            )}
          >
            <n.icon className="size-4" />
            {n.short}
          </Link>
        ))}
      </nav>
    </div>
  );
}
