import type { ConvertedPrice } from "../types/currency";
import { formatCurrency } from "../utils/currency";

export interface PriceRenderPart {
  text: string;
  type: "estimate" | "original";
}

export function buildRenderedPriceParts(text: string, prices: ConvertedPrice[]): PriceRenderPart[] {
  const parts: PriceRenderPart[] = [];
  let cursor = 0;

  for (const price of [...prices].sort((first, second) => first.original.start - second.original.start)) {
    const { end, raw, start } = price.original;
    if (start < cursor || end > text.length || text.slice(start, end) !== raw) continue;

    addOriginalPart(parts, text.slice(cursor, end));
    parts.push({ text: ` (approx. ${formatCurrency(price.convertedAmount, price.targetCurrency)})`, type: "estimate" });
    cursor = end;
  }

  addOriginalPart(parts, text.slice(cursor));
  return parts;
}

export function renderConvertedPrices(node: Text, prices: ConvertedPrice[]): number {
  if (!node.parentNode || prices.length === 0) return 0;

  const parts = buildRenderedPriceParts(node.nodeValue ?? "", prices);
  const estimateCount = parts.filter((part) => part.type === "estimate").length;
  if (estimateCount === 0) return 0;

  const document = node.ownerDocument;
  const fragment = document.createDocumentFragment();

  for (const part of parts) {
    if (part.type === "original") {
      fragment.append(document.createTextNode(part.text));
      continue;
    }

    const marker = document.createElement("span");
    marker.className = "instant-currency-estimate";
    marker.dataset.instantCurrencyConverted = "true";
    marker.setAttribute("aria-label", part.text.trim());
    marker.textContent = part.text;
    fragment.append(marker);
  }

  ensureRendererStyles(document);
  node.replaceWith(fragment);
  return estimateCount;
}

function addOriginalPart(parts: PriceRenderPart[], text: string): void {
  if (text) parts.push({ text, type: "original" });
}

function ensureRendererStyles(document: Document): void {
  if (document.querySelector("style[data-instant-currency-styles='true']")) return;

  const style = document.createElement("style");
  style.dataset.instantCurrencyStyles = "true";
  style.textContent = `
    .instant-currency-estimate {
      color: #0f766e !important;
      font-size: 0.9em !important;
      font-weight: 600 !important;
      margin-left: 0.2em !important;
      white-space: nowrap !important;
    }
  `;
  (document.head ?? document.documentElement).append(style);
}
