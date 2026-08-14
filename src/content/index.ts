import type { DetectedPrice } from "../types/currency";

import { createPriceScanner } from "./priceScanner";

interface PriceDetectedEventDetail {
  hostname: string;
  matches: Array<{
    prices: DetectedPrice[];
    text: string;
  }>;
}

const scanner = createPriceScanner();

function scanPage(): void {
  const matches = scanner.scan();
  if (matches.length === 0) return;

  const detail: PriceDetectedEventDetail = {
    hostname: window.location.hostname,
    matches: matches.map(({ node, prices }) => ({
      prices,
      text: node.nodeValue ?? "",
    })),
  };

  window.dispatchEvent(new CustomEvent<PriceDetectedEventDetail>("instant-currency:prices-detected", { detail }));
  console.info(`Instant Currency detected ${matches.length} price node(s).`, detail.matches);
}

scanPage();
