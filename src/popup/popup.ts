import "./popup.css";

import { CURRENCY_LABELS, SUPPORTED_CURRENCIES, type CurrencyCode } from "../types/currency";
import { getLatestCachedExchangeRate, RATE_CACHE_STORAGE_KEY } from "../utils/rateCache";
import {
  getPreferences,
  isSiteEnabled,
  savePreferences,
  setSiteEnabled,
  SITE_CONTROLS_STORAGE_KEY,
} from "../utils/storage";

const form = getElement<HTMLFormElement>("preferences-form");
const targetCurrency = getElement<HTMLSelectElement>("target-currency");
const automaticConversion = getElement<HTMLInputElement>("automatic-conversion");
const showOriginalPrice = getElement<HTMLInputElement>("show-original-price");
const currentSiteEnabled = getElement<HTMLInputElement>("current-site-enabled");
const currentSiteHost = getElement<HTMLElement>("current-site-host");
const saveStatus = getElement<HTMLParagraphElement>("save-status");
const rateStatus = getElement<HTMLParagraphElement>("rate-status");

let activeHostname: string | null = null;

for (const currency of SUPPORTED_CURRENCIES) {
  const option = document.createElement("option");
  option.value = currency;
  option.textContent = `${CURRENCY_LABELS[currency]} (${currency})`;
  targetCurrency.append(option);
}

void initializePopup();

form.addEventListener("change", (event) => {
  if (event.target === currentSiteEnabled) {
    void persistCurrentSiteControl();
    return;
  }

  void persistPreferences();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes[RATE_CACHE_STORAGE_KEY]) {
    void loadRateStatus();
    return;
  }

  if (areaName === "sync" && changes[SITE_CONTROLS_STORAGE_KEY]) {
    void loadCurrentSiteControl();
  }

});

async function initializePopup(): Promise<void> {
  await loadPreferences();
  activeHostname = await getActiveHostname();
  renderActiveSite();
  await loadCurrentSiteControl();
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

async function loadCurrentSiteControl(): Promise<void> {
  if (!activeHostname) {
    currentSiteEnabled.checked = false;
    return;
  }

  currentSiteEnabled.checked = await isSiteEnabled(activeHostname);
}

async function persistCurrentSiteControl(): Promise<void> {
  if (!activeHostname) return;

  saveStatus.textContent = "Saving...";

  try {
    await setSiteEnabled(activeHostname, currentSiteEnabled.checked);
    saveStatus.textContent = currentSiteEnabled.checked ? "Enabled on this site" : "Disabled on this site";
  } catch {
    saveStatus.textContent = "Could not save site setting";
    await loadCurrentSiteControl();
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

async function getActiveHostname(): Promise<string | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTabUrl = tabs[0]?.url;
  if (!activeTabUrl) return null;

  try {
    const url = new URL(activeTabUrl);
    return url.protocol === "http:" || url.protocol === "https:" ? url.hostname : null;
  } catch {
    return null;
  }
}

function renderActiveSite(): void {
  currentSiteEnabled.disabled = !activeHostname;
  currentSiteHost.textContent = activeHostname ?? "Unavailable on this page";
}

function getElement<ElementType extends HTMLElement>(id: string): ElementType {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing popup element: ${id}`);

  return element as ElementType;
}
