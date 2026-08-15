import { describe, expect, it, vi } from "vitest";

import { createExchangeRateService, createFrankfurterProvider } from "./exchangeRate";

describe("createFrankfurterProvider", () => {
  it("normalizes a provider response into an exchange rate", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      base: "USD",
      date: "2026-08-15",
      quote: "NGN",
      rate: 1532.45,
    })));
    const provider = createFrankfurterProvider(fetcher as unknown as typeof fetch);

    await expect(provider.getRate("USD", "NGN")).resolves.toEqual({
      from: "USD",
      rate: 1532.45,
      to: "NGN",
      updatedAt: Date.parse("2026-08-15"),
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[0].toString()).toBe(
      "https://api.frankfurter.dev/v2/rate/USD/NGN",
    );
  });

  it("rejects unusable provider data", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      base: "USD",
      date: "2026-08-15",
      quote: "NGN",
      rate: 0,
    })));
    const provider = createFrankfurterProvider(fetcher as unknown as typeof fetch);

    await expect(provider.getRate("USD", "NGN")).rejects.toThrow("invalid USD/NGN response");
  });
});

describe("createExchangeRateService", () => {
  it("shares a pending request and converts a detected price", async () => {
    const getRate = vi.fn(async () => ({
      from: "USD" as const,
      rate: 1500,
      to: "NGN" as const,
      updatedAt: 0,
    }));
    const service = createExchangeRateService({ getRate });

    const [first, second] = await Promise.all([
      service.convert({ amount: 10, currency: "USD", end: 3, raw: "$10", start: 0 }, "NGN"),
      service.convert({ amount: 20, currency: "USD", end: 3, raw: "$20", start: 0 }, "NGN"),
    ]);

    expect(getRate).toHaveBeenCalledTimes(1);
    expect(first.convertedAmount).toBe(15000);
    expect(second.convertedAmount).toBe(30000);
  });
});
