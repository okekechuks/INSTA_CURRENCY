import type { ConvertedPrice, CurrencyCode, DetectedPrice, ExchangeRate } from "../types/currency";
import { convertDetectedPrice } from "../utils/currency";

const FRANKFURTER_API_URL = "https://api.frankfurter.dev/v2/rate";

interface FrankfurterRateResponse {
  base: string;
  date: string;
  quote: string;
  rate: unknown;
}

export interface ExchangeRateProvider {
  getRate(from: CurrencyCode, to: CurrencyCode): Promise<ExchangeRate>;
}

export interface CachedExchangeRate extends ExchangeRate {
  cachedAt: number;
}

export interface ExchangeRateCache {
  get(from: CurrencyCode, to: CurrencyCode): Promise<CachedExchangeRate | null>;
  set(rate: ExchangeRate): Promise<CachedExchangeRate>;
}

export interface ExchangeRateService {
  convert(price: DetectedPrice, targetCurrency: CurrencyCode): Promise<ConvertedPrice>;
  getRate(from: CurrencyCode, to: CurrencyCode): Promise<ExchangeRate>;
}

interface ExchangeRateServiceOptions {
  cache?: ExchangeRateCache;
  cacheTtlMs?: number;
  now?: () => number;
}

export const RATE_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

export function createFrankfurterProvider(fetcher: typeof fetch = fetch): ExchangeRateProvider {
  return {
    async getRate(from, to): Promise<ExchangeRate> {
      if (from === to) {
        return { from, rate: 1, to, updatedAt: Date.now() };
      }

      const url = new URL(`${FRANKFURTER_API_URL}/${from}/${to}`);

      let response: Response;
      try {
        response = await fetcher(url);
      } catch (error) {
        throw new Error(`Unable to fetch the ${from}/${to} exchange rate.`, { cause: error });
      }

      if (!response.ok) {
        throw new Error(`Exchange-rate provider returned HTTP ${response.status}.`);
      }

      const payload = await response.json() as FrankfurterRateResponse;
      const rate = payload.rate;
      const updatedAt = Date.parse(payload.date);

      if (
        payload.base !== from
        || payload.quote !== to
        || typeof rate !== "number"
        || !Number.isFinite(rate)
        || rate <= 0
      ) {
        throw new Error(`Exchange-rate provider returned an invalid ${from}/${to} response.`);
      }

      return {
        from,
        rate,
        to,
        updatedAt: Number.isNaN(updatedAt) ? Date.now() : updatedAt,
      };
    },
  };
}

export function createExchangeRateService(
  provider: ExchangeRateProvider = createFrankfurterProvider(),
  options: ExchangeRateServiceOptions = {},
): ExchangeRateService {
  const pendingRates = new Map<string, Promise<ExchangeRate>>();
  const cacheTtlMs = options.cacheTtlMs ?? RATE_CACHE_TTL_MS;
  const now = options.now ?? Date.now;

  return {
    async convert(price, targetCurrency): Promise<ConvertedPrice> {
      const rate = await this.getRate(price.currency, targetCurrency);
      const convertedAmount = convertDetectedPrice(price, rate);

      if (convertedAmount === null) {
        throw new Error(`Unable to convert ${price.currency} to ${targetCurrency}.`);
      }

      return { convertedAmount, original: price, rate, targetCurrency };
    },

    async getRate(from, to): Promise<ExchangeRate> {
      if (from === to) {
        return { from, rate: 1, to, updatedAt: now() };
      }

      const pair = `${from}:${to}`;
      const cachedRate = await options.cache?.get(from, to);

      if (cachedRate && isFresh(cachedRate, cacheTtlMs, now())) {
        return toExchangeRate(cachedRate);
      }

      const pending = pendingRates.get(pair);
      if (pending) return pending;

      const request = provider.getRate(from, to)
        .then(async (rate) => {
          await options.cache?.set(rate);
          return rate;
        })
        .catch((error) => {
          if (cachedRate) return toExchangeRate(cachedRate);

          throw error;
        })
        .finally(() => pendingRates.delete(pair));
      pendingRates.set(pair, request);
      return request;
    },
  };
}

function isFresh(rate: CachedExchangeRate, cacheTtlMs: number, now: number): boolean {
  return now - rate.cachedAt <= cacheTtlMs;
}

function toExchangeRate(rate: CachedExchangeRate): ExchangeRate {
  return {
    from: rate.from,
    rate: rate.rate,
    to: rate.to,
    updatedAt: rate.updatedAt,
  };
}
