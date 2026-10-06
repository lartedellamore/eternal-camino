# Peregrina — Base44 app

A travel companion: colour-in world map, live currency converter, phrases with audio, plug & voltage advice,
history / politics / arts / love languages for 32 countries, 197 country pages (33 highlights + 33 fun facts + full language guides for 32 of them),
and "The Tenth" — 10% to humanitarian organisations.

## Live on GitHub Pages

Every push to `main` builds the app and publishes it with GitHub Actions
(`.github/workflows/pages.yml`). One-time setup: repository **Settings → Pages → Source: GitHub Actions**.
Your map and giving log are kept in each visitor's browser; add Base44 (below) for accounts and sync.

## Optional: Base44 backend (accounts + sync)

Open Terminal in this folder, then:

    npm install
    npx base44 login                      # opens your browser — approve
    npx base44 link --create --name Peregrina
    npx base44 deploy -y                  # pushes the Visit + GivingEntry entities and the site

Then copy the app ID from base44/.app.jsonc into a new file `.env.local`:

    VITE_BASE44_APP_ID=<your app id>

and deploy once more (`npm run build && npx base44 deploy -y`) so sign-in and sync switch on.

## Develop

    npm run dev

Content lives in `src/data/countries.json` (country guides) and `src/data/rosary.js` (prayers).
