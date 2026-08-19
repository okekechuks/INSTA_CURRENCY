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
const rateValue = getElement<HTMLParagraphElement>("rate-value");
const themeToggle = getElement<HTMLButtonElement>("theme-toggle");
const refreshRate = getElement<HTMLButtonElement>("refresh-rate");

let activeHostname: string | null = null;
let activeTabId: number | null = null;

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

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.classList.contains("dark") ? "light" : "dark";
  setTheme(nextTheme);
  void chrome.storage.local.set({ instantCurrencyTheme: nextTheme });
});

refreshRate.addEventListener("click", () => {
  refreshRate.disabled = true;
  void loadRateStatus(true).finally(() => {
    refreshRate.disabled = false;
  });
});

for (const id of ["settings-btn", "favorites-btn", "history-btn", "rates-btn", "blocked-btn", "premium-btn"]) {
  const button = document.getElementById(id);
  button?.addEventListener("click", () => {
    if (id === "settings-btn") {
      saveStatus.textContent = "Settings are available through the controls below.";
    } else if (id === "premium-btn") {
      saveStatus.textContent = "Premium features are coming soon.";
    } else {
      saveStatus.textContent = `${button.textContent?.trim() ?? "Action"} is coming soon.`;
    }
  });
}

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
  const activeTab = await getActiveTabInfo();
  activeHostname = activeTab.hostname;
  activeTabId = activeTab.tabId;
  renderActiveSite();
  await injectContentScript();
  await loadCurrentSiteControl();
  await loadTheme();
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

async function loadRateStatus(forceRefresh = false): Promise<void> {
  try {
    const latestRate = await getLatestCachedExchangeRate(
      chrome.storage.local,
      targetCurrency.value as CurrencyCode,
    );

    if (!latestRate) {
      rateValue.textContent = "Waiting for first conversion";
      rateStatus.textContent = "Rates update after your first conversion";
      return;
    }

    if (forceRefresh) {
      rateStatus.textContent = "Using the latest cached rate available to the extension";
    } else {
      rateStatus.textContent = `Updated ${formatTimestamp(latestRate.cachedAt)}`;
    }

    rateValue.textContent = `1 ${latestRate.from} ≈ ${latestRate.rate.toFixed(4)} ${latestRate.to}`;
  } catch {
    rateValue.textContent = "Rate unavailable";
    rateStatus.textContent = "Rate status unavailable";
  }
}

async function loadTheme(): Promise<void> {
  const stored = await chrome.storage.local.get("instantCurrencyTheme");
  setTheme(stored.instantCurrencyTheme === "dark" ? "dark" : "light");
}

function setTheme(theme: "light" | "dark"): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function formatTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

async function getActiveTabInfo(): Promise<{ hostname: string | null; tabId: number | null }> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  const activeTabUrl = activeTab?.url;
  if (!activeTabUrl) return { hostname: null, tabId: null };

  try {
    const url = new URL(activeTabUrl);
    const isSupportedPage = url.protocol === "http:" || url.protocol === "https:";
    return {
      hostname: isSupportedPage ? url.hostname : null,
      tabId: isSupportedPage && typeof activeTab.id === "number" ? activeTab.id : null,
    };
  } catch {
    return { hostname: null, tabId: null };
  }
}

async function injectContentScript(): Promise<void> {
  if (activeTabId === null) return;
  try {
    await chrome.scripting.executeScript({
      files: ["content.js"],
      target: { tabId: activeTabId },
    });
  } catch {
    // The manifest content script still handles normal page loads.
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
