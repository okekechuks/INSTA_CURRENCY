import { createBackgroundRateProvider } from "../services/backgroundRateProvider";
import { createExchangeRateService } from "../services/exchangeRate";
import type { ConvertedPrice, CurrencyCode, DetectedPrice } from "../types/currency";
import {
  getPreferences,
  isSiteEnabled,
  PREFERENCES_STORAGE_KEY,
  SITE_CONTROLS_STORAGE_KEY,
  type UserPreferences,
} from "../utils/storage";

import { observeDynamicContent, type DynamicContentObserver } from "./dynamicContent";
import { appendConvertedPriceEstimate, clearRenderedPriceEstimates, renderConvertedPrices } from "./priceRenderer";
import { createPriceScanner, type PriceScanMatch } from "./priceScanner";

declare global {
  interface Window {
    __instantCurrencyInitialized?: boolean;
  }
}

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
const exchangeRates = createExchangeRateService(createBackgroundRateProvider());
let preferences: UserPreferences;
let currentSiteEnabled = true;
let settingsRevision = 0;
let dynamicContentObserver: DynamicContentObserver | undefined;

function scanPage(root?: ParentNode): void {
  if (!currentSiteEnabled) return;
  if (!preferences.automaticConversion) return;

  const matches = scanner.scan(root);
  if (matches.length === 0) return;

  const detail: PriceDetectedEventDetail = {
    hostname: window.location.hostname,
    matches: matches.map((match) => ({
      prices: match.prices,
      text: getMatchText(match),
    })),
  };

  window.dispatchEvent(new CustomEvent<PriceDetectedEventDetail>("instant-currency:prices-detected", { detail }));
  console.info(`Instant Currency detected ${matches.length} price node(s).`, detail.matches);
  void convertPrices(matches, preferences, settingsRevision);
}

function getMatchText(match: PriceScanMatch): string {
  if (match.kind === "text") {
    return match.node.nodeValue ?? "";
  }

  return match.element.textContent ?? "";
}

async function convertPrices(
  matches: PriceScanMatch[],
  activePreferences: UserPreferences,
  activeRevision: number,
): Promise<void> {
  const convertedMatches = await Promise.all(
    matches.map(async (match) => ({
      match,
      prices: await Promise.all(
        match.prices.map(async (price) => {
          try {
            return await exchangeRates.convert(price, activePreferences.targetCurrency);
          } catch {
            return null;
          }
        }),
      ),
    })),
  );
  const successfulMatches = convertedMatches.map(({ match, prices }) => ({
    match,
    prices: prices.filter((price): price is ConvertedPrice => price !== null),
  })).filter(({ prices }) => prices.length > 0);
  const successfulPrices = successfulMatches.flatMap(({ prices }) => prices);

  if (activeRevision !== settingsRevision || !currentSiteEnabled || !activePreferences.automaticConversion) {
    return;
  }

  if (successfulPrices.length === 0) {
    console.warn("Instant Currency could not retrieve an exchange rate; page prices were left unchanged.");
    return;
  }

  const renderedCount = successfulMatches.reduce(
    (count, { match, prices }) => count + renderConvertedMatch(match, prices, activePreferences.showOriginalPrice),
    0,
  );

  const detail: PricesConvertedEventDetail = {
    hostname: window.location.hostname,
    prices: successfulPrices,
    targetCurrency: activePreferences.targetCurrency,
  };

  window.dispatchEvent(new CustomEvent<PricesConvertedEventDetail>("instant-currency:prices-converted", { detail }));
  console.info(`Instant Currency rendered ${renderedCount} converted price estimate(s) in ${activePreferences.targetCurrency}.`);
}

function renderConvertedMatch(
  match: PriceScanMatch,
  prices: ConvertedPrice[],
  showOriginalPrice: boolean,
): number {
  if (match.kind === "text") {
    return renderConvertedPrices(match.node, prices, showOriginalPrice);
  }

  return appendConvertedPriceEstimate(match.element, prices);
}

async function initialize(): Promise<void> {
  [preferences, currentSiteEnabled] = await Promise.all([
    getPreferences(),
    isSiteEnabled(window.location.hostname),
  ]);
  scanPage();
  dynamicContentObserver = observeDynamicContent(document.body, (roots) => {
    for (const root of roots) scanPage(root);
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (
      areaName !== "sync"
      || (!changes[PREFERENCES_STORAGE_KEY] && !changes[SITE_CONTROLS_STORAGE_KEY])
    ) {
      return;
    }

    void refreshForSettings();
  });
}

async function refreshForSettings(): Promise<void> {
  [preferences, currentSiteEnabled] = await Promise.all([
    getPreferences(),
    isSiteEnabled(window.location.hostname),
  ]);
  settingsRevision += 1;
  clearRenderedPriceEstimates();
  scanner = createPriceScanner();
  scanPage();
}

if (!window.__instantCurrencyInitialized) {
  window.__instantCurrencyInitialized = true;
  void initialize();
}
