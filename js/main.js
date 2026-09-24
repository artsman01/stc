// STC — scripts. One IIFE per component, initialised by class / data-attribute.

// Phone mask for every input[type="tel"] on the page — ported as-is from
// Domarti (same reference project the rest of the site follows). Renders
// "+7 (___) ___-__-__" on focus and fills in only the digits the person
// actually types; a leading 7/8 is dropped since the country code is implicit.
(function () {
  var TEMPLATE = "+7 (___) ___-__-__";

  function initPhoneMask(input) {
    var digitPositions = [];
    for (var i = 0; i < TEMPLATE.length; i++) {
      if (TEMPLATE[i] === "_") digitPositions.push(i);
    }

    // Local-number digits only (no country code) — kept as our own state
    // instead of re-parsed from input.value, so the fixed "+7" prefix can
    // never be mistaken for a digit the user actually typed.
    var digits = [];

    function render() {
      var chars = TEMPLATE.split("");
      for (var i = 0; i < digitPositions.length; i++) {
        chars[digitPositions[i]] = digits[i] !== undefined ? digits[i] : "_";
      }
      input.value = chars.join("");
    }

    function cursorPos() {
      return digits.length >= digitPositions.length
        ? TEMPLATE.length
        : digitPositions[digits.length];
    }

    function placeCursor() {
      var pos = cursorPos();
      input.setSelectionRange(pos, pos);
    }

    function insertText(text) {
      var typed = text.replace(/\D/g, "");
      for (var i = 0; i < typed.length; i++) {
        if (digits.length === 0 && (typed[i] === "7" || typed[i] === "8")) {
          continue; // country code is implicit — a leading 7/8 is redundant
        }
        if (digits.length < digitPositions.length) {
          digits.push(typed[i]);
        }
      }
    }

    input.addEventListener("focus", function () {
      render();
      requestAnimationFrame(placeCursor);
    });

    input.addEventListener("beforeinput", function (e) {
      if (
        e.inputType === "insertText" ||
        e.inputType === "insertFromPaste" ||
        e.inputType === "insertCompositionText"
      ) {
        e.preventDefault();
        insertText(e.data || "");
        render();
        placeCursor();
      } else if (e.inputType && e.inputType.indexOf("delete") === 0) {
        e.preventDefault();
        digits.pop();
        render();
        placeCursor();
      }
    });

    input.addEventListener("click", function () {
      placeCursor();
    });

    input.addEventListener("blur", function () {
      if (digits.length === 0) input.value = "";
    });
  }

  document.querySelectorAll('input[type="tel"]').forEach(initPhoneMask);
})();

// Catalog tabs filter which .home-catalog__group is shown — "all" (the
// default) shows every group, any other tab shows only the group with the
// matching data-category and hides the rest (separator included, since each
// group carries its own — see the CSS comment on .home-catalog__group).
(function () {
  function initCatalogTabs(section) {
    var tabs = section.querySelectorAll('.home-catalog__tabs .tab');
    var groups = section.querySelectorAll('.home-catalog__group');
    if (!tabs.length || !groups.length) return;

    function apply(category) {
      groups.forEach(function (group) {
        group.hidden = category !== 'all' && group.dataset.category !== category;
      });
      tabs.forEach(function (tab) {
        tab.classList.toggle('tab--active', tab.dataset.category === category);
      });
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        apply(tab.dataset.category);
      });
    });
  }

  document.querySelectorAll('.home-catalog').forEach(initCatalogTabs);
})();

// Industries slider: below xl, cards are a fixed width per breakpoint (CSS,
// see .industry-card) and slidesPerView stays "auto" — Swiper just shows
// however many fit, matching the Figma anchors, where the last visible card
// is always cropped mid-way rather than the row filling exactly. From xl,
// slidesPerView switches to a plain 4: Swiper then sizes the 4 slides itself
// to fill the row exactly, so they stretch on a wide desktop instead of
// staying pinned to Figma's 370px with extra empty space next to them.
//
// The nav buttons exist twice in the markup (beside the description on
// desktop/tablet, below the slider on mobile — only one copy is ever
// visible, see the CSS comment on .industries__nav) and share the same
// classes; passing Swiper a selector string instead of an element wires
// up every match, so both copies drive the same slider in sync.
(function () {
  function initIndustries(section) {
    var swiperEl = section.querySelector('.industries__slider');
    if (!swiperEl) return;

    new Swiper(swiperEl, {
      slidesPerView: 'auto',
      spaceBetween: 8,
      speed: 450,
      // Not looping (unlike Domarti's .material-slider): reaching either
      // end disables that arrow instead of wrapping around.
      wrapperClass: 'industries__track',
      slideClass: 'industry-card',
      navigation: {
        nextEl: '.industries__nav-next',
        prevEl: '.industries__nav-prev',
      },
      breakpoints: {
        1200: { slidesPerView: 4, spaceBetween: 8 },
      },
    });
  }

  document.querySelectorAll('.industries').forEach(initIndustries);
})();

// Solutions slider: same wiring as Industries just above (fixed-width
// peeking cards below xl, Swiper stretches 4 across from xl, not looping,
// nav buttons duplicated for mobile and matched by selector string) — see
// that comment for the reasoning, not repeated here.
(function () {
  function initSolutions(section) {
    var swiperEl = section.querySelector('.solutions__slider');
    if (!swiperEl) return;

    new Swiper(swiperEl, {
      slidesPerView: 'auto',
      spaceBetween: 8,
      speed: 450,
      wrapperClass: 'solutions__track',
      slideClass: 'solution-card',
      navigation: {
        nextEl: '.solutions__nav-next',
        prevEl: '.solutions__nav-prev',
      },
      breakpoints: {
        1200: { slidesPerView: 4, spaceBetween: 8 },
      },
    });
  }

  document.querySelectorAll('.solutions').forEach(initSolutions);
})();

// .header--overlay scrolls away with the hero it's laid over (see the CSS
// comment on .header--stuck) — past a few pixels of scroll it needs to
// become a plain fixed bar instead, so the rest of the page keeps a header.
(function () {
  var header = document.querySelector('.header--overlay');
  if (!header) return;

  var STUCK_AT = 4;
  var stuck = false;
  var ticking = false;

  function apply() {
    var shouldStick = window.scrollY > STUCK_AT;
    if (shouldStick !== stuck) {
      stuck = shouldStick;
      header.classList.toggle('header--stuck', stuck);
    }
    ticking = false;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(apply);
  }

  apply();
  window.addEventListener('scroll', onScroll, { passive: true });
})();
