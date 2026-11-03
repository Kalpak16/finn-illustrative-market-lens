import { describe, expect, it } from "vitest";
import { priorityThreshold, rankDrivers } from "@/lib/finn/scoring";

describe("rank reasons", () => {
  it("lists the largest score contributors first", () => {
    const d = rankDrivers({ breakdown: { Category: 18, Materiality: 24, Recency: 0, Portfolio: 8 } });
    expect(d.map((x) => x.label)).toEqual(["financial materiality", "filing type", "portfolio exposure"]);
  });
  it("states the critical threshold", () => {
    expect(priorityThreshold("critical")).toBe("score ≥ 70");
  });
});
