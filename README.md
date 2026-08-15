# Instant Currency

A Chrome/Chromium extension that will show estimated currency conversions next to prices on web pages.

## Current status

Instant Currency is in the early extension build-out:

- Phase 1 foundation is in place: Manifest V3, popup shell, background worker, content script, Vite, and TypeScript.
- Phase 2 price detection is in place: common symbols, ISO currency codes, amount parsing, duplicate-safe text-node scanning, and detector tests are present.
- Phase 3 conversion is in place: a provider-isolated exchange-rate service fetches live rates and emits converted-price data, with no page change when a rate cannot be retrieved.
- Phase 4 rendering is in place: estimated values render beside source prices, with original text preserved and duplicate-safe markers.
- Phase 5 preferences are in place: the popup stores a target currency and display options, then active pages reapply conversions when settings change.
- Dynamic page handling, persistent caching, and per-site controls are planned next.

See [docs/PROJECT_PHASES.md](docs/PROJECT_PHASES.md) for the full phased project breakdown.

## Local setup

1. Run `npm install`.
2. Run `npm run build`.
3. Open `chrome://extensions`, enable Developer mode, select **Load unpacked**, and choose the `dist` directory.
4. Open the extension popup to confirm the foundation screen appears.

During development, run `npm run dev` and use the reload button for the extension after each rebuild.

## Useful commands

- `npm run typecheck` checks TypeScript without writing build output.
- `npm test` runs the price detector tests.
- `npm run build` creates the extension bundle in `dist/`.
