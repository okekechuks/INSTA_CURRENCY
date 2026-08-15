import type { DetectedPrice } from "../types/currency";

import { findPrices, findUnprocessedPriceElements, findUnprocessedPriceNodes } from "./priceDetector";

export interface TextPriceScanMatch {
  kind: "text";
  node: Text;
  prices: DetectedPrice[];
}

export interface ElementPriceScanMatch {
  element: Element;
  kind: "element";
  prices: DetectedPrice[];
}

export type PriceScanMatch = ElementPriceScanMatch | TextPriceScanMatch;

export interface PriceScanner {
  scan(root?: ParentNode): PriceScanMatch[];
}

export function createPriceScanner(
  processedNodes = new WeakSet<Text>(),
  processedElements = new WeakSet<Element>(),
): PriceScanner {
  return {
    scan(root = document.body): PriceScanMatch[] {
      if (!root) return [];

      const matches: PriceScanMatch[] = [];
      const matchedTextNodes = new Set<Text>();

      for (const node of findUnprocessedPriceNodes(root, processedNodes)) {
        const prices = findPrices(node.nodeValue ?? "");
        processedNodes.add(node);

        if (prices.length > 0) {
          matchedTextNodes.add(node);
          matches.push({ kind: "text", node, prices });
        }
      }

      for (const element of findUnprocessedPriceElements(root, processedElements, matchedTextNodes)) {
        const prices = findPrices(element.textContent ?? "");
        processedElements.add(element);

        if (prices.length > 0) {
          matches.push({ element, kind: "element", prices });
        }
      }

      return matches;
    },
  };
}
