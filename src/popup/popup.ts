import "./popup.css";

import { CURRENCY_LABELS, SUPPORTED_CURRENCIES, type CurrencyCode } from "../types/currency";
import { getLatestCachedExchangeRate, RATE_CACHE_STORAGE_KEY } from "../utils/rateCache";
import { getPreferences, savePreferences } from "../utils/storage";

const form = getElement<HTMLFormElement>("preferences-form");
const targetCurrency = getElement<HTMLSelectElement>("target-currency");
const automaticConversion = getElement<HTMLInputElement>("automatic-conversion");
const showOriginalPrice = getElement<HTMLInputElement>("show-original-price");
const saveStatus = getElement<HTMLParagraphElement>("save-status");
const rateStatus = getElement<HTMLParagraphElement>("rate-status");

for (const currency of SUPPORTED_CURRENCIES) {
  const option = document.createElement("option");
  option.value = currency;
  option.textContent = `${CURRENCY_LABELS[currency]} (${currency})`;
  targetCurrency.append(option);
}

void initializePopup();

form.addEventListener("change", () => {
  void persistPreferences();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[RATE_CACHE_STORAGE_KEY]) return;

  void loadRateStatus();
});

async function initializePopup(): Promise<void> {
  await loadPreferences();
  await loadRateStatus();
}

async function loadPreferences(): Promise<void> {
  const preferences = await getPreferences();
  targetCurrency.value = preferences.targetCurrency;
  automaticConversion.checked = preferences.automaticConversion;
  showOriginalPrice.checked = preferences.showOriginalPrice;
}

async function persistPreferences(): Promise<void> {
  saveStatus.textContent = "Saving...";

  try {
    await savePreferences({
      automaticConversion: automaticConversion.checked,
      showOriginalPrice: showOriginalPrice.checked,
      targetCurrency: targetCurrency.value as CurrencyCode,
    });
    saveStatus.textContent = "Saved";
    await loadRateStatus();
  } catch {
    saveStatus.textContent = "Could not save settings";
  }
}

async function loadRateStatus(): Promise<void> {
  try {
    const latestRate = await getLatestCachedExchangeRate(
      chrome.storage.local,
      targetCurrency.value as CurrencyCode,
    );

    if (!latestRate) {
      rateStatus.textContent = "Rates update after first conversion";
      return;
    }

    rateStatus.textContent = `Rates updated ${formatTimestamp(latestRate.cachedAt)}`;
  } catch {
    rateStatus.textContent = "Rate status unavailable";
  }
}

function formatTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function getElement<ElementType extends HTMLElement>(id: string): ElementType {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing popup element: ${id}`);

  return element as ElementType;
}
