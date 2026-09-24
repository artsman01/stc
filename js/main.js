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
  // Cards must always be equal height. align-items: stretch on the track
  // (see _solutions.scss) handles most cases, but a Chrome layout quirk
  // silently defeats it once a card's image block and text block both have
  // real content at the same time (each stretches fine alone — verified by
  // isolating them — only the combination breaks). JS is the reliable
  // fallback: measure natural heights and lock every card to the tallest.
  function equalizeHeights(cards) {
    if (!cards.length) return;
    cards.forEach(function (c) {
      c.style.height = '';
    });
    var max = 0;
    cards.forEach(function (c) {
      var h = c.getBoundingClientRect().height;
      if (h > max) max = h;
    });
    cards.forEach(function (c) {
      c.style.height = max + 'px';
    });
  }

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

    var cards = section.querySelectorAll('.solution-card');
    var resizeTimer;
    equalizeHeights(cards);
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        equalizeHeights(cards);
      }, 150);
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
    ticking = false;
    // Пока поиск заблокировал скролл через body{position:fixed}, window.scrollY
    // молча обнуляется браузером (document.scrollHeight схлопывается) — без
    // этой проверки шапка на миг теряла .header--stuck в фоне (невидимо, пока
    // поиск открыт поверх неё), а сразу после закрытия и мгновенного
    // восстановления scrollY получала её обратно — этот один кадр без класса
    // читался как «шапка исчезла и появилась снова».
    if (document.body.style.position === 'fixed') return;
    var shouldStick = window.scrollY > STUCK_AT;
    if (shouldStick !== stuck) {
      stuck = shouldStick;
      header.classList.toggle('header--stuck', stuck);
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(apply);
  }

  apply();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

// AboutBullets: cards must be equal height within a row/grid but are
// explicitly NOT square and must never crop their content (client
// reverted an earlier square-everywhere version for exactly that reason) —
// so height has to come from whichever card's real content is tallest,
// not from CSS. align-items: stretch is the obvious tool, but a card here
// holds both an image block and a text block together, which is exactly
// the combination that silently defeats stretch in Chrome (see Solutions
// above) — same JS fallback reused here. Below md the layout is a single
// column (no "row" to match heights within), so it's left at its natural
// per-card height there instead of being forced equal.
(function () {
  var MD = 768;

  function equalizeHeights(cards) {
    if (!cards.length) return;
    cards.forEach(function (c) {
      c.style.height = '';
    });
    if (window.innerWidth < MD) return;
    var max = 0;
    cards.forEach(function (c) {
      var h = c.getBoundingClientRect().height;
      if (h > max) max = h;
    });
    cards.forEach(function (c) {
      c.style.height = max + 'px';
    });
  }

  function initAboutBullets(section) {
    var cards = section.querySelectorAll('.about-bullet');
    var resizeTimer;
    equalizeHeights(cards);
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        equalizeHeights(cards);
      }, 150);
    });
  }

  document.querySelectorAll('.about-bullets').forEach(initAboutBullets);
})();

// Footer category accordions — CSS alone keeps everything open above md
// (see _footer.scss), so the click handler doesn't need to check viewport
// width at all: toggling .is-open above md just has no visual effect.
(function () {
  document.querySelectorAll('.footer__col-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var col = btn.closest('.footer__col');
      var expanded = col.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  });
})();

