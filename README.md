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

| Token        | Hex      | Notes                                    |
|--------------|----------|------------------------------------------|
| `honey-500`  | `#D6912C` | primary brand color                       |
| `honey-100`  | `#FBEFD2` | hero / soft surfaces                      |
| `honey-800`  | `#5E3B14` | secondary text + warm dark                |
| `cream`      | `#FAF5EA` | app background                            |
| `walnut`     | `#2C1B0E` | primary text + grounded surfaces          |
| `moss`       | `#5C6E4F` | accent — used sparingly                   |

Tailwind classes available everywhere via NativeWind: `bg-honey-100`,
`text-walnut`, `border-honey-200`, etc.

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the phased delivery plan.

## Hosting

- **Mobile** — built + submitted via Expo's EAS Build (Phase 9).
- **Web** — `npx expo export -p web` → static export deployable to
  Vercel / Netlify / Cloudflare Pages.
