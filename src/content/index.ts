import { createExchangeRateService } from "../services/exchangeRate";
import type { ConvertedPrice, CurrencyCode, DetectedPrice } from "../types/currency";

import { renderConvertedPrices } from "./priceRenderer";
import { createPriceScanner, type PriceScanMatch } from "./priceScanner";

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
  void convertPrices(matches);
}

async function convertPrices(matches: PriceScanMatch[]): Promise<void> {
  const convertedMatches = await Promise.all(
    matches.map(async ({ node, prices }) => ({
      node,
      prices: await Promise.all(
        prices.map(async (price) => {
          try {
            return await exchangeRates.convert(price, targetCurrency);
          } catch {
            return null;
          }
        }),
      ),
    })),
  );
  const successfulMatches = convertedMatches.map(({ node, prices }) => ({
    node,
    prices: prices.filter((price): price is ConvertedPrice => price !== null),
  })).filter(({ prices }) => prices.length > 0);
  const successfulPrices = successfulMatches.flatMap(({ prices }) => prices);

  if (successfulPrices.length === 0) {
    console.warn("Instant Currency could not retrieve an exchange rate; page prices were left unchanged.");
    return;
  }

  const renderedCount = successfulMatches.reduce(
    (count, match) => count + renderConvertedPrices(match.node, match.prices),
    0,
  );

  const detail: PricesConvertedEventDetail = {
    hostname: window.location.hostname,
    prices: successfulPrices,
    targetCurrency,
  };

  window.dispatchEvent(new CustomEvent<PricesConvertedEventDetail>("instant-currency:prices-converted", { detail }));
  console.info(`Instant Currency rendered ${renderedCount} converted price estimate(s) in ${targetCurrency}.`);
}

scanPage();
