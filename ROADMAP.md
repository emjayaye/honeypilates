# Honey Pilates — Delivery Roadmap

Phased build for a full studio platform shipping iOS / Android / Web.
Each phase is a self-contained slice that can deploy independently.

---

## ✅ Phase 0 — Scaffold

- [x] `create-expo-app` with TypeScript + Expo Router
- [x] Install Supabase client + AsyncStorage + URL polyfill
- [x] Install NativeWind + Tailwind + reanimated + SVG
- [x] Tailwind config with honey palette
- [x] `lib/supabase.ts` client with env-var loading
- [x] `.env.example` + `.gitignore` covers secrets
- [x] Tab bar: Home / Schedule / Membership / Account
- [x] Honey-branded landing screen
- [x] Bundle identifiers set: `com.honeypilates.app`
- [x] First git commit

---

## Phase 1 — Marketing surface

- Hero polish — real photography or art-direction placeholder
- Studio location, hours, contact form, map
- Instructor bios page
- Class types explainer (reformer, mat, prenatal, etc.)
- Pricing page mirroring the membership tiers
- Web SEO: title tags, OG image, sitemap

## Phase 2 — Auth

- Supabase email sign-up + sign-in
- Sign in with Apple (required for iOS app review)
- Sign in with Google
- Magic link option for low-friction returns
- Profile screen: name, photo, emergency contact
- Sign-out + delete-account (required for app review)

## Phase 3 — Schedule + booking

- `classes` + `class_sessions` + `reservations` tables
- Week-view calendar (`react-native-calendars`)
- Class detail: instructor, type, seats remaining, description
- Reserve / cancel actions
- Waitlist with auto-promote on cancel
- Booking confirmation push + email

## Phase 4 — Packages + memberships

- `packages` (5-pack, 10-pack, intro month) and `memberships`
  (monthly unlimited) tables
- Stripe integration via Expo's `@stripe/stripe-react-native`
- Web: Stripe Elements
- Edge function for checkout sessions + webhook handler
- "Your balance" in account screen — remaining class credits

## Phase 5 — Waivers + e-sign

- Waiver template stored in `legal_documents` (versioned)
- First-reservation gate: must accept before booking confirmed
- Signature capture (canvas)
- Stored signature + IP + version timestamp

## Phase 6 — Instructor portal

- Role-gated routes (`role: 'instructor'`)
- Own schedule view
- Class roster: attendee names, contact, notes
- Cancel class action (notifies all attendees)

## Phase 7 — Admin tools

- Manage instructors (invite, deactivate)
- Manage class catalog (types, durations, default capacity)
- Schedule templates ("Mondays at 9am — Reformer Flow with Alex")
- Manage packages + pricing
- Refund flow

## Phase 8 — Push notifications

- Expo Notifications setup
- Booking confirmation
- 24h reminder
- Class cancelled by instructor
- Waitlist promotion
- Settings: opt-in per category

## Phase 9 — App store submissions

- EAS Build production builds
- TestFlight internal track
- Play Console internal track
- Store listings (screenshots, description, privacy policy URL)
- Privacy policy + terms hosted on the web build
- Submit for review
