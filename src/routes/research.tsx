import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Assistant } from "@/components/finn/Assistant";
import { CompanySearch } from "@/components/finn/CompanySearch";
import { ResearchReportView } from "@/components/finn/ResearchReport";
import { DocumentLibrary, GroundedResearch, SourceInspector, useGrounded } from "@/components/finn/GroundedResearch";
import type { Passage } from "@/lib/finn/rag/types";
import { DemoBadge, Section, SourceCite } from "@/components/finn/primitives";
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

function Research() {
  const { ticker } = Route.useSearch();
  const navigate = useNavigate({ from: "/research" });
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

      {ticker && <TickerResearch key={ticker} ticker={ticker} />}
    </div>
  );
}

function DemoSourceInspector({ report }: { report: NonNullable<ReturnType<typeof getResearch>> }) {
  return (
    <Section title="Source inspector · demo report" action={<DemoBadge label="Demo" />}>
      <ul className="space-y-3">
        {report.sources.map((s, i) => (
          <li key={i} className="text-xs">
            <SourceCite source={s} />
            <p className="mt-1 border-l-2 border-border pl-2 italic text-muted-foreground">{s.excerpt ?? "Synthetic demo citation — no extracted excerpt. Upload the real document to inspect passages."}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function TickerResearch({ ticker }: { ticker: string }) {
  const report = getResearch(ticker);
  const g = useGrounded(ticker);
  const [selected, setSelected] = useState<string | null>(null);
  const [used, setUsed] = useState<Passage[]>([]);
  const hasDocs = g.docs.length > 0;
  const inspect = (id: string) => {
    setSelected(id);
    document.getElementById("source-inspector")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="text-lg font-semibold">{companyName(ticker)}</h2>
          <span className="num text-sm text-muted-foreground">NSE: {ticker}</span>
        </div>
        {g.loading ? (
          <div className="panel h-40 animate-pulse" />
        ) : hasDocs ? (
          <GroundedResearch ticker={ticker} g={g} onInspect={inspect} onUsed={setUsed} />
        ) : !report ? (
          <div className="panel p-5">
            <span className="rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">Insufficient source evidence</span>
            <p className="mt-2 text-sm text-muted-foreground">
              No primary documents are loaded for {ticker}. FINN will not generate research from model memory or third-party commentary.
              Upload an official annual report, results filing or earnings-call transcript to begin.
            </p>
          </div>
        ) : null}
        {report && (
          <div className="space-y-2">
            {hasDocs && <div className="eyebrow">Demo report (synthetic, for comparison)</div>}
            <ResearchReportView r={report} />
          </div>
        )}
      </div>

      <aside className="min-w-0 space-y-4">
        <DocumentLibrary ticker={ticker} g={g} />
        <div id="source-inspector">
          {hasDocs ? (
            <SourceInspector docs={g.docs} chunks={g.chunks} selected={selected} onSelect={setSelected} used={used} />
          ) : report ? (
            <DemoSourceInspector report={report} />
          ) : (
            <Section title="Source inspector">
              <p className="text-xs text-muted-foreground">No documents yet.</p>
            </Section>
          )}
        </div>
        {!hasDocs && report && <Assistant report={report} ticker={ticker} />}
      </aside>
    </div>
  );
}
