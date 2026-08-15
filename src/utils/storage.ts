import { SUPPORTED_CURRENCIES, type CurrencyCode } from "../types/currency";

export const PREFERENCES_STORAGE_KEY = "instantCurrencyPreferences";

export interface UserPreferences {
  automaticConversion: boolean;
  showOriginalPrice: boolean;
  targetCurrency: CurrencyCode;
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

function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && SUPPORTED_CURRENCIES.includes(value as CurrencyCode);
}
