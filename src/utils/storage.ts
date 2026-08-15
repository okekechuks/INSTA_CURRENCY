import { SUPPORTED_CURRENCIES, type CurrencyCode } from "../types/currency";

export const PREFERENCES_STORAGE_KEY = "instantCurrencyPreferences";
export const SITE_CONTROLS_STORAGE_KEY = "instantCurrencySiteControls";

export interface UserPreferences {
  automaticConversion: boolean;
  showOriginalPrice: boolean;
  targetCurrency: CurrencyCode;
}

export interface SiteControls {
  disabledHostnames: string[];
}

export interface PreferencesStorageArea {
  get(keys?: string | string[] | Record<string, unknown>): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  automaticConversion: true,
  showOriginalPrice: true,
  targetCurrency: "NGN",
};

export const DEFAULT_SITE_CONTROLS: SiteControls = {
  disabledHostnames: [],
};

export async function getPreferences(
  storage: PreferencesStorageArea = chrome.storage.sync,
): Promise<UserPreferences> {
  const items = await storage.get(PREFERENCES_STORAGE_KEY);
  return normalizePreferences(items[PREFERENCES_STORAGE_KEY]);
}

export async function savePreferences(
  changes: Partial<UserPreferences>,
  storage: PreferencesStorageArea = chrome.storage.sync,
): Promise<UserPreferences> {
  const preferences = { ...await getPreferences(storage), ...changes };
  const normalized = normalizePreferences(preferences);

  await storage.set({ [PREFERENCES_STORAGE_KEY]: normalized });
  return normalized;
}

export async function getSiteControls(
  storage: PreferencesStorageArea = chrome.storage.sync,
): Promise<SiteControls> {
  const items = await storage.get(SITE_CONTROLS_STORAGE_KEY);
  return normalizeSiteControls(items[SITE_CONTROLS_STORAGE_KEY]);
}

export async function isSiteEnabled(
  hostname: string,
  storage: PreferencesStorageArea = chrome.storage.sync,
): Promise<boolean> {
  const normalizedHostname = normalizeHostname(hostname);
  if (!normalizedHostname) return true;

  const siteControls = await getSiteControls(storage);
  return !siteControls.disabledHostnames.includes(normalizedHostname);
}

export async function setSiteEnabled(
  hostname: string,
  enabled: boolean,
  storage: PreferencesStorageArea = chrome.storage.sync,
): Promise<SiteControls> {
  const normalizedHostname = normalizeHostname(hostname);
  const siteControls = await getSiteControls(storage);
  const disabledHostnames = new Set(siteControls.disabledHostnames);

  if (normalizedHostname) {
    if (enabled) {
      disabledHostnames.delete(normalizedHostname);
    } else {
      disabledHostnames.add(normalizedHostname);
    }
  }

  const normalized = normalizeSiteControls({
    disabledHostnames: Array.from(disabledHostnames),
  });

  await storage.set({ [SITE_CONTROLS_STORAGE_KEY]: normalized });
  return normalized;
}

export function normalizePreferences(value: unknown): UserPreferences {
  if (!value || typeof value !== "object") return { ...DEFAULT_PREFERENCES };

  const preferences = value as Partial<UserPreferences>;
  return {
    automaticConversion: typeof preferences.automaticConversion === "boolean"
      ? preferences.automaticConversion
      : DEFAULT_PREFERENCES.automaticConversion,
    showOriginalPrice: typeof preferences.showOriginalPrice === "boolean"
      ? preferences.showOriginalPrice
      : DEFAULT_PREFERENCES.showOriginalPrice,
    targetCurrency: isCurrencyCode(preferences.targetCurrency)
      ? preferences.targetCurrency
      : DEFAULT_PREFERENCES.targetCurrency,
  };
}

export function normalizeSiteControls(value: unknown): SiteControls {
  if (!value || typeof value !== "object") return { ...DEFAULT_SITE_CONTROLS };

  const siteControls = value as Partial<SiteControls>;
  return {
    disabledHostnames: Array.isArray(siteControls.disabledHostnames)
      ? Array.from(new Set(siteControls.disabledHostnames.map(normalizeHostnameValue).filter(Boolean))).sort()
      : DEFAULT_SITE_CONTROLS.disabledHostnames,
  };
}

export function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, "");
}

function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && SUPPORTED_CURRENCIES.includes(value as CurrencyCode);
}

function normalizeHostnameValue(value: unknown): string {
  return typeof value === "string" ? normalizeHostname(value) : "";
}
