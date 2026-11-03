import { describe, expect, it } from "vitest";
import { evaluateRule } from "@/lib/finn/alerts";
import { computeSnapshot } from "@/lib/finn/data/market";
import { priorityOf } from "@/lib/finn/scoring";
import type { AlertRule } from "@/lib/finn/types";

const bars = (vols: number[], closes: number[]) => vols.map((v, i) => ({ date: `d${i}`, close: closes[i], volume: v }));

describe("FINN rules", () => {
  it("priority bands: critical ≥70, important ≥45", () => {
    expect(priorityOf(70)).toBe("critical");
    expect(priorityOf(69)).toBe("important");
    expect(priorityOf(45)).toBe("important");
    expect(priorityOf(44)).toBe("low");
  });

  it("volume multiple uses the prior 20-day average", () => {
    const s = computeSnapshot("X", bars([...Array(20).fill(100), 300], [...Array(20).fill(10), 10.5]), "t");
    expect(s.avgVolume20).toBe(100);
    expect(s.volumeMultiple).toBe(3);
    expect(s.changePct).toBeCloseTo(5);
  });

  it("volume rule fires at 2x and not below", () => {
    const rule: AlertRule = { id: "r", name: "v", enabled: true, tickers: [], sectors: [], categories: [], minPriority: null, minPriceMovePct: null, minVolumeMultiple: 2, match: "any" };
    const co = [{ ticker: "X", name: "X", sector: "Energy" as const }];
    const hi = computeSnapshot("X", bars([...Array(20).fill(100), 200], Array(21).fill(10)), "t");
    const lo = computeSnapshot("X", bars([...Array(20).fill(100), 190], Array(21).fill(10)), "t");
    expect(evaluateRule(rule, co, [], () => hi)).toHaveLength(1);
    expect(evaluateRule(rule, co, [], () => lo)).toHaveLength(0);
  });
});
