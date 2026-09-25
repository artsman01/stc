// STC — scripts. One IIFE per component, initialised by class / data-attribute.

// Реальная ширина системного скроллбара (не тонкого кастомного — от него
// отказались, см. _catalog-menu.scss) сильно отличается между ОС/браузером/
// настройками (macOS «Показывать всегда» vs авто-скрытие, Windows и т.д.) —
// статичный запас в CSS либо оставлял щель, либо не вмещал скроллбар.
// Измеряем один раз classическим приёмом (пустой div с overflow:scroll
// минус его же внутренний div) — используется и в CSS (--scrollbar-width,
// .catalog-menu__content), и напрямую в JS (lockPageScroll ниже — на body,
// не на html, см. комментарий в _header.scss про то, почему отказались от
// html{scrollbar-gutter:stable}).
var scrollbarWidth = (function () {
  var outer = document.createElement('div');
  outer.style.cssText = 'visibility:hidden;position:absolute;top:-9999px;width:100px;overflow:scroll;';
  document.body.appendChild(outer);
  var inner = document.createElement('div');
  inner.style.width = '100%';
  outer.appendChild(inner);
  var width = outer.offsetWidth - inner.offsetWidth;
  outer.parentNode.removeChild(outer);
  document.documentElement.style.setProperty('--scrollbar-width', width + 'px');
  return width;
})();

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

