import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { UNIVERSE, isValidNseSymbol } from "@/lib/finn/data/companies";
import { cn } from "@/lib/utils";

/** Ticker autocomplete over the demo universe; also accepts any valid NSE symbol. */
export function CompanySearch({
  onSelect,
  placeholder = "Search NSE ticker or company…",
  className,
  autoFocus,
}: {
  onSelect: (ticker: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const hits = UNIVERSE.filter((c) => c.ticker.toLowerCase().includes(s) || c.name.toLowerCase().includes(s)).slice(0, 7);
    const exact = hits.some((h) => h.ticker.toLowerCase() === s);
    const items = hits.map((h) => ({ ticker: h.ticker, label: h.name, note: h.sector }));
    if (!exact && isValidNseSymbol(q)) items.push({ ticker: q.trim().toUpperCase(), label: "Use NSE symbol", note: "Not in demo universe" });
    return items;
  }, [q]);

  const choose = (t: string) => {
    onSelect(t);
    setQ("");
    setOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, results.length - 1));
          if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
          if (e.key === "Enter" && results[active]) choose(results[active].ticker);
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder}
        aria-label="Search companies"
        className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-xl">
          {results.map((r, i) => (
            <li key={r.ticker + r.label}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(r.ticker)}
                className={cn("flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm", i === active && "bg-accent")}
              >
                <span className="min-w-0 truncate">
                  <span className="num font-semibold">{r.ticker}</span>
                  <span className="ml-2 text-muted-foreground">{r.label}</span>
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{r.note}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
