# Design — kyprewards.com

The locked visual system for the marketing site. Every page edit reads this
before emitting markup. Extend this file when the system needs to grow; do not
re-pick per page. Copy is the spec and is never changed for design reasons.

## Where it comes from

Studied 2026-10-06 from gobalik.com's register (centred heads, pill tags,
alternating bands with arched seams, large rounded panels, soft shadows,
rendered 3D objects, counter photography) and carried onto the KYP tokens.
Nothing of theirs is copied: not colour, not type, not imagery, not copy.

## Genre

Playful-soft. Warm, tactile, rounded. Never childish; emoji never decorate.

## Theme (from `packages/ui/src/tokens.css`, unchanged)

- Paper `--paper` #faf8f3 · surface `--surface` #fffefb
- Ink `--ink` #18120c · amber `--accent` #e8a33d · amber text `--accent-strong`
- Marketing-only (in `globals.css`): `--band` amber 7 % on paper, `--band-deep`
  13 %, `--radius-panel` 32px, `--shadow-soft`, `--shadow-lift`, `--seam` 4.5rem.
- Amber on paper is for fills and icons only; amber *text* on paper is always
  `--accent-strong`. Headline emphasis word uses `--accent-strong`.

## Typography (unchanged)

Sora 700 for display (the only weight the brand allows above 600), Inter for body, Geist Mono for tiny labels.
Display tracking −0.03em, hero −0.035em. Headers are always roman.

## Page rhythm

1. Hero on paper, centred: pill, headline, lede, two buttons, trust line,
   then the hero scene. Bottom padding `pad-seam`.
2. Sections alternate paper and `.band`. A section that follows a band starts
   with `.seam-top` (paper) or `.seam-top-band` (band) so it arches over the
   one before. Give the arched section `pt-24 lg:pt-32`.
3. Every section head is centred: `SiteEyebrow` pill, then `h2` at
   `text-4xl sm:text-5xl`, then an optional lede at `max-w-[60ch]`.
   Left-aligned heads are allowed inside two-column sections (Field notes).
4. Cards and dark blocks are `.panel` (32px) with `.shadow-soft`; a dark hero
   panel or the CTA uses `.shadow-lift`. Hairline border `--line` on light cards.
5. Buttons are `SiteButton`: pill, `min-h-13`, `px-7`, arrow on the right.
   Dark is primary, accent is primary on dark grounds, outline is secondary.

## Imagery

- Objects: `public/images/obj-*.webp`, 800px square, generated with
  gpt-image-2. Brief: soft 3D render, Apple-emoji material, transparent PNG,
  espresso + amber + cream only, no text, single centred subject.
  Use at 112–300px, `.drift` or `.drift-late` for a slow float.
- Photos: `public/images/photo-*.webp`, counters and shopfronts, warm light,
  no readable text. Always behind an ink gradient when copy sits on them.
- Never draw browser chrome, phone frames or fake windows around a mockup.
- No testimonials, logos, merchant counts or invented metrics anywhere.

## Motion

`--ease-out` cubic-bezier(0.16, 1, 0.3, 1). Hover lifts of 2–4px on cards and
buttons. Objects drift 7px over 7–8.5s. `prefers-reduced-motion` collapses all
of it (globals.css).

## Nav and footer

Header: wordmark, pill links, sign-in text link, pill CTA; translucent paper.
Footer: warm band, brand card with two fact pills, six link columns, one-line
colophon. Legal links stay in their own column.
