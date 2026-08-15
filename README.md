# Instant Currency

Instant Currency is a Chrome/Chromium Manifest V3 extension that detects prices
on web pages and shows estimated conversions beside them. The extension is built
for browsing ecommerce sites, deal pages, travel pages, and other places where a
quick local-currency estimate helps you decide faster.

This project has not been published to the Chrome Web Store yet. For now, it is
installed and tested locally as an unpacked extension.

## What It Does

- Detects common price formats such as `$49.99`, `USD 120`, `1,299.99 USD`,
  `GBP 39.99`, `EUR 10`, `NGN 2,500`, and symbol-based prices.
- Converts detected prices into a selected target currency.
- Shows the converted estimate beside the original price.
- Preserves the page's original price text by default.
- Supports dynamic pages where products and prices appear after the initial page
  load.
- Stores user preferences in Chrome sync storage.
- Caches exchange rates in Chrome local storage to reduce repeated network
  requests.
- Lets users disable or enable conversion per website from the popup.

## How It Works

Instant Currency has three extension surfaces:

- The content script scans page text and price-like elements, detects supported
  currency formats, and renders conversion estimates into the page.
- The background service worker owns exchange-rate requests, shares lookups
  across tabs, and stores cached rates by currency pair.
- The popup provides user controls for target currency, automatic conversion,
  original-price display, per-site conversion, and rate-cache status.

The flow is:

1. A content script runs on supported `http` and `https` pages.
2. It scans text nodes and price-like elements for supported currency formats.
3. Detected prices are sent through the exchange-rate service.
4. The content script asks the background worker for the needed rate.
5. The background worker returns a fresh cached rate, refreshes a stale rate, or
   falls back to stale cached data if the provider is unavailable.
6. The content script inserts a small `approx.` estimate beside the source price.
7. Popup preference changes are saved to Chrome storage and active pages reapply
   conversion automatically.

Exchange rates currently come from the Frankfurter API.

## Project Structure

```text
.
+-- docs/
|   +-- PROJECT_PHASES.md        # Phase plan and implementation roadmap
+-- src/
|   +-- background/
|   |   +-- background.ts        # MV3 service worker and rate request broker
|   +-- content/
|   |   +-- dynamicContent.ts    # MutationObserver batching for dynamic pages
|   |   +-- index.ts             # Content-script entry point
|   |   +-- priceDetector.ts     # Price parsing and DOM candidate detection
|   |   +-- priceRenderer.ts     # DOM rendering and cleanup helpers
|   |   +-- priceScanner.ts      # Page scanning orchestration
|   +-- popup/
|   |   +-- popup.html           # Extension popup markup
|   |   +-- popup.css            # Popup styling
|   |   +-- popup.ts             # Popup controls and active-tab integration
|   +-- services/
|   |   +-- backgroundRateProvider.ts # Content-to-background rate provider
|   |   +-- exchangeRate.ts      # Rate provider/service abstraction
|   +-- types/
|   |   +-- chrome.d.ts          # Project Chrome API type additions
|   |   +-- currency.ts          # Currency and conversion data types
|   |   +-- messages.ts          # Typed extension message contract
|   +-- utils/
|       +-- currency.ts          # Conversion and formatting helpers
|       +-- rateCache.ts         # Chrome storage-backed rate cache
|       +-- storage.ts           # Preferences and per-site settings storage
+-- manifest.json                # Chrome extension manifest
+-- package.json                 # Scripts and development dependencies
+-- tsconfig.json                # TypeScript configuration
+-- vite.config.ts               # Extension build configuration
```

Test files live beside the modules they cover using the `*.test.ts` suffix.

## Requirements

- Node.js 18 or newer
- npm
- Google Chrome, Microsoft Edge, Brave, or another Chromium-based browser

On Windows PowerShell, use `npm.cmd` if `npm` is blocked by script execution
policy.

## Install Dependencies

```powershell
npm.cmd install
```

On macOS/Linux or shells where `npm` runs normally:

```bash
npm install
```

## Build The Extension

```powershell
npm.cmd run build
```

This creates the production extension bundle in:

```text
dist/
```

During development, you can run:

```powershell
npm.cmd run dev
```

That rebuilds the extension when source files change. After each rebuild, reload
the extension from the browser extensions page.

## Add It To Chrome For Local Testing

Because Instant Currency has not been published yet, install it as an unpacked
extension:

1. Build the project with `npm.cmd run build`.
2. Open Chrome or another Chromium browser.
3. Go to `chrome://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the generated `dist` folder from this repo.
7. Pin or open the Instant Currency extension from the toolbar.
8. Visit a page with visible prices and open the popup once.

For this workspace, the folder to select is:

```text
C:\Users\(Your_PC)\OneDrive\Documents\INSTA_CURRENCY\dist
```

If the extension is already loaded, click the reload button on
`chrome://extensions` after rebuilding.

## Manual Testing Checklist

After loading the unpacked extension:

- Open a shopping page with prices such as `$25`, `GBP 12.81`, `USD 120`, or
  `EUR 49.99`.
- Confirm converted estimates appear beside detected prices.
- Open the popup and change the target currency.
- Toggle **Automatic conversion** off and confirm estimates disappear or stop
  being added.
- Toggle **Show original price** off and confirm the source price is hidden while
  the estimate remains.
- Toggle **This site** off and confirm conversion is disabled for the current
  hostname.
- Toggle **This site** back on and confirm conversion resumes.
- Append a price dynamically in DevTools:

```js
document.body.append(" New item: $42 ");
```

The new price should receive an estimate after a short delay.

## Useful Commands

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

- `typecheck` validates TypeScript without writing output.
- `test` runs the Vitest suite.
- `build` creates the local extension bundle in `dist/`.

## Current Status

The core extension workflow is implemented through Phase 8:

- Extension foundation
- Price detection
- Live conversion service
- Price rendering
- User preferences
- Dynamic page support
- Rate caching through the background worker
- Per-site enable/disable controls

Advanced features are planned next. See [docs/PROJECT_PHASES.md](docs/PROJECT_PHASES.md)
for the full project roadmap.
