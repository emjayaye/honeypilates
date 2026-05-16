# Honey Pilates — Accessibility Standard

**Target:** WCAG 2.1 Level AA on web. Equivalent treatment on iOS / Android.

The US ADA Title III is enforced against commercial websites under WCAG
2.1 AA as the de facto bar. Every PR that touches user-facing UI must
keep this doc satisfied. If you're adding a new screen, new
interactive element, or new image, run the checklist at the bottom.

---

## 1 · Color & contrast

All text must clear **4.5:1** against its background (normal text) or
**3:1** (large text — 18pt+, or 14pt+ bold). Use the approved tokens:

| Use case                              | Token         | Hex       | Ratio on cream `#F1E8DD` |
|---------------------------------------|---------------|-----------|--------------------------|
| Body copy, paragraphs                 | `text-ink`    | `#1F1F1F` | 13.5 : 1 ✅ AAA          |
| Secondary copy (eyebrow, meta, hint)  | `text-ink-2`  | `#535350` | 5.0 : 1  ✅ AA           |
| Decorative tints (background washes)  | `bg-sage`     | `#777C75` | 3.06 : 1 ❌ text-NEVER    |
| Inverse on dark surface               | `text-cream`  | `#F1E8DD` | 13.5 : 1 on `bg-ink` ✅  |

**The live honeypilates.com Duda site uses `#777C75` for body copy.
That fails AA. Do not copy that decision into the app.** Use
`text-ink-2` for any text that needs to be read.

For peach (`#EBC3A1`) backgrounds, only use `text-ink` (8.9:1) or
`text-ink-2` (4.5:1 — borderline; prefer `text-ink`).

---

## 2 · Interactive elements

Every `<Pressable>`, `<TouchableOpacity>`, `<Link>` etc. that the user
can activate must include all three:

```tsx
<Pressable
  accessibilityRole="link"           // or "button" / "tab" / "checkbox" / "switch"
  accessibilityLabel="Book a class"  // short, action-oriented, no "click here"
  accessibilityHint="Opens the schedule"  // optional, only if not obvious
>
```

- **`accessibilityRole`** maps to the right ARIA role on web + the
  right OS-level role on native screen readers.
- **`accessibilityLabel`** is the announced name. Required if the
  visible label is ambiguous, icon-only, or composed of multiple
  Text nodes.
- **`accessibilityHint`** describes what happens *after* activation.
  Optional — keep it terse and only include when the action isn't
  obvious from the label.

**Touch targets** must be ≥ **44 × 44 pt** (WCAG 2.5.5 + iOS HIG).
For text links inside paragraphs, add `py-3 -my-3` to pad the hit
area without affecting layout.

---

## 3 · Headings & landmarks

Use `accessibilityRole="header"` plus `aria-level={n}` for every
heading. Each route has exactly ONE `aria-level={1}` — the page
title. Section headings start at `aria-level={2}` and nest deeper as
needed. The web root wraps everything in a `<main id="main-content">`
landmark via the `<MainLandmark>` component so the skip-link works.

---

## 4 · Images

- **Meaningful images** (photo of a class, instructor portrait):
  `accessibilityLabel="<descriptive alt>"` on the parent Pressable.
- **Decorative images / icons** (hairline dividers, button icons that
  duplicate a text label): `accessibilityElementsHidden` +
  `importantForAccessibility="no"`. They will not be announced.
- The `<ClassGallery>` component announces each card as
  *"{label}. {blurb}. {alt}."* so a screen-reader user gets the same
  info a sighted user gets from the photo + caption.

---

## 5 · Focus

Web focus rings are styled in `global.css` and appear only on
`:focus-visible` (keyboard, not mouse). They render as a 2px ink
outline with a soft peach glow — high-contrast, brand-aligned.

- **Skip-to-main-content** link is the first focusable element on
  every page. Activated by Tab from the address bar. Implemented in
  `components/skip-link.tsx`.
- Never call `outline: none` without providing an equivalent. The
  base reset uses `:focus-visible` to keep mouse interactions clean
  but preserve keyboard rings.
- Modals (when added) must trap focus and restore it on close. Use
  a focus-trap library or React Aria's `useFocusTrap`.

---

## 6 · Motion

Any animation longer than ~250ms must respect the user's
`prefers-reduced-motion` setting. `global.css` already cancels
animation + transition durations and forces instant scroll for users
who request it. Don't override this with inline `style.transition`
values that ignore the media query.

---

## 7 · Forms (Phase 2+ checklist)

Every form input:
- Has an associated `<Text>` label or `accessibilityLabel`
- Has `accessibilityHint` describing the expected format if non-obvious
- Surfaces error text as a sibling with `accessibilityLiveRegion="polite"`
- Has visible error state that doesn't rely on color alone (icon + text)

---

## 8 · Language

`<html lang="en">` is set by `app/_layout.tsx`. If we add localized
content, swap to a `useLocale()` hook and update the attribute on
locale change.

---

## 9 · PR checklist (paste into your PR description)

```
ACCESSIBILITY
[ ] All new text uses `text-ink` or `text-ink-2` — no `text-sage` for copy
[ ] Every new Pressable/Link has accessibilityRole + accessibilityLabel
[ ] New headings have accessibilityRole="header" + aria-level
[ ] New images have descriptive labels OR are marked decorative
[ ] Touch targets ≥ 44pt
[ ] No new outline:none without focus-visible replacement
[ ] Animation respects prefers-reduced-motion
[ ] Manually ran axe DevTools on the affected pages — zero violations
[ ] Tested with VoiceOver (iOS / macOS) or TalkBack (Android)
```

---

## 10 · Tooling

- **axe DevTools** — Chrome / Firefox extension. Run on every page,
  fix every violation before merge.
- **Lighthouse → Accessibility** — automated score, target ≥ 95.
- **VoiceOver (macOS)** — `Cmd + F5` to toggle. Tab through the app,
  verify announcements make sense.
- **Keyboard-only** — unplug the mouse, navigate the whole app, fix
  anything you can't reach or activate.
- **High Contrast / forced-colors** — test on Windows with the
  high-contrast theme enabled.

---

## What this protects against

The pattern of demand letters under ADA Title III centers on:

- Images without alt text → covered by §4
- Form fields without labels → covered by §7
- Insufficient contrast → covered by §1
- Inaccessible buttons / no keyboard nav → covered by §2 + §5
- No skip link / no landmarks → covered by §3 + §5
- Auto-playing motion / no reduce-motion → covered by §6

If a plaintiff's expert can show any of those, you can be on the
hook for $5k–$25k+ in settlements. Maintaining this standard is
significantly cheaper than litigating it once.
