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
  const WHATSAPP_URL = "https://wa.me/353894791366";

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
     Tour city filters and carousel navigation.
     Only one city's tours are shown at a time. The carousel scrolls 1 by 1.
  ------------------------------------------------------------------------- */
  const tourFilters = Array.from(document.querySelectorAll("[data-tour-filter]"));
  const tourCards = Array.from(document.querySelectorAll("[data-tour-city]"));
  const tourGrid = document.getElementById("tour-grid");
  const tourPrev = document.getElementById("tour-prev");
  const tourNext = document.getElementById("tour-next");

  function getTourScrollStep() {
    return tourGrid ? tourGrid.clientWidth : 400;
  }

  function updateTourNav() {
    if (!tourGrid || !tourPrev || !tourNext) return;
    const maxScroll = tourGrid.scrollWidth - tourGrid.clientWidth - 10;
    tourPrev.disabled = tourGrid.scrollLeft <= 5;
    tourNext.disabled = tourGrid.scrollLeft >= maxScroll;
  }

  function selectTourCity(city) {
    tourFilters.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.tourFilter === city));
    });
    tourCards.forEach((card) => {
      card.hidden = card.dataset.tourCity !== city;
    });
    if (tourGrid) {
      tourGrid.scrollTo({ left: 0, behavior: "smooth" });
      setTimeout(updateTourNav, 150);
    }
  }

  tourPrev?.addEventListener("click", () => {
    if (tourGrid) {
      tourGrid.scrollBy({ left: -getTourScrollStep(), behavior: "smooth" });
      setTimeout(updateTourNav, 300);
    }
  });

  tourNext?.addEventListener("click", () => {
    if (tourGrid) {
      tourGrid.scrollBy({ left: getTourScrollStep(), behavior: "smooth" });
      setTimeout(updateTourNav, 300);
    }
  });

  tourGrid?.addEventListener("scroll", updateTourNav, { passive: true });
  window.addEventListener("resize", updateTourNav, { passive: true });

  tourFilters.forEach((button) => {
    button.addEventListener("click", () => selectTourCity(button.dataset.tourFilter));
  });

  const toursTabsWrapper = document.querySelector(".tours-tabs-wrapper");
  const toursSwipeHint = document.querySelector(".tours-swipe-hint");
  toursTabsWrapper?.addEventListener("scroll", () => {
    if (toursSwipeHint) toursSwipeHint.style.opacity = "0.2";
  }, { passive: true });

  if (tourFilters.length && tourCards.length) selectTourCity("dublin");

  /* -------------------------------------------------------------------------
     Booking form elements
  ------------------------------------------------------------------------- */
  const bookingForm = document.getElementById("booking-form");
  const statusEl = document.getElementById("form-status");
  const sentPanel = document.getElementById("booking-sent");

  const serviceField = document.getElementById("f-service");
  const passengersField = document.getElementById("f-passengers");

  /* Move a selection into the booking form and scroll to it. Used by every
     "Book" button and by the hero quote bar. */
  function sendToBooking({ service, date, passengers } = {}) {
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
    if (date) bookingDate?.set(date);
    if (passengers && passengersField) passengersField.value = passengers;

    /* Assigning to .value fires neither input nor change, so nothing so far
       has told the form these fields were answered. Without this, a date
       carried down from the hero quote bar lands underneath a live "Pick the
       day you travel." */
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

  document.querySelectorAll("[data-book]").forEach((button) => {
    button.addEventListener("click", () => {
      sendToBooking({ service: button.dataset.book });
    });
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
    "f-service": (value) => (value ? null : "Choose the transfer or tour you need."),
    "f-name": (value) => (value.trim().length >= 2 ? null : "Tell John who to look for."),
    /* Empty and malformed are different mistakes and get different sentences.
       Telling someone who has typed nothing that their email "does not look
       right" reads as a bug in the form. */
    "f-email": (value) => {
      if (!value.trim()) return "John needs an address to reply to.";
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
        ? null
        : "That email does not look right. John replies to this address.";
    },
    "f-passengers": (value) => {
      const n = Number(value);
      return Number.isInteger(n) && n >= 1 && n <= 4
        ? null
        : "One car takes four passengers. For a larger group, message John.";
    },
    /* These two read what was typed, not a parsed value, so "did not read"
       and "left blank" stay separate sentences. Telling someone who typed a
       date that they have not picked one is what started all this. */
    "f-date": (raw) => {
      if (!raw.trim()) return "Pick the day you travel.";
      const value = parseDate(raw);
      if (!value) return "That date did not read. Day, month, year, like 22/08/2026.";
      if (value < todayISO) return "That date has already passed.";
      if (value > maxISO) return "Check the year on that. For a date further out than two years, message John.";
      return null;
    },
    "f-time": (raw) => {
      if (!raw.trim()) return "What time should John be there?";
      return parseTime(raw) ? null : "That time did not read. Try 06:40, on a 24-hour clock.";
    },
    "f-pickup": (value) => (value.trim().length >= 3 ? null : "Where should John collect you?"),
    "f-dropoff": (value) => (value.trim().length >= 3 ? null : "Where are you going?"),
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
     filled in travels with it, so John never has to ask a follow-up for
     something that was already on the form. */
  function whatsappRequestURL(data) {
    const lines = [
      "Booking request from the website",
      `Service: ${data.service || "not specified"}`,
      `Name: ${data.name || ""}`,
      `Email: ${data.email || ""}`,
      data.phone ? `Phone: ${data.phone}` : "",
      `Date: ${data.date || ""} at ${data.time || ""}`,
      `Passengers: ${data.passengers || ""}`,
      `Pickup: ${data.pickup || ""}`,
      `Drop-off: ${data.dropoff || ""}`,
      data.flight ? `Flight: ${data.flight}` : "",
      data.bags ? `Large bags: ${data.bags}` : "",
      data.notes ? `Notes: ${data.notes}` : "",
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
    when: (d) => [readableDate(d.date), d.time].filter(Boolean).join(", "),
    passengers: (d) => (d.passengers ? `${d.passengers} ${d.passengers === "1" ? "passenger" : "passengers"}` : ""),
    pickup: (d) => d.pickup,
    dropoff: (d) => d.dropoff,
  };

  function showForm({ reset = false, focus = false } = {}) {
    if (!bookingForm || !sentPanel || bookingForm.hidden === false) return;
    sentPanel.hidden = true;
    bookingForm.hidden = false;
    if (reset) {
      bookingForm.reset();
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
        ? "The message is written and waiting in WhatsApp with every detail already in it. Press send there and it lands on John's own phone. He answers most requests within the hour, day or night."
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

  if (bookingForm && sentPanel) {
    bookingForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const invalid = ruledFields().filter((field) => !validateField(field));

      if (invalid.length) {
        setStatus(
          `${invalid.length} ${invalid.length === 1 ? "field needs" : "fields need"} a moment before this can go to John.`,
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
      const url = whatsappRequestURL(data);

      /* Opened without the `noopener` feature string on purpose: browsers
         return null for that form, and null is the only signal a popup
         blocker gives us. The reference is severed straight afterwards. */
      const opened = window.open(url, "_blank");
      if (opened) opened.opener = null;

      showSent(data, url, Boolean(opened));
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

