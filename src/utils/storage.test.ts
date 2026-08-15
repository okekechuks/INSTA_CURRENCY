import { describe, expect, it } from "vitest";

import {
  DEFAULT_SITE_CONTROLS,
  DEFAULT_PREFERENCES,
  getPreferences,
  getSiteControls,
  isSiteEnabled,
  normalizePreferences,
  normalizeSiteControls,
  savePreferences,
  setSiteEnabled,
  SITE_CONTROLS_STORAGE_KEY,
  type PreferencesStorageArea,
} from "./storage";

describe("preferences storage", () => {
  it("uses defaults when stored preferences are missing or invalid", async () => {
    const storage = createStorage({ instantCurrencyPreferences: { targetCurrency: "INVALID" } });

    await expect(getPreferences(storage)).resolves.toEqual(DEFAULT_PREFERENCES);
    expect(normalizePreferences(null)).toEqual(DEFAULT_PREFERENCES);
  });

  it("merges and persists preference updates", async () => {
    const storage = createStorage({
      instantCurrencyPreferences: { automaticConversion: true, showOriginalPrice: true, targetCurrency: "NGN" },
    });

    await expect(savePreferences({ automaticConversion: false, targetCurrency: "USD" }, storage)).resolves.toEqual({
      automaticConversion: false,
      showOriginalPrice: true,
      targetCurrency: "USD",
    });
    await expect(getPreferences(storage)).resolves.toEqual({
      automaticConversion: false,
      showOriginalPrice: true,
      targetCurrency: "USD",
    });
  });
});

describe("site controls storage", () => {
  it("uses defaults when stored site controls are missing or invalid", async () => {
    const storage = createStorage({ [SITE_CONTROLS_STORAGE_KEY]: { disabledHostnames: "example.com" } });

    await expect(getSiteControls(storage)).resolves.toEqual(DEFAULT_SITE_CONTROLS);
    expect(normalizeSiteControls(null)).toEqual(DEFAULT_SITE_CONTROLS);
  });

  it("normalizes, sorts, and de-duplicates disabled hostnames", () => {
    expect(normalizeSiteControls({
      disabledHostnames: [" Shop.Example.COM.", "example.com", "shop.example.com"],
    })).toEqual({
      disabledHostnames: ["example.com", "shop.example.com"],
    });
  });

  it("enables and disables a hostname", async () => {
    const storage = createStorage({});

    await expect(isSiteEnabled("Shop.Example.com", storage)).resolves.toBe(true);
    await expect(setSiteEnabled("Shop.Example.com", false, storage)).resolves.toEqual({
      disabledHostnames: ["shop.example.com"],
    });
    await expect(isSiteEnabled("shop.example.com", storage)).resolves.toBe(false);
    await expect(setSiteEnabled("shop.example.com", true, storage)).resolves.toEqual({
      disabledHostnames: [],
    });
    await expect(isSiteEnabled("shop.example.com", storage)).resolves.toBe(true);
  });
});

function createStorage(initialValues: Record<string, unknown>): PreferencesStorageArea {
  let values = { ...initialValues };

  return {
    async get(): Promise<Record<string, unknown>> {
      return { ...values };
    },
    async set(nextValues): Promise<void> {
      values = { ...values, ...nextValues };
    },
  };
}
