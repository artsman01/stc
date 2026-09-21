# СТК — вёрстка

Вёрстка сайта СТК на **Bootstrap 5 + SCSS**, без фреймворков и сборщиков поверх этого. Схема взята из проекта Domarti (`~/Desktop/Domarti`), который заказчика устраивал: плоские HTML-страницы в корне, один SCSS-файл на компонент, один `main.js`.

Этот файл — общая память проекта: по нему можно быстро войти в курс дела человеку и Claude. Если что-то в проекте меняется (цвета, размеры, брейкпоинты, новые иконки), правьте и здесь.

## Быстрый старт

```bash
npm install          # один раз
npm run watch:css    # пересобирает css/style.css при каждом изменении scss
npm start            # локальный сервер на http://localhost:5500
npm run build:css    # разовая сборка (для деплоя)
```

`css/style.css` — результат сборки, руками его не правим. Редактируем только `scss/`.

## Что где лежит

```
index.html            главная страница (пока пустой каркас)
css/style.css         собранный CSS (генерируется)
js/main.js            все скрипты сайта
scss/
  main.scss           точка входа, порядок подключения важен (см. ниже)
  _variables.scss     цвета из макета + переопределения переменных Bootstrap
  _tokens.scss        цвета как CSS-переменные --color-*
  _typography.scss    шкала шрифтов (desktop + mobile) и текстовые классы
  components/         по одному файлу на компонент (_icons.scss, дальше _header.scss и т. д.)
assets/icons/         иконки: sprite.svg + отдельные .svg
```

Порядок в `main.scss` (менять нельзя): `variables` → `bootstrap` → `tokens` → `typography` → `components/*`. Переменные должны идти до Bootstrap, чтобы он их подхватил; компоненты после, чтобы перебивать его стили.

## Дизайн-система (из Figma)

Файл: `https://www.figma.com/design/xo2npJK6Gsqud0inZAy93r/СТК`

| Что | Node в Figma |
|---|---|
| Цвета (Colors) | `69:5263` |
| Типографика Desktop | `34:1722` |
| Типографика Mobile | `113:12566` |
| Иконки (Icons) | `34:1719` |

### Цвета

Единственный источник — карта `$stc-colors` в `scss/_variables.scss`. Каждый цвет автоматически становится CSS-переменной `--color-<имя>` (в макете `brand/primary`, у нас `--color-brand-primary`). В стилях используем переменные, а не hex.

| Переменная | Значение | Как используется |
|---|---|---|
| `--color-brand-primary` | `#38afed` | основной цвет, Bootstrap `$primary` |
| `--color-brand-secondary` | `#373f51` | Bootstrap `$secondary` |
| `--color-brand-tertiary` | `#ffa503` | акцент, в Bootstrap не подключён |
| `--color-text-heading` | `#1e222c` | заголовки |
| `--color-text-primary` | `#292d37` | основной текст (`$body-color`) |
| `--color-text-secondary` | `#6f7582` | второстепенный текст (`.text-body-secondary`) |
| `--color-text-muted` | `#9b9fa8` | приглушённый текст (`.text-body-tertiary`) |
| `--color-text-button` | `#ffffff` | текст на кнопках |
| `--color-text-on-img` | белый 72% | текст поверх картинок |
| `--color-bg-primary` | `#ffffff` | фон страницы |
| `--color-bg-secondary` | `#eef2f5` | вторичный светлый фон |
| `--color-bg-light` | `#fafbfd` | самый светлый фон |
| `--color-bg-dark` | `#1e222c` | тёмные секции |
| `--color-bg-dark-secondary` | `#292d37` | вторичный тёмный фон |
| `--color-border-default` | `#dce2f1` | обычная граница |
| `--color-border-light` | `#f1f4fa` | лёгкая граница |
| `--color-border-dark` | `#252a35` | граница на тёмном |
| `--color-border-dark-light` | белый 16% | светлая граница на тёмном |
| `--color-border-on-img` | белый 4% | граница поверх картинок |
| `--color-surface-default` | `#1e222c` 16% | полупрозрачная подложка |
| `--color-surface-popup` | чёрный 50% | затемнение под попапами |

Про белый текст на кнопках: по макету он белый на `#38afed` (контраст около 2.6:1, ниже нормы WCAG AA). Bootstrap по умолчанию сделал бы его чёрным, поэтому в `_variables.scss` стоит `$min-contrast-ratio: 2`. Если заказчик захочет соответствовать AA, нужно менять цвет в макете.

### Типографика

Шрифт — **Wix Madefor Display** (подключается с Google Fonts в `<head>`, веса 400/500/600/700, кириллица есть). Межбуквенный интервал везде 0.

Заголовки (вес 700). **На мобильной версии они меньше**, шаги стали мельче:

| Стиль | Desktop, размер / межстрочный | Mobile, размер / межстрочный |
|---|---|---|
| display | 48 / 56 | 28 / 36 |
| h1 | 40 / 48 | 24 / 32 |
| h2 | 28 / 36 | 22 / 28 |
| h3 | 24 / 32 | 20 / 26 |
| h4 | 18 / 28 | 16 / 22 |
| h5 | 16 / 24 | 14 / 20 |
| h6 | 14 / 22 | 12 / 20 |

Основной текст **одинаковый на desktop и mobile**:

| Стиль | Размер / межстрочный | Веса |
|---|---|---|
| lead | 16 / 24 | regular 400, medium 500, bold 600 |
| text | 14 / 20 | regular 400, medium 500, bold 600 |
| meta | 12 / 18 | regular 400, medium 500, bold 600 |
| caption | 10 / 16 | regular 400, medium 500, bold 600 |

