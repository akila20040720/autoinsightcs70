# AutoInsight

AutoInsight is a React + TypeScript single-page experience built with Vite that showcases an AI-first analytics interface for the Sri Lankan vehicle market. The app combines cinematic motion, rich storytelling sections, and practical product flows across Home, Features, About, FAQ, Contact, and 404.

## Live Demo
- Public site: https://info-autoinsight.vercel.app/
- Optimized for modern Chromium-based browsers with hardware acceleration.

## At a Glance
- Motion-forward UX: splash screen, scroll reveals, animated 3D hero, hover lifts, and analytical grid background powered by Framer Motion
- Complete navigation: Home, Features, About, FAQ, Contact, and Not Found routes via React Router
- Theming guardrails: theme preference is set before paint to avoid flashes; light/dark support is ready to extend
- Product storytelling: how-it-works steps, feature grids, testimonials (4.9/5), data-source acknowledgments, and team bios
- Engagement touches: glassmorphic navbar, animated cursor, chatbot entry point, scroll-to-top helper, and responsive layout
- Contact experience: validated form, multiple channels (email, phone, live chat), and animated illustrations

## Architecture and Stack
- React 19 + TypeScript
- Vite 7 (SWC) for fast dev/build
- React Router 7 for client-side routing
- Framer Motion 12 for animation primitives
- Lucide and React Icons for pictograms
- CSS tokens + global animations in a single stylesheet (no CSS frameworks)

## Pages and Content
- Home: animated hero, featured vehicles, how-it-works steps, feature grid, testimonials, data sources, and recent work highlights
- Features: grid of capability cards (AI price prediction, filters, trend charts, geographic view, alerts, comparisons, chatbot)
- About: mission, vision, story timeline, values, and team roster with social links
- FAQ: category filters with animated accordion answers
- Contact: multi-channel cards plus a validated contact form
- Not Found: branded 404 fallbacks

## Project Structure
- src/main.tsx: entry point, theme bootstrap, router mount
- src/App.tsx: layout shell, splash control, navbar/footer, route switch
- src/pages/: Home, Features, About, FAQ, Contact, NotFound
- src/components/: hero, cards, analytics background, chatbot button, cursor, splash, navbar, footer, scroll helper, etc.
- src/styles.css: design tokens, themes, layout primitives, animation utilities
- public/: static assets (logos, images, video). Vehicle imagery on the live demo is served from /Vehicles/*.jpg and can be swapped via public/Vehicles
- data_processing/ and web_scrapping/: offline CSV prep and scraping samples that inform the analytics narrative (respect source site terms)

## Prerequisites
- Node.js 18 or newer
- npm 9+ (bundled with recent Node releases)

## Installation and Local Development
1) Install dependencies: npm install
2) Start dev server with HMR: npm run dev
3) Lint: npm run lint
4) Production build: npm run build
5) Preview built assets locally: npm run preview

## Marketplace Pipeline and API
The production marketplace flow now lives under `autoinsight-frontend/`.

### Frontend
1. `cd autoinsight-frontend/auto-frontend`
2. `npm install`
3. `npm run dev`

### Backend
1. `cd autoinsight-frontend/backend`
2. `python3 -m venv .venv && source .venv/bin/activate`
3. `pip install -r requirements.txt`
4. `python3 server.py`

### Optional environment variables
- `PIPELINE_SOURCE_MODE=scrape|manual|prefer-manual`
- `PIPELINE_SOURCE_JSON=/absolute/path/to/manual_snapshot.json`
- `MODEL_REPORT_PATH=/absolute/path/to/Model_Data_Report.xlsx`
- `ENABLE_PIPELINE_SCHEDULER=true`
- `PIPELINE_REFRESH_INTERVAL_SECONDS=21600`
- `STALE_RETENTION_SECONDS=259200`
- `MONGODB_URI=mongodb://localhost:27017`
- `MONGODB_DATABASE=autoinsight`
- `MONGODB_COLLECTION=vehicle_listings`
- `MONGODB_FAVORITES_COLLECTION=favorites`
- `QUERY_CACHE_TTL_SECONDS=300`
- `OG_IMAGE_CACHE_TTL_SECONDS=21600`

### Data refresh
- Manual refresh: `curl -X POST http://127.0.0.1:5000/api/admin/refresh`
- Scheduled refresh: set `ENABLE_PIPELINE_SCHEDULER=true`
- Missing listings from a new scrape are marked stale immediately and hidden from API responses; stale records are purged after `STALE_RETENTION_SECONDS`.

## NPM Scripts
- npm run dev — start Vite dev server
- npm run lint — run ESLint across the project
- npm run build — type-check (tsc -b) then bundle with Vite
- npm run preview — serve the production build locally

## Development Notes
- Splash screen temporarily disables body scroll; see src/App.tsx for lifecycle handling.
- Theme preference is stored in localStorage and applied before React mounts to reduce flicker.
- Framer Motion variants drive entrances and hovers; reuse patterns to keep motion consistent.
- Routing map lives in src/App.tsx; add new pages there and place components under src/pages.

## Testing and QA
- Run npm run lint before commits to catch common issues.
- Use npm run preview to smoke-test the production bundle.
- Validate responsive states (desktop, tablet, mobile) and dark/light theming if extended.

## Deployment
- Static SPA: host dist on Vercel, Netlify, GitHub Pages, Azure Static Web Apps, or S3/CloudFront.
- Ensure your host rewrites unknown routes to index.html to support client-side routing.

## GitHub Actions CI/CD (Soft Mode)
- Main CI workflow: `.github/workflows/main.yml`
- CI is intentionally non-blocking for lint/build/tests to reduce pipeline breakage while the project is evolving.
- Preview checks are time-limited to avoid hanging workflows.

Optional deploy workflows (they auto-skip when required secrets are missing):
- Backend container deploy: `.github/workflows/backend-appservice-deploy.yml`
	- Required secret: `AZURE_CREDENTIALS`
- Backend Python App Service deploy: `.github/workflows/main_autoinsight-analytics.yml`
	- Required secrets:
		- `AZUREAPPSERVICE_CLIENTID_702B276A3DBE4D45BB5CFCC6396C51E7`
		- `AZUREAPPSERVICE_TENANTID_F0143E00B07A40B4A8302D7BCCFFA016`
		- `AZUREAPPSERVICE_SUBSCRIPTIONID_04CD2EFC83AD4025803BEAFD2FFE387D`
- Frontend Static Web Apps deploy: `.github/workflows/azure-static-web-apps-calm-beach-0445a0100.yml`
	- Required secret: `AZURE_STATIC_WEB_APPS_API_TOKEN_CALM_BEACH_0445A0100`

## Data and Content Credits
- Marketplace and industry acknowledgments: Riyasewana, Patpat.lk, Ikman.lk, and CMTA.
- CSV samples and scripts in data_processing/ and web_scrapping/ are illustrative; comply with each source’s terms of service when collecting or using data.


## Contributing
- Fork, create a feature branch, and open a PR.
- Follow existing patterns: TypeScript types, Framer Motion variants, and CSS tokens in src/styles.css.

## License
- MIT (see LICENSE in the repository root).
