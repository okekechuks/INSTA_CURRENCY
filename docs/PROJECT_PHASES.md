# Instant Currency Project Phases

This plan turns the external project brief into repo-sized delivery phases for the
Chrome/Chromium Manifest V3 extension.

## Current Snapshot

The repository currently contains the extension foundation and the first price
detection slice:

- Manifest V3 setup with popup, content script, and background worker entries.
- Vite and TypeScript build configuration for extension bundles.
- Lightweight popup shell for local extension loading.
- Price detector support for common symbols, ISO currency codes, separators, and
  duplicate text-node avoidance.
- Vitest coverage for detector parsing behavior.

## Phase 1: Extension Foundation

Goal: Make the extension load locally and establish the project structure.

Deliverables:

- TypeScript, Vite, and Manifest V3 configuration.
- Popup HTML, CSS, and TypeScript entry.
- Background service worker entry.
- Content script entry.
- Local build and load-unpacked instructions.

Repo areas:

- `manifest.json`
- `vite.config.ts`
- `tsconfig.json`
- `src/popup/`
- `src/background/`
- `src/content/index.ts`

## Phase 2: Price Detection

Goal: Detect supported prices without modifying page markup.

Deliverables:

- Symbol and ISO-code detection for USD, GBP, EUR, JPY, NGN, CAD, AUD, GHS, KES,
  and ZAR.
- Amount parsing for comma, dot, and space separators.
- Text-node scanning that skips ignored elements and already converted content.
- Unit tests for representative price formats.

Repo areas:

- `src/content/priceDetector.ts`
- `src/content/priceDetector.test.ts`
- `src/types/currency.ts`

## Phase 3: Conversion Service

Goal: Convert detected prices into the user's target currency.

Deliverables:

- Exchange-rate service abstraction.
- Conversion calculation helper.
- Provider-normalized rate response types.
- Network failure handling with graceful no-render fallback.

Repo areas:

- `src/services/exchangeRate.ts`
- `src/utils/currency.ts`
- `src/types/currency.ts`

## Phase 4: Price Rendering

Goal: Display converted values beside original prices without replacing them.

Deliverables:

- Renderer that inserts a small converted-price marker next to detected text.
- Formatting through `Intl.NumberFormat`.
- Marker attributes/classes to prevent duplicate processing.
- Clear estimate styling that does not look like merchant-provided pricing.

Repo areas:

- `src/content/priceRenderer.ts`
- `src/content/index.ts`
- `src/popup/popup.css`

## Phase 5: User Preferences

Goal: Let users configure the target currency and display behavior.

Deliverables:

- Target currency picker.
- Automatic conversion toggle.
- Original-price/display preference controls.
- `chrome.storage` wrapper for preferences.
- Settings change handling from popup to content scripts.

Repo areas:

- `src/popup/`
- `src/utils/storage.ts`
- `src/types/currency.ts`
- `src/content/index.ts`

## Phase 6: Dynamic Page Support

Goal: Keep conversions working on modern shopping pages that change after load.

Deliverables:

- `MutationObserver` integration.
- Debounced rescans for inserted nodes.
- DOM work limits to avoid page slowdowns.
- Tests or fixtures for dynamically added price text.

Repo areas:

- `src/content/index.ts`
- `src/content/priceDetector.ts`
- `src/content/priceRenderer.ts`

## Phase 7: Rate Caching

Goal: Avoid unnecessary exchange-rate requests while keeping estimates current.

Deliverables:

- Cached rates stored by source and target currency pair.
- Expiration and stale-refresh rules.
- Last-updated timestamp surfaced in popup.
- Background coordination for shared rate lookups.

Repo areas:

- `src/services/exchangeRate.ts`
- `src/background/background.ts`
- `src/utils/storage.ts`
- `src/popup/`

## Phase 8: Per-Site Controls

Goal: Let users disable automatic conversion on selected websites.

Deliverables:

- Current-site enable/disable toggle.
- Disabled-domain list in storage.
- Content script early exit for disabled domains.
- Popup status for current website.

Repo areas:

- `src/popup/`
- `src/utils/storage.ts`
- `src/content/index.ts`

## Phase 9: Advanced Features

Goal: Expand the extension after the core workflow is dependable.

Potential additions:

- Secondary target currency.
- Manual conversion from selected text.
- Optional conversion tooltips.
- Custom refresh intervals.
- Bank/card fee adjustment.
- Website-specific detection rules.
- Firefox support.
