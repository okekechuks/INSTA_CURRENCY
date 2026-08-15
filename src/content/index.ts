import { createExchangeRateService } from "../services/exchangeRate";
import type { ConvertedPrice, CurrencyCode, DetectedPrice } from "../types/currency";

import { createPriceScanner } from "./priceScanner";

interface PriceDetectedEventDetail {
  hostname: string;
  matches: Array<{
    prices: DetectedPrice[];
    text: string;
  }>;
}

interface PricesConvertedEventDetail {
  hostname: string;
  prices: ConvertedPrice[];
  targetCurrency: CurrencyCode;
}

const scanner = createPriceScanner();
const exchangeRates = createExchangeRateService();
const targetCurrency: CurrencyCode = "NGN";

function scanPage(): void {
  const matches = scanner.scan();
  if (matches.length === 0) return;

  const detail: PriceDetectedEventDetail = {
    hostname: window.location.hostname,
    matches: matches.map(({ node, prices }) => ({
      prices,
      text: node.nodeValue ?? "",
    })),
  };

  window.dispatchEvent(new CustomEvent<PriceDetectedEventDetail>("instant-currency:prices-detected", { detail }));
  console.info(`Instant Currency detected ${matches.length} price node(s).`, detail.matches);
  void convertPrices(detail.matches.flatMap(({ prices }) => prices));
}

async function convertPrices(prices: DetectedPrice[]): Promise<void> {
  const converted = await Promise.all(
    prices.map(async (price) => {
      try {
        return await exchangeRates.convert(price, targetCurrency);
      } catch {
        return null;
      }
    }),
  );
  const successfulPrices = converted.filter((price): price is ConvertedPrice => price !== null);

  if (successfulPrices.length === 0) {
    console.warn("Instant Currency could not retrieve an exchange rate; page prices were left unchanged.");
    return;
  }

  const detail: PricesConvertedEventDetail = {
    hostname: window.location.hostname,
    prices: successfulPrices,
    targetCurrency,
  };

  window.dispatchEvent(new CustomEvent<PricesConvertedEventDetail>("instant-currency:prices-converted", { detail }));
  console.info(`Instant Currency converted ${successfulPrices.length} price(s) to ${targetCurrency}.`);
}

scanPage();
