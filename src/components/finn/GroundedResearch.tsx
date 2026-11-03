import { useServerFn } from "@tanstack/react-start";
import { Calculator, ExternalLink, FileText, Loader2, Search, ShieldCheck, Trash2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ingest, removeDoc, useLibrary } from "@/lib/finn/rag/library";
import { computeCalculations, extractMetrics } from "@/lib/finn/rag/metrics";
import { groundedResearch, type GroundedOutput, type ResearchTask } from "@/lib/finn/rag/research.functions";
import { retrieve } from "@/lib/finn/rag/retrieve";
import { DOC_KIND_LABEL, INSUFFICIENT, type Chunk, type Claim, type DocKind, type DocMeta, type Passage } from "@/lib/finn/rag/types";
import { cn } from "@/lib/utils";
import { Section } from "./primitives";

/* ---------------- Document intake ---------------- */

function DocumentIntake({ ticker, onAdded }: { ticker: string; onAdded: () => void }) {
  const [kind, setKind] = useState<DocKind>("annual_report");
  const [period, setPeriod] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (url && !/^https:\/\//.test(url)) return toast.error("Source URL must start with https://");
    if (file.size > 40 * 1024 * 1024) return toast.error("File too large (max 40 MB)");
    try {
      const doc = await ingest(ticker, file, { kind, period, url }, setBusy);
      toast.success(`${doc.name} indexed`, { description: `${doc.pages} pages · ${doc.chunks} passages` });
      setPeriod("");
      setUrl("");
      onAdded();
    } catch (e) {
      toast.error("Could not process document", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(null);
    }
  };

  const input = "h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60";
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value as DocKind)} className={input} aria-label="Document type">
          {(Object.keys(DOC_KIND_LABEL) as DocKind[]).map((k) => (
            <option key={k} value={k}>
              {DOC_KIND_LABEL[k]}
            </option>
          ))}
        </select>
        <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Period, e.g. FY25" className={input} aria-label="Reporting period" />
      </div>
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Official source URL (optional)" className={input} aria-label="Source URL" />
      <label
        className={cn(
          "flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary",
          busy && "pointer-events-none opacity-70",
        )}
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
        {busy ?? "Upload PDF or transcript (.txt)"}
        <input type="file" accept="application/pdf,.pdf,text/plain,.txt,.md" className="hidden" onChange={(e) => (onFile(e.target.files?.[0]), (e.target.value = ""))} />
      </label>
      <p className="text-[11px] text-muted-foreground">Processed on this device. Only the passages retrieved for a question are sent for analysis.</p>
    </div>
  );
}

/* ---------------- Citations & inspector ---------------- */

function Cites({ ids, index, onOpen }: { ids: string[]; index: Map<string, number>; onOpen: (id: string) => void }) {
  return (
    <span className="ml-1 inline-flex flex-wrap gap-0.5 align-middle">
      {ids.map((id) => (
        <button key={id} onClick={() => onOpen(id)} className="num rounded bg-primary/15 px-1 text-[10px] font-semibold text-primary hover:bg-primary/25" title="Inspect source passage">
          {index.get(id) ?? "?"}
        </button>
      ))}
    </span>
  );
}

