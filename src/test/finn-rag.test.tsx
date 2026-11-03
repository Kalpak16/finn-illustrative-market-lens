import { describe, expect, it } from "vitest";
import { chunkPages, sectionsFromTranscript } from "@/lib/finn/rag/chunk";
import { guardClaims, guardGuidance } from "@/lib/finn/rag/grounding";
import { computeCalculations, extractMetrics } from "@/lib/finn/rag/metrics";
import { retrieve } from "@/lib/finn/rag/retrieve";
import type { DocMeta } from "@/lib/finn/rag/types";

const doc: DocMeta = { id: "d1", ticker: "TEST", name: "ar.pdf", kind: "annual_report", period: "FY25", pages: 2, chunks: 0, uploadedAt: "" };

describe("FINN grounded pipeline", () => {
  it("chunks keep their page number and never span pages", () => {
    const chunks = chunkPages("d1", [
      { page: 3, text: "Revenue grew strongly. ".repeat(100) },
      { page: 4, text: "Debt was reduced during the year." },
    ]);
    expect(chunks.length).toBeGreaterThan(2);
    expect(chunks.filter((c) => c.page === 4).map((c) => c.text)).toEqual(["Debt was reduced during the year."]);
    expect(chunks.every((c) => c.page === 3 || c.page === 4)).toBe(true);
  });

  it("transcripts become numbered sections", () => {
    const s = sectionsFromTranscript("CEO: We expect margins of 20%.\n\nCFO: Capex will be 500 crore.");
    expect(s[0].page).toBe(1);
  });

  it("retrieval ranks the passage that answers the question first", () => {
    const chunks = chunkPages("d1", [
      { page: 1, text: "The board met to discuss governance and director appointments." },
      { page: 2, text: "Net cash generated from operating activities rose versus profit after tax." },
    ]);
    expect(retrieve("Is profit converting into cash?", chunks, [doc])[0].page).toBe(2);
  });

  it("extracts metrics with unit, period and basis, and computes margins only on matching units", () => {
    const chunks = chunkPages("d1", [
      { page: 5, text: "Consolidated results (₹ in crore) for FY25\nRevenue from operations 10,000\nEBITDA 2,500\nProfit after tax 1,200" },
      { page: 6, text: "Standalone (₹ in lakh) FY25\nRevenue from operations 50,000" },
    ]);
    const facts = extractMetrics(chunks, [doc]);
    const rev = facts.find((f) => f.metric === "Revenue" && f.basis === "Consolidated")!;
    expect(rev).toMatchObject({ value: 10000, unit: "₹ crore", period: "FY25", page: 5 });
    const calcs = computeCalculations(facts);
    expect(calcs.find((c) => c.label === "EBITDA margin · FY25")?.value).toBe("25.0%");
    // the lakh/standalone revenue must not be combined with crore/consolidated EBITDA
    expect(calcs.filter((c) => c.label.startsWith("EBITDA margin"))).toHaveLength(1);
  });

  it("drops claims with no valid citation", () => {
    const r = guardClaims([{ text: "Revenue grew.", citations: ["d9:0"] }], { "d1:0": "Revenue grew 12%." }, []);
    expect(r.kept).toHaveLength(0);
  });

  it("drops claims with numbers absent from cited evidence", () => {
    const r = guardClaims([{ text: "Revenue grew 18%.", citations: ["d1:0"] }], { "d1:0": "Revenue grew 12%." }, []);
    expect(r.kept).toHaveLength(0);
    expect(guardClaims([{ text: "Revenue grew 12%.", citations: ["d1:0"] }], { "d1:0": "Revenue grew 12%." }, []).kept).toHaveLength(1);
  });

  it("allows numbers from deterministic calculations", () => {
    const r = guardClaims([{ text: "EBITDA margin was 25.0%.", citations: ["d1:0"] }], { "d1:0": "EBITDA 2,500" }, ["25.0% 2,500 ÷ 10,000"]);
    expect(r.kept).toHaveLength(1);
  });

  it("ungrounded guidance outcome becomes Insufficient / Not yet measurable", () => {
    const r = guardGuidance(
      [{ statement: "We expect 20% margins.", period: "FY25", outcome: "Margins were 22%.", status: "Delivered", statementCitations: ["d1:0"], outcomeCitations: [] }],
      { "d1:0": "We expect 20% margins." },
      [],
    );
    expect(r.kept[0]).toMatchObject({ status: "Not yet measurable", outcome: "Insufficient source evidence." });
  });
});
