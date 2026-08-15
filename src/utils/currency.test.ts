import { describe, expect, it } from "vitest";

import { convertAmount, convertDetectedPrice, formatCurrency } from "./currency";

describe("currency utilities", () => {
  it("converts valid amounts and rejects invalid rates", () => {
    expect(convertAmount(49.99, 1532.45)).toBeCloseTo(76607.1755);
    expect(convertAmount(10, 0)).toBeNull();
  });

  it("only converts a price when its source matches the rate", () => {
    const price = { amount: 10, currency: "USD" as const, end: 3, raw: "$10", start: 0 };
    const rate = { from: "USD" as const, rate: 1500, to: "NGN" as const, updatedAt: 0 };

    expect(convertDetectedPrice(price, rate)).toBe(15000);
    expect(convertDetectedPrice(price, { ...rate, from: "GBP" })).toBeNull();
  });

  it("formats currencies using their standard fraction digits", () => {
    expect(formatCurrency(1500, "NGN", "en-NG")).toContain("1,500.00");
    expect(formatCurrency(4000, "JPY", "en-US")).toContain("4,000");
  });
});
