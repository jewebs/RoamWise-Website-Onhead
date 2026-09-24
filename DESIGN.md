# DESIGN.md — John Transfer

Design system for the landing page. Tailwind CSS v4, tokens declared in `src/input.css` under `@theme`.

## Scene

A traveller landing at Dublin Airport at 06:40, phone in one hand, luggage in the other, deciding in under a minute whether a stranger's car is a safe bet.

That scene sets the job: reassurance rather than browsing, read on a phone, in transit. **Light.** A warm off-white surface reads as a price list you can trust in daylight, and it keeps the photography as the only dark mass on the page, so every banner and tour card lands as a deliberate image rather than more of the same background.

## Color

**Strategy: committed.** Warm off-white carries the whole surface. Amber is the single action color and appears only on things you can act on. If something is amber and not clickable, it is a bug.

| Token | OKLCH | Role |
|---|---|---|
| `--color-surface` | `oklch(0.98 0.004 250)` | page background |
| `--color-raised` | `oklch(0.995 0.003 250)` | panels, form, tab track |
| `--color-sunken` | `oklch(0.95 0.006 250)` | footer, inset wells, input fills |
| `--color-line` | `oklch(0.88 0.010 250)` | structural hairlines and dividers (decorative) |
| `--color-field` | `oklch(0.62 0.014 250)` | bordered buttons, tab track, field hover and focus |
| `--color-field-soft` | `oklch(0.80 0.010 250)` | resting boundary of a text-entry field |
| `--color-ink` | `oklch(0.22 0.018 250)` | primary text |
| `--color-muted` | `oklch(0.44 0.016 250)` | secondary text |
| `--color-faint` | `oklch(0.50 0.016 250)` | form labels, helper text, metadata |
| `--color-on-image` | `oklch(0.98 0.005 250)` | text sitting on a scrimmed photograph |
| `--color-accent` | `#92ff60` | Verde claro fills: CTAs, active tab, logo mark |
| `--color-accent-hi` | `#276120` | Verde médio: fill hover |
| `--color-accent-ink` | `#113b29` | Verde escuro: text on light green fills |
| `--color-accent-deep` | `#113b29` | Verde escuro: green as text, prices, eyebrows, focus ring |
| `--color-danger` | `oklch(0.52 0.170 25)` | validation errors |
| `--color-ok` | `oklch(0.50 0.115 155)` | success state |

Rules:
- Never `#000` or `#fff`. Every neutral is tinted toward hue 250.
- Chroma stays low near the lightness extremes. `--color-ink` sits at 0.018 chroma for a reason.
- Amber budget: CTAs, price figures, focus rings, the active tab indicator. Nothing else.
- **Two ambers, and the difference matters.** `--color-accent` is a fill and only ever carries `--color-accent-ink` on top (9.13:1). `--color-accent-deep` is the text and icon amber, dark enough to clear 4.5:1 on every page surface (5.39:1 worst case). Bright amber as text on a light surface is 1.80:1, so it is only allowed over a scrimmed photograph. Never swap the two.
- **Three border tokens, and the differences matter.** `--color-line` is decorative and deliberately below the 3:1 floor: dividers, section rules, card outlines. `--color-field` holds 3:1 or better against every surface it lands on, per WCAG 1.4.11, and carries bordered buttons, the tab track, and the hover and focus state of every text-entry field. `--color-field-soft` is the resting boundary of a text-entry field only. Never use `--color-line` on a control, and never use either field token on a plain divider.
- **`--color-field-soft` is a documented deviation from WCAG 1.4.11.** It sits at 1.76:1 on `--color-surface`, under the 3:1 non-text floor, and it is deliberate. With the fill removed from the fields, a 3:1 outline drawn around eleven of them turned the booking form back into the stack of grey boxes the fill removal was meant to fix, and the ceiling for 3:1 on this surface is L 0.654, so there is no lighter value that still passes. The mitigations are structural rather than cosmetic: every field carries a permanently visible label above it, hover and focus escalate the border to `--color-field` at 3.44:1, error state escalates it to `--color-danger`, and the focus ring is never suppressed. Buttons keep `--color-field` because there the border is the entire affordance and nothing else marks the control. Revisit if the surface ever darkens.
- Contrast floor 4.5:1 for every piece of text on the page, including form labels and helper text. Verified worst case: `--color-faint` on `--color-sunken` at 5.18:1. Any change to `--color-faint`, `--color-sunken` or `--color-field` must be re-checked against that floor.
- **Text over photography never uses page tokens.** The scrim keeps those areas dark whatever the page theme does, so headline, body and metadata there use `--color-on-image` (and its opacity steps) plus bright `--color-accent`. `text-ink` over a photo is a bug.

