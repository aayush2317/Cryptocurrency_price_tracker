# CryptoPulse

A responsive cryptocurrency dashboard built with **React, Vite, Tailwind CSS, React Router, Recharts, and JavaScript**.

All market figures are illustrative mock data. No market API, backend, account integration, or live price feed is connected. The watchlist is saved in this browser on this device.

## Open in VS Code and run

Use Node.js 22.12+ (or a supported newer LTS release).

1. Extract the source ZIP.
2. Open the `cryptopulse` folder in VS Code with **File → Open Folder**.
3. Open **Terminal → New Terminal** and run:

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:4173`).

```bash
npm run build     # Create an optimized production build in dist/
npm run preview   # Serve that production build locally
npm run format    # Format the source files
```

For deployment, serve `dist/` and configure an SPA fallback so `/markets`, `/watchlist`, and `/coin/bitcoin` return `index.html`. The Site deployment includes this fallback.

## Project structure

| Folder                   | Purpose                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| `src/pages/`             | Dashboard, Markets, Coin Details, Watchlist, and missing-page view |
| `src/components/layout/` | Shared navigation, mobile drawer, header, and page shell           |
| `src/components/market/` | Searchable/sortable market table, market movers, and statistics    |
| `src/components/charts/` | Recharts price chart and lightweight SVG sparklines                |
| `src/components/ui/`     | Reusable icons, coin avatars, change badges, and watchlist buttons |
| `src/context/`           | Shared watchlist state and safe browser-storage handling           |
| `src/data/`              | Coin fixtures and deterministic sample price history               |
| `src/hooks/`             | Optional browser-tool registration, with support detection         |
| `src/utils/`             | Shared currency, number, and percentage formatting                 |
| `public/coins/`          | Locally bundled cryptocurrency icons                               |

## Features

- Three global statistics cards: market capitalization, trading volume, and BTC dominance.
- Trending coins, top gainers, and top losers.
- Search by coin name or symbol, category filters, sortable columns, and pagination.
- Dynamic coin routes with price, market cap, 24-hour volume/change, ATH, and circulating supply.
- Interactive price tooltips, six time ranges, and linear/logarithmic scales.
- Watchlist actions across the table and detail pages; cross-tab storage synchronization.
- Accessible labels, keyboard navigation, visible focus indicators, reduced-motion support, empty states, and a render-error fallback.
- Responsive layouts with a mobile/tablet navigation drawer and compact market tables.
- Local fonts and icons: opening the app does not require third-party font or market-data requests.

## Mock data

Edit `src/data/coins.js` to change coin records and the fixed snapshot date. `createHistory()` produces stable illustrative chart series for each asset and time period. Global values represent an illustrative broader market, not the sum of the 16 displayed coins.

The chart's percentage reflects the selected period; the coin's headline and table percentage always refer to 24 hours. Basic metadata is descriptive; the prices, statistics, and chart histories are not current market information.

For the optional WebMCP browser capability, `set_watchlist_asset` exposes the same device-local watchlist action as the UI and validates inputs. This safely does nothing when the host browser does not expose the required registration API.

## Validation

The production build passes. Browser checks covered all four routes, search and no-results states, category filters, sorting, chart period and scale selection, adding/removing assets, and watchlist persistence after reload (including the empty state). Mobile and tablet layouts were inspected in narrow browser frames, including a 320px check, with document overflow checks. No application-origin console errors were observed. Browser-extension diagnostics are unrelated to application code.

The current QA browser did not expose the optional WebMCP registrations, so executing that optional capability could not be verified. The visible watchlist interface was tested directly.

## Asset credits

- Inter: `@fontsource/inter`, SIL Open Font License.
- Icons: `lucide-react`, ISC License.
- Cryptocurrency logos: `cryptocurrency-icons`, CC0. For assets without a bundled logo, the app uses a labeled monogram fallback.

The corresponding license files are in `public/licenses/`.
