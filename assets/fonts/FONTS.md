# Self-hosted fonts

Downloaded via the Google Fonts CSS2 API (`https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Inter:wght@400..700&display=swap`)
requested with a modern desktop Chrome User-Agent so the API returned `woff2` URLs. Files below were curl'd directly
from `fonts.gstatic.com` and are unmodified originals.

## Archivo (variable)

- Exact family name: `Archivo`
- Axes: weight `400 900`, width (`font-stretch`) `62% 125%` — the width axis **is** available for this family.
- Files:
  - `archivo-variable-latin.woff2` — unicode-range `latin` (basic Latin + common punctuation)
    - Source: `https://fonts.gstatic.com/s/archivo/v25/k3kQo8UDI-1M0wlSfdnoLmvDIaI.woff2`
  - `archivo-variable-latin-ext.woff2` — unicode-range `latin-ext` (extended Latin, diacritics)
    - Source: `https://fonts.gstatic.com/s/archivo/v25/k3kQo8UDI-1M0wlSfdfoLmvDIaK18A.woff2`
- License: SIL Open Font License 1.1

## Inter (variable)

- Exact family name: `Inter`
- Axes: weight `400 700` (no width axis exposed for Inter in this CSS2 response).
- Files:
  - `inter-variable-latin.woff2` — unicode-range `latin`
    - Source: `https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2`
  - `inter-variable-latin-ext.woff2` — unicode-range `latin-ext`
    - Source: `https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa25L7W0Q5n-wU.woff2`
- License: SIL Open Font License 1.1

## `@font-face` blocks

Paste as-is into the stylesheet (paths are relative from a CSS file in the project's `css/` or `styles/` root; adjust
if your stylesheet lives elsewhere):

```css
@font-face {
  font-family: 'Archivo';
  font-style: normal;
  font-weight: 400 900;
  font-stretch: 62% 125%;
  font-display: swap;
  src: url('../assets/fonts/archivo-variable-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

@font-face {
  font-family: 'Archivo';
  font-style: normal;
  font-weight: 400 900;
  font-stretch: 62% 125%;
  font-display: swap;
  src: url('../assets/fonts/archivo-variable-latin-ext.woff2') format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url('../assets/fonts/inter-variable-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url('../assets/fonts/inter-variable-latin-ext.woff2') format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
```
