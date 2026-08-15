import { createExchangeRateService } from "../services/exchangeRate";
import type { ConvertedPrice, CurrencyCode, DetectedPrice } from "../types/currency";
import {
  getPreferences,
  PREFERENCES_STORAGE_KEY,
  type UserPreferences,
} from "../utils/storage";

import { observeDynamicContent, type DynamicContentObserver } from "./dynamicContent";
import { clearRenderedPriceEstimates, renderConvertedPrices } from "./priceRenderer";
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

let scanner = createPriceScanner();
const exchangeRates = createExchangeRateService();
let preferences: UserPreferences;
let dynamicContentObserver: DynamicContentObserver | undefined;

function scanPage(root?: ParentNode): void {
  if (!preferences.automaticConversion) return;

  const matches = scanner.scan(root);
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
            return await exchangeRates.convert(price, preferences.targetCurrency);
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
    (count, match) => count + renderConvertedPrices(match.node, match.prices, preferences.showOriginalPrice),
    0,
  );

  const detail: PricesConvertedEventDetail = {
    hostname: window.location.hostname,
    prices: successfulPrices,
    targetCurrency: preferences.targetCurrency,
  };

  window.dispatchEvent(new CustomEvent<PricesConvertedEventDetail>("instant-currency:prices-converted", { detail }));
  console.info(`Instant Currency rendered ${renderedCount} converted price estimate(s) in ${preferences.targetCurrency}.`);
}

async function initialize(): Promise<void> {
  preferences = await getPreferences();
  scanPage();
  dynamicContentObserver = observeDynamicContent(document.body, (roots) => {
    for (const root of roots) scanPage(root);
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync" || !changes[PREFERENCES_STORAGE_KEY]) return;

    void refreshForPreferences();
  });
}

async function refreshForPreferences(): Promise<void> {
  preferences = await getPreferences();
  clearRenderedPriceEstimates();
  scanner = createPriceScanner();
  scanPage();
}

void initialize();