// Search overlay — opens from the header's search icon-btn, sits right
// below the header (see .search-overlay's top: var(--header-h) — the
// header itself stays visible/clickable, only the page below it dims).
// There's no real product search backend yet (the catalog page only has
// category cards, not individual products), so results are a small fixed
// mock list — enough to show the real interaction (typing, clearing,
// clicking a tag, hover, Escape/backdrop close), not a real filtered search.
(function () {
  var overlay = document.getElementById('search-overlay');
  var openBtn = document.querySelector('.icon-btn[aria-label="Поиск"]');
  if (!overlay || !openBtn) return;

  var panel = overlay.querySelector('.search-panel');
  var input = overlay.querySelector('.search-panel__input');
  var clearBtn = overlay.querySelector('.search-panel__clear');
  var closeBtn = overlay.querySelector('.search-panel__close');
  var tags = overlay.querySelectorAll('.search-panel__tag');
  var countEl = overlay.querySelector('.search-panel__count');
  var resultsEl = overlay.querySelector('.search-panel__results');

  var MOCK_RESULTS = [
    { title: 'Ультразвуковой дефектоскоп на фазированных решетках УСД-60ФР', type: 'Товар', img: 'assets/search/product-1.png' },
    { title: 'Ультразвуковой дефектоскоп УСД-50 IPS', type: 'Товар', img: 'assets/search/product-1.png' },
    { title: 'Ультразвуковой дефектоскоп на фазированных решетках УСД-60ФР', type: 'Товар', img: 'assets/search/product-1.png' },
    { title: 'Ультразвуковой дефектоскоп УСД-60', type: 'Товар', img: 'assets/search/product-1.png' },
    { title: 'Ультразвуковой контроль', type: 'Категория', img: 'assets/search/product-2.png' },
    { title: 'Ультразвуковой дефектоскоп на фазированных решетках УСД-60ФР', type: 'Товар', img: 'assets/search/product-1.png' },
    { title: 'Ультразвуковой дефектоскоп УСД-60', type: 'Товар', img: 'assets/search/product-1.png' },
    { title: 'Ультразвуковой дефектоскоп на фазированных решетках УСД-60ФР', type: 'Товар', img: 'assets/search/product-1.png' },
    { title: 'Ультразвуковой дефектоскоп УСД-60', type: 'Товар', img: 'assets/search/product-1.png' },
    { title: 'Ультразвуковой дефектоскоп на фазированных решетках УСД-60ФР', type: 'Товар', img: 'assets/search/product-1.png' },
  ];

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderResults(query) {
    if (!query) {
      resultsEl.innerHTML = '';
      countEl.hidden = true;
      return;
    }
    countEl.hidden = false;
    countEl.textContent = 'Найдено: ' + MOCK_RESULTS.length;
    resultsEl.innerHTML = MOCK_RESULTS.map(function (item) {
      return (
        '<a class="search-result" href="catalog.html">' +
        '<img class="search-result__img" src="' + item.img + '" alt="" loading="lazy">' +
        '<span class="search-result__text">' +
        '<span class="search-result__title">' + escapeHtml(item.title) + '</span>' +
        '<span class="search-result__type">' + escapeHtml(item.type) + '</span>' +
        '</span>' +
        '</a>'
      );
    }).join('');
  }

  function updateClearBtn() {
    clearBtn.hidden = !input.value;
  }

  // Блокируем скролл через position:fixed на body (а не overflow:hidden на
  // html) — html держит overflow-y:auto + scrollbar-gutter:stable
  // постоянно (см. _header.scss), так что место под скроллбар зарезервировано
  // всегда; overflow:hidden на html эту резервацию сбрасывает (проверено
  // через CDP), и контент/шапка дёргались вправо на ширину скроллбара.
  function open() {
    var scrollY = window.scrollY;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.position = 'fixed';
    document.body.style.top = -scrollY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    input.focus();
  }

  function close() {
    var scrollY = -parseInt(document.body.style.top || '0', 10);
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    // behavior:'instant' — без этого глобальный html{scroll-behavior:smooth}
    // анимирует возврат к scrollY, и виден прыжок вверх (после снятия
    // position:fixed страница на миг оказывается в 0) с последующей плавной
    // прокруткой обратно вместо мгновенного восстановления.
    window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });
  }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);

  // Клик именно по затемнённому фону (не по самой белой панели) закрывает.
  overlay.addEventListener('click', function (e) {
    if (!panel.contains(e.target)) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
  });

  input.addEventListener('input', function () {
    updateClearBtn();
    renderResults(input.value.trim());
  });

  clearBtn.addEventListener('click', function () {
    input.value = '';
    updateClearBtn();
    renderResults('');
    input.focus();
  });

  tags.forEach(function (tag) {
    tag.addEventListener('click', function () {
      input.value = tag.textContent.trim();
      updateClearBtn();
      renderResults(input.value);
      input.focus();
    });
  });
})();
