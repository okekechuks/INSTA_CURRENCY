import { describe, expect, it } from "vitest";

import {
  DEFAULT_PREFERENCES,
  getPreferences,
  normalizePreferences,
  savePreferences,
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