Как это устроено в коде (`scss/_typography.scss`):

- Все размеры лежат в CSS-переменных `--h1-size`, `--h1-lh`, `--lead-size` и т. д. Мобильная шкала будет просто подменой этих переменных внутри media query, сами селекторы повторять не нужно.
- `h1`–`h6` и `.h1`–`.h6` берут размер из этих переменных. Для остальных стилей есть классы `.text-display`, `.text-lead`, `.text-meta`, `.text-caption`. Обычный `text` (14/20) — это базовый размер `body`, отдельный класс не нужен.
- Вес задаём утилитами Bootstrap: `.fw-normal` (400), `.fw-medium` (500), `.fw-semibold` (600, это «bold» у body-стилей в макете).
- Автомасштабирование заголовков Bootstrap (RFS) выключено, потому что размеры заданы макетом.

Мобильная шкала уже записана в `$type-mobile`, но **пока не подключена**, так как брейкпоинты ещё не определены.

### Иконки

32 иконки из Figma лежат в `assets/icons/`: `sprite.svg` для сайта и такие же отдельные `.svg`. Подключение:

```html
<svg class="icon"><use href="assets/icons/sprite.svg#phone"></use></svg>
<svg class="icon icon--12"><use href="assets/icons/sprite.svg#angle-down"></use></svg>
```

Размеры: `.icon` 24px по умолчанию, `.icon--12` (стрелки `angle-*`), `.icon--16` (`check`), `.icon--48` (`map`). Одноцветные иконки красятся через CSS `color` (внутри `currentColor`), поэтому hover меняется обычным `color`. Цветные (telegram, wa, max, pdf) остаются как в макете. Не добавляйте `display:none` на корень `sprite.svg`, иначе пропадёт градиент у telegram.

Список id: `menu`, `phone`, `search`, `comparison`, `comparison-2`, `angle-down`, `angle-up`, `angle-left`, `angle-right`, `check`, `check-large`, `arrow-right`, `hamburger`, `cross`, `slash`, `map`, `ultra-sound`, `speedometer`, `radiation`, `magnet`, `vortex`, `spray`, `water`, `visual`, `hot`, `waves`, `mail`, `telegram`, `wa`, `max`, `pdf`, `trash`.

Отличие `menu` от `hamburger`: `menu` — четыре квадрата, `hamburger` — две горизонтальные полосы.

## Брейкпоинты

**Пока не определены** — решим, когда будем верстать главную; их будет несколько. Поэтому сейчас в проекте остались стандартные значения Bootstrap (576 / 768 / 992 / 1200 / 1400), контейнер тоже стандартный. Когда решим:

1. поменять `$grid-breakpoints` и `$container-max-widths` в `_variables.scss` (пример уже есть в Domarti);
2. подключить `$type-mobile` в media query в `_typography.scss`;
3. обновить этот раздел.

## Как мы пишем код

- **Сначала утилиты Bootstrap** (`d-flex`, `gap-3`, `px-3`, `d-none d-md-block`), а в SCSS только то, что утилитами не покрыть.
- **Один компонент — один файл** в `scss/components/_имя.scss`, подключается в `main.scss` после Bootstrap. Классы в БЭМ: `header__logo`, `card--active`.
- **Цвета и размеры шрифтов только из переменных** (`var(--color-…)`, `var(--h2-size)`), не hex и не пиксели.
- **Комментарии объясняют «почему»**, а не «что»: например, зачем перебит стиль Bootstrap. Так сделано в Domarti.
- **Скрипты** в `js/main.js`: по одной самовызывающейся функции на компонент, без jQuery, инициализация по классам и data-атрибутам.
- HTML: каждая страница отдельным файлом в корне; шапка и футер повторяются в каждом (шаблонизатора нет).
- Кнопки без класса `.btn` (иконочные) наследуют шрифт и `cursor: pointer` из `_tokens.scss`.

## Что решено, а что нет

Решено при создании каркаса:

- Подключён только CSS Bootstrap. JS Bootstrap (выпадающие меню, модалки) не подключён, добавим, если понадобится.
- Swiper (слайдеры) не установлен, в Domarti он был, поставим, когда дойдём до слайдеров.
- Тёмная тема Bootstrap выключена (`$enable-dark-mode: false`), сайт только светлый.
- Репозиторий: https://github.com/artsman01/stc (ветка `main`). Автодеплой (в Domarti это GitHub Actions по FTP на Timeweb) не настраивался; `css/style.css` закоммичен, поэтому сайт можно раздавать и без сборки.
- Кнопки, поля и остальные компоненты пока в стандартном виде Bootstrap, стилизуем по макету по мере вёрстки.

Ждёт решения:

- Брейкпоинты и ширина контейнера (см. выше).
- Есть ли у СТК favicon, `meta description` и нужен ли дашборд-`index.html`, как у Domarti (сейчас `index.html` это главная страница).

## Для Claude: как достать данные из Figma

Figma Dev Mode MCP-сервер работает локально на `http://127.0.0.1:3845/mcp` (нужно запущенное приложение Figma). Если инструментов Figma в сессии нет, к серверу можно обратиться напрямую по HTTP (JSON-RPC: `initialize`, затем заголовок `mcp-session-id`). Полезные методы: `get_variable_defs` (цвета и типографика), `get_metadata` (структура), `get_design_context` (макет + ссылки на SVG-ассеты), `get_screenshot`. Векторные иконки Figma отдаёт кусками, полный SVG приходится собирать по отступам и зеркалированию из `get_design_context`. Node-id нужных фреймов указаны выше.