## Typography

| Role | Family | Treatment |
|---|---|---|
| Display | Archivo (variable) | uppercase, condensed width, weight 700-800, tracking tightened to -0.02em |
| Section head | Archivo | uppercase, weight 700, smaller optical tracking |

The `h1, h2, h3` base rule only reaches real heading tags. Anything else carrying the display voice (route titles, nav shortcuts, list heads, all of which are `<p>` or `<span>` for document-outline reasons) uses the `display-head` utility, which mirrors that rule: family, 82% width, weight 700, uppercase. `font-display` on its own renders at normal width and weight and will drift from the heading beside it.
| Body / UI | Inter (variable) | weight 400-600, normal case |
| Numerals | Inter | `font-variant-numeric: tabular-nums` on all prices, durations and times |

Both self-hosted as woff2 with `font-display: swap`. No external font requests: the page must render fully from the filesystem.

Scale, ratio ≥ 1.25, fluid via `clamp()`:

| Step | Size |
|---|---|
| display | `clamp(2.75rem, 9vw, 7rem)` |
| h2 | `clamp(1.75rem, 4vw, 3rem)` |
| h3 | `clamp(1.25rem, 2vw, 1.5rem)` |
| body-lg | `1.125rem` |
| body | `1rem` |
| small | `0.875rem` |
| label | `0.75rem`, uppercase, tracking `0.12em` |

Body copy capped at 68ch. The display headline may break across lines but never below 3 words per line on desktop.

## Layout

- Page gutter: `1.25rem` mobile, `2rem` tablet, `4rem` desktop. Content max width `80rem`.
- Section rhythm is deliberately uneven. Transfers and tours breathe wider than the trust section, which is deliberately tight and text-led.
- The hero banner is full bleed: no gutter, no radius, the photograph runs the full width of the viewport and starts directly under the nav. Its text column is still capped at the `80rem` content width and carries the page gutter itself. The quote bar sits back inside the gutter and overlaps the banner's bottom edge by roughly half its height.
- The hero scrim is tuned so the road is still legible: `0.70` at the bottom, `0.30` at the midpoint, `0.45` at the top. Any darker and the banner reads as flat grey.
- Radii: `1.5rem` for section panels and tour cards, `1rem` (`--radius-field`) for inputs and notices, `1rem` (`--radius-inner`) for anything inset by `0.5rem` inside a panel so the corners stay concentric, `999px` for pills and the nav. The hero banner is the one square-cornered element on the page. `--radius-field` and `--radius-inner` share a value and keep separate names: one is a control shape, the other is concentric arithmetic, and they would drift apart if the panel radius ever moved.
- Every operable control is one height, `--spacing-control` (`3rem`). A select, a date field and a button on the same row line up without per-element nudging.
- Do not wrap everything in a container. The trust section and the footer sit directly on the surface.

## Components

**Nav.** `position: fixed`, overlaying the hero photograph rather than sitting on a band of surface colour above it. Two states, both drawn in `.nav-shell`:

- **At the top:** no chrome at all. No fill, no hairline, no blur. Logo and links in `--color-on-image`, the logo dot in bright `--color-accent`. A floating pill needs something to float over, and at scroll zero there is only the photograph.
- **Past 16px:** the pill fades in over 300ms. Hairline `--color-line/70`, `--color-sunken/90` fill, 6px blur, text back to `--color-ink` and `--color-muted`.

