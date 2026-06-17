export const SUPPORTED_CURRENCIES = [
  "USD",
  "GBP",
  "EUR",
  "JPY",
  "NGN",
  "CAD",
  "AUD",
  "GHS",
  "KES",
  "ZAR",
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export interface DetectedPrice {
  amount: number;
  currency: CurrencyCode;
  end: number;
  raw: string;
  start: number;
}
