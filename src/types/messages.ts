import { SUPPORTED_CURRENCIES, type CurrencyCode, type ExchangeRate } from "./currency";

export const GET_RATE_MESSAGE_TYPE = "instant-currency:get-rate";

export interface GetRateMessage {
  from: CurrencyCode;
  to: CurrencyCode;
  type: typeof GET_RATE_MESSAGE_TYPE;
}

export type GetRateResponse =
  | { ok: true; rate: ExchangeRate }
  | { error: string; ok: false };

export type InstantCurrencyMessage = GetRateMessage;

export function createGetRateMessage(from: CurrencyCode, to: CurrencyCode): GetRateMessage {
  return { from, to, type: GET_RATE_MESSAGE_TYPE };
}

export function isGetRateMessage(message: unknown): message is GetRateMessage {
  if (!isRecord(message)) return false;

  return (
    message.type === GET_RATE_MESSAGE_TYPE
    && isSupportedCurrency(message.from)
    && isSupportedCurrency(message.to)
  );
}

function isSupportedCurrency(value: unknown): value is CurrencyCode {
  return typeof value === "string" && SUPPORTED_CURRENCIES.includes(value as CurrencyCode);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
