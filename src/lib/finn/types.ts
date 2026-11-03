export type Sector =
  | "Energy"
  | "Banking"
  | "IT Services"
  | "Capital Goods"
  | "Telecom"
  | "FMCG"
  | "Automobiles"
  | "Pharma"
  | "Consumer"
  | "Power"
  | "Conglomerate"
  | "Paints"
  | "Internet"
  | "Defence"
  | "Electricals"
  | "Beverages"
  | "Retail";

export interface Company {
  ticker: string;
  name: string;
  sector: Sector;
}

export interface Holding extends Company {
  quantity: number;
}

export type AnnouncementCategory =
  | "Results"
  | "M&A"
  | "Management"
  | "Litigation"
  | "Fundraising"
  | "Dividend"
  | "Capex"
  | "Credit rating"
  | "Other";

export type Priority = "critical" | "important" | "low";

export interface SourceRef {
  document: string;
  period: string;
  location?: string; // page or transcript section
  url: string;
  excerpt?: string;
}

export interface MetricPoint {
  label: "Revenue" | "EBITDA" | "PBT" | "PAT";
  value: number | null; // ₹ crore
  qoq: number | null; // %
  yoy: number | null; // %
}

/** Inputs to the relevance engine, each 0–1. */
export interface ScoringFactors {
  materiality: number;
  earningsImpact: number;
  balanceSheetImpact: number;
  strategic: number;
}

export interface Announcement {
  id: string;
  ticker: string;
  category: AnnouncementCategory;
  filedAt: string; // ISO
  headline: string;
  whatHappened: string;
  whyItMatters: string;
  implications: string;
  investigate: string;
  factors: ScoringFactors;
  metrics?: MetricPoint[];
  metricsBasis?: string; // e.g. "Consolidated · Q2 FY27 · ₹ crore"
  source: SourceRef;
  demo: true;
}

export interface ScoredAnnouncement extends Announcement {
  score: number;
  priority: Priority;
  breakdown: Record<string, number>;
}

export interface PriceBar {
  date: string; // YYYY-MM-DD
  close: number;
  volume: number;
}

export interface MarketSnapshot {
  ticker: string;
  asOf: string;
  close: number;
  prevClose: number;
  changePct: number;
  volume: number;
  avgVolume20: number;
  volumeMultiple: number;
  history: PriceBar[];
  source: string;
}

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  tickers: string[]; // empty = any
  sectors: Sector[]; // empty = any
  categories: AnnouncementCategory[]; // empty = any
  minPriority: number | null;
  minPriceMovePct: number | null;
  minVolumeMultiple: number | null;
  match: "any" | "all";
}

export interface TriggeredAlert {
  ruleId: string;
  ruleName: string;
  ticker: string;
  reasons: string[];
  at: string;
}

export interface Settings {
  priceThresholdPct: number;
  volumeMultiple: number;
  weights: {
    category: number;
    materiality: number;
    earnings: number;
    balanceSheet: number;
    strategic: number;
    recency: number;
    portfolio: number;
  };
  displayName: string;
}

export type GuidanceStatus = "Delivered" | "Partially delivered" | "Missed" | "Not yet measurable";

export interface ResearchReport {
  ticker: string;
  basis: string;
  business: {
    description: string;
    model: string;
    drivers: string[];
    segments: { name: string; share: number }[];
    source: SourceRef;
  };
  snapshot: {
    period: string;
    unit: string;
    items: { label: string; value: string }[];
    source: SourceRef;
  };
  annual: { period: string; revenue: number; ebitda: number; pat: number; ocf: number; fcf: number }[];
  quarterly: { period: string; revenue: number; ebitda: number; pat: number; ocf: number | null; fcf: number | null }[];
  trajectoryNotes: string[];
  balanceSheet: { label: string; value: string; flag?: "ok" | "watch" | "stress" }[];
  balanceNotes: string[];
  narrative: {
    statement: string;
    period: string;
    outcome: string;
    status: GuidanceStatus;
    evidence: SourceRef;
  }[];
  guidance: { topic: string; type: "Numerical" | "Qualitative"; text: string; source: SourceRef }[];
  bull: string[];
  bear: string[];
  questions: string[];
  sources: SourceRef[];
}
