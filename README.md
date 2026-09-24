# John Transfer

Static landing page for John Transfer, a licensed private driver running airport transfers in
Dublin, Cork and Belfast and private day tours across Ireland.

One page, no framework, no server. Open `index.html` and it works.

## Run it

The site is plain HTML, CSS and JavaScript. `dist/styles.css` is committed, so the folder can be
dropped onto any static host, or opened straight from the filesystem, with no build step.

You only need Node if you want to change the styles:

```bash
npm install
npm run dev     # rebuild dist/styles.css on every change
npm run build   # minified production build
npm run serve   # optional local web server
```

Tailwind CSS v4. Design tokens live in the `@theme` block in `src/input.css`, not in a JS config
file.

## Layout

```
index.html          the page
src/input.css       tokens, font faces, base styles
src/main.js         tabs, form validation, reveal on scroll
dist/styles.css     built output, committed on purpose
assets/img/         photography (see CREDITS.md)
assets/fonts/       self-hosted Archivo + Inter (see FONTS.md)
PRODUCT.md          who this is for, tone, anti-references
DESIGN.md           colour, type, components, the rules behind them
```

## How the booking form delivers

There is no backend and no form endpoint. A valid submission composes the whole request as a
WhatsApp message and opens it, then the form is replaced by a confirmation panel that reads the
request back and offers to reopen WhatsApp or call.

The wording is deliberate. The page never says the request was sent, because it was not: the
message is written and waiting, and the reader still has to press send in WhatsApp. A popup
blocker is handled as a state rather than a failure, and the panel says so and gives the link.

This suits a one-driver operation better than email. John already answers WhatsApp all day, there
is no deliverability to babysit, no spam folder to lose a 05:00 airport run in, and no key or
service to keep alive. It is also what PRODUCT.md asks for: the booking is a conversation, not a
checkout.

Everything travels with the message: service, name, email, phone, date, time, passengers, pickup,
drop-off, flight number, bag count and notes. John never has to ask a follow-up for something that
was already on the form.

The single constant is `WHATSAPP_URL` at the top of `src/main.js`.

## One thing still open

### Two photographs must be replaced before launch

The landscape photography is of real places John drives to and can stay. Two images are stock
standing in for assets that need to be real:

- `assets/img/transfer-car-*` should be John's actual vehicle.
- `assets/img/tour-chauffeur-*` should be John's car on a real road, or John at arrivals.

A generic stock car is the fastest way for a visitor to decide the operator is not real, which is
the opposite of what this page exists to do. Details and exact dimensions are in
`assets/img/CREDITS.md`.

## What was verified, and what was not

Verified in this build:

- Tailwind builds clean; `node --check` passes on `src/main.js`.
- No horizontal overflow at 375, 768, 1280 or 1920 px (`scrollWidth == clientWidth` at each).
- City tabs: click, `aria-selected`, roving tabindex, arrow keys, Home/End, wraparound.
- Booking flow: every "Book" button prefills the form and scrolls to it.
- Validation: empty submit blocked with per-field errors, malformed email rejected, valid email
  accepted, past date rejected, date `min` pinned to today, passengers capped at 4.
- Valid submission reaches the "not connected" state and offers the WhatsApp fallback.
- Reveal animations fire for elements in view, and `prefers-reduced-motion: reduce` skips them
  entirely.
- With JavaScript disabled nothing is hidden: the hidden state is scoped to a `.js` class set by an
  inline script, so a JS failure cannot leave the page blank.
- Contrast computed from the OKLCH tokens: every text pair is at least 4.5:1 (worst case 5.29:1),
  and every interactive border is at least 3:1 (worst case 3.39:1).
- Content matches the briefing: six transfer routes, five tours, prices and durations exact,
  4 seater only, no 8-seater anywhere.

Not verified, and worth a human pass:

- **Scroll-triggered reveal in a real browser.** Headless Chrome with a virtual time budget
  dispatches no scroll events at all and does not run the observer during scripted scrolling, so
  this could not be tested here. Reveal is confirmed working for elements in view on load, and a
  scroll-driven fallback in `main.js` covers anything jumped past by an anchor link. Scroll the
  real page once to confirm.
- **Lighthouse.** Not run.
- **Real devices.** All checks were headless Chrome on macOS. No iOS or Android Safari pass, which
  matters here because most traffic will be mobile.
- **Screen reader.** ARIA is wired (tabs, live region, `aria-invalid`, `aria-describedby`) but no
  assistive technology was actually driven over it.
