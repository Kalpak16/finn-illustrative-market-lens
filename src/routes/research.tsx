import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileText, Link2, Plus, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Assistant } from "@/components/finn/Assistant";
import { CompanySearch } from "@/components/finn/CompanySearch";
import { ResearchReportView } from "@/components/finn/ResearchReport";
import { DemoBadge, Section, SourceCite } from "@/components/finn/primitives";
import { Button } from "@/components/ui/button";
import { companyName, isValidNseSymbol } from "@/lib/finn/data/companies";
import { getResearch } from "@/lib/finn/data/research";

export const Route = createFileRoute("/research")({
  validateSearch: (s: Record<string, unknown>): { ticker?: string } => ({
    ticker: typeof s.ticker === "string" && isValidNseSymbol(s.ticker) ? s.ticker.toUpperCase() : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Research Lab — FINN" },
      { name: "description", content: "Primary-source company research: financials, cash quality, narrative vs numbers, and bull vs bear." },
      { property: "og:title", content: "Research Lab — FINN" },
      { property: "og:description", content: "Research anything. Understand everything." },
    ],
  }),
  component: Research,
});

const SUGGESTED = [
  { label: "Analyse Reliance Industries.", ticker: "RELIANCE" },
  { label: "Is Infosys improving its cash conversion?", ticker: "INFY" },
  { label: "What has changed in HDFC Bank's balance sheet?", ticker: "HDFCBANK" },
  { label: "Compare management guidance against actual results.", ticker: "TATAMOTORS" },
  { label: "Build a bull vs bear case for Tata Motors.", ticker: "TATAMOTORS" },
];

function DocumentIntake({ ticker }: { ticker: string }) {
  const [url, setUrl] = useState("");
  const [docs, setDocs] = useState<string[]>([]);
  return (
    <div className="space-y-2">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            const u = new URL(url);
            if (u.protocol !== "https:") throw new Error();
            setDocs((d) => [...d, u.toString()]);
            setUrl("");
            toast.success("Document queued", { description: "Parsing and indexing requires the backend to be enabled — queued locally only." });
          } catch {
            toast.error("Enter a valid https:// URL to an official filing");
          }
        }}
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={`Official ${ticker} annual report / results URL`}
          className="h-9 flex-1 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60"
        />
        <Button type="submit" size="sm" variant="secondary">
          <Link2 className="size-3.5" /> Add
        </Button>
      </form>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary">
        <Upload className="size-3.5" /> Upload PDF report
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setDocs((d) => [...d, f.name]);
              toast.success(`${f.name} queued`, { description: "Text extraction runs once the backend is enabled." });
            }
          }}
        />
      </label>
      {docs.map((d) => (
        <div key={d} className="flex items-center gap-2 truncate text-xs">
          <FileText className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{d}</span>
          <span className="ml-auto shrink-0 rounded bg-muted px-1.5 text-[10px] text-muted-foreground">Queued · not indexed</span>
        </div>
      ))}
    </div>
  );
}

function Research() {
  const { ticker } = Route.useSearch();
  const navigate = useNavigate({ from: "/research" });
  const report = ticker ? getResearch(ticker) : undefined;
  const select = (t: string) => navigate({ search: { ticker: t } });

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight">Research anything. Understand everything.</h1>
        <p className="mt-1 text-sm text-muted-foreground">Primary sources only — annual reports, filed results, investor presentations, official transcripts.</p>
        <CompanySearch className="mt-4 max-w-xl" onSelect={select} placeholder="Search any NSE ticker…" />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTED.map((s) => (
            <button key={s.label} onClick={() => select(s.ticker)} className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary">
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {!ticker && (
        <div className="panel p-6 text-sm text-muted-foreground">
          Choose a company to generate a structured research report. Demo reports with sources are available for{" "}
          {["RELIANCE", "INFY", "TATAMOTORS"].map((t, i) => (
            <span key={t}>
              <button className="num text-primary hover:underline" onClick={() => select(t)}>
                {t}
              </button>
              {i < 2 ? ", " : "."}
            </span>
          ))}
        </div>
      )}

      {ticker && (
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-baseline gap-2">
              <h2 className="text-lg font-semibold">{companyName(ticker)}</h2>
              <span className="num text-sm text-muted-foreground">NSE: {ticker}</span>
            </div>
            {report ? (
              <ResearchReportView r={report} />
            ) : (
              <div className="panel p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">Insufficient source evidence</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  No primary documents are loaded for {ticker}. FINN will not generate a report from model memory or third-party
                  commentary. Add an official annual report, results filing or transcript to begin.
                </p>
                <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  {["A. Business snapshot", "B. Financial snapshot", "C. Financial trajectory", "D. Balance sheet", "E. Cash quality", "F. Narrative vs Numbers", "G. Management guidance", "H. Bull vs Bear"].map((s) => (
                    <div key={s} className="rounded-lg border border-border px-3 py-2">
                      {s} — <span className="text-warning">awaiting documents</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <Section title="Sources used" action={report ? <DemoBadge label="Demo" /> : <Plus className="size-4 text-muted-foreground" />}>
              {report ? (
                <ul className="space-y-2.5">
                  {report.sources.map((s, i) => (
                    <li key={i}>
                      <SourceCite source={s} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No documents yet.</p>
              )}
              <div className="mt-4 border-t border-border pt-3">
                <div className="eyebrow mb-2">Add primary document</div>
                <DocumentIntake ticker={ticker} />
              </div>
            </Section>
            <Assistant key={ticker} report={report} ticker={ticker} />
          </aside>
        </div>
      )}
    </div>
  );
}