The bare state is scoped to `.js`, so a page whose script never runs keeps the readable pill instead of white links on a light surface. The hero's top padding clears the bar, which is no longer in the flow.

Mobile drops it and uses a fixed bottom bar with the briefing's three shortcuts: Transfers, Tours, Chat. The bottom bar is a real navigation landmark, not decoration.

**Buttons.** Primary is amber fill with `--color-accent-ink` text. Secondary is a hairline outline on transparent. Both `999px` radius, minimum touch target 44px. Focus ring is a 2px `--color-accent-deep` outline with a 2px offset, never removed: the fill amber is too light to be seen against the page.

**Quote bar.** One ruled strip, not three boxed inputs inside a fourth box. The panel border is the only boundary; segments are divided by the same `--color-line` hairlines the transfer list uses. Each control is bare (`bare-control`: no border, no fill, no padding) and the segment around it carries the label, the hit area and the focus tint. The submit button is a full-height amber block terminating the strip. Selects always show a chevron: `appearance-none` without one leaves a dropdown looking like a text field.

**Transfer rows.** Not cards. A route list: origin, arrow, destination, then capacity and price right-aligned, separated by hairlines. Reads like a price list, which is exactly the trust signal we want.

**Shortcut row.** Three ruled columns sitting directly on the surface: icon, display title, one line of detail, arrow. Not cards, no icon chips, no borders of their own. Same hairline language as the transfer list, so the page reads as one index.

**Tour cards.** Photo-led, varied heights, duration and price as a metadata line. Distinct in structure from transfer rows on purpose.

**Trust items.** Text-led, no icon squares, no equal-sized boxes.

**Form.** Single column on mobile, two on desktop. Labels always visible, never placeholder-only. Inline error text under the field, `aria-describedby` wired, `aria-invalid` on the field.

**Date and time entry.** Not native `type="date"` or `type="time"`. Those cannot be typed into reliably: WebKit renders the digits and reports `value === ""` with `validity.badInput` set, and Chrome does the same for a time whose AM/PM segment was never filled, so the form said "Pick the day you travel." underneath a field plainly showing a date. Verified in all three engines.

What a person types into is a plain text field that `main.js` parses. A hidden input alongside carries the canonical value, so `FormData` keeps yielding an ISO date and a 24-hour time and nothing downstream needed to know.

**Calendar.** Drawn in the DOM, not handed to the browser. `showPicker()` was tried first and failed twice over: it renders in the operating system's locale, which put `ago. de 2026` on an English-only page, and its dismissal is browser chrome that nothing on the page can reach, observe or test, so it sat open after a date was chosen. The replacement is ordinary markup, so it speaks the page's language, uses the page's tokens, and every open, close and keypress is drivable in a test.

It floats, so its boundary is `--color-field` rather than a hairline, and it carries no shadow because the page has none. Monday-first, since the audience is in Ireland. Today gets an inset ring rather than a fill, so it never competes with the selection, which takes the amber. Days outside the two-year window are disabled and a month arrow that leads nowhere selectable is disabled with them. It closes on pick, Escape, an outside pointerdown, Tab out, or a second press of the trigger, and returns focus to the trigger on the paths where the reader is still there to receive it. Arrow keys move a day, PageUp and PageDown a month, Home and End the week; only the cursor day is tabbable. It drops below the field and flips above when the last week would land under the fold or behind the fixed mobile bar.

**Pickup time has no picker.** Typing covers it, `hh:mm` states the format, and a clock popover would add a second bespoke widget to save four keystrokes.

The parser takes `22/08/2026`, `22-8-26`, `2026-08-22`, `22 aug`, `aug 22 2026` for dates and `06:40`, `0640`, `640`, `6.40`, `6pm`, `6:40 pm` for times. Bare numeric dates read day first, the Irish order, and fall back to month first only when that gives an impossible month, so an American typing `08/22/2026` is understood rather than told off. Blur echoes back what was understood, `22 aug` visibly becoming `22/08/2026`, so a misreading is caught at the field and not inside the WhatsApp message where nobody would look for it.