// Общая блокировка скролла страницы — используется и поиском, и
// выпадающим каталогом (оба полноэкранных оверлея должны запрещать скролл
// фона, весь скролл — внутри самого оверлея). Через position:fixed на body.
//
// Раньше ширину компенсировал html{scrollbar-gutter:stable} (глобально, на
// корневом элементе) — отказались: побочный эффект оказался хуже пользы,
// это "просачивалось" в расчёт containing block для ЛЮБОГО position:fixed
// элемента сайта (не только body), по-разному в разных браузерах, и попытки
// компенсировать это в каждом fixed-оверлее отдельно (сначала формулой
// "100vw + ширина скроллбара", потом измерением через пробник) оказались
// хрупкими и один раз реально сломали видимость скролла на реальном
// устройстве заказчика. Вместо глобального решения — точечное: сама
// lockPageScroll компенсирует ширину НАПРЯМУЮ на body (padding-right на
// измеренную ранее scrollbarWidth), причём только если скроллбар и
// правда был (сравниваем innerWidth с clientWidth ДО блокировки) — на
// коротких страницах без реального скролла компенсация не нужна и не
// добавляется. Никакой сайд-эффект на другие fixed-элементы не возникает,
// потому что html вообще не трогаем.
var pageScrollLockY = 0;
function lockPageScroll() {
  if (document.body.style.position === 'fixed') return;
  var hadScrollbar = window.innerWidth > document.documentElement.clientWidth;
  pageScrollLockY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = -pageScrollLockY + 'px';
  document.body.style.left = '0';
  document.body.style.right = '0';
  if (hadScrollbar) {
    document.body.style.paddingRight = scrollbarWidth + 'px';
    // .header--stuck — единственный элемент на странице, который сам
    // становится position:fixed (см. _header.scss) — его containing block
    // поэтому не body с только что добавленным paddingRight, а сразу
    // вьюпорт, в обход этой компенсации целиком. Пока не прилипла (наверху
    // страницы), шапка position:absolute внутри .hero, то есть в обычном
    // потоке — там paddingRight у body действует на неё как на всё
    // остальное, без доп. правок. Именно поэтому баг был заметен только
    // после прокрутки: прыжок (шапка резко становится на scrollbarWidth
    // шире всего прочего контента) возникал только если к моменту
    // блокировки шапка уже .header--stuck.
    var stuckHeader = document.querySelector('.header--stuck');
    if (stuckHeader) stuckHeader.style.right = scrollbarWidth + 'px';
  }
}
function unlockPageScroll() {
  if (document.body.style.position !== 'fixed') return;
  var scrollY = -parseInt(document.body.style.top || '0', 10);
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.paddingRight = '';
  var stuckHeader = document.querySelector('.header--stuck');
  if (stuckHeader) stuckHeader.style.right = '';
  // behavior:'instant' — без этого глобальный html{scroll-behavior:smooth}
  // анимирует возврат к scrollY, и виден прыжок вверх (после снятия
  // position:fixed страница на миг оказывается в 0) с последующей плавной
  // прокруткой обратно вместо мгновенного восстановления.
  window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });
}

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
    { title: 'Ультразвуковой дефектоскоп УСД-50 IPS', type: 'Товар', img: 'assets/search/product-1.png' },
    { title: 'Ультразвуковой контроль', type: 'Категория', img: 'assets/search/product-2.png' },
    { title: 'Ультразвуковой дефектоскоп УСД-60', type: 'Товар', img: 'assets/search/product-1.png' },
    { title: 'Ультразвуковой дефектоскоп на фазированных решетках УСД-60ФР', type: 'Товар', img: 'assets/search/product-1.png' },
    { title: 'Ультразвуковой дефектоскоп УСД-50 IPS', type: 'Товар', img: 'assets/search/product-1.png' },
    { title: 'Ультразвуковой контроль', type: 'Категория', img: 'assets/search/product-2.png' },
    { title: 'Ультразвуковой дефектоскоп УСД-60', type: 'Товар', img: 'assets/search/product-1.png' },
    { title: 'Ультразвуковой дефектоскоп на фазированных решетках УСД-60ФР', type: 'Товар', img: 'assets/search/product-1.png' },
    { title: 'Ультразвуковой дефектоскоп УСД-50 IPS', type: 'Товар', img: 'assets/search/product-1.png' },
    { title: 'Ультразвуковой контроль', type: 'Категория', img: 'assets/search/product-2.png' },
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

  function open() {
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    lockPageScroll();
    input.focus();
    var header = document.querySelector('.header');
    var catalogMenu = document.getElementById('catalog-menu');
    if (catalogMenu) {
      catalogMenu.classList.remove('is-open');
      catalogMenu.setAttribute('aria-hidden', 'true');
    }
    var hamburgerMenu = document.getElementById('hamburger-menu');
    if (hamburgerMenu && hamburgerMenu.classList.contains('is-open')) {
      hamburgerMenu.classList.remove('is-open');
      hamburgerMenu.classList.remove('is-level2');
      hamburgerMenu.setAttribute('aria-hidden', 'true');
      var hamburgerTrigger = document.getElementById('hamburger-trigger');
      if (hamburgerTrigger) hamburgerTrigger.setAttribute('aria-expanded', 'false');
    }
    if (header) header.classList.remove('header--menu-open');
  }

  function close() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    unlockPageScroll();
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

