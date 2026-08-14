import type { DetectedPrice } from "../types/currency";

import { findPrices, findUnprocessedPriceNodes } from "./priceDetector";

export interface PriceScanMatch {
  node: Text;
  prices: DetectedPrice[];
}

export interface PriceScanner {
  scan(root?: ParentNode): PriceScanMatch[];
}

export function createPriceScanner(processedNodes = new WeakSet<Text>()): PriceScanner {
  return {
    scan(root = document.body): PriceScanMatch[] {
      if (!root) return [];

      const matches: PriceScanMatch[] = [];

      for (const node of findUnprocessedPriceNodes(root, processedNodes)) {
        const prices = findPrices(node.nodeValue ?? "");
        processedNodes.add(node);

        if (prices.length > 0) {
          matches.push({ node, prices });
        }
      }

      return matches;
    },
  };
}
