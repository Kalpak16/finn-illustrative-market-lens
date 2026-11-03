import { createServerFn } from "@tanstack/react-start";
import { guardClaims, guardGuidance } from "./grounding";
import type { Claim, GuidanceRow } from "./types";

export type ResearchTask = "qa" | "guidance" | "bullbear";

export interface GroundedInput {
  task: ResearchTask;
  ticker: string;
  question: string;
  passages: { id: string; text: string; doc: string; page: number; period: string; kind: string }[];
  calculations: { label: string; value: string; formula: string }[];
}

export interface GroundedOutput {
  ok: boolean;
  insufficient: boolean;
  claims: Claim[];
  guidance: GuidanceRow[];
  bull: Claim[];
  bear: Claim[];
  nextQuestion: string | null;
  reason?: string;
  dropped: { text: string; reason: string }[];
  error?: string;
}

const EMPTY: Omit<GroundedOutput, "ok" | "insufficient"> = { claims: [], guidance: [], bull: [], bear: [], nextQuestion: null, dropped: [] };

function validate(input: unknown): GroundedInput {
  const i = input as GroundedInput;
  if (!i || !["qa", "guidance", "bullbear"].includes(i.task)) throw new Error("Invalid task");
  if (typeof i.ticker !== "string" || !/^[A-Z0-9&-]{1,20}$/.test(i.ticker)) throw new Error("Invalid ticker");
  if (typeof i.question !== "string" || i.question.length > 500) throw new Error("Invalid question");
  if (!Array.isArray(i.passages) || i.passages.length > 16) throw new Error("Too many passages");
  for (const p of i.passages) {
    if (typeof p.id !== "string" || typeof p.text !== "string" || p.text.length > 2000) throw new Error("Invalid passage");
  }
  if (!Array.isArray(i.calculations) || i.calculations.length > 60) throw new Error("Invalid calculations");
  return i;
}

const claimSchema = {
  type: "object",
  additionalProperties: false,
  required: ["text", "citations"],
  properties: { text: { type: "string" }, citations: { type: "array", items: { type: "string" } } },
};

