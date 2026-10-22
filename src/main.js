/* John Transfer — landing page interactions.
   No dependencies, no build step. Loaded with `defer`. */

(() => {
  "use strict";

  /* =========================================================================
     DELIVERY — WhatsApp handoff.

     The form validates on the client, then composes the whole request as a
     WhatsApp message and opens it. There is no backend, no endpoint, no key
     and no email deliverability to babysit, and John reads it on the same
     phone he already answers on all day.

     It also keeps the page honest. The site never claims to have sent
     anything: it says the message is written and waiting, because the reader
     still has to press send in WhatsApp. See README.md.
  ========================================================================= */
  const WHATSAPP_URL = "http://wa.me/353894551295";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -------------------------------------------------------------------------
     Footer year
  ------------------------------------------------------------------------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* -------------------------------------------------------------------------
     Nav chrome. The bar floats bare over the hero photograph at the top of the
     page and takes on its pill background once you scroll off it. The two
     states are drawn in input.css under `.nav-shell`; this only flips the
     attribute. A page loaded already scrolled (a refresh, a #anchor) gets the
     pill immediately, no flash.
  ------------------------------------------------------------------------- */
  const header = document.getElementById("site-header");
  if (header) {
    let queued = false;

    const syncHeader = () => {
      queued = false;
      header.toggleAttribute("data-scrolled", window.scrollY > 16);
    };

    syncHeader();
    window.addEventListener(
      "scroll",
      () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(syncHeader);
      },
      { passive: true },
    );
  }

  /* -------------------------------------------------------------------------
     Date bounds: not in the past, not absurdly far ahead
  ------------------------------------------------------------------------- */
  const isoDate = (date) =>
    [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

  const today = new Date();
  const todayISO = isoDate(today);
  /* The rule below compares ISO strings, where a mistyped "82026-02-01" sorts
     after today and would sail through. A slipped year is a lot more likely
     than a booking made in the year 82026, so there is an upper bound. It also
     gives the calendar somewhere to stop paging. */
  const maxISO = isoDate(new Date(today.getFullYear() + 2, today.getMonth(), today.getDate()));

  /* -------------------------------------------------------------------------
     Date and time entry

     A native date or time input cannot be typed into reliably. WebKit renders
     the digits and reports `value === ""` with `validity.badInput` set, and
     Chrome does the same for a time whose AM/PM segment was never filled, so
     the form said "Pick the day you travel." underneath a field plainly
     showing a date. Verified in Chromium, Firefox and WebKit.

     So the field a person types into is plain text that we parse here, and the
     button opens the calendar built further down rather than anything native.
     A hidden input carries the canonical value, so FormData keeps yielding an
     ISO date and a 24-hour time and nothing downstream had to change.
  ------------------------------------------------------------------------- */
  const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

  const pad = (n, width = 2) => String(n).padStart(width, "0");

  /* Rejects 31 February and friends: an impossible day rolls the month over,
     so the round trip through Date no longer matches what went in. */
  function toISO(year, month, day) {
    if (!(month >= 1 && month <= 12) || !(day >= 1 && day <= 31)) return "";
    const probe = new Date(Date.UTC(year, month - 1, day));
    if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
      return "";
    }
    return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
  }

  const fullYear = (year) => (year < 100 ? 2000 + year : year);

  /* No year typed: take the next time that day comes round, which is what
     somebody writing "22 aug" in August means. */
  function impliedYear(month, day) {
    const year = today.getFullYear();
    return `${year}-${pad(month)}-${pad(day)}` >= todayISO ? year : year + 1;
  }

  const monthFromName = (name) => MONTHS.findIndex((short) => name.startsWith(short)) + 1;

  function parseDate(raw) {
    const text = String(raw || "").trim().toLowerCase();
    if (!text) return "";

    // 2026-08-22
    let m = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (m) return toISO(+m[1], +m[2], +m[3]);

    /* 22/08/2026, 22-8-26, 22.08.2026. Day first, the Irish reading, and the
       helper text under the field says so. If that gives an impossible month
       we try month first, so an American typing 08/22/2026 is understood
       rather than told off. */
    m = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
    if (m) {
      const year = fullYear(+m[3]);
      return toISO(year, +m[2], +m[1]) || toISO(year, +m[1], +m[2]);
    }

    // 22 aug 2026, 22 august, 22aug
    m = text.match(/^(\d{1,2})\s*([a-z]{3,})\.?,?\s*(\d{2,4})?$/);
    if (m) {
      const month = monthFromName(m[2]);
      return month ? toISO(m[3] ? fullYear(+m[3]) : impliedYear(month, +m[1]), month, +m[1]) : "";
    }

    // aug 22 2026, august 22
    m = text.match(/^([a-z]{3,})\.?\s*(\d{1,2})(?:st|nd|rd|th)?[,\s]*(\d{2,4})?$/);
    if (m) {
      const month = monthFromName(m[1]);
      return month ? toISO(m[3] ? fullYear(+m[3]) : impliedYear(month, +m[2]), month, +m[2]) : "";
    }

    return "";
  }

  /* Accepts 06:40, 0640, 640, 6.40, 6h40, 6pm, 6:40 pm. Returns 24-hour. */
  function parseTime(raw) {
    const text = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");
    if (!text) return "";

    const m = text.match(/^(\d{1,2})(?:[:.h]?(\d{2}))?(am|pm|a|p)?$/);
    if (!m) return "";

    let hours = +m[1];
    const minutes = m[2] ? +m[2] : 0;

    if (m[3]) {
      if (hours < 1 || hours > 12) return "";
      hours = (hours % 12) + (m[3].startsWith("p") ? 12 : 0);
    }

    return hours > 23 || minutes > 59 ? "" : `${pad(hours)}:${pad(minutes)}`;
  }

  const displayDate = (iso) => {
    const [year, month, day] = iso.split("-");
    return `${day}/${month}/${year}`;
  };

  /* Wires one typed field to its hidden canonical value. Returns a get/set
     pair so the quote bar, the Book buttons and the calendar can move a value
     around without knowing how any of it is spelled on screen. */
  function wireEntry(textId, kind) {
    const text = document.getElementById(textId);
    if (!text) return null;

    const hidden = document.getElementById(`${textId}-value`);
    const parse = kind === "date" ? parseDate : parseTime;
    const display = kind === "date" ? displayDate : (value) => value;

    const sync = () => {
      const canonical = parse(text.value);
      if (hidden) hidden.value = canonical;
      return canonical;
    };

    text.addEventListener("input", sync);
    text.addEventListener("blur", () => {
      const canonical = sync();
      /* Echo back what we understood, so "22 aug" visibly becomes 22/08/2026
         and a misreading is caught here rather than inside the WhatsApp
         message where nobody would look for it. */
      if (canonical) text.value = display(canonical);
    });

    /* A browser restoring the form on back-navigation puts text back without
       firing anything, which would leave the canonical value empty under a
       field that visibly holds a date. */
    sync();

    return {
      get: () => (hidden ? hidden.value : parse(text.value)),
      set: (canonical) => {
        if (!canonical) return;
        text.value = display(canonical);
        sync();
        /* The form's delegated listener clears a stale message, and it hears
           real events only, which assigning to .value does not fire. */
        text.dispatchEvent(new Event("input", { bubbles: true }));
      },
    };
  }

  /* -------------------------------------------------------------------------
     Calendar popover

     Drawn here rather than handed to the browser. `showPicker()` opens native
     chrome that renders in the operating system's locale, which put a
     Portuguese month name on a page PRODUCT.md says is English only, and whose
     dismissal nothing on the page can reach, observe or test. This one is
     ordinary DOM, so it speaks the page's language and every open, close and
     keypress can be driven in a test.
  ------------------------------------------------------------------------- */
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const shiftDays = (iso, days) => {
    const [y, m, d] = iso.split("-").map(Number);
    const next = new Date(Date.UTC(y, m - 1, d + days));
    return `${pad(next.getUTCFullYear(), 4)}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
  };

  const shiftMonths = (iso, months) => {
    const [y, m, d] = iso.split("-").map(Number);
    const target = new Date(Date.UTC(y, m - 1 + months, 1));
    const year = target.getUTCFullYear();
    const month = target.getUTCMonth() + 1;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return `${pad(year, 4)}-${pad(month)}-${pad(Math.min(d, lastDay))}`;
  };

  const inRange = (iso) => iso >= todayISO && iso <= maxISO;
  const clampToRange = (iso) => (iso < todayISO ? todayISO : iso > maxISO ? maxISO : iso);

  function wireCalendar(textId, entry) {
    const root = document.getElementById(`${textId}-calendar`);
    const button = document.querySelector(`[data-calendar-for="${textId}"]`);
    const text = document.getElementById(textId);
    if (!root || !button || !entry) return;

    /* The day the keyboard is sitting on, which is not always the chosen day:
       arrow keys move it around before anything is committed. */
    let cursor = todayISO;
    let isOpen = false;

    root.innerHTML = `
      <div class="calendar-head">
        <button type="button" class="calendar-nav" data-step="-1">
          <span class="sr-only">Previous month</span>
          <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <p class="calendar-title" data-calendar-title aria-live="polite"></p>
        <button type="button" class="calendar-nav" data-step="1">
          <span class="sr-only">Next month</span>
          <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </div>
      <div class="calendar-grid" aria-hidden="true">
        ${WEEKDAYS.map((day) => `<div class="calendar-weekday">${day.slice(0, 2)}</div>`).join("")}
      </div>
      <div class="calendar-grid" data-calendar-grid></div>`;

    const grid = root.querySelector("[data-calendar-grid]");
    const title = root.querySelector("[data-calendar-title]");

    function render() {
      const [year, month] = cursor.split("-").map(Number);
      const selected = entry.get();
      /* getUTCDay puts Sunday at 0; the week starts on Monday here. */
      const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
      const days = new Date(Date.UTC(year, month, 0)).getUTCDate();

      let cells = "";
      for (let i = 0; i < offset; i += 1) cells += "<div></div>";
      for (let day = 1; day <= days; day += 1) {
        const iso = `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
        cells +=
          `<button type="button" class="calendar-day" data-day="${iso}"` +
          `${inRange(iso) ? "" : " disabled"}` +
          `${iso === todayISO ? " data-today" : ""}` +
          `${iso === selected ? ' aria-current="date"' : ""}` +
          ` tabindex="${iso === cursor ? 0 : -1}">${day}</button>`;
      }
      grid.innerHTML = cells;
      title.textContent = `${MONTH_NAMES[month - 1]} ${year}`;

      /* A month with nothing selectable in it is a dead end, so the arrow that
         leads there is switched off rather than left to disappoint. */
      root.querySelector('[data-step="-1"]').disabled =
        `${pad(year, 4)}-${pad(month)}-01` <= todayISO;
      root.querySelector('[data-step="1"]').disabled =
        `${pad(year, 4)}-${pad(month)}-${pad(days)}` >= maxISO;
    }

    const focusCursor = () => grid.querySelector(`[data-day="${cursor}"]`)?.focus();

    function moveCursor(next) {
      const target = clampToRange(next);
      const monthChanged = target.slice(0, 7) !== cursor.slice(0, 7);
      cursor = target;
      if (monthChanged) {
        render();
        /* Row count changes between months, so the flip decision changes too. */
        if (isOpen) place();
      } else {
        grid.querySelectorAll("[data-day]").forEach((cell) => {
          cell.tabIndex = cell.dataset.day === cursor ? 0 : -1;
        });
      }
      focusCursor();
    }

    /* Drops below the field by default and flips above it when that would put
       the last week under the fold, or behind the fixed mobile shortcut bar,
       which is exactly where a phone lands with this field mid-screen. */
    function place() {
      root.removeAttribute("data-drop-up");
      const floor = window.innerHeight - 88;
      const popover = root.getBoundingClientRect();
      const field = text.getBoundingClientRect();
      if (popover.bottom > floor && field.top > popover.height + 16) {
        root.setAttribute("data-drop-up", "");
      }
    }

    function open() {
      if (isOpen) return;
      isOpen = true;
      cursor = clampToRange(entry.get() || todayISO);
      render();
      root.hidden = false;
      place();
      button.setAttribute("aria-expanded", "true");
      focusCursor();
    }

    function close({ returnFocus = true } = {}) {
      if (!isOpen) return;
      isOpen = false;
      root.hidden = true;
      button.setAttribute("aria-expanded", "false");
      if (returnFocus) button.focus();
    }

    function pick(iso) {
      entry.set(iso);
      close();
    }

    button.addEventListener("click", (event) => {
      event.preventDefault();
      /* The quote bar wraps its segment in a <label>, which would otherwise
         swallow this click and merely focus the text field. */
      event.stopPropagation();
      if (isOpen) close();
      else open();
    });

    root.addEventListener("click", (event) => {
      event.stopPropagation();
      const day = event.target.closest("[data-day]");
      if (day) {
        pick(day.dataset.day);
        return;
      }
      const step = event.target.closest("[data-step]");
      if (step) {
        moveCursor(shiftMonths(cursor, Number(step.dataset.step)));
      }
    });

    root.addEventListener("keydown", (event) => {
      const moves = {
        ArrowLeft: () => shiftDays(cursor, -1),
        ArrowRight: () => shiftDays(cursor, 1),
        ArrowUp: () => shiftDays(cursor, -7),
        ArrowDown: () => shiftDays(cursor, 7),
        PageUp: () => shiftMonths(cursor, -1),
        PageDown: () => shiftMonths(cursor, 1),
        Home: () => shiftDays(cursor, -((new Date(`${cursor}T00:00:00Z`).getUTCDay() + 6) % 7)),
        End: () => shiftDays(cursor, 6 - ((new Date(`${cursor}T00:00:00Z`).getUTCDay() + 6) % 7)),
      };

      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        if (event.target.closest("[data-day]")) {
          event.preventDefault();
          pick(cursor);
        }
        return;
      }
      if (event.key === "Tab") {
        close({ returnFocus: false });
        return;
      }
      if (moves[event.key]) {
        event.preventDefault();
        moveCursor(moves[event.key]());
      }
    });

    /* Anywhere else on the page closes it. Capture, so a handler that stops
       propagation somewhere else on the page cannot strand it open. */
    document.addEventListener(
      "pointerdown",
      (event) => {
        if (!isOpen || root.contains(event.target) || button.contains(event.target)) return;
        close({ returnFocus: false });
      },
      true,
    );

    /* Typing in the field while the calendar is up moves it to the month being
       typed, rather than leaving the two showing different things. */
    text.addEventListener("input", () => {
      if (!isOpen) return;
      const typed = entry.get();
      if (typed && inRange(typed)) moveCursor(typed);
    });
  }

  const bookingDate = wireEntry("f-date", "date");
  wireEntry("f-time", "time");
  const quoteDate = wireEntry("quote-date", "date");

  wireCalendar("f-date", bookingDate);
  wireCalendar("quote-date", quoteDate);

  /* -------------------------------------------------------------------------
     City tabs. Roving tabindex: one tab in the tab order, arrow keys move
     between them, Home/End jump to the ends.
  ------------------------------------------------------------------------- */
  const tabs = Array.from(document.querySelectorAll("[data-city-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-city-panel]"));

  function selectTab(tab, { focus = false } = {}) {
    tabs.forEach((t) => {
      const isTarget = t === tab;
      t.setAttribute("aria-selected", String(isTarget));
      t.tabIndex = isTarget ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel.id !== tab.getAttribute("aria-controls");
    });
    if (focus) tab.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab));

    tab.addEventListener("keydown", (event) => {
      const moves = {
        ArrowRight: index + 1,
        ArrowLeft: index - 1,
        Home: 0,
        End: tabs.length - 1,
      };
      if (!(event.key in moves)) return;
      event.preventDefault();
      const next = (moves[event.key] + tabs.length) % tabs.length;
      selectTab(tabs[next], { focus: true });
    });
  });

  /* -------------------------------------------------------------------------
     Tour city filters and responsive grid display.
     'all' displays all tours across Ireland; city filters display only that city.
  ------------------------------------------------------------------------- */
  const tourFilters = Array.from(document.querySelectorAll("[data-tour-filter]"));
  const tourCards = Array.from(document.querySelectorAll("[data-tour-city]"));

  function selectTourCity(city) {
    const target = (city || "").toLowerCase().trim();

    tourFilters.forEach((button) => {
      const btnFilter = (button.dataset.tourFilter || "").toLowerCase().trim();
      button.setAttribute("aria-pressed", String(btnFilter === target));
    });

    tourCards.forEach((card) => {
      const cardCity = (card.dataset.tourCity || "").toLowerCase().trim();
      const isMatch = target === "all" || target === "" || cardCity === target;

      if (isMatch) {
        card.removeAttribute("hidden");
        card.style.removeProperty("display");
      } else {
        card.setAttribute("hidden", "");
        card.style.setProperty("display", "none", "important");
      }
    });
  }

  tourFilters.forEach((button) => {
    button.addEventListener("click", () => selectTourCity(button.dataset.tourFilter));
  });

  const toursTabsWrapper = document.querySelector(".tours-tabs-wrapper");
  const toursSwipeHint = document.querySelector(".tours-swipe-hint");
  toursTabsWrapper?.addEventListener("scroll", () => {
    if (toursSwipeHint) toursSwipeHint.style.opacity = "0.2";
  }, { passive: true });

  if (tourFilters.length && tourCards.length) selectTourCity("all");

  /* =========================================================================
     CONFIGURAÇÃO CENTRAL DE TOURS: HORÁRIOS E VALORES POR OPÇÃO DE PASSAGEIROS
     -------------------------------------------------------------------------
     Para alterar o preço ou o horário/duração de qualquer tour:
     - 'duration': texto do horário/duração exibido no card (ex: "12h 30m", "8h", "1h 30m")
     - 'price': valor base de partida (exibido como 'From €...' no card e equivalente a 'car-1')
     - 'prices': valores em Euro para cada opção de Passengers no formulário:
         * 'car-1':   01-04 passengers (1 car)
         * 'van-1':   04-07 passengers (1 van)
         * 'van-car': 08-11 passengers (1 van + 1 car)
         * 'vans-2':  12-14 passengers (2 vans)
     
     Qualquer valor alterado aqui é refletido AUTOMATICAMENTE nos cards e no
     formulário de reserva (preços do popover de passageiros, totais e recibo).
     ========================================================================= */
  const TOURS_CONFIG = {
    // --- DUBLIN TOURS ---
    "cliffs-moher-galway": {
      service: "Dublin • Private Tour: Cliffs of Moher & Galway.",
      duration: "12h 30m",
      price: 790,
      prices: {
        "car-1": 790,
        "van-1": 1290,
        "van-car": 2080,
        "vans-2": 2580,
      },
    },
    "belfast-titanic-giants": {
      service: "Dublin • Private Tour: Belfast, Titanic & Giants.",
      duration: "13h",
      price: 840,
      prices: {
        "car-1": 840,
        "van-1": 1370,
        "van-car": 2210,
        "vans-2": 2740,
      },
    },
    "wicklow-glendalough": {
      service: "Dublin • Wicklow & Glendalough Private Day Tour.",
      duration: "7h",
      price: 630,
      prices: {
        "car-1": 630,
        "van-1": 1030,
        "van-car": 1660,
        "vans-2": 2060,
      },
    },
    "dublin-chauffeur": {
      service: "Dublin • Dublin: Private Chauffeur Tour.",
      duration: "4h or 8h",
      price: 540,
      prices: {
        "car-1": 540,
        "van-1": 880,
        "van-car": 1420,
        "vans-2": 1760,
      },
    },

    // --- BELFAST TOURS ---
    "giants-causeway": {
      service: "Belfast • Giant's Causeway – Private Guide Bus Tour.",
      duration: "8h",
      price: 680,
      prices: {
        "car-1": 680,
        "van-1": 1110,
        "van-car": 1790,
        "vans-2": 2220,
      },
    },
    "belfast-city": {
      service: "Belfast • Belfast City – Private Chauffeur Day Tour.",
      duration: "7h",
      price: 590,
      prices: {
        "car-1": 590,
        "van-1": 960,
        "van-car": 1550,
        "vans-2": 1930,
      },
    },
    "game-of-thrones": {
      service: "Belfast • Game of Thrones Private Tour.",
      duration: "8h",
      price: 690,
      prices: {
        "car-1": 690,
        "van-1": 1130,
        "van-car": 1820,
        "vans-2": 2250,
      },
    },

    // --- CORK TOURS ---
    "titanic-trail": {
      service: "Cork • Titanic Trail Walking Tour.",
      duration: "1h 30m",
      price: 160,
      prices: {
        "car-1": 160,
        "van-1": 260,
        "van-car": 420,
        "vans-2": 520,
      },
    },
    "ring-of-kerry": {
      service: "Cork • Ring of Kerry – Private Day Tour.",
      duration: "8h",
      price: 720,
      prices: {
        "car-1": 720,
        "van-1": 1180,
        "van-car": 1900,
        "vans-2": 2350,
      },
    },
    "gougane-barra": {
      service: "Cork • Private Tour to Gougane Barra and Glengarriff.",
      duration: "8h",
      price: 650,
      prices: {
        "car-1": 650,
        "van-1": 1060,
        "van-car": 1710,
        "vans-2": 2120,
      },
    },

    // --- GALWAY TOURS ---
    "galway-cliffs-moher": {
      service: "Galway • Cliffs of Moher from Galway – Private Tour.",
      duration: "1h 30m",
      price: 490,
      prices: {
        "car-1": 490,
        "van-1": 800,
        "van-car": 1290,
        "vans-2": 1600,
      },
    },

    // --- AIRPORT TRANSFERS ---
    "dublin-airport-city": {
      service: "Dublin Airport to Dublin City Centre.",
      duration: "45m",
      price: 85,
      prices: {
        "car-1": 85,
        "van-1": 140,
        "van-car": 225,
        "vans-2": 280,
      },
    },
    "dublin-city-airport": {
      service: "Dublin City Centre to Dublin Airport.",
      duration: "45m",
      price: 65,
      prices: {
        "car-1": 65,
        "van-1": 110,
        "van-car": 175,
        "vans-2": 215,
      },
    },
    "cork-airport-city": {
      service: "Cork Airport to Cork City Centre.",
      duration: "30m",
      price: 50,
      prices: {
        "car-1": 50,
        "van-1": 85,
        "van-car": 135,
        "vans-2": 165,
      },
    },
    "cork-city-airport": {
      service: "Cork City Centre to Cork Airport.",
      duration: "30m",
      price: 50,
      prices: {
        "car-1": 50,
        "van-1": 85,
        "van-car": 135,
        "vans-2": 165,
      },
    },
    "belfast-airport-city": {
      service: "Belfast Airport to Belfast City Centre.",
      duration: "40m",
      price: 65,
      prices: {
        "car-1": 65,
        "van-1": 110,
        "van-car": 175,
        "vans-2": 215,
      },
    },
    "belfast-city-airport": {
      service: "Belfast City Centre to Belfast Airport.",
      duration: "40m",
      price: 65,
      prices: {
        "car-1": 65,
        "van-1": 110,
        "van-car": 175,
        "vans-2": 215,
      },
    },
  };

  // Expose globally for easy inspection if needed
  window.TOURS_CONFIG = TOURS_CONFIG;

  // Active pricing lookup table
  const TOUR_PRICING = {};

  /* Sincroniza a configuração de preços e horários (TOURS_CONFIG) com os cards e o formulário */
  function syncToursConfigToUI() {
    // 1. Atualizar mapa de preços por nome de serviço
    Object.values(TOURS_CONFIG).forEach((tour) => {
      if (tour.service) {
        TOUR_PRICING[tour.service] = tour.prices?.["car-1"] ?? tour.price;
      }
    });

    // 2. Atualizar todos os cards na página (duração, preço e botão)
    document.querySelectorAll(".tour-card").forEach((card) => {
      const tourId = card.dataset.tourId;
      const bookBtn = card.querySelector(".tour-book-btn");
      const serviceName = bookBtn?.dataset.tourBook;

      const tour = (tourId && TOURS_CONFIG[tourId])
        || Object.values(TOURS_CONFIG).find((t) => t.service === serviceName);

      if (tour) {
        // Atualizar texto de Duração / Horário
        const durationEl = card.querySelector(".tour-duration-value");
        if (durationEl && tour.duration) {
          durationEl.textContent = tour.duration;
        }

        const basePrice = tour.prices?.["car-1"] ?? tour.price;

        // Atualizar badge de Preço
        const priceEl = card.querySelector(".tour-price-value");
        if (priceEl && basePrice) {
          priceEl.textContent = `From €${Number(basePrice).toLocaleString("en-IE")}`;
        }

        // Atualizar atributos do botão Book Now do card
        if (bookBtn) {
          if (basePrice) {
            bookBtn.dataset.tourPrice = String(basePrice);
          }
          if (tour.service) {
            bookBtn.dataset.tourBook = tour.service;
          }
        }
      }
    });
  }

  // Executa a sincronização imediatamente
  syncToursConfigToUI();

  const bookingForm = document.getElementById("booking-form");
  const statusEl = document.getElementById("form-status");
  const sentPanel = document.getElementById("booking-sent");

  const serviceField = document.getElementById("f-service");
  const passengersField = document.getElementById("f-passengers");

  /* -------------------------------------------------------------------------
     Passengers Popover Widget (Exact match to Irish English screenshot)
  ------------------------------------------------------------------------- */
  let activeTourPrices = {
    "car-1": 790,
    "van-1": 1290,
    "van-car": 2080,
    "vans-2": 2580,
  };
  let currentBasePrice = 790;

  const selectedTierCounts = {
    "car-1": 1,
    "van-1": 0,
    "van-car": 0,
    "vans-2": 0,
  };

  let currentSelectionBreakdown = [
    {
      tierId: "car-1",
      label: "01-04 passengers (1 car)",
      count: 1,
      unitPrice: 790,
      subtotal: 790,
    },
  ];

  function findTourConfig(tourIdOrService) {
    if (!tourIdOrService) return null;
    const clean = String(tourIdOrService).trim();
    if (TOURS_CONFIG[clean]) return TOURS_CONFIG[clean];

    const normalize = (str) =>
      str
        ? String(str)
            .replace(/&amp;/g, "&")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase()
        : "";

    const target = normalize(clean);

    return (
      Object.values(TOURS_CONFIG).find((t) => {
        if (!t.service) return false;
        return normalize(t.service) === target;
      }) || null
    );
  }

  function getTierUnitPrice(tierId) {
    if (activeTourPrices && activeTourPrices[tierId] !== undefined) {
      return Number(activeTourPrices[tierId]);
    }
    return currentBasePrice || 790;
  }

  function calculateTierPrice(basePrice, ratio) {
    if (ratio === 1.0) return basePrice;
    return Math.round((basePrice * ratio) / 10) * 10;
  }

  function formatEuro(amount) {
    return "€" + Number(amount).toLocaleString("en-IE");
  }

  function updatePopoverPricing() {
    const rows = document.querySelectorAll("#passenger-tiers-list .tier-row");
    let total = 0;
    let anySelected = false;

    rows.forEach((row) => {
      const tierId = row.dataset.tierId;
      const tierPrice = getTierUnitPrice(tierId);
      const priceLabel = row.querySelector(".tier-price-label");
      if (priceLabel) priceLabel.textContent = formatEuro(tierPrice);

      const count = selectedTierCounts[tierId] || 0;
      const countEl = row.querySelector(".tier-count");
      if (countEl) countEl.textContent = String(count);

      const decBtn = row.querySelector(".tier-dec-btn");
      if (decBtn) decBtn.disabled = count <= 0;

      if (count > 0) {
        anySelected = true;
        total += count * tierPrice;
      }
    });

    if (!anySelected) {
      total = getTierUnitPrice("car-1");
    }

    const popoverTotal = document.getElementById("passengers-popover-total");
    if (popoverTotal) popoverTotal.textContent = formatEuro(total);
  }

  function applyPassengerSelection() {
    const rows = Array.from(document.querySelectorAll("#passenger-tiers-list .tier-row"));
    let activeRows = rows.filter((row) => (selectedTierCounts[row.dataset.tierId] || 0) > 0);

    if (activeRows.length === 0) {
      selectedTierCounts["car-1"] = 1;
      activeRows = [rows[0]];
      updatePopoverPricing();
    }

    let totalAmount = 0;
    let summaryLabels = [];
    currentSelectionBreakdown = [];

    activeRows.forEach((row) => {
      const tierId = row.dataset.tierId;
      const count = selectedTierCounts[tierId] || 0;
      const tierPrice = getTierUnitPrice(tierId);
      const subtotal = count * tierPrice;
      totalAmount += subtotal;

      const label = row.dataset.label || "01-04 passengers (1 car)";
      summaryLabels.push(`${count} x ${label}`);

      currentSelectionBreakdown.push({
        tierId,
        label,
        count,
        unitPrice: tierPrice,
        subtotal,
      });
    });

    const finalSummary = summaryLabels.join(", ");
    const formattedPrice = formatEuro(totalAmount);

    const displayLabel = document.getElementById("passengers-display-label");
    if (displayLabel) displayLabel.textContent = finalSummary;

    const displayPrice = document.getElementById("passengers-display-price");
    if (displayPrice) displayPrice.textContent = formattedPrice;

    const hiddenPassengers = document.getElementById("f-passengers");
    if (hiddenPassengers) hiddenPassengers.value = finalSummary;

    const hiddenPrice = document.getElementById("f-price");
    if (hiddenPrice) hiddenPrice.value = formattedPrice;

    const hiddenPriceNum = document.getElementById("f-price-num");
    if (hiddenPriceNum) hiddenPriceNum.value = String(totalAmount);

    if (hiddenPassengers) clearFieldError(hiddenPassengers);
  }

  function updateActiveTour(tourIdOrService, customBasePrice) {
    const config = findTourConfig(tourIdOrService);
    if (config && config.prices) {
      activeTourPrices = { ...config.prices };
      currentBasePrice = Number(config.prices["car-1"] ?? config.price ?? 790);
    } else if (customBasePrice && !isNaN(customBasePrice)) {
      const base = Number(customBasePrice);
      currentBasePrice = base;
      activeTourPrices = {
        "car-1": base,
        "van-1": calculateTierPrice(base, 1.633),
        "van-car": calculateTierPrice(base, 2.633),
        "vans-2": calculateTierPrice(base, 3.266),
      };
    }
    updatePopoverPricing();
    applyPassengerSelection();
  }

  function updateTourBasePrice(newBase, tourIdOrService) {
    if (tourIdOrService) {
      updateActiveTour(tourIdOrService, newBase);
    } else if (newBase && !isNaN(newBase)) {
      updateActiveTour(null, newBase);
    }
  }

  const passengersWidgetContainer = document.getElementById("passengers-widget-container");
  const passengersDisplayBtn = document.getElementById("f-passengers-display");
  const passengersPopover = document.getElementById("passengers-popover");
  const passengersChevron = document.getElementById("passengers-chevron");
  const passengersApplyBtn = document.getElementById("passengers-popover-apply");

  function openPassengersPopover() {
    if (!passengersPopover) return;
    updatePopoverPricing();
    passengersPopover.hidden = false;
    passengersDisplayBtn?.setAttribute("aria-expanded", "true");
    if (passengersChevron) passengersChevron.style.transform = "rotate(180deg)";
  }

  function closePassengersPopover() {
    if (!passengersPopover || passengersPopover.hidden) return;
    passengersPopover.hidden = true;
    passengersDisplayBtn?.setAttribute("aria-expanded", "false");
    if (passengersChevron) passengersChevron.style.transform = "";
  }

  passengersDisplayBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (passengersPopover?.hidden) {
      openPassengersPopover();
    } else {
      closePassengersPopover();
    }
  });

  document.addEventListener("click", (e) => {
    if (passengersWidgetContainer && !passengersWidgetContainer.contains(e.target)) {
      closePassengersPopover();
    }
  });

  document.querySelectorAll("#passenger-tiers-list .tier-row").forEach((row) => {
    const tierId = row.dataset.tierId;
    const decBtn = row.querySelector(".tier-dec-btn");
    const incBtn = row.querySelector(".tier-inc-btn");

    decBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedTierCounts[tierId] = Math.max(0, (selectedTierCounts[tierId] || 0) - 1);
      updatePopoverPricing();
    });

    incBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedTierCounts[tierId] = (selectedTierCounts[tierId] || 0) + 1;
      updatePopoverPricing();
    });
  });

  passengersApplyBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    applyPassengerSelection();
    closePassengersPopover();
  });

  /* Move a selection into the booking form and scroll to it. Used by every
     "Book" button and by the hero quote bar. */
  function sendToBooking({ service, date, passengers, price, tourId } = {}) {
    /* A reader who already sent one request and then tapped Book on another
       route would otherwise be scrolled to a confirmation panel for the
       previous journey. Put the form back first, keeping what they typed. */
    showForm({ reset: false, focus: false });

    if (service && serviceField) {
      const match = Array.from(serviceField.options).find(
        (option) => option.value === service || option.textContent.trim() === service,
      );
      serviceField.value = match ? match.value : "Something else";
    }

    const basePrice = price || (service ? TOUR_PRICING[service] : null) || 790;
    updateActiveTour(tourId || service, basePrice);

    if (date) bookingDate?.set(date);
    if (passengers && passengersField) passengersField.value = passengers;

    /* Assigning to .value fires neither input nor change, so nothing so far
       has told the form these fields were answered. */
    refreshShownErrors();

    const target = document.getElementById("book");
    if (!target) return;
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });

    /* Land on the first field that still needs an answer, so the next action
       is obvious. Delayed past the scroll so focus does not fight it. */
    window.setTimeout(
      () => {
        const firstEmpty = ["f-name", "f-email", "f-pickup", "f-dropoff", "f-date", "f-time"]
          .map((id) => document.getElementById(id))
          .find((field) => field && !field.value);
        if (firstEmpty) firstEmpty.focus({ preventScroll: true });
      },
      prefersReducedMotion ? 0 : 600,
    );
  }

  // Sync pricing if the customer manually changes the service dropdown
  serviceField?.addEventListener("change", () => {
    const selectedService = serviceField.value;
    updateActiveTour(selectedService);
  });

  // Tour cards Book Now buttons
  document.querySelectorAll(".tour-book-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const card = button.closest(".tour-card");
      const tourId = card?.dataset.tourId;
      const service = button.dataset.tourBook;
      const price = Number(button.dataset.tourPrice) || (tourId && TOURS_CONFIG[tourId]?.prices?.["car-1"]) || 790;
      sendToBooking({ service, price, tourId });
    });
  });

  document.querySelectorAll("[data-book]").forEach((button) => {
    button.addEventListener("click", () => {
      const service = button.dataset.book;
      const price = TOUR_PRICING[service] || 790;
      sendToBooking({ service, price });
    });
  });

  /* -------------------------------------------------------------------------
     Tour Details Modal / Popup
     Dynamically loads dedicated popup files on click of any [data-tour-popup] button.
  ------------------------------------------------------------------------- */
  const tourModal = document.getElementById("tour-modal");
  const tourModalBackdrop = document.getElementById("tour-modal-backdrop");
  const tourModalContent = document.getElementById("tour-modal-content");
  const tourPopupButtons = document.querySelectorAll("[data-tour-popup]");
  const tourPopupCache = new Map();
  let lastFocusedTourTrigger = null;
  let activeTourLightbox = null;

  function closeTourPopup() {
    if (!tourModal || !tourModal.classList.contains("is-active")) return;
    if (activeTourLightbox) {
      try {
        activeTourLightbox.close();
      } catch (e) { }
    }
    tourModal.classList.remove("is-active");
    tourModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocusedTourTrigger && typeof lastFocusedTourTrigger.focus === "function") {
      lastFocusedTourTrigger.focus();
    }
  }

  function initPopupLightbox(container) {
    if (activeTourLightbox) {
      try {
        activeTourLightbox.destroy();
      } catch (e) { }
      activeTourLightbox = null;
    }
    if (typeof GLightbox !== "undefined") {
      activeTourLightbox = GLightbox({
        selector: ".glightbox",
        touchNavigation: true,
        loop: true,
        autoplayVideos: false,
        zoomable: true,
        draggable: true,
        openEffect: "zoom",
        closeEffect: "zoom",
        slideEffect: "slide",
      });

      // Maintain modal scroll lock when lightbox closes
      activeTourLightbox.on("close", () => {
        if (tourModal?.classList.contains("is-active")) {
          document.body.style.overflow = "hidden";
        }
      });
    }
  }

  function wirePopupInternals(container) {
    // Initialize GLightbox for gallery images
    initPopupLightbox(container);

    // Close buttons inside popup
    container.querySelectorAll(".tour-popup-close").forEach((btn) => {
      btn.addEventListener("click", closeTourPopup);
    });

    // Booking button inside popup
    container.querySelectorAll(".tour-popup-book-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const wrapper = btn.closest(".tour-popup-wrapper");
        const serviceName = wrapper ? wrapper.dataset.tourBooking : "";
        closeTourPopup();
        if (serviceName) {
          sendToBooking({ service: serviceName });
        }
      });
    });
  }

  async function openTourPopup(fileUrl, triggerEl) {
    if (!tourModal || !tourModalContent) return;
    lastFocusedTourTrigger = triggerEl;

    // Open modal container
    tourModal.classList.add("is-active");
    tourModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // If cached, render immediately
    if (tourPopupCache.has(fileUrl)) {
      tourModalContent.innerHTML = tourPopupCache.get(fileUrl);
      wirePopupInternals(tourModalContent);
      tourModalContent.scrollTop = 0;
      return;
    }

    // Elegant loading spinner
    tourModalContent.innerHTML = `
      <div class="flex flex-col items-center justify-center p-12 text-center">
        <div class="size-8 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
        <p class="mt-4 text-sm font-medium text-muted">Loading tour details...</p>
      </div>
    `;

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("HTTP " + response.status);
      const html = await response.text();
      tourPopupCache.set(fileUrl, html);
      tourModalContent.innerHTML = html;
      wirePopupInternals(tourModalContent);
      tourModalContent.scrollTop = 0;
    } catch (err) {
      console.warn("Could not fetch popup file:", fileUrl, err);
      tourModalContent.innerHTML = `
        <div class="p-8 text-center">
          <p class="text-base font-semibold text-danger">Failed to load tour details.</p>
          <p class="mt-2 text-sm text-muted">Please check your connection and try again.</p>
          <button type="button" class="tour-popup-close mt-6 rounded-full bg-sunken px-6 py-2 text-sm font-medium text-ink hover:bg-line">
            Close
          </button>
        </div>
      `;
      wirePopupInternals(tourModalContent);
    }
  }

  tourPopupButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const fileUrl = btn.dataset.tourPopup;
      if (fileUrl) {
        openTourPopup(fileUrl, btn);
      }
    });
  });

  // Also allow clicking anywhere on the tour card (such as on the image) to open the tour popup
  document.querySelectorAll(".tour-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("button") || e.target.closest("a")) return;
      const btn = card.querySelector("[data-tour-popup]");
      if (btn) {
        const fileUrl = btn.dataset.tourPopup;
        if (fileUrl) {
          openTourPopup(fileUrl, btn);
        }
      }
    });
  });

  tourModalBackdrop?.addEventListener("click", closeTourPopup);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (document.body.classList.contains("glightbox-open")) {
        return;
      }
      const rModal = document.getElementById("booking-receipt-modal");
      if (rModal && !rModal.hidden) {
        closeBookingReceiptModal();
        return;
      }
      if (passengersPopover && !passengersPopover.hidden) {
        closePassengersPopover();
        return;
      }
      if (tourModal?.classList.contains("is-active")) {
        closeTourPopup();
      }
    }
  });

  /* -------------------------------------------------------------------------
     Hero quote bar. It carries a selection down to the form. It deliberately
     does not calculate anything: every price on this page is fixed and
     already published.
  ------------------------------------------------------------------------- */
  const quoteForm = document.getElementById("quote-form");
  if (quoteForm) {
    quoteForm.addEventListener("submit", (event) => {
      event.preventDefault();
      sendToBooking({
        service: document.getElementById("quote-service")?.value,
        date: quoteDate?.get(),
        passengers: document.getElementById("quote-passengers")?.value,
      });
    });
  }

  /* -------------------------------------------------------------------------
     Validation
  ------------------------------------------------------------------------- */
  const RULES = {
    "f-service": (value) => (value ? null : "Required field"),
    "f-name": (value) => (value.trim().length >= 2 ? null : "Required field"),
    /* Empty and malformed are different mistakes and get different sentences.
       Telling someone who has typed nothing that their email "does not look
       right" reads as a bug in the form. */
    "f-email": (value) => {
      if (!value.trim()) return "Required field";
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
        ? null
        : "This email address is incorrect, please try again.";
    },
    "f-passengers": (value) => {
      return value && value.trim().length >= 3
        ? null
        : "Please select your passengers and vehicle.";
    },
    /* These two read what was typed, not a parsed value, so "did not read"
       and "left blank" stay separate sentences. Telling someone who typed a
       date that they have not picked one is what started all this. */
    "f-date": (raw) => {
      if (!raw.trim()) return "Required field";
      const value = parseDate(raw);
      if (!value) return "That date did not read. Day, month, year, like 22/08/2026.";
      if (value < todayISO) return "That date has already passed.";
      if (value > maxISO) return "Check the year on that. For a date further out than two years.";
      return null;
    },
    "f-time": (raw) => {
      if (!raw.trim()) return "Required field";
      return parseTime(raw) ? null : "That time did not read. Try 06:40, on a 24-hour clock.";
    },
    "f-pickup": (value) => (value.trim().length >= 3 ? null : "Required field"),
    "f-dropoff": (value) => (value.trim().length >= 3 ? null : "Required field"),
  };

  function errorEl(field) {
    return document.getElementById("e-" + field.id.replace(/^f-/, ""));
  }

  function setFieldError(field, message) {
    field.setAttribute("aria-invalid", "true");
    const el = errorEl(field);
    if (el) {
      el.textContent = message;
      el.hidden = false;
      el.classList.remove("hidden");
    }
  }

  function clearFieldError(field) {
    field.removeAttribute("aria-invalid");
    const el = errorEl(field);
    if (el) {
      el.textContent = "";
      el.hidden = true;
      el.classList.add("hidden");
    }
  }

  function validateField(field) {
    const rule = RULES[field.id];
    if (!rule) return true;
    const message = rule(field.value ?? "");
    if (message) {
      setFieldError(field, message);
      return false;
    }
    clearFieldError(field);
    return true;
  }

  /* Re-run the rule on every field that is currently showing a message, and
     only on those. A field nobody has answered yet is left alone. */
  function refreshShownErrors() {
    ruledFields().forEach((field) => {
      if (field.getAttribute("aria-invalid") === "true") validateField(field);
    });
  }

  /* Accuse a field only once it has been left. Nobody wants to be told their
     email is wrong while they are still typing it. */
  ruledFields().forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
  });

  /* Clearing is delegated to the form, and it sweeps every showing message
     rather than only the field being typed into.

     The date and time inputs are why. Their value stays "" until the last
     segment is filled, so the events arrive at moments that do not line up
     with a per-field listener, and a value put there from script (the hero
     quote bar, a Book button) fires no event at all. Both left "Pick the day
     you travel." sitting under a field that plainly showed a date. Sweeping
     all of them on any input anywhere in the form costs eight rule checks and
     closes the whole class rather than the one path. */
  bookingForm?.addEventListener("input", refreshShownErrors);
  bookingForm?.addEventListener("change", refreshShownErrors);

  /* -------------------------------------------------------------------------
     Submit: validate, compose, hand off to WhatsApp, confirm
  ------------------------------------------------------------------------- */

  /* The only inline notice left is the validation summary. Success is not a
     strip above a form any more, it is the panel that replaces it. */
  function setStatus(message) {
    if (!statusEl) return;
    statusEl.innerHTML = message
      ? `<div class="rounded-field border border-danger/35 bg-danger/5 px-4 py-3 text-sm text-danger">${message}</div>`
      : "";
  }

  function ruledFields() {
    return Object.keys(RULES)
      .map((id) => document.getElementById(id))
      .filter(Boolean);
  }

  /* Compose the whole request as a WhatsApp message. Every field the reader
     filled in travels with it, including reference code and price. */
  function whatsappRequestURL(data, ref, price) {
    const travelDate = readableDate(parseDate(data.date)) || data.date;

    let breakdownLines = [];
    if (currentSelectionBreakdown && currentSelectionBreakdown.length > 0) {
      breakdownLines = currentSelectionBreakdown.map(
        (item) => `${item.count} x ${formatEuro(item.unitPrice)} ${item.label}`
      );
    } else {
      breakdownLines = [`1 x ${price || data.price || "€790"} ${data.passengers || "01-04 passengers (1 car)"}`];
    }

    const lines = [
      `*Booking Request #${ref || "RW-WEB"}*`,
      "RoamWise Ireland Chauffeur & Private Tours",
      "",
      "*Customer details*",
      `• Name: ${data.name || ""}`,
      `• Email: ${data.email || ""}`,
      data.phone ? `• Phone: ${data.phone}` : "",
      "",
      "*Booking details*",
      `• Service: ${data.service || "Not specified"}`,
      `• Date & Time: ${travelDate || ""} at ${data.time || ""}`,
      `• Vehicles & Passengers: ${data.passengers || ""}`,
      `• Pickup: ${data.pickup || ""}`,
      `• Drop-off: ${data.dropoff || ""}`,
      data.flight ? `• Flight: ${data.flight}` : "",
      data.bags ? `• Large Bags: ${data.bags}` : "",
      data.notes ? `• Notes: ${data.notes}` : "",
      "",
      "*Payment details*",
      `Subtotal: ${price || data.price || "€790"}`,
      ...breakdownLines,
      `Total: ${price || data.price || "€790"}`,
    ].filter(Boolean);
    return `${WHATSAPP_URL}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  /* "2026-08-22" reads as a database row. "Saturday, 22 August" reads as a
     day someone is travelling, which is what the reader is checking. */
  function readableDate(iso) {
    if (!iso) return "";
    const date = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long" });
  }

  const SENT_SUMMARY = {
    service: (d) => d.service,
    when: (d) => [readableDate(parseDate(d.date)) || d.date, d.time].filter(Boolean).join(", "),
    passengers: (d) => d.passengers || "01–04 passengers (1 car)",
    pickup: (d) => d.pickup,
    dropoff: (d) => d.dropoff,
  };

  function showForm({ reset = false, focus = false } = {}) {
    if (!bookingForm || !sentPanel || bookingForm.hidden === false) return;
    sentPanel.hidden = true;
    bookingForm.hidden = false;
    if (reset) {
      bookingForm.reset();
      selectedTierCounts["car-1"] = 1;
      selectedTierCounts["van-1"] = 0;
      selectedTierCounts["van-car"] = 0;
      selectedTierCounts["vans-2"] = 0;
      applyPassengerSelection();
      ruledFields().forEach(clearFieldError);
      setStatus("");
    }
    if (focus) serviceField?.focus({ preventScroll: true });
  }

  /* Read the summary back before anything else. A traveller who has just typed
     a pickup address on a phone wants to see it repeated, not a tick and a
     "thanks". It is also the last chance to catch a wrong date. */
  function showSent(data, url, opened) {
    if (!bookingForm || !sentPanel) return;

    Object.entries(SENT_SUMMARY).forEach(([key, read]) => {
      const el = sentPanel.querySelector(`[data-sent="${key}"]`);
      if (el) el.textContent = read(data) || "Not given";
    });

    const link = sentPanel.querySelector("[data-sent-whatsapp]");
    if (link) link.href = url;

    const lead = sentPanel.querySelector("[data-sent-lead]");
    if (lead) {
      lead.textContent = opened
        ? "The message is written and waiting in WhatsApp with every detail already in it. Press send there and it lands directly on the phone. Most requests are answered within the hour, day or night."
        : "Your browser blocked the WhatsApp window. Open it with the button below: the message is already written, you only need to press send.";
    }

    bookingForm.hidden = true;
    sentPanel.hidden = false;
    sentPanel.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
    });
    /* Focus moves into the panel so a screen reader lands on the outcome
       rather than being left on a submit button that no longer exists. */
    sentPanel.focus({ preventScroll: true });
  }

  /* -------------------------------------------------------------------------
     Booking Receipt / Summary Note Modal logic ("Nota ou Impressão")
  ------------------------------------------------------------------------- */
  const receiptModal = document.getElementById("booking-receipt-modal");
  const receiptClose = document.getElementById("booking-receipt-close");
  const receiptBackdrop = document.getElementById("booking-receipt-backdrop");
  const receiptPrintBtn = document.getElementById("receipt-print-btn");
  const receiptEditBtn = document.getElementById("receipt-edit-btn");
  const receiptConfirmBtn = document.getElementById("receipt-confirm-whatsapp-btn");

  let activeBookingData = null;
  let activeBookingRef = "";

  function closeBookingReceiptModal() {
    if (!receiptModal) return;
    receiptModal.hidden = true;
    document.body.style.overflow = "";
  }

  function openBookingReceiptModal(data) {
    if (!receiptModal) return;

    activeBookingData = data;
    activeBookingRef = "RW-" + Math.floor(10000 + Math.random() * 90000);

    const refEl = document.getElementById("receipt-ref");
    if (refEl) refEl.textContent = activeBookingRef;

    const issuedEl = document.getElementById("receipt-issued");
    if (issuedEl) {
      issuedEl.textContent = new Date().toLocaleDateString("en-IE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }

    const serviceEl = document.getElementById("receipt-service");
    if (serviceEl) serviceEl.textContent = data.service || "Private Chauffeur Tour";

    const whenEl = document.getElementById("receipt-when");
    const travelDate = readableDate(parseDate(data.date)) || data.date;
    if (whenEl) {
      whenEl.innerHTML = `
        <svg class="size-3.5 text-accent-deep" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        ${travelDate} at ${data.time || "TBD"}
      `;
    }

    const passEl = document.getElementById("receipt-passengers");
    if (passEl) {
      passEl.innerHTML = `
        <svg class="size-3.5 text-accent-deep" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        ${data.passengers || "01–04 passengers (1 car)"}
      `;
    }

    const nameEl = document.getElementById("receipt-name");
    if (nameEl) nameEl.textContent = data.name || "";

    const emailEl = document.getElementById("receipt-email");
    if (emailEl) emailEl.textContent = data.email || "";

    const phoneEl = document.getElementById("receipt-phone");
    if (phoneEl) phoneEl.textContent = data.phone || "Not specified";

    const pickupEl = document.getElementById("receipt-pickup");
    if (pickupEl) pickupEl.textContent = data.pickup || "";

    const dropoffEl = document.getElementById("receipt-dropoff");
    if (dropoffEl) dropoffEl.textContent = data.dropoff || "";

    const flightEl = document.getElementById("receipt-flight");
    if (flightEl) flightEl.textContent = data.flight ? `Flight: ${data.flight}` : "Flight: None";

    const bagsEl = document.getElementById("receipt-bags");
    if (bagsEl) bagsEl.textContent = data.bags ? `Large bags: ${data.bags}` : "Bags: Standard";

    const notesEl = document.getElementById("receipt-notes");
    if (notesEl) notesEl.textContent = data.notes || "None";

    const subtotalEl = document.getElementById("receipt-subtotal");
    if (subtotalEl) subtotalEl.textContent = data.price || "€790";

    const itemsListEl = document.getElementById("receipt-items-list");
    if (itemsListEl) {
      if (currentSelectionBreakdown && currentSelectionBreakdown.length > 0) {
        itemsListEl.innerHTML = currentSelectionBreakdown
          .map(
            (item) => `
            <div class="flex items-center justify-between py-1">
              <span class="text-ink font-medium">${item.count} x ${formatEuro(item.unitPrice)} ${item.label}</span>
              <span class="font-bold text-ink font-mono">${formatEuro(item.subtotal)}</span>
            </div>`
          )
          .join("");
      } else {
        itemsListEl.innerHTML = `
          <div class="flex items-center justify-between py-1">
            <span class="text-ink font-medium">1 x ${data.price || "€790"} ${data.passengers || "01-04 passengers (1 car)"}</span>
            <span class="font-bold text-ink font-mono">${data.price || "€790"}</span>
          </div>`;
      }
    }

    const totalEl = document.getElementById("receipt-total");
    if (totalEl) totalEl.textContent = data.price || "€790";

    receiptModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  receiptClose?.addEventListener("click", closeBookingReceiptModal);
  receiptBackdrop?.addEventListener("click", closeBookingReceiptModal);
  receiptEditBtn?.addEventListener("click", closeBookingReceiptModal);

  receiptPrintBtn?.addEventListener("click", () => {
    window.print();
  });

  receiptConfirmBtn?.addEventListener("click", () => {
    if (!activeBookingData) return;
    const url = whatsappRequestURL(activeBookingData, activeBookingRef, activeBookingData.price);
    closeBookingReceiptModal();

    /* Opened without the `noopener` feature string on purpose: browsers
       return null for that form, and null is the only signal a popup
       blocker gives us. The reference is severed straight afterwards. */
    const opened = window.open(url, "_blank");
    if (opened) opened.opener = null;

    showSent(activeBookingData, url, Boolean(opened));
  });

  if (bookingForm && sentPanel) {
    bookingForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const invalid = ruledFields().filter((field) => !validateField(field));

      if (invalid.length) {
        setStatus(
          `${invalid.length} ${invalid.length === 1 ? "field needs" : "fields need"} required fields are missing.`,
        );
        invalid[0].focus();
        invalid[0].scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "center",
        });
        return;
      }

      setStatus("");

      const data = Object.fromEntries(new FormData(bookingForm).entries());
      // Prompt user with booking summary note / receipt before sending to WhatsApp
      openBookingReceiptModal(data);
    });

    sentPanel.querySelector("[data-sent-restart]")?.addEventListener("click", () => {
      showForm({ reset: true, focus: true });
      bookingForm.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  /* -------------------------------------------------------------------------
     Reveal on scroll. One pass per element, skipped entirely under reduced
     motion so nothing depends on the observer ever firing.
  ------------------------------------------------------------------------- */
  const revealables = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealables.forEach((el) => el.classList.add("is-in"));
  } else {
    const pending = new Set(revealables);

    const reveal = (el) => {
      el.classList.add("is-in");
      pending.delete(el);
      observer.unobserve(el);
      if (!pending.size) window.removeEventListener("scroll", onScroll);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) reveal(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );

    /* Safety net. The observer only reports elements that are on screen when
       a frame is actually rendered, so anything jumped past by an anchor link
       or a flung scroll could otherwise sit at opacity 0 above the viewport.
       This runs straight off the scroll event rather than through
       requestAnimationFrame, so it does not share the observer's dependency
       on the rendering loop. Measuring at most a handful of elements is
       cheap enough not to need throttling. */
    const sweep = () => {
      pending.forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight) reveal(el);
      });
    };
    const onScroll = sweep;

    revealables.forEach((el) => observer.observe(el));
    window.addEventListener("scroll", onScroll, { passive: true });

    /* Anything already in view when the page loads, in case the observer's
       first callback is late or the page was restored mid-scroll. */
    sweep();
  }

  /* -------------------------------------------------------------------------
     Scroll to Top button with real-time progress bar
  ------------------------------------------------------------------------- */
  const scrollTopBtn = document.getElementById("scroll-to-top");
  const scrollTopProgress = document.getElementById("scroll-top-progress-bar");

  function updateScrollProgress() {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollY / docHeight) * 100)) : 0;

    if (scrollTopProgress) {
      scrollTopProgress.style.height = `${progress}%`;
    }

    if (scrollTopBtn) {
      if (scrollY > 280) {
        scrollTopBtn.classList.add("is-visible");
      } else {
        scrollTopBtn.classList.remove("is-visible");
      }
    }
  }

  scrollTopBtn?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  updateScrollProgress();
})();