// Выпадающее меню каталога — сайдбар открывается кликом по «Каталог» в
// шапке (теперь кнопка, не ссылка — сама навигация на catalog.html убрана,
// открывать/закрывать список категорий можно только так), закрывается
// повторным кликом, Escape-ом или кликом по затемнению. Панель контента
// справа (.catalog-menu__content) отдельно показывается при наведении на
// любой пункт НК.
//
// Реальные Figma-данные (грид товаров) есть только для «Ультразвукового
// контроля» — по просьбе заказчика остальные 9 пунктов НК тоже открывают
// панель на ховер (не просто статично неактивны), переиспользуя тот же пул
// из 7 карточек, но разным количеством на каждый пункт (PRODUCT_COUNTS в
// разметке — data-count), чтобы переключение между пунктами было заметно
// (разная высота грида), а не выглядело как ничего не происходит. Это
// сознательная имитация «пока нет реальных данных на каждую подкатегорию»,
// не окончательный контент — понадобятся отдельные Figma-ссылки на панели
// остальных 9 подкатегорий, чтобы получить настоящие товары под каждую.
(function () {
  var trigger = document.getElementById('catalog-trigger');
  var menu = document.getElementById('catalog-menu');
  if (!trigger || !menu) return;

  // cat — фейковая категория для демо-фильтрации по табам (см. renderPanel
  // и обработчик клика по .tab ниже, по просьбе заказчика — "просто для
  // примера"), реальной привязки товар→категория в данных нет.
  var PRODUCTS = [
    { img: 'assets/catalog-menu/scanners.png', title: 'Сканеры-дефектоскопы', cat: 'main' },
    { img: 'assets/catalog-menu/thickness-gauges.png', title: 'Ультразвуковые толщиномеры', cat: 'consumable' },
    { img: 'assets/catalog-menu/flaw-detectors.png', title: 'Ультразвуковые дефектоскопы', cat: 'extra' },
    { img: 'assets/catalog-menu/automated-lines.png', title: 'Автоматизированные линии', cat: 'main' },
    { img: 'assets/catalog-menu/par-sensors.png', title: 'Роликовые датчики на фазированных решётках ФАР', cat: 'consumable' },
    { img: 'assets/catalog-menu/gel.png', title: 'Гель для УЗК', cat: 'extra' },
    { img: 'assets/catalog-menu/accessories.png', title: 'Вспомогательные приборы и принадлежности', cat: 'main' }
  ];

  var header = document.querySelector('.header');
  var groups = menu.querySelectorAll('.catalog-menu__group');
  var contentPanel = menu.querySelector('.catalog-menu__content');
  var contentHeaderIcon = contentPanel.querySelector('.catalog-menu__content-header use');
  var contentHeaderTitle = contentPanel.querySelector('.catalog-menu__content-header span');
  var grid = contentPanel.querySelector('.catalog-menu__grid');
  var tabs = contentPanel.querySelectorAll('.catalog-menu__tabs-wrap .tab');
  var panelSubitems = menu.querySelectorAll('.catalog-menu__subitem[data-panel]');

  function openMenu() {
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    if (header) header.classList.add('header--menu-open');
    lockPageScroll();
    var searchOverlay = document.querySelector('.search-overlay');
    if (searchOverlay && searchOverlay.classList.contains('is-open')) {
      var searchCloseBtn = document.querySelector('.search-panel__close');
      if (searchCloseBtn) searchCloseBtn.click();
    }
  }

  function closeMenu() {
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    if (header) header.classList.remove('header--menu-open');
    contentPanel.classList.remove('is-visible');
    unlockPageScroll();
  }

  trigger.addEventListener('click', function (e) {
    e.preventDefault();
    if (menu.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) closeMenu();
  });

  menu.addEventListener('click', function (e) {
    if (e.target === menu) closeMenu();
  });

  // Правая панель НЕ закрывается сама по себе от ухода курсора в тёмную
  // область — по явной просьбе заказчика. Она остаётся как есть, пока
  // либо не навести на ДРУГОЙ пункт первого уровня (тогда renderPanel
  // просто перерисовывает её под новый пункт), либо не закрыть всё меню
  // целиком (closeMenu — клик по триггеру/Escape/клик по затемнению).
  function showContent() {
    contentPanel.classList.add('is-visible');
  }

  function renderGrid(filter) {
    grid.innerHTML = '';
    var filtered = filter === 'all' ? grid.__items : grid.__items.filter(function (p) {
      return p.cat === filter;
    });
    for (var i = 0; i < filtered.length; i += 4) {
      var row = document.createElement('div');
      row.className = 'catalog-menu__row';
      filtered.slice(i, i + 4).forEach(function (p) {
        row.insertAdjacentHTML(
          'beforeend',
          '<a class="catalog-menu__card" href="catalog.html">' +
            '<span class="catalog-menu__card-img"><img src="' + p.img + '" alt=""></span>' +
            '<span class="catalog-menu__card-title">' + p.title + '</span>' +
          '</a>'
        );
      });
      grid.appendChild(row);
    }
  }

  function renderPanel(item) {
    var iconId = item.dataset.panel;
    var count = parseInt(item.dataset.count, 10) || PRODUCTS.length;
    var title = item.querySelector('span').textContent;

    contentHeaderIcon.setAttribute('href', 'assets/icons/sprite.svg#' + iconId);
    contentHeaderTitle.textContent = title;

    // Пул из 7 карточек зациклен по модулю — чтобы демонстрационный
    // data-count мог быть больше длины пула (например 24, см. HTML) и всё
    // равно заполнял столько рядов, сколько нужно, без обрыва на 7-й.
    var items = [];
    for (var n = 0; n < count; n++) {
      items.push(PRODUCTS[n % PRODUCTS.length]);
    }
    grid.__items = items;

    tabs.forEach(function (tab) {
      tab.classList.toggle('tab--active', tab.dataset.filter === 'all');
    });
    renderGrid('all');
  }

  // Табы фильтруют текущий грид по демо-категории товара (см. PRODUCTS выше)
  // — просто пример живого переключения, реальной категоризации товаров
  // ещё нет.
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        t.classList.remove('tab--active');
      });
      tab.classList.add('tab--active');
      renderGrid(tab.dataset.filter);
    });
  });

  panelSubitems.forEach(function (item) {
    item.addEventListener('mouseenter', function () {
      showContent();
      panelSubitems.forEach(function (i) {
        i.classList.remove('is-active');
      });
      item.classList.add('is-active');
      renderPanel(item);
    });
  });

  // Верхнеуровневые группы (НК / Механические испытания / Анализ металлов)
  // раскрываются по клику, как аккордеон в подвале — только одна открыта
  // одновременно.
  groups.forEach(function (group) {
    var toggle = group.querySelector('.catalog-menu__group-toggle');
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      var isOpen = group.classList.contains('is-open');
      groups.forEach(function (g) {
        g.classList.remove('is-open');
        g.querySelector('.catalog-menu__group-toggle').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        group.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();

// Гамбургер-меню — мобильный/планшетный аналог catalog-menu. Список
// категорий (аккордеон НК/МИ/АМ) использует ТЕ ЖЕ классы и ТУ ЖЕ разметку,
// что и catalog-menu (см. index.html) — так что аккордеон здесь не
// переписан, просто ещё раз выбираем те же .catalog-menu__group внутри
// #hamburger-menu и вешаем идентичный обработчик. Второй уровень (панель
// товаров подкатегории) — по правке заказчика открывается ОТДЕЛЬНЫМ
// полноэкранным слоем (класс .is-level2 прячет сайдбар-список, показывает
// .hamburger-menu__detail на всю ширину), а не рядом, как в desktop-версии.
(function () {
  var trigger = document.getElementById('hamburger-trigger');
  var menu = document.getElementById('hamburger-menu');
  if (!trigger || !menu) return;

  // Тот же пул демо-карточек, что у catalog-menu (см. его комментарий выше
  // про имитацию — реальных данных по подкатегориям всё ещё нет), но своя
  // копия: карточки здесь рендерятся в CSS Grid (.hamburger-menu__grid),
  // а не построчно, как в фикс-ширины desktop-варианте, так что общий
  // рендер-код всё равно пришлось бы писать заново.
  var PRODUCTS = [
    { img: 'assets/catalog-menu/scanners.png', title: 'Сканеры-дефектоскопы', cat: 'main' },
    { img: 'assets/catalog-menu/thickness-gauges.png', title: 'Ультразвуковые толщиномеры', cat: 'consumable' },
    { img: 'assets/catalog-menu/flaw-detectors.png', title: 'Ультразвуковые дефектоскопы', cat: 'extra' },
    { img: 'assets/catalog-menu/automated-lines.png', title: 'Автоматизированные линии', cat: 'main' },
    { img: 'assets/catalog-menu/par-sensors.png', title: 'Роликовые датчики на фазированных решётках ФАР', cat: 'consumable' },
    { img: 'assets/catalog-menu/gel.png', title: 'Гель для УЗК', cat: 'extra' },
    { img: 'assets/catalog-menu/accessories.png', title: 'Вспомогательные приборы и принадлежности', cat: 'main' }
  ];

  var header = document.querySelector('.header');
  var groups = menu.querySelectorAll('.catalog-menu__group');
  var panelSubitems = menu.querySelectorAll('.catalog-menu__subitem[data-panel]');
  var detail = menu.querySelector('.hamburger-menu__detail');
  var detailHeaderIcon = detail.querySelector('.catalog-menu__content-header use');
  var detailHeaderTitle = detail.querySelector('.catalog-menu__content-header span');
  var grid = detail.querySelector('.hamburger-menu__grid');
  var tabs = detail.querySelectorAll('.tabs .tab');
  var backBtn = detail.querySelector('.hamburger-menu__back');
  var closeBtns = menu.querySelectorAll('.hamburger-menu__close');

  function openMenu() {
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    if (header) header.classList.add('header--menu-open');
    lockPageScroll();
    var searchOverlay = document.querySelector('.search-overlay');
    if (searchOverlay && searchOverlay.classList.contains('is-open')) {
      var searchCloseBtn = document.querySelector('.search-panel__close');
      if (searchCloseBtn) searchCloseBtn.click();
    }
  }

  function closeMenu() {
    menu.classList.remove('is-open');
    menu.classList.remove('is-level2');
    menu.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    if (header) header.classList.remove('header--menu-open');
    unlockPageScroll();
  }

  trigger.addEventListener('click', function () {
    if (menu.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  closeBtns.forEach(function (btn) {
    btn.addEventListener('click', closeMenu);
  });

  // Клик по пустому затемнённому пространству (не по самому дроверу/детали)
  // закрывает меню — тот же приём, что у catalog-menu (e.target === menu
  // отличает клик по самому фону от клика по чему-то внутри него).
  menu.addEventListener('click', function (e) {
    if (e.target === menu) closeMenu();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !menu.classList.contains('is-open')) return;
    if (menu.classList.contains('is-level2')) {
      menu.classList.remove('is-level2');
    } else {
      closeMenu();
    }
  });

  function renderGrid(filter) {
    grid.innerHTML = '';
    var filtered = filter === 'all' ? grid.__items : grid.__items.filter(function (p) {
      return p.cat === filter;
    });
    filtered.forEach(function (p) {
      grid.insertAdjacentHTML(
        'beforeend',
        '<a class="hamburger-menu__card" href="catalog.html">' +
          '<span class="hamburger-menu__card-img"><img src="' + p.img + '" alt=""></span>' +
          '<span class="hamburger-menu__card-title">' + p.title + '</span>' +
        '</a>'
      );
    });
  }

  function openDetail(item) {
    var iconId = item.dataset.panel;
    var count = parseInt(item.dataset.count, 10) || PRODUCTS.length;
    var title = item.querySelector('span').textContent;

    detailHeaderIcon.setAttribute('href', 'assets/icons/sprite.svg#' + iconId);
    detailHeaderTitle.textContent = title;

    var items = [];
    for (var n = 0; n < count; n++) {
      items.push(PRODUCTS[n % PRODUCTS.length]);
    }
    grid.__items = items;

    tabs.forEach(function (tab) {
      tab.classList.toggle('tab--active', tab.dataset.filter === 'all');
    });
    renderGrid('all');

    menu.classList.add('is-level2');
    detail.scrollTop = 0;
  }

  panelSubitems.forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      openDetail(item);
    });
  });

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        t.classList.remove('tab--active');
      });
      tab.classList.add('tab--active');
      renderGrid(tab.dataset.filter);
    });
  });

  backBtn.addEventListener('click', function () {
    menu.classList.remove('is-level2');
  });

  // Аккордеон НК/МИ/АМ — идентичен по поведению catalog-menu (только один
  // раскрыт одновременно), но это отдельный набор .catalog-menu__group
  // внутри #hamburger-menu, поэтому обработчик свой.
  groups.forEach(function (group) {
    var toggle = group.querySelector('.catalog-menu__group-toggle');
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      var isOpen = group.classList.contains('is-open');
      groups.forEach(function (g) {
        g.classList.remove('is-open');
        g.querySelector('.catalog-menu__group-toggle').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        group.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();
