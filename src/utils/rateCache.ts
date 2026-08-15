import { SUPPORTED_CURRENCIES, type CurrencyCode, type ExchangeRate } from "../types/currency";
import type { CachedExchangeRate, ExchangeRateCache } from "../services/exchangeRate";

export const RATE_CACHE_STORAGE_KEY = "instantCurrencyRateCache";

export interface RateCacheStorageArea {
  get(keys?: string | string[] | Record<string, unknown>): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

interface RateCachePayload {
  rates: Record<string, CachedExchangeRate>;
}

export function createChromeExchangeRateCache(
  storage: RateCacheStorageArea = chrome.storage.local,
  now: () => number = Date.now,
): ExchangeRateCache {
  return {
    async get(from, to): Promise<CachedExchangeRate | null> {
      const payload = await getRateCachePayload(storage);
      const cachedRate = payload.rates[getRateCacheKey(from, to)];

      return isCachedExchangeRate(cachedRate) ? cachedRate : null;
    },

    async set(rate): Promise<CachedExchangeRate> {
      const payload = await getRateCachePayload(storage);
      const cachedRate = { ...rate, cachedAt: now() };

      await storage.set({
        [RATE_CACHE_STORAGE_KEY]: {
          rates: {
            ...payload.rates,
            [getRateCacheKey(rate.from, rate.to)]: cachedRate,
          },
        },
      });

      return cachedRate;
    },
  };
}

export async function getLatestCachedExchangeRate(
  storage: RateCacheStorageArea = chrome.storage.local,
  targetCurrency?: CurrencyCode,
): Promise<CachedExchangeRate | null> {
  const payload = await getRateCachePayload(storage);
  const cachedRates = Object.values(payload.rates)
    .filter(isCachedExchangeRate)
    .filter((rate) => !targetCurrency || rate.to === targetCurrency)
    .sort((first, second) => second.cachedAt - first.cachedAt);

  return cachedRates[0] ?? null;
}

export function getRateCacheKey(from: CurrencyCode, to: CurrencyCode): string {
  return `${from}:${to}`;
}

async function getRateCachePayload(storage: RateCacheStorageArea): Promise<RateCachePayload> {
  const storedValues = await storage.get(RATE_CACHE_STORAGE_KEY);
  const payload = storedValues[RATE_CACHE_STORAGE_KEY];

  if (!isRateCachePayload(payload)) {
    return { rates: {} };
  }

  return payload;
}

function isRateCachePayload(value: unknown): value is RateCachePayload {
  if (!isRecord(value) || !isRecord(value.rates)) return false;

  return true;
}

function isCachedExchangeRate(value: unknown): value is CachedExchangeRate {
  if (!isExchangeRate(value) || !isRecord(value)) return false;

  return typeof value.cachedAt === "number" && Number.isFinite(value.cachedAt);
}

function isExchangeRate(value: unknown): value is ExchangeRate {
  if (!isRecord(value)) return false;

  return (
    isSupportedCurrency(value.from)
    && isSupportedCurrency(value.to)
    && typeof value.rate === "number"
    && Number.isFinite(value.rate)
    && value.rate > 0
    && typeof value.updatedAt === "number"
    && Number.isFinite(value.updatedAt)
  );
}

function isSupportedCurrency(value: unknown): value is CurrencyCode {
  return typeof value === "string" && SUPPORTED_CURRENCIES.includes(value as CurrencyCode);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
