# KYPStamping — Brand Guidelines

The mark, palette, and type that every KYPStamping surface is built from. Tokens
live in `packages/ui/src/tokens.css`; the lockup lives in `packages/ui/src/index.tsx`.
Change them there, never per app.

---

## 1. The mark — The Seal Badge

A modernised **selyo**: the scalloped edge of an official stamp, rounded and
simplified rather than stiff and bureaucratic, with a gold ring standing in for a
seal of approval. It borrows the trust signal of an official mark without the
formality — which matters, because a merchant is being asked to hand over their
customer list.

**Geometry** (512 grid, one definition shared by every rendering):

| Element | Spec |
|---|---|
| Scallops | 16 circles, r=40, centres at r=186 from centre |
| Disc | circle, r=190 |
| Seal ring | circle, r=126, stroke 15, amber |
| Monogram | `K`, Sora 700, 160px, paper, baseline y=313 |

**Where each rendering lives**

- `SealMark` in `@kypstamping/ui` — inline SVG, the only mark to use inside the apps.
  Crisp at any size and theme-aware.
- `apps/*/src/app/icon.svg` and `apps/*/public/icon.svg` — favicon.
- `apps/*/public/brand/logo.png` — 512px raster for stores, PWA install, OG.
  Generated with `gpt-image-2` via the `gpt-image-bridge` skill; source in
  `design/generated/logo-seal.png`.

**Rules**

- Clear space on all sides = one scallop (7% of the mark's width). Already baked
  into the PNG's padding.
- Minimum size 24px. Below that the scallops mush — use it anyway, it still reads
  as a dot; do not substitute a different mark.
- On light surfaces: espresso disc, amber ring, paper `K`.
- On dark surfaces (`inverse`): amber disc, espresso `K`, ring at 35% so the
  badge stays a single confident shape.
- Never recolour outside those two states, never add a gradient, drop shadow,
  outline, or rotation.

## 2. Wordmark

`KYP` in amber + `Stamping` in ink, set in **Sora 700**, tracking `-0.02em`, no space.

- Light surfaces use `--accent-strong` for `KYP` (the raw amber fails contrast on paper).
- Dark surfaces use `--accent`.
- Never break the two halves onto separate lines or separate them with a space.

## 3. Lockup

Seal + wordmark + tagline, as rendered by `BrandMark`:

```
[seal]  KYPStamping
        KEEP STAMPING · EARN THE REWARD
```

- Gap between seal and wordmark: 12px (`gap-3`).
- Tagline: mono, 9px, uppercase, tracking `0.14em`, `--muted`. It is part of the
  lockup, not a headline — do not set it in Sora or reuse it as page copy.
- `compact` drops the wordmark and tagline. Use it wherever the app name is
  already on screen (nav rails, mobile chrome).
- "Loyalty, made local." remains the marketing headline. It is the positioning
  line, not the lockup tagline.

## 4. Palette

Three colours carry the brand. Everything else is a neutral derived from them.

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#18120C` | Espresso. Text, the seal disc, dark surfaces. |
| `--paper` | `#FAF8F3` | The page. Never pure white. |
| `--accent` | `#E8A33D` | Amber. Collected stamps, the seal ring, one CTA per view. |

Derived:

| Token | Hex | Use |
|---|---|---|
| `--accent-strong` | `#8F5510` | Amber for **text and focus rings** on paper. Raw amber fails AA there. |
| `--surface` | `#FFFEFB` | Cards lifted off the page. |
| `--surface-2` | `#EEE9E0` | Recessed chips, inactive tracks. |
| `--ink-soft` | `#2C231B` | Secondary headings. |
| `--muted` / `--muted-strong` | `#6F6359` / `#675B51` | Body support, labels. |
| `--line` / `--line-strong` | `#E5DED3` / `#D6CCBF` | Hairlines, dividers. |
| `--success` / `--danger` | `#0F7655` / `#B23B2B` | Status only, never decoration. |

**Rules**

- Amber is an event, not a wash. One amber emphasis per view — a filled stamp, a
  primary button, a live badge. A screen with three amber things has none.
- No hex literals in components. Use the tokens; if a value is missing, add it to
  `tokens.css`.
- Success and danger never carry brand meaning. They report state.

## 5. Typography

| Role | Face | Weights |
|---|---|---|
| Display — wordmark, `h1`–`h3`, stamp monograms | **Sora** | 600, 700 |
| Body, UI, everything else | **Inter** | 400–800 |
| Data, codes, receipts, the lockup tagline | **Geist Mono** (marketing) / system mono | 400–600 |

Sora is wired per app in `layout.tsx` as `--font-display`; `tokens.css` applies it
to `h1`–`h3` and the `.font-display` utility. Do not set `font-family` anywhere else.

**Rules**

- Sora is geometric and wide — headings take relaxed tracking (`-0.02em`), never
  the `-0.04em` a condensed face wants.
- Sora ships 600 and 700 only — 700 is the display ceiling. Inter goes to 800 for
  small UI labels and eyebrows; 900 exists nowhere.
- Uppercase only for eyebrows and the lockup tagline, always with tracking ≥ `0.14em`.

## 6. Shape

One radius scale, defined in `tokens.css`:

| Token | px | Use |
|---|---|---|
| `--radius-md` | 12 | Buttons, tiles |
| `--radius-lg` | 16 | Cards |
| `--radius-xl` | 18 | Sheets, modals |
| `rounded-full` | — | Chips, dots, avatars, stamp slots |

The seal is the only scalloped shape in the system. Do not scallop cards, buttons,
or dividers — the edge is the logo's job.

## 7. The stamp card

The one piece of product UI that is also brand. `StampDots` in `@kypstamping/ui`:

- Collected: filled amber circle, espresso `K` in Sora 700 — a miniature of the seal.
- Empty: dashed hairline circle, no fill. Dashed reads as "not yet", solid reads as "broken".
- Never animate a stamp landing more than once per view.

## 8. Voice

Direct, warm, specific. Sentence case. No exclamation marks, no emoji as icons.
Say "3 more visits to a free drink", not "You're on your way!".
