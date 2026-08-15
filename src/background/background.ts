import { createExchangeRateService, createFrankfurterProvider } from "../services/exchangeRate";
import { isGetRateMessage, type GetRateResponse } from "../types/messages";
import { createChromeExchangeRateCache } from "../utils/rateCache";

const exchangeRates = createExchangeRateService(createFrankfurterProvider(), {
  cache: createChromeExchangeRateCache(),
});

chrome.runtime.onInstalled.addListener(() => {
  console.info("Instant Currency installed.");
});

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse: (response: GetRateResponse) => void) => {
  if (!isGetRateMessage(message)) return false;

  void exchangeRates.getRate(message.from, message.to)
    .then((rate) => sendResponse({ ok: true, rate }))
    .catch((error: unknown) => {
      sendResponse({
        error: error instanceof Error ? error.message : "Unable to retrieve the exchange rate.",
        ok: false,
      });
    });

  return true;
});
