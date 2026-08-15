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

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  AUD: "Australian Dollar",
  CAD: "Canadian Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  GHS: "Ghanaian Cedi",
  JPY: "Japanese Yen",
  KES: "Kenyan Shilling",
  NGN: "Nigerian Naira",
  USD: "US Dollar",
  ZAR: "South African Rand",
};

export interface DetectedPrice {
  amount: number;
  currency: CurrencyCode;
  end: number;
  raw: string;
  start: number;
}

export interface ExchangeRate {
  from: CurrencyCode;
  rate: number;
  to: CurrencyCode;
  updatedAt: number;
}

export interface ConvertedPrice {
  convertedAmount: number;
  original: DetectedPrice;
  rate: ExchangeRate;
  targetCurrency: CurrencyCode;
}