Placeholders are `dd/mm/yyyy` and `hh:mm`, never a sample value like `22/08/2026`. A realistic sample is indistinguishable from a filled field at a glance, which invites a hurried reader to skip it.

**Validation timing.** A field is accused on blur and never while it is being typed into. Clearing is the opposite: delegated to the form, and any input or change anywhere in it re-runs the rule on every field currently showing a message. Per-field listeners are not enough, because a date or time input holds `""` until its last segment is filled and a value set from script (the hero quote bar, a Book button) fires no event at all. Both used to leave "Pick the day you travel." sitting under a field plainly showing a date. Empty and malformed are different mistakes and get different sentences; telling someone who has typed nothing that their email does not look right reads as a bug in the form.

**Fields.** One class, `.field`, on every input, select and textarea. No fill: the form column already sits on `--color-raised`, and a sunken grey rectangle inside it made eleven fields read as eleven grey slabs rather than as one form. With the fill gone the border is the only boundary, so the border is what escalates: `--color-field-soft` at rest, `--color-field` under the pointer or the caret, `--color-danger` when the field has failed. `.field-select` adds `appearance: none` and the right padding for the chevron; a select without a visible chevron is a text field as far as the reader is concerned, so every one of them carries the same absolutely-positioned icon.

**Booking outcome.** Success replaces the form rather than sitting above it. An eleven-field form left standing under a confirmation invites a second submit, and on a phone the notice is off screen by the time the reader looks up. The panel reads the request back as a hairline `<dl>` (service, when, passengers, pickup, drop-off) before offering any action, because a traveller who has just typed a pickup address on a phone wants to see it repeated, not a tick and a thank-you, and it is the last chance to catch a wrong date. Focus moves into the panel on success. The only inline notice left inside the form is the validation summary, in `--color-danger` on a 5% tint of itself.

**Submit.** There is no backend. The form composes the whole request as a WhatsApp message and opens it, so the button says `Send request on WhatsApp` and the helper text under it says the same thing again. The confirmation never claims the message was sent, because the reader still has to press send in WhatsApp; it says the message is written and waiting. A blocked popup is a state, not a failure: the panel still appears and its lead line changes to say so.

**Tabs.** City selector uses roving tabindex, arrow keys move, `aria-selected` reflects state, panels wired with `aria-controls`.

## Motion

- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo). No bounce, no elastic.
- Durations: 150ms for hover and focus, 400ms for reveals, 250ms for tab panel changes.
- Only `transform` and `opacity` animate. Never layout properties.
- One reveal-on-scroll pass via `IntersectionObserver`, fired once per element.
- Everything above is fully disabled under `prefers-reduced-motion: reduce`.

## Bans

Match and refuse. Gradient text. Side-stripe borders. Decorative glassmorphism. The hero-metric template. Identical repeated card grids. Modal as a first thought. Em dashes in copy.

## Canonical content

Transfers, 4 seater only. There is no 8-seater in this product.

| City | Route | Price |
|---|---|---|
| Dublin | Airport → City Centre | €84.90 |
| Dublin | City Centre → Airport | €64.90 |
| Cork | Airport → City Centre | €49.90 |
| Cork | City Centre → Airport | €49.90 |
| Belfast | Airport → City Centre | €64.90 |
| Belfast | City Centre → Airport | €64.90 |

Tours, all departing Dublin.

| Tour | Duration | Price |
|---|---|---|
| Dublin Personal Photography Walking Tour | 2 hr | €159.90 |
| Private Tour: Cliffs of Moher & Galway | 12 hr 30 min | From €790 |
| Private Tour: Belfast, Titanic & Giants | 13 hr | From €840 |
| Dublin: Private Chauffeur Tour | 4 hr | From €540 |
| Wicklow & Glendalough Private Day Tour | 7 hr | From €630 |

Contact: `+353 89 479 1366`, WhatsApp and phone, 24×7.
