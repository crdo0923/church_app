import { describe, expect, it } from "vitest";
import { progressPercent, weightedProjectProgress } from "@/lib/progress";

describe("progressPercent", () => {
  it("computes done/total", () => {
    expect(progressPercent(9, 12)).toBe(75);
  });
  it("returns 0 for empty total", () => {
    expect(progressPercent(0, 0)).toBe(0);
  });
  it("clamps over-completion", () => {
    expect(progressPercent(15, 10)).toBe(100);
  });
});

describe("weightedProjectProgress", () => {
  it("averages phases", () => {
    expect(weightedProjectProgress([{ progress: 40 }, { progress: 80 }])).toBe(60);
  });
  it("returns 0 when empty", () => {
    expect(weightedProjectProgress([])).toBe(0);
  });
});
