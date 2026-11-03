export type DocKind = "annual_report" | "transcript" | "results" | "presentation";

export const DOC_KIND_LABEL: Record<DocKind, string> = {
  annual_report: "Annual report",
  transcript: "Earnings-call transcript",
  results: "Quarterly results",
  presentation: "Investor presentation",
};

export interface DocMeta {
  id: string;
  ticker: string;
  name: string; // file name
  kind: DocKind;
  period: string; // user-declared reporting period, e.g. "FY25" or "Q2 FY26"
  url?: string; // official source URL, if provided
  pages: number;
  chunks: number;
  uploadedAt: string;
}

export interface PageText {
  page: number; // 1-based page (PDF) or section number (transcript)
  text: string;
}

export interface Chunk {
  id: string; // `${docId}:${index}`
  docId: string;
  page: number;
  text: string;
}

export interface Passage extends Chunk {
  score: number;
  docName: string;
  kind: DocKind;
  period: string;
  url?: string;
}

export type MetricName = "Revenue" | "EBITDA" | "PBT" | "PAT" | "EPS" | "Operating cash flow" | "Capex" | "Total debt" | "Cash";

export interface MetricFact {
  id: string;
  metric: MetricName;
  value: number;
  unit: string; // "₹ crore", "₹ lakh", "₹ million", "₹" (per share), "unknown"
  period: string; // detected or document-declared
  periodSource: "detected" | "document";
  basis: "Consolidated" | "Standalone" | "Not stated";
  chunkId: string;
  docId: string;
  page: number;
  excerpt: string;
}

/** A deterministic, code-computed figure (never produced by the LLM). */
export interface Calculation {
  label: string;
  value: string;
  formula: string;
  inputs: string[]; // MetricFact ids
}

/** A single claim with citations back to retrieved passages. */
export interface Claim {
  text: string;
  citations: string[]; // chunk ids
}

export interface GuidanceRow {
  statement: string;
  period: string;
  outcome: string;
  status: "Delivered" | "Partially delivered" | "Missed" | "Not yet measurable";
  statementCitations: string[];
  outcomeCitations: string[];
}

export const INSUFFICIENT = "Insufficient source evidence.";
