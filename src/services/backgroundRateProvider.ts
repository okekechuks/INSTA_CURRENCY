import { createGetRateMessage, type GetRateResponse } from "../types/messages";
import type { CurrencyCode, ExchangeRate } from "../types/currency";

import type { ExchangeRateProvider } from "./exchangeRate";

type RuntimeSendMessage = <Message, Response>(message: Message) => Promise<Response>;

export function createBackgroundRateProvider(
  sendMessage: RuntimeSendMessage = chrome.runtime.sendMessage,
): ExchangeRateProvider {
  return {
    async getRate(from: CurrencyCode, to: CurrencyCode): Promise<ExchangeRate> {
      const response = await sendMessage<ReturnType<typeof createGetRateMessage>, GetRateResponse>(
        createGetRateMessage(from, to),
      );

      if (!response?.ok) {
        throw new Error(response?.error ?? `Unable to retrieve the ${from}/${to} exchange rate.`);
      }

      return response.rate;
    },
  };
}
