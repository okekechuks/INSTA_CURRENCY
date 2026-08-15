import { describe, expect, it } from "vitest";

import { buildRenderedPriceParts } from "./priceRenderer";

describe("buildRenderedPriceParts", () => {
  it("preserves source text and adds estimates after each detected price", () => {
    const text = "Now $10, later EUR 20";
    const prices = [
      {
        convertedAmount: 15000,
        original: { amount: 10, currency: "USD" as const, end: 7, raw: "$10", start: 4 },
        rate: { from: "USD" as const, rate: 1500, to: "NGN" as const, updatedAt: 0 },
        targetCurrency: "NGN" as const,
      },
      {
        convertedAmount: 35000,
        original: { amount: 20, currency: "EUR" as const, end: 21, raw: "EUR 20", start: 15 },
        rate: { from: "EUR" as const, rate: 1750, to: "NGN" as const, updatedAt: 0 },
        targetCurrency: "NGN" as const,
      },
    ];

    const parts = buildRenderedPriceParts(text, prices);

    expect(parts.filter((part) => part.type !== "estimate").map((part) => part.text).join("")).toBe(text);
    expect(parts.filter((part) => part.type === "estimate")).toHaveLength(2);
    expect(parts.every((part) => part.type !== "estimate" || part.text.startsWith(" (approx. "))).toBe(true);
  });

  it("does not render an estimate when the price position no longer matches the text", () => {
    const parts = buildRenderedPriceParts("Price changed", [{
      convertedAmount: 15000,
      original: { amount: 10, currency: "USD", end: 3, raw: "$10", start: 0 },
      rate: { from: "USD", rate: 1500, to: "NGN", updatedAt: 0 },
      targetCurrency: "NGN",
    }]);

    expect(parts).toEqual([{ text: "Price changed", type: "original" }]);
  });
});
