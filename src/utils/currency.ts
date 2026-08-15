import type { CurrencyCode, DetectedPrice, ExchangeRate } from "../types/currency";

export function convertAmount(amount: number, rate: number): number | null {
  if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(rate) || rate <= 0) {
    return null;
  }

  return amount * rate;
}

export function convertDetectedPrice(
  price: DetectedPrice,
  rate: ExchangeRate,
): number | null {
  if (price.currency !== rate.from) return null;

  return convertAmount(price.amount, rate.rate);
}

export function formatCurrency(amount: number, currency: CurrencyCode, locale = "en"): string {
  return new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits: getFractionDigits(currency),
    minimumFractionDigits: getFractionDigits(currency),
    style: "currency",
  }).format(amount);
}

function getFractionDigits(currency: CurrencyCode): number {
  return currency === "JPY" ? 0 : 2;
}