function schemaFor(task: ResearchTask) {
  const base = { insufficient: { type: "boolean" }, insufficient_reason: { type: "string" }, next_question: { type: "string" } };
  if (task === "qa")
    return { type: "object", additionalProperties: false, required: ["insufficient", "insufficient_reason", "claims", "next_question"], properties: { ...base, claims: { type: "array", items: claimSchema } } };
  if (task === "guidance")
    return {
      type: "object",
      additionalProperties: false,
      required: ["insufficient", "insufficient_reason", "rows", "next_question"],
      properties: {
        ...base,
        rows: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["statement", "period", "outcome", "status", "statement_citations", "outcome_citations"],
            properties: {
              statement: { type: "string" },
              period: { type: "string" },
              outcome: { type: "string" },
              status: { type: "string", enum: ["Delivered", "Partially delivered", "Missed", "Not yet measurable"] },
              statement_citations: { type: "array", items: { type: "string" } },
              outcome_citations: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    };
  return {
    type: "object",
    additionalProperties: false,
    required: ["insufficient", "insufficient_reason", "bull", "bear", "next_question"],
    properties: { ...base, bull: { type: "array", items: claimSchema }, bear: { type: "array", items: claimSchema } },
  };
}

const RULES = `You are FINN, a primary-source financial research analyst.
STRICT RULES:
- Use ONLY the numbered PASSAGES and CALCULATIONS provided. Never use prior knowledge, news, or broker views.
- Every claim must cite one or more passage ids exactly as given (e.g. "d1:4"). Never invent ids.
- Every number you write must appear verbatim in a cited passage or in CALCULATIONS. Do not compute new numbers yourself.
- Keep claims short (one sentence). Do not give buy/sell recommendations.
- If the passages do not answer the request (or concern a different company), set insufficient=true, explain why briefly in insufficient_reason, and return empty arrays. Otherwise insufficient_reason is "".
- Never treat vague commentary as a numerical commitment.`;

const TASK_PROMPT: Record<ResearchTask, string> = {
  qa: "Answer the investor's question in 2–6 cited claims.",
  guidance:
    "Identify explicit management statements/guidance (from transcripts or reports) and compare each with the reported actual outcome in the passages. Status: Delivered / Partially delivered / Missed only when an actual figure is cited; otherwise 'Not yet measurable'. Cite the statement and the outcome separately.",
  bullbear: "Build a balanced bull case and bear case (2–5 claims each) strictly from evidence in the passages.",
};

function outputText(res: unknown): string {
  const r = res as { output?: { type: string; content?: { type: string; text?: string }[] }[] };
  return (r.output ?? [])
    .filter((o) => o.type === "message")
    .flatMap((o) => o.content ?? [])
    .filter((c) => c.type === "output_text")
    .map((c) => c.text ?? "")
    .join("");
}

export const groundedResearch = createServerFn({ method: "POST" })
  .validator(validate)
  .handler(async ({ data }): Promise<GroundedOutput> => {
    if (data.passages.length === 0) return { ok: true, insufficient: true, ...EMPTY };
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    const passageBlock = data.passages
      .map((p) => `[${p.id}] (${p.doc} · ${p.kind} · ${p.period} · page/section ${p.page})\n${p.text}`)
      .join("\n\n");
    const calcBlock = data.calculations.length ? data.calculations.map((c) => `- ${c.label}: ${c.value} (${c.formula})`).join("\n") : "(none)";
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: RULES,
        input: [
          {
            role: "user",
            content: `${TASK_PROMPT[data.task]}\nCompany: NSE:${data.ticker}\nInvestor request: ${data.question || "(general)"}\n\nPASSAGES:\n${passageBlock}\n\nCALCULATIONS (deterministic, computed by code):\n${calcBlock}\n\nReturn JSON matching the schema.`,
          },
        ],
        text: { format: { type: "json_schema", name: `finn_${data.task}`, schema: schemaFor(data.task), strict: true } },
      });
      const raw = outputText(res);
      const parsed = JSON.parse(raw || "{}");
      const passages = Object.fromEntries(data.passages.map((p) => [p.id, p.text]));
      const calcTexts = data.calculations.map((c) => `${c.value} ${c.formula}`);
      const dropped: GroundedOutput["dropped"] = [];
      const g = (arr: Claim[] | undefined) => {
        const r = guardClaims(arr ?? [], passages, calcTexts);
        dropped.push(...r.dropped.map((d) => ({ text: d.item.text, reason: d.reason })));
        return r.kept;
      };
      const out: GroundedOutput = { ok: true, insufficient: false, ...EMPTY, dropped, nextQuestion: parsed.next_question || null, reason: parsed.insufficient_reason || undefined };
      if (data.task === "qa") out.claims = g(parsed.claims);
      if (data.task === "bullbear") {
        out.bull = g(parsed.bull);
        out.bear = g(parsed.bear);
      }
      if (data.task === "guidance") {
        const rows: GuidanceRow[] = (parsed.rows ?? []).map((r: Record<string, unknown>) => ({
          statement: String(r.statement ?? ""),
          period: String(r.period ?? ""),
          outcome: String(r.outcome ?? ""),
          status: r.status as GuidanceRow["status"],
          statementCitations: (r.statement_citations as string[]) ?? [],
          outcomeCitations: (r.outcome_citations as string[]) ?? [],
        }));
        const gr = guardGuidance(rows, passages, calcTexts);
        out.guidance = gr.kept;
        dropped.push(...gr.dropped.map((d) => ({ text: d.item.statement, reason: d.reason })));
      }
      out.insufficient = parsed.insufficient === true || (out.claims.length + out.bull.length + out.bear.length + out.guidance.length === 0);
      return out;
    } catch (e) {
      if (e instanceof GatewayError) {
        console.error("FINN grounded research gateway error", e.code, e.httpStatus);
        const msg =
          e.httpStatus === 402 ? "AI credits exhausted — add credits to continue." : e.httpStatus === 429 ? "AI is rate-limited — try again shortly." : "AI analysis is unavailable right now.";
        return { ok: false, insufficient: true, ...EMPTY, error: msg };
      }
      console.error("FINN grounded research failed", e);
      return { ok: false, insufficient: true, ...EMPTY, error: "AI analysis failed. Retrieved passages are shown below." };
    }
  });
