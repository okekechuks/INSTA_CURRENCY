import { describe, expect, it } from "vitest";

import {
  createChromeExchangeRateCache,
  getLatestCachedExchangeRate,
  RATE_CACHE_STORAGE_KEY,
  type RateCacheStorageArea,
} from "./rateCache";

describe("rate cache storage", () => {
  it("stores and retrieves rates by currency pair", async () => {
    const storage = createStorage();
    const cache = createChromeExchangeRateCache(storage, () => 1_000);

    await cache.set({
      from: "USD",
      rate: 1500,
      to: "NGN",
      updatedAt: 500,
    });

    await expect(cache.get("USD", "NGN")).resolves.toEqual({
      cachedAt: 1_000,
      from: "USD",
      rate: 1500,
      to: "NGN",
      updatedAt: 500,
    });
    await expect(cache.get("GBP", "NGN")).resolves.toBeNull();
  });

  it("returns the latest cached rate for a target currency", async () => {
    const storage = createStorage({
      [RATE_CACHE_STORAGE_KEY]: {
        rates: {
          "EUR:NGN": { cachedAt: 1_000, from: "EUR", rate: 1600, to: "NGN", updatedAt: 500 },
          "USD:NGN": { cachedAt: 2_000, from: "USD", rate: 1500, to: "NGN", updatedAt: 500 },
          "USD:CAD": { cachedAt: 3_000, from: "USD", rate: 1.3, to: "CAD", updatedAt: 500 },
        },
      },
    });

    await expect(getLatestCachedExchangeRate(storage, "NGN")).resolves.toEqual({
      cachedAt: 2_000,
      from: "USD",
      rate: 1500,
      to: "NGN",
      updatedAt: 500,
    });
  });
});

function createStorage(initialValues: Record<string, unknown> = {}): RateCacheStorageArea {
  let values = { ...initialValues };

  return {
    async get(): Promise<Record<string, unknown>> {
      return { ...values };
    },
    async set(nextValues): Promise<void> {
      values = { ...values, ...nextValues };
    },
  };
}
