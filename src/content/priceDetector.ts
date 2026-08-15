import type { CurrencyCode, DetectedPrice } from "../types/currency";

const CURRENCY_CODES = "USD|GBP|EUR|JPY|NGN|CAD|AUD|GHS|KES|ZAR";
const AMOUNT = "\\d{1,3}(?:[,.\\s]\\d{3})*(?:[,.]\\d+)?|\\d+(?:[,.]\\d+)?";
const PRICE_PATTERN = new RegExp(
  `(?<symbol>US\\$|[$\\u00A3\\u20AC\\u00A5\\u20A6])\\s*(?<symbolAmount>${AMOUNT})|\\b(?<prefixCode>${CURRENCY_CODES})\\s*(?<prefixAmount>${AMOUNT})|(?<suffixAmount>${AMOUNT})\\s*(?<suffixCode>${CURRENCY_CODES})\\b`,
  "gi",
);

const SYMBOL_CURRENCIES: Record<string, CurrencyCode> = {
  "$": "USD",
  "US$": "USD",
  "\u00A3": "GBP",
  "\u20AC": "EUR",
  "\u00A5": "JPY",
  "\u20A6": "NGN",
};

const IGNORED_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT"]);
const PRICE_ELEMENT_SELECTOR = [
  "[aria-label*='price' i]",
  "[class*='amount' i]",
  "[class*='currency' i]",
  "[class*='price' i]",
  "[data-price]",
  "[itemprop='price']",
].join(",");

export function findPrices(text: string): DetectedPrice[] {
  const prices: DetectedPrice[] = [];

  for (const match of text.matchAll(PRICE_PATTERN)) {
    const groups = match.groups;
    if (!groups || match.index === undefined) continue;

    const currency = getCurrency(groups);
    const amount = parseAmount(groups.symbolAmount ?? groups.prefixAmount ?? groups.suffixAmount ?? "");

    if (!currency || amount === null) continue;

    prices.push({
      amount,
      currency,
      end: match.index + match[0].length,
      raw: match[0],
      start: match.index,
    });
  }

  return prices;
}

export function findUnprocessedPriceNodes(root: ParentNode, processedNodes: WeakSet<Text>): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let currentNode: Node | null;

  while ((currentNode = walker.nextNode())) {
    const textNode = currentNode as Text;
    if (processedNodes.has(textNode) || !textNode.nodeValue?.trim()) continue;
    if (hasIgnoredParent(textNode) || findPrices(textNode.nodeValue).length === 0) continue;

    nodes.push(textNode);
  }

  return nodes;
}

export function findUnprocessedPriceElements(
  root: ParentNode,
  processedElements: WeakSet<Element>,
  skippedTextNodes: Set<Text> = new Set(),
): Element[] {
  const elements = getPriceElementCandidates(root);
  const matches: Element[] = [];

  for (const element of elements) {
    if (processedElements.has(element) || hasIgnoredElement(element)) continue;
    if (containsSkippedTextNode(element, skippedTextNodes)) continue;
    if (hasPriceElementDescendant(element)) continue;

    const text = element.textContent?.trim() ?? "";
    if (text.length > 80 || findPrices(text).length === 0) continue;

    matches.push(element);
  }

  return matches;
}

function getCurrency(groups: Record<string, string | undefined>): CurrencyCode | null {
  if (groups.symbol) return SYMBOL_CURRENCIES[groups.symbol] ?? null;

  const code = groups.prefixCode ?? groups.suffixCode;
  return code ? (code.toUpperCase() as CurrencyCode) : null;
}

function hasIgnoredParent(node: Text): boolean {
  let parent = node.parentElement;

  while (parent) {
    if (
      IGNORED_TAGS.has(parent.tagName)
      || parent.dataset.instantCurrencyConverted === "true"
      || parent.dataset.instantCurrencyOriginal === "true"
    ) {
      return true;
    }
    parent = parent.parentElement;
  }

  return false;
}

function getPriceElementCandidates(root: ParentNode): Element[] {
  const candidates: Element[] = [];

  if (root instanceof Element && root.matches(PRICE_ELEMENT_SELECTOR)) {
    candidates.push(root);
  }

  candidates.push(...Array.from(root.querySelectorAll(PRICE_ELEMENT_SELECTOR)));
  return candidates;
}

function hasIgnoredElement(element: Element): boolean {
  let current: Element | null = element;

  while (current) {
    if (
      IGNORED_TAGS.has(current.tagName)
      || current instanceof HTMLElement && (
        current.dataset.instantCurrencyConverted === "true"
        || current.dataset.instantCurrencyOriginal === "true"
      )
    ) {
      return true;
    }
    current = current.parentElement;
  }

  return false;
}

function containsSkippedTextNode(element: Element, skippedTextNodes: Set<Text>): boolean {
  for (const textNode of skippedTextNodes) {
    if (textNode.parentElement && element.contains(textNode.parentElement)) return true;
  }

  return false;
}

function hasPriceElementDescendant(element: Element): boolean {
  return Array.from(element.querySelectorAll(PRICE_ELEMENT_SELECTOR)).some((child) => {
    const text = child.textContent?.trim() ?? "";
    return text.length <= 80 && findPrices(text).length > 0;
  });
}

export function parseAmount(value: string): number | null {
  const compact = value.replace(/\s/g, "");
  if (!compact || !/^\d[\d,.]*$/.test(compact)) return null;

  const lastComma = compact.lastIndexOf(",");
  const lastDot = compact.lastIndexOf(".");
  const decimalIndex = getDecimalIndex(compact, lastComma, lastDot);
  const normalized = decimalIndex === -1
    ? compact.replace(/[,.]/g, "")
    : `${compact.slice(0, decimalIndex).replace(/[,.]/g, "")}.${compact.slice(decimalIndex + 1)}`;
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function getDecimalIndex(value: string, lastComma: number, lastDot: number): number {
  if (lastComma !== -1 && lastDot !== -1) return Math.max(lastComma, lastDot);

  const separatorIndex = Math.max(lastComma, lastDot);
  if (separatorIndex === -1) return -1;

  const digitsAfterSeparator = value.length - separatorIndex - 1;
  return digitsAfterSeparator > 0 && digitsAfterSeparator <= 2 ? separatorIndex : -1;
}
