import "./popup.css";

import { CURRENCY_LABELS, SUPPORTED_CURRENCIES, type CurrencyCode } from "../types/currency";
import { getPreferences, savePreferences } from "../utils/storage";

const form = getElement<HTMLFormElement>("preferences-form");
const targetCurrency = getElement<HTMLSelectElement>("target-currency");
const automaticConversion = getElement<HTMLInputElement>("automatic-conversion");
const showOriginalPrice = getElement<HTMLInputElement>("show-original-price");
const saveStatus = getElement<HTMLParagraphElement>("save-status");

for (const currency of SUPPORTED_CURRENCIES) {
  const option = document.createElement("option");
  option.value = currency;
  option.textContent = `${CURRENCY_LABELS[currency]} (${currency})`;
  targetCurrency.append(option);
}

void loadPreferences();

form.addEventListener("change", () => {
  void persistPreferences();
});

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
  } catch {
    saveStatus.textContent = "Could not save settings";
  }
}

function getElement<ElementType extends HTMLElement>(id: string): ElementType {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing popup element: ${id}`);

  return element as ElementType;
}
