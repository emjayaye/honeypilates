# 🍯 Honey Pilates

Booking app + studio website for **Honey Pilates** — one codebase
shipping to **iOS App Store**, **Google Play**, and the **web**.

## Stack

- **Expo SDK 54** (React Native 0.81, React 19, Expo Router 6 file-based routing)
- **TypeScript**
- **NativeWind v4** (Tailwind CSS for React Native + web)
- **Supabase** — auth, Postgres, storage, edge functions
- **Stripe** (Phase 4) — packages, memberships, in-app payments

## Quick start

```bash
# Install
npm install

# Copy env template and fill in your Supabase keys
cp .env.example .env

# Run on web
npm run web

# Run on iOS simulator (macOS only)
npm run ios

# Run on Android emulator
npm run android

# Or open Expo Go on your phone and scan the QR code
npm start
```

## Project layout

```
app/                 file-based routes (Expo Router)
  (tabs)/            tab-bar routes
    index.tsx        Home (landing)
    schedule.tsx     Schedule + booking (Phase 3)
    membership.tsx   Packages + plans (Phase 4)
    account.tsx      Auth + profile (Phase 2)
  _layout.tsx        Root layout — loads NativeWind global.css
components/          shared UI primitives
lib/
  supabase.ts        Supabase client (auth + DB)
constants/           legacy theme tokens from the template (will retire)
hooks/               useColorScheme etc.
assets/              fonts + images
global.css           Tailwind directives loaded by metro/NativeWind
tailwind.config.js   honey palette + font tokens
ROADMAP.md           phased delivery plan
```

## Brand tokens

Lifted from honeypilates.com (Duda site) — five-color luxe-boutique palette.

| Token        | Hex      | Notes                                    |
|--------------|----------|------------------------------------------|
| `ink`        | `#1F1F1F` | primary text / charcoal CTAs              |
| `sage`       | `#777C75` | secondary text / warm gray                |
| `white`      | `#FFFFFF` | inverse copy                              |
| `cream`      | `#F1E8DD` | page background                           |
| `peach`      | `#EBC3A1` | primary accent / feature bands            |
| `peach-50/200/400/700` | derived | hover, pressed, disabled tints   |

**Type pairing:** `font-display` (Fahkwang 400/500/600) for elegant
headings; `font-body` (DM Sans 400/500/600) for everything else.

Tailwind via NativeWind: `bg-cream`, `text-ink`, `font-display`,
`tracking-[0.32em]`, etc.

## Accessibility

This project targets **WCAG 2.1 Level AA** for ADA Title III compliance.
See [ACCESSIBILITY.md](ACCESSIBILITY.md) for the standard, the
approved color tokens, the PR checklist, and the tooling we use.

Every interactive element ships with `accessibilityRole` +
`accessibilityLabel`. Every page has a skip-to-main-content link,
keyboard focus rings, reduced-motion handling, and verified color
contrast on all body text.

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the phased delivery plan.

## Hosting

- **Mobile** — built + submitted via Expo's EAS Build (Phase 9).
- **Web** — `npx expo export -p web` → static export deployable to
  Vercel / Netlify / Cloudflare Pages.
