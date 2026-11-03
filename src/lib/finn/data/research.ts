import type { ResearchReport, SourceRef } from "../types";

/**
 * SYNTHETIC research examples for demo mode. Figures, excerpts and quotations are
 * illustrative placeholders tied to document names — they are NOT extracted from
 * real filings. URLs point to the official IR pages where the real document lives.
 */

const ril = (document: string, period: string, location?: string, excerpt?: string): SourceRef => ({
  document: `${document} (demo)`,
  period,
  location,
  url: "https://www.ril.com/investors/financial-reporting",
  excerpt,
});
const infy = (document: string, period: string, location?: string, excerpt?: string): SourceRef => ({
  document: `${document} (demo)`,
  period,
  location,
  url: "https://www.infosys.com/investors/reports-filings.html",
  excerpt,
});
const tml = (document: string, period: string, location?: string, excerpt?: string): SourceRef => ({
  document: `${document} (demo)`,
  period,
  location,
  url: "https://www.tatamotors.com/investors/",
  excerpt,
});

export const RESEARCH: Record<string, ResearchReport> = {
  RELIANCE: {
    ticker: "RELIANCE",
    basis: "Consolidated · ₹ crore · synthetic demo values",
    business: {
      description:
        "Diversified conglomerate spanning oil-to-chemicals (O2C), upstream oil & gas, digital services (Jio) and retail, with a new-energy platform under construction.",
      model:
        "Cash-generative O2C and upstream fund growth capex in consumer businesses (digital, retail), which are increasingly the earnings growth driver.",
      drivers: ["Refining & petrochemical spreads", "Telecom ARPU and subscriber growth", "Retail store footprint & footfall", "New-energy giga-factory commissioning"],
      segments: [
        { name: "O2C", share: 54 },
        { name: "Retail", share: 26 },
        { name: "Digital", share: 13 },
        { name: "Oil & Gas", share: 3 },
        { name: "Others", share: 4 },
      ],
      source: ril("Integrated Annual Report FY26", "FY26", "Segment information, p.188"),
    },
    snapshot: {
      period: "FY26 (Annual)",
      unit: "₹ crore",
      items: [
        { label: "Revenue", value: "9,64,200" },
        { label: "EBITDA", value: "1,68,400" },
        { label: "EBITDA margin", value: "17.5%" },
        { label: "PBT", value: "1,02,800" },
        { label: "PAT", value: "79,600" },
        { label: "EPS (₹)", value: "58.8" },
        { label: "Gross debt", value: "3,46,000" },
        { label: "Cash & equivalents", value: "2,20,000" },
        { label: "ROCE", value: "9.6%" },
        { label: "ROE", value: "8.9%" },
      ],
      source: ril("Integrated Annual Report FY26", "FY26", "Consolidated financial statements, p.240–246"),
    },
    annual: [
      { period: "FY22", revenue: 700000, ebitda: 125700, pat: 67800, ocf: 110600, fcf: -15000 },
      { period: "FY23", revenue: 877800, ebitda: 154700, pat: 74100, ocf: 115000, fcf: -26000 },
      { period: "FY24", revenue: 901100, ebitda: 162200, pat: 79000, ocf: 158800, fcf: 26000 },
      { period: "FY25", revenue: 928500, ebitda: 164100, pat: 76400, ocf: 160100, fcf: 29000 },
      { period: "FY26", revenue: 964200, ebitda: 168400, pat: 79600, ocf: 172300, fcf: 37000 },
    ],
    quarterly: [
      { period: "Q3 FY26", revenue: 240100, ebitda: 42100, pat: 19600, ocf: null, fcf: null },
      { period: "Q4 FY26", revenue: 246900, ebitda: 43600, pat: 20100, ocf: null, fcf: null },
      { period: "Q1 FY27", revenue: 238300, ebitda: 40890, pat: 18320, ocf: null, fcf: null },
      { period: "Q2 FY27", revenue: 248310, ebitda: 44120, pat: 19020, ocf: null, fcf: null },
    ],
    trajectoryNotes: [
      "Revenue CAGR FY22–26 ≈ 8.3%; EBITDA CAGR ≈ 7.6% — margins broadly flat at 17–18%.",
      "PAT has lagged EBITDA since FY23 as depreciation and finance cost absorb growth.",
      "Free cash flow turned positive from FY24 as Jio 5G capex peaked.",
      "Quarterly OCF is not disclosed in quarterly results — shown as Not available.",
    ],
    balanceSheet: [
      { label: "Gross debt", value: "₹3,46,000 cr", flag: "watch" },
      { label: "Net debt / EBITDA", value: "0.75x", flag: "ok" },
      { label: "Debt / Equity", value: "0.39x", flag: "ok" },
      { label: "Cash & equivalents", value: "₹2,20,000 cr", flag: "ok" },
      { label: "Receivable days", value: "14", flag: "ok" },
      { label: "Inventory days", value: "52", flag: "watch" },
      { label: "Payable days", value: "78", flag: "ok" },
      { label: "Contingent liabilities", value: "Insufficient source evidence" },
    ],
    balanceNotes: [
      "Leverage is comfortable at group level; gross debt is high in absolute terms because of telecom spectrum liabilities.",
      "Inventory days rose in FY26 — consistent with retail store additions, worth monitoring.",
    ],
    narrative: [
      {
        statement: "\"We expect to double the retail store footprint in five years.\"",
        period: "FY22 AGM → FY27",
        outcome: "Store count up ~1.7x over four years.",
        status: "Not yet measurable",
        evidence: ril("AGM transcript 2021 / Annual Report FY26", "FY22–FY26", "Retail section, p.54", "Synthetic demo excerpt"),
      },
      {
        statement: "\"Net-debt-zero will be maintained as capex moderates.\"",
        period: "FY24 onwards",
        outcome: "Net debt ≈ ₹1,26,000 cr at FY26 end.",
        status: "Missed",
        evidence: ril("Q4 FY26 investor presentation", "FY26", "Slide 9"),
      },
      {
        statement: "\"Jio capex will peak in FY24 and decline thereafter.\"",
        period: "FY24 → FY26",
        outcome: "Digital capex down ~38% from FY24 peak; FCF positive.",
        status: "Delivered",
        evidence: ril("Integrated Annual Report FY26", "FY26", "Cash flow statement, p.248"),
      },
      {
        statement: "\"New energy giga-factories to commission progressively from 2026.\"",
        period: "CY2026",
        outcome: "First module line commissioned; cell and battery lines pending.",
        status: "Partially delivered",
        evidence: ril("Q2 FY27 earnings-call transcript", "Q2 FY27", "Management remarks"),
      },
    ],
    guidance: [
      { topic: "Capex", type: "Qualitative", text: "Capex intensity to moderate as 5G rollout completes.", source: ril("Q2 FY27 earnings-call transcript", "Q2 FY27", "Q&A") },
      { topic: "Capacity", type: "Numerical", text: "20 GW solar module capacity targeted by end-2026.", source: ril("AGM 2025 transcript", "FY26", "New Energy") },
      { topic: "Revenue growth", type: "Qualitative", text: "Retail and digital to deliver 'industry-leading growth'.", source: ril("Integrated Annual Report FY26", "FY26", "Chairman's letter") },
      { topic: "EBITDA margins", type: "Qualitative", text: "No explicit margin guidance issued.", source: ril("Q2 FY27 earnings-call transcript", "Q2 FY27") },
    ],
    bull: [
      "Digital and retail now ~40% of EBITDA, lowering dependence on cyclical O2C spreads.",
      "Free cash flow positive for three consecutive years as telecom capex peaks.",
      "Optionality from new-energy platform and potential listings of subsidiaries.",
    ],
    bear: [
      "PAT growth trails EBITDA: depreciation and finance cost absorb operating gains.",
      "Net-debt-zero commitment not maintained; absolute debt remains high.",
      "Retail revenue growth decelerating while inventory days rise.",
      "New-energy execution timelines have slipped versus initial commentary.",
    ],
    questions: [
      "What is retail like-for-like growth excluding new stores?",
      "What returns are assumed on new-energy capex, and over what timeframe?",
      "Will management restate a net-debt target?",
    ],
    sources: [],
  },
  INFY: {
    ticker: "INFY",
    basis: "Consolidated (IFRS/Ind AS) · ₹ crore · synthetic demo values",
    business: {
      description: "Global IT services and consulting company providing digital transformation, cloud, and application services.",
      model: "Time-and-material and fixed-price contracts; revenue scales with headcount utilisation and large-deal wins.",
      drivers: ["Large-deal TCV", "Utilisation & attrition", "BFSI client spend", "Currency movements"],
      segments: [
        { name: "Financial services", share: 28 },
        { name: "Retail", share: 14 },
        { name: "Communication", share: 12 },
        { name: "Energy & Utilities", share: 13 },
        { name: "Manufacturing", share: 15 },
        { name: "Others", share: 18 },
      ],
      source: infy("Annual Report FY26", "FY26", "Segment reporting, p.212"),
    },
    snapshot: {
      period: "FY26 (Annual)",
      unit: "₹ crore",
      items: [
        { label: "Revenue", value: "1,68,900" },
        { label: "EBITDA", value: "41,800" },
        { label: "EBITDA margin", value: "24.7%" },
        { label: "PBT", value: "37,600" },
        { label: "PAT", value: "27,900" },
        { label: "EPS (₹)", value: "67.2" },
        { label: "Debt", value: "Nil (lease liabilities only)" },
        { label: "Cash & investments", value: "46,200" },
        { label: "ROCE", value: "38.5%" },
        { label: "ROE", value: "30.1%" },
      ],
      source: infy("Annual Report FY26", "FY26", "Consolidated statements, p.180–186"),
    },
    annual: [
      { period: "FY22", revenue: 121600, ebitda: 31300, pat: 22100, ocf: 23900, fcf: 21800 },
      { period: "FY23", revenue: 146800, ebitda: 35600, pat: 24100, ocf: 22500, fcf: 20100 },
      { period: "FY24", revenue: 153700, ebitda: 37100, pat: 26200, ocf: 25200, fcf: 23100 },
      { period: "FY25", revenue: 162900, ebitda: 39900, pat: 26700, ocf: 35700, fcf: 33100 },
      { period: "FY26", revenue: 168900, ebitda: 41800, pat: 27900, ocf: 34600, fcf: 31900 },
    ],
    quarterly: [
      { period: "Q3 FY26", revenue: 42100, ebitda: 10450, pat: 6900, ocf: 8800, fcf: 8100 },
      { period: "Q4 FY26", revenue: 42800, ebitda: 10580, pat: 7050, ocf: 9400, fcf: 8700 },
      { period: "Q1 FY27", revenue: 42570, ebitda: 10590, pat: 7060, ocf: 7900, fcf: 7200 },
      { period: "Q2 FY27", revenue: 43890, ebitda: 10970, pat: 7240, ocf: 9100, fcf: 8400 },
    ],
    trajectoryNotes: [
      "Revenue growth decelerated from ~21% (FY23) to mid-single digits.",
      "EBITDA margin stable in a 24–25% band despite weaker growth.",
      "OCF/PAT above 120% in FY25–26 — strong cash conversion.",
    ],
    balanceSheet: [
      { label: "Total debt", value: "Nil", flag: "ok" },
      { label: "Debt / Equity", value: "0.00x", flag: "ok" },
      { label: "Cash & investments", value: "₹46,200 cr", flag: "ok" },
      { label: "Receivable days (DSO)", value: "68", flag: "watch" },
      { label: "Unbilled revenue", value: "₹12,400 cr", flag: "watch" },
      { label: "Payables", value: "₹4,100 cr", flag: "ok" },
      { label: "Contingent liabilities (tax)", value: "₹6,800 cr", flag: "watch" },
    ],
    balanceNotes: [
      "Debt-free with large cash buffer; no balance-sheet stress indicators.",
      "DSO and unbilled revenue are the items to watch for revenue-recognition quality.",
    ],
    narrative: [
      { statement: "FY26 revenue growth guidance of 1–3% in constant currency.", period: "FY26", outcome: "Delivered 2.6% cc growth.", status: "Delivered", evidence: infy("Q4 FY26 press release", "FY26", "p.1") },
      { statement: "Operating margin band of 20–22%.", period: "FY26", outcome: "21.1% operating margin.", status: "Delivered", evidence: infy("Q4 FY26 fact sheet", "FY26", "p.2") },
      { statement: "\"Large deal momentum to accelerate in H2.\"", period: "H2 FY26", outcome: "H2 TCV lower than H1.", status: "Missed", evidence: infy("Q4 FY26 earnings-call transcript", "FY26", "Q&A, segment 3") },
      { statement: "Return ~85% of FCF to shareholders over 5 years.", period: "FY25–FY29", outcome: "~88% returned in first two years.", status: "Not yet measurable", evidence: infy("Capital allocation policy", "FY25") },
    ],
    guidance: [
      { topic: "Revenue growth", type: "Numerical", text: "FY27 cc revenue growth of 2–3% (narrowed from 1–3%).", source: infy("Q2 FY27 press release", "Q2 FY27", "p.1") },
      { topic: "EBITDA margins", type: "Numerical", text: "Operating margin 20–22%.", source: infy("Q2 FY27 press release", "Q2 FY27", "p.1") },
      { topic: "Priorities", type: "Qualitative", text: "Focus on AI-led services and cost take-out programmes.", source: infy("Q2 FY27 earnings-call transcript", "Q2 FY27", "CEO remarks") },
    ],
    bull: [
      "Consistent delivery against numerical guidance for two years.",
      "Cash conversion above 100% of PAT with no debt.",
      "Guidance narrowed upward despite soft macro.",
    ],
    bear: [
      "Revenue growth in low single digits; valuation premium needs acceleration.",
      "Large-deal momentum commentary not matched by H2 TCV.",
      "Rising DSO and unbilled revenue.",
    ],
    questions: [
      "What share of TCV is net-new versus renewals?",
      "Why have DSO and unbilled revenue risen?",
      "How much of FY27 guidance depends on H2 ramp-ups?",
    ],
    sources: [],
  },
  TATAMOTORS: {
    ticker: "TATAMOTORS",
    basis: "Consolidated · ₹ crore · synthetic demo values",
    business: {
      description: "Automotive manufacturer with Jaguar Land Rover (JLR), Indian commercial vehicles and passenger vehicles including EVs.",
      model: "Premium luxury (JLR) drives most profits; domestic CV is cyclical; PV/EV is a growth bet.",
      drivers: ["JLR wholesale volumes & mix", "Domestic CV cycle", "EV adoption", "Commodity costs & FX"],
      segments: [
        { name: "JLR", share: 71 },
        { name: "Commercial vehicles", share: 17 },
        { name: "Passenger vehicles", share: 11 },
        { name: "Others", share: 1 },
      ],
      source: tml("Integrated Annual Report FY26", "FY26", "Segment reporting, p.302"),
    },
    snapshot: {
      period: "FY26 (Annual)",
      unit: "₹ crore",
      items: [
        { label: "Revenue", value: "4,38,000" },
        { label: "EBITDA", value: "58,100" },
        { label: "EBITDA margin", value: "13.3%" },
        { label: "PBT", value: "30,400" },
        { label: "PAT", value: "24,800" },
        { label: "EPS (₹)", value: "64.9" },
        { label: "Gross debt", value: "1,02,000" },
        { label: "Cash", value: "62,000" },
        { label: "ROCE", value: "17.2%" },
        { label: "ROE", value: "Insufficient source evidence" },
      ],
      source: tml("Integrated Annual Report FY26", "FY26", "Consolidated statements"),
    },
    annual: [
      { period: "FY22", revenue: 278500, ebitda: 24800, pat: -11400, ocf: 14300, fcf: -9200 },
      { period: "FY23", revenue: 346000, ebitda: 31800, pat: 2400, ocf: 35400, fcf: 9800 },
      { period: "FY24", revenue: 434000, ebitda: 59500, pat: 31800, ocf: 67900, fcf: 27500 },
      { period: "FY25", revenue: 444000, ebitda: 61200, pat: 28100, ocf: 63200, fcf: 21700 },
      { period: "FY26", revenue: 438000, ebitda: 58100, pat: 24800, ocf: 51400, fcf: 9200 },
    ],
    quarterly: [
      { period: "Q3 FY26", revenue: 113500, ebitda: 15400, pat: 6900, ocf: null, fcf: null },
      { period: "Q4 FY26", revenue: 119500, ebitda: 16100, pat: 7400, ocf: null, fcf: null },
      { period: "Q1 FY27", revenue: 104200, ebitda: 12100, pat: 4100, ocf: null, fcf: null },
      { period: "Q2 FY27", revenue: 101800, ebitda: 10900, pat: 3300, ocf: null, fcf: null },
    ],
    trajectoryNotes: [
      "Sharp turnaround FY22→FY24 driven by JLR mix; momentum reversed from FY25.",
      "EBITDA margin compressed for two consecutive quarters.",
      "FCF has fallen by ~2/3 since FY24 — the key deterioration to watch.",
    ],
    balanceSheet: [
      { label: "Gross debt", value: "₹1,02,000 cr", flag: "watch" },
      { label: "Net auto debt", value: "₹40,000 cr", flag: "watch" },
      { label: "Debt / Equity", value: "0.92x", flag: "watch" },
      { label: "Cash", value: "₹62,000 cr", flag: "ok" },
      { label: "Inventory days", value: "48", flag: "stress" },
      { label: "Payable days", value: "96", flag: "watch" },
      { label: "Receivables", value: "₹16,800 cr", flag: "ok" },
      { label: "Contingent liabilities", value: "Insufficient source evidence" },
    ],
    balanceNotes: [
      "Negative working capital funded by high payables — a reversal would hurt cash flow.",
      "Rising inventory alongside falling volumes is a stress indicator.",
    ],
    narrative: [
      { statement: "\"Net automotive debt-free by FY25.\"", period: "FY25", outcome: "Net auto debt ≈ ₹40,000 cr at FY26 end.", status: "Missed", evidence: tml("Investor Day presentation 2023", "FY24", "Slide 14") },
      { statement: "JLR EBIT margin ≥ 8.5% in FY26.", period: "FY26", outcome: "JLR EBIT margin 7.4%.", status: "Missed", evidence: tml("JLR Q4 FY26 results", "FY26", "p.3") },
      { statement: "\"EV penetration to reach 25% of PV volumes by FY27.\"", period: "FY27", outcome: "EV share ~13% in H1 FY27.", status: "Not yet measurable", evidence: tml("Q2 FY27 earnings-call transcript", "Q2 FY27", "PV section") },
      { statement: "\"Demerger of CV and PV businesses to complete in 2025.\"", period: "CY2025", outcome: "Demerger completed.", status: "Delivered", evidence: tml("Scheme of arrangement disclosure", "FY26") },
    ],
    guidance: [
      { topic: "EBITDA margins", type: "Numerical", text: "JLR EBIT margin guided to 5–7% for FY27 (lowered).", source: tml("Q2 FY27 earnings-call transcript", "Q2 FY27", "JLR CFO remarks") },
      { topic: "Capex", type: "Numerical", text: "JLR investment of ~£18bn over five years.", source: tml("JLR strategy presentation", "FY25") },
      { topic: "Priorities", type: "Qualitative", text: "Focus on cash preservation and tariff mitigation.", source: tml("Q2 FY27 earnings-call transcript", "Q2 FY27") },
    ],
    bull: [
      "Demerger unlocks focused capital allocation for CV and PV.",
      "Domestic CV franchise remains cash-generative.",
      "Range Rover/Defender mix still supports premium pricing.",
    ],
    bear: [
      "Two consecutive guidance misses (net-debt, JLR margin).",
      "FCF down ~66% since FY24; margins compressing.",
      "Rating outlook revised to Negative.",
      "Heavy JLR capex commitment while earnings fall.",
    ],
    questions: [
      "Can JLR fund its £18bn plan from internal accruals at 5–7% margins?",
      "What is the tariff impact per vehicle and mitigation timeline?",
      "Is working-capital release masking weaker operating cash generation?",
    ],
    sources: [],
  },
};

// Build source panel lists from all citations in each report.
for (const r of Object.values(RESEARCH)) {
  const all: SourceRef[] = [r.business.source, r.snapshot.source, ...r.narrative.map((n) => n.evidence), ...r.guidance.map((g) => g.source)];
  const seen = new Set<string>();
  r.sources = all.filter((s) => (seen.has(s.document + s.period) ? false : (seen.add(s.document + s.period), true)));
}

export function getResearch(ticker: string): ResearchReport | undefined {
  return RESEARCH[ticker.toUpperCase()];
}