function ClaimList({ claims, index, onOpen }: { claims: Claim[]; index: Map<string, number>; onOpen: (id: string) => void }) {
  if (!claims.length) return <p className="text-sm text-warning">{INSUFFICIENT}</p>;
  return (
    <ul className="space-y-1.5 text-sm">
      {claims.map((c, i) => (
        <li key={i}>
          {c.text}
          <Cites ids={c.citations} index={index} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  );
}

export function SourceInspector({ docs, chunks, selected, onSelect, used }: { docs: DocMeta[]; chunks: Chunk[]; selected: string | null; onSelect: (id: string | null) => void; used: Passage[] }) {
  const chunk = chunks.find((c) => c.id === selected);
  const doc = chunk && docs.find((d) => d.id === chunk.docId);
  return (
    <Section title={<span className="flex items-center gap-2"><Search className="size-4 text-primary" /> Source inspector</span>}>
      {chunk && doc ? (
        <div className="mb-4 rounded-lg border border-primary/40 bg-surface p-3">
          <div className="mb-1 flex items-start justify-between gap-2 text-xs">
            <div className="min-w-0">
              <div className="truncate font-semibold">{doc.name}</div>
              <div className="text-muted-foreground">
                {DOC_KIND_LABEL[doc.kind]} · {doc.period} · {doc.kind === "transcript" && !doc.name.toLowerCase().endsWith(".pdf") ? "Section" : "Page"} {chunk.page}
              </div>
            </div>
            <button onClick={() => onSelect(null)} className="shrink-0 text-muted-foreground hover:text-foreground">Close</button>
          </div>
          <p className="max-h-64 overflow-auto whitespace-pre-wrap border-l-2 border-primary/50 pl-2 text-xs leading-relaxed">{chunk.text}</p>
          {doc.url && (
            <a href={doc.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
              <ExternalLink className="size-3" /> Open official source{doc.kind !== "transcript" && ` (p.${chunk.page})`}
            </a>
          )}
        </div>
      ) : (
        <p className="mb-3 text-xs text-muted-foreground">Click any citation number to inspect the exact passage it came from.</p>
      )}
      {used.length > 0 && (
        <div className="mb-3">
          <div className="eyebrow mb-1.5">Passages used in the latest analysis</div>
          <ul className="space-y-1">
            {used.map((p, i) => (
              <li key={p.id}>
                <button onClick={() => onSelect(p.id)} className={cn("flex w-full gap-2 rounded px-1.5 py-1 text-left text-xs hover:bg-accent", selected === p.id && "bg-accent")}>
                  <span className="num w-5 shrink-0 text-primary">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{p.docName}</span>
                  <span className="num shrink-0 text-muted-foreground">p.{p.page}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="eyebrow mb-1.5">Documents ({docs.length})</div>
      <ul className="space-y-1 text-xs">
        {docs.map((d) => (
          <li key={d.id} className="flex items-center gap-2">
            <FileText className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{d.name}</span>
            <span className="shrink-0 text-muted-foreground">{d.period} · {d.pages}p</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ---------------- Main grounded research ---------------- */

const TASK_QUERIES: Record<Exclude<ResearchTask, "qa">, string[]> = {
  guidance: ["guidance expect target outlook will aim plan margin growth capex", "revenue ebitda profit results reported quarter year grew declined"],
  bullbear: ["growth improvement strong demand expansion margin", "risk pressure decline debt headwind challenge weak"],
};

function dedupe(ps: Passage[], k: number) {
  const seen = new Set<string>();
  return ps.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true))).slice(0, k);
}

export function useGrounded(ticker: string) {
  const lib = useLibrary(ticker);
  const facts = useMemo(() => extractMetrics(lib.chunks, lib.docs), [lib.chunks, lib.docs]);
  const calcs = useMemo(() => computeCalculations(facts), [facts]);
  return { ...lib, facts, calcs };
}

export function GroundedResearch({ ticker, g, onInspect, onUsed }: { ticker: string; g: ReturnType<typeof useGrounded>; onInspect: (id: string) => void; onUsed: (p: Passage[]) => void }) {
  const run = useServerFn(groundedResearch);
  const [tab, setTab] = useState<"ask" | "metrics" | "guidance" | "bullbear">("ask");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<ResearchTask | null>(null);
  const [results, setResults] = useState<Partial<Record<ResearchTask, { out: GroundedOutput; passages: Passage[]; question: string }>>>({});

  const runTask = async (task: ResearchTask, question: string) => {
    const passages =
      task === "qa"
        ? retrieve(question, g.chunks, g.docs, 10)
        : dedupe(TASK_QUERIES[task].flatMap((tq) => retrieve(`${tq} ${question}`, g.chunks, g.docs, 7)), 14);
    onUsed(passages);
    if (!passages.length) {
      setResults((r) => ({ ...r, [task]: { out: { ok: true, insufficient: true, claims: [], guidance: [], bull: [], bear: [], nextQuestion: null, dropped: [] }, passages, question } }));
      return;
    }
    setBusy(task);
    try {
      const out = await run({
        data: {
          task,
          ticker,
          question,
          passages: passages.map((p) => ({ id: p.id, text: p.text.slice(0, 2000), doc: p.docName, page: p.page, period: p.period, kind: DOC_KIND_LABEL[p.kind] })),
          calculations: g.calcs.slice(0, 60).map(({ label, value, formula }) => ({ label, value, formula })),
        },
      });
      if (out.error) toast.error(out.error);
      setResults((r) => ({ ...r, [task]: { out, passages, question } }));
    } catch {
      toast.error("Analysis request failed. Showing retrieved passages only.");
      setResults((r) => ({ ...r, [task]: { out: { ok: false, insufficient: true, claims: [], guidance: [], bull: [], bear: [], nextQuestion: null, dropped: [], error: "Request failed" }, passages, question } }));
    } finally {
      setBusy(null);
    }
  };

  const indexFor = (task: ResearchTask) => new Map((results[task]?.passages ?? []).map((p, i) => [p.id, i + 1]));
  const factIndex = new Map(g.facts.map((f) => [f.id, f]));

  const Tab = ({ k, label }: { k: typeof tab; label: string }) => (
    <button onClick={() => setTab(k)} className={cn("whitespace-nowrap rounded-md px-2.5 py-1 text-xs", tab === k ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>
      {label}
    </button>
  );

  const Fallback = ({ task }: { task: ResearchTask }) => {
    const r = results[task];
    if (!r) return null;
    const idx = indexFor(task);
    return (
      <div className="mt-3 space-y-2">
        {r.out.dropped.length > 0 && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">{r.out.dropped.length} unsupported statement(s) removed by the grounding check</summary>
            <ul className="mt-1 space-y-1 pl-3">
              {r.out.dropped.map((d, i) => (
                <li key={i}>“{d.text}” — {d.reason}</li>
              ))}
            </ul>
          </details>
        )}
        {(!r.out.ok || r.out.insufficient) && r.passages.length > 0 && (
          <div>
            <div className="eyebrow mb-1">Most relevant retrieved passages (verbatim)</div>
            {r.passages.slice(0, 3).map((p) => (
              <button key={p.id} onClick={() => onInspect(p.id)} className="mb-1 block w-full rounded-lg border border-border bg-surface p-2 text-left text-xs hover:border-primary/50">
                <span className="num mr-1 text-primary">[{idx.get(p.id)}]</span>
                <span className="text-muted-foreground">{p.docName} · p.{p.page}: </span>
                {p.text.slice(0, 260)}…
              </button>
            ))}
          </div>
        )}
        {r.out.nextQuestion && !r.out.insufficient && (
          <div className="text-xs text-muted-foreground">
            Next:{" "}
            <button className="text-primary hover:underline" onClick={() => (setQ(r.out.nextQuestion!), runTask("qa", r.out.nextQuestion!), setTab("ask"))}>
              {r.out.nextQuestion}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Section
      title={<span className="flex items-center gap-2"><ShieldCheck className="size-4 text-positive" /> Grounded research · your documents</span>}
      action={<span className="text-[11px] text-muted-foreground">{g.docs.length} docs · {g.chunks.length} passages</span>}
    >
      <div className="-mx-1 mb-3 flex gap-1 overflow-x-auto px-1">
        <Tab k="ask" label="Ask" />
        <Tab k="metrics" label={`Metrics (${g.facts.length})`} />
        <Tab k="guidance" label="Narrative vs Numbers" />
        <Tab k="bullbear" label="Bull vs Bear" />
      </div>

      {tab === "ask" && (
        <div>
          <form onSubmit={(e) => (e.preventDefault(), q.trim() && runTask("qa", q.trim()))} className="flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Is revenue growth translating into cash?" className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60" />
            <Button type="submit" size="sm" disabled={busy === "qa" || !q.trim()}>
              {busy === "qa" ? <Loader2 className="size-3.5 animate-spin" /> : "Ask"}
            </Button>
          </form>
          {results.qa && (
            <div className="mt-3 rounded-lg border border-border bg-surface p-3">
              <div className="eyebrow mb-1.5">{results.qa.question}</div>
              <ClaimList claims={results.qa.out.claims} index={indexFor("qa")} onOpen={onInspect} />
            </div>
          )}
          <Fallback task="qa" />
        </div>
      )}

      {tab === "metrics" && (
        <div className="space-y-4">
          <div>
            <div className="eyebrow mb-1.5 flex items-center gap-1"><Calculator className="size-3" /> Deterministic calculations (computed by code, not AI)</div>
            {g.calcs.length === 0 ? (
              <p className="text-sm text-warning">{INSUFFICIENT} Need matching metrics with the same unit, basis and period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-xs">
                  <thead className="text-left text-muted-foreground"><tr><th className="py-1 pr-3 font-medium">Calculation</th><th className="py-1 pr-3 font-medium">Value</th><th className="py-1 pr-3 font-medium">Formula</th><th className="py-1 font-medium">Inputs</th></tr></thead>
                  <tbody>
                    {g.calcs.map((c, i) => (
                      <tr key={i} className="border-t border-border/60">
                        <td className="py-1.5 pr-3">{c.label}</td>
                        <td className="num py-1.5 pr-3 font-semibold">{c.value}</td>
                        <td className="num py-1.5 pr-3 text-muted-foreground">{c.formula}</td>
                        <td className="py-1.5">
                          {c.inputs.map((id) => {
                            const f = factIndex.get(id);
                            return f ? <button key={id} onClick={() => onInspect(f.chunkId)} className="mr-1 text-primary hover:underline">p.{f.page}</button> : null;
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div>
            <div className="eyebrow mb-1.5">Extracted metrics</div>
            {g.facts.length === 0 ? (
              <p className="text-sm text-warning">{INSUFFICIENT}</p>
            ) : (
              <div className="max-h-96 overflow-auto">
                <table className="w-full min-w-[620px] text-xs">
                  <thead className="sticky top-0 bg-card text-left text-muted-foreground"><tr><th className="py-1 pr-3 font-medium">Metric</th><th className="py-1 pr-3 font-medium">Value</th><th className="py-1 pr-3 font-medium">Unit</th><th className="py-1 pr-3 font-medium">Period</th><th className="py-1 pr-3 font-medium">Basis</th><th className="py-1 font-medium">Source</th></tr></thead>
                  <tbody>
                    {g.facts.map((f) => (
                      <tr key={f.id} className="border-t border-border/60 align-top">
                        <td className="py-1.5 pr-3">{f.metric}</td>
                        <td className="num py-1.5 pr-3">{f.value.toLocaleString("en-IN")}</td>
                        <td className={cn("py-1.5 pr-3", f.unit === "unknown" && "text-warning")}>{f.unit === "unknown" ? "Unit not stated" : f.unit}</td>
                        <td className="py-1.5 pr-3">{f.period}{f.periodSource === "document" && <span className="text-muted-foreground"> (doc)</span>}</td>
                        <td className="py-1.5 pr-3">{f.basis}</td>
                        <td className="py-1.5"><button onClick={() => onInspect(f.chunkId)} className="text-primary hover:underline" title={f.excerpt}>p.{f.page}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-2 text-[11px] text-muted-foreground">Pattern-based extraction. Verify each figure against its page before relying on it; figures with no stated unit are excluded from calculations.</p>
          </div>
        </div>
      )}

      {tab === "guidance" && (
        <div>
          <Button size="sm" variant="secondary" onClick={() => runTask("guidance", "")} disabled={busy === "guidance"}>
            {busy === "guidance" ? <Loader2 className="size-3.5 animate-spin" /> : null} {results.guidance ? "Re-run comparison" : "Compare management statements with reported results"}
          </Button>
          {results.guidance && (
            results.guidance.out.guidance.length === 0 ? (
              <p className="mt-3 text-sm text-warning">{INSUFFICIENT}</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-1.5 pr-3 font-medium">Management statement</th><th className="py-1.5 pr-3 font-medium">Period</th><th className="py-1.5 pr-3 font-medium">Actual outcome</th><th className="py-1.5 font-medium">Status</th></tr></thead>
                  <tbody>
                    {results.guidance.out.guidance.map((r, i) => (
                      <tr key={i} className="border-t border-border/60 align-top">
                        <td className="py-2 pr-3">{r.statement}<Cites ids={r.statementCitations} index={indexFor("guidance")} onOpen={onInspect} /></td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">{r.period}</td>
                        <td className={cn("py-2 pr-3", !r.outcomeCitations.length && "text-warning")}>{r.outcome}<Cites ids={r.outcomeCitations} index={indexFor("guidance")} onOpen={onInspect} /></td>
                        <td className="py-2 text-xs font-semibold">{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
          <Fallback task="guidance" />
        </div>
      )}

      {tab === "bullbear" && (
        <div>
          <Button size="sm" variant="secondary" onClick={() => runTask("bullbear", "")} disabled={busy === "bullbear"}>
            {busy === "bullbear" ? <Loader2 className="size-3.5 animate-spin" /> : null} {results.bullbear ? "Rebuild" : "Build bull vs bear from evidence"}
          </Button>
          {results.bullbear && (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-positive/30 bg-positive/5 p-3">
                <div className="eyebrow mb-2 text-positive">Bull case</div>
                <ClaimList claims={results.bullbear.out.bull} index={indexFor("bullbear")} onOpen={onInspect} />
              </div>
              <div className="rounded-lg border border-negative/30 bg-negative/5 p-3">
                <div className="eyebrow mb-2 text-negative">Bear case</div>
                <ClaimList claims={results.bullbear.out.bear} index={indexFor("bullbear")} onOpen={onInspect} />
              </div>
            </div>
          )}
          <Fallback task="bullbear" />
        </div>
      )}

      <p className="mt-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
        Retrieval-first: passages are selected by code, the AI only explains them, and any claim without a valid citation — or with a number not found in its source — is removed. Not investment advice.
      </p>
    </Section>
  );
}

export function DocumentLibrary({ ticker, g }: { ticker: string; g: ReturnType<typeof useGrounded> }) {
  return (
    <Section title="Primary documents">
      {g.docs.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          {g.docs.map((d) => (
            <li key={d.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs">
              <FileText className="size-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{d.name}</div>
                <div className="text-muted-foreground">{DOC_KIND_LABEL[d.kind]} · {d.period} · {d.pages}p · {d.chunks} passages</div>
              </div>
              <button aria-label={`Remove ${d.name}`} onClick={async () => (await removeDoc(ticker, d.id), g.refresh(), toast(`${d.name} removed`))} className="rounded p-1 text-muted-foreground hover:text-negative">
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <DocumentIntake ticker={ticker} onAdded={g.refresh} />
    </Section>
  );
}
