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

## Data and Content Credits
- Marketplace and industry acknowledgments: Riyasewana, Patpat.lk, Ikman.lk, and CMTA.
- CSV samples and scripts in data_processing/ and web_scrapping/ are illustrative; comply with each source’s terms of service when collecting or using data.


## Contributing
- Fork, create a feature branch, and open a PR.
- Follow existing patterns: TypeScript types, Framer Motion variants, and CSS tokens in src/styles.css.

## License
- MIT (see LICENSE in the repository root).
