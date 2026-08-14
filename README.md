# Instant Currency

A Chrome/Chromium extension that will show estimated currency conversions next to prices on web pages.

## Current status

Instant Currency is in the early extension build-out:

- Phase 1 foundation is in place: Manifest V3, popup shell, background worker, content script, Vite, and TypeScript.
- Phase 2 price detection has started: common symbols, ISO currency codes, amount parsing, and detector tests are present.
- Conversion, rendering, user preferences, dynamic page handling, caching, and per-site controls are planned next.

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
