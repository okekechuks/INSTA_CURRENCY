import { describe, expect, it } from "vitest";

import { findPrices, parseAmount } from "./priceDetector";

describe("findPrices", () => {
  it("detects symbol and ISO-code price formats", () => {
    expect(findPrices("$49.99, GBP 39.99, and 1,299.99 USD")).toEqual([
      { amount: 49.99, currency: "USD", start: 0, end: 6, raw: "$49.99" },
      { amount: 39.99, currency: "GBP", start: 8, end: 17, raw: "GBP 39.99" },
      { amount: 1299.99, currency: "USD", start: 23, end: 35, raw: "1,299.99 USD" },
    ]);
  });

  it("detects supported currency symbols", () => {
    expect(findPrices("\u20AC1.299,99 | \u00A339 | \u20A62,500 | \u00A54,000").map(({ amount, currency }) => ({ amount, currency }))).toEqual([
      { amount: 1299.99, currency: "EUR" },
      { amount: 39, currency: "GBP" },
      { amount: 2500, currency: "NGN" },
      { amount: 4000, currency: "JPY" },
    ]);
  });

  it("detects symbol prices separated by markup-like whitespace", () => {
    expect(findPrices("\u00A3\n 12.81").map(({ amount, currency }) => ({ amount, currency }))).toEqual([
      { amount: 12.81, currency: "GBP" },
    ]);
  });

  it("detects the phase 2 target formats from the project brief", () => {
    expect(
      findPrices("$1,299.99 US$1,299.99 USD 1,299.99 1,299.99 USD").map(({ amount, currency, raw }) => ({
        amount,
        currency,
        raw,
      })),
    ).toEqual([
      { amount: 1299.99, currency: "USD", raw: "$1,299.99" },
      { amount: 1299.99, currency: "USD", raw: "US$1,299.99" },
      { amount: 1299.99, currency: "USD", raw: "USD 1,299.99" },
      { amount: 1299.99, currency: "USD", raw: "1,299.99 USD" },
    ]);
  });

  it("normalizes lower-case currency codes", () => {
    expect(findPrices("cad 14.50 and 19.99 aud").map(({ currency }) => currency)).toEqual(["CAD", "AUD"]);
  });
});

describe("parseAmount", () => {
  it("handles international separators", () => {
    expect(parseAmount("1,299.99")).toBe(1299.99);
    expect(parseAmount("1.299,99")).toBe(1299.99);
    expect(parseAmount("4,000")).toBe(4000);
  });

  it("rejects non-numeric values", () => {
    expect(parseAmount("ten dollars")).toBeNull();
  });
});
