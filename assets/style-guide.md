# Español con Diana — Style Guide

---

## Brand Essence

Warm, credible, and hand-touched. Diana is an expert who teaches like a friend — the brand should feel like a sun-lit classroom with terracotta walls, not a sterile app or a children's cartoon.

---

## Color

| Token       | Hex       | Role                                         |
|-------------|-----------|----------------------------------------------|
| Paper       | `#FAF6EE` | Default background — never pure white        |
| Ink         | `#1F1A14` | Body text, headings — never pure black       |
| Ochre       | `#C99A3D` | Golden accent: borders, dividers, icons      |
| Terracotta  | `#C4593A` | Primary action: CTAs, links, interactive     |
| Sage        | `#6B8E6B` | Success states, correct-answer badges        |
| Night       | `#2A2540` | Dark surfaces, nav bar, footer, heavy type   |
| Muted       | `#7B736B` | Secondary text, placeholders, meta           |

**Usage rules**

- Terracotta is the one true call-to-action color. Do not use ochre on buttons — it reads as warning.
- Ochre lives in decorative roles: rule lines, icon strokes, the logo ring. It can accent a pull-quote border or a lesson-card corner.
- Sage is reserved for feedback (correct, completed, progress). Never use as a primary accent.
- Night replaces ink when you need maximum contrast on a dark surface; never use pure black.
- Paper replaces white everywhere. White (#FFF) is not in the palette.
- Avoid placing terracotta on night directly — contrast passes AA but reads harsh. Use paper as a buffer.
- Dark mode: swap paper → night, ink → `#EDE8E0`, muted → `#A89F98`. Ochre and terracotta remain unchanged.

---

## Typography

| Role         | Family      | Weight / Style                   | Use case                          |
|--------------|-------------|----------------------------------|-----------------------------------|
| Display      | Fraunces    | 300–700, opsz 144 (optical max)  | H1, hero, pull quotes, logo       |
| Body         | Inter       | 300–600                          | Paragraphs, UI labels, nav        |
| Comic accent | Caveat      | 400–700                          | Handwritten annotations, "con" in logo, sticky notes |
| Data / Mono  | DM Mono     | 300–500                          | Vocabulary tables, IPA, lesson codes |

**Pairing rules**

- Fraunces at large sizes (≥24px) benefits from `letter-spacing: -0.02em` and `font-optical-sizing: auto`. Always set `font-optical-sizing: auto` so the browser uses the `opsz` axis.
- Fraunces italic at display scale is expressive — use sparingly for emphasis, not decoration.
- Caveat should appear brief — one word, a label, a date. Never set a full paragraph in Caveat.
- DM Mono is data-forward. Keep it small (12–14px) and muted in color.
- Never pair Fraunces + Caveat without Inter as a separator. The contrast is too extreme without a neutral middle.

---

## Logo

The mark is a circle containing a rising sun whose horizon is drawn as a tilde — the tilde of the **ñ**, the most distinctly Spanish letter. A minimal "D" arc below the tilde reads as Diana's initial and as an architectural archway.

The wordmark stacks three type voices:
- "Español" in Fraunces — credible, editorial
- "con" in Caveat terracotta — warm, conversational
- "Diana" in Fraunces Night — personal, authoritative

**Logo do / don't**

- Do: use on paper, on night, or on ochre backgrounds.
- Do: use monochrome (all-ink or all-paper) when color is not available.
- Don't: scale below 180px wide — use the icon instead.
- Don't: place on a terracotta or sage background — the wordmark colors conflict.
- Don't: recolor the tilde arc or the sun disc independently.
- Don't: stretch, rotate, or add drop shadows to the mark.

**Minimum clear space**: 0.5× the mark diameter on all sides.

---

## Icon

The icon is the letter **ñ** in Fraunces Night, centered over a rising Ochre sun, framed by a rounded square with an ochre border ring. The tilde of the ñ and the sinuous tilde arch both reinforce the Spanish-language identity.

- 512×512: full color (PWA icon, app store, OG image)
- 32×32 favicon: the ñ glyph remains legible; sun provides color cue
- Monochrome use: flatten to ink on paper; remove the gradient layers

---

## Voice and Tone

**Who Diana is**: a warm, expert Spanish teacher. She explains clearly, encourages without condescending, and brings cultural context naturally.

**Tone spectrum**:
- Lesson content → clear, precise, slightly formal. No slang.
- Navigation / UI labels → minimal, neutral, never cute.
- Feedback / success → warm, specific. "¡Muy bien!" is fine; "Amazing job superstar!" is not.
- Error / correction → gentle, constructive. Never sarcastic.
- Marketing copy → aspirational but grounded. "Begin your Spanish story" not "Unlock the secret to fluency in 7 days."

**Voice constants** (every piece of copy):
- First-person plural ("we" = Diana + student) for lessons; second-person singular ("you") for UI actions.
- Include one cultural anchor per lesson intro — food, geography, a custom, a phrase's history.
- A1 level text should feel clear to a curious adult, not simplified for a child.

---

## Do / Don't Summary

| Do                                             | Don't                                              |
|------------------------------------------------|----------------------------------------------------|
| Use warm, slightly imperfect textures          | Use flat, corporate color blocks                   |
| Let Fraunces carry display hierarchy           | Set body copy in Fraunces                          |
| Use the tilde arch as the brand's signature gesture | Add clip-art sombreros, flags, or maracas     |
| Keep whitespace generous (space-8 minimum)     | Crowd content to maximize above-the-fold           |
| Pair ochre dividers with Fraunces headings     | Use ochre for interactive / CTA elements           |
| Celebrate the Spanish language's visual richness | Use generic "language learning app" conventions  |
| Scale gracefully (SVG everywhere possible)     | Export the logo as a low-res PNG                   |
