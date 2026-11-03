import { Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { answer, type AssistantAnswer } from "@/lib/finn/assistant";
import type { ResearchReport } from "@/lib/finn/types";
import { SourceCite } from "./primitives";

const PROMPTS = [
  "What changed in the latest quarter?",
  "Compare the last four quarters.",
  "Is revenue growth translating into cash?",
  "What has management promised regarding margins?",
  "Find contradictions between management commentary and financial performance.",
];

export function Assistant({ report, ticker }: { report?: ResearchReport; ticker: string }) {
  const [q, setQ] = useState("");
  const [log, setLog] = useState<{ q: string; a: AssistantAnswer }[]>([]);
  const ask = (text: string) => {
    if (!text.trim()) return;
    setLog((l) => [...l, { q: text, a: answer(text, report) }]);
    setQ("");
  };
  return (
    <div className="panel flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="size-4 text-primary" />
        <div className="text-sm font-semibold">Ask FINN about {ticker}</div>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4" style={{ maxHeight: 520 }}>
        {log.length === 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Answers are drawn only from the documents loaded for this company.</p>
            {PROMPTS.map((p) => (
              <button key={p} onClick={() => ask(p)} className="block w-full rounded-lg border border-border px-3 py-2 text-left text-xs hover:border-primary/50 hover:text-primary">
                {p}
              </button>
            ))}
          </div>
        )}
        {log.map(({ q, a }, i) => (
          <div key={i} className="space-y-2">
            <div className="ml-auto w-fit max-w-[90%] rounded-lg bg-primary/15 px-3 py-2 text-sm">{q}</div>
            <div className="rounded-lg border border-border bg-surface p-3 text-sm">
              <div className="eyebrow mb-1.5 text-primary">{a.intent}</div>
              <ul className="space-y-1">
                {a.lines.map((l, j) => (
                  <li key={j}>{l}</li>
                ))}
              </ul>
              {a.table && (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        {a.table.head.map((h) => (
                          <th key={h} className="py-1 pr-3 font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="num">
                      {a.table.rows.map((r, k) => (
                        <tr key={k} className="border-t border-border/60">
                          {r.map((c, m) => (
                            <td key={m} className="py-1 pr-3 align-top">
                              {c}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {a.citations.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-border pt-2">
                  {a.citations.map((c, k) => (
                    <SourceCite key={k} source={c} compact />
                  ))}
                </div>
              )}
              <div className="mt-2 text-xs text-muted-foreground">
                Next: <button className="text-primary hover:underline" onClick={() => ask(a.next)}>{a.next}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
        className="flex gap-2 border-t border-border p-3"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask a research question…"
          className="h-9 flex-1 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60"
        />
        <button type="submit" aria-label="Send" className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
