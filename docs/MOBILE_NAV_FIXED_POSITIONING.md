# Бургер-меню: `position: fixed` ломается при скролле

## Симптомы

- Меню открывается нормально только вверху страницы (в hero).
- После прокрутки вниз по клику на бургер шапка «пропадает» или меню открывается где-то далеко сверху (вне видимой области).
- На десктопе всё может выглядеть нормально — баг проявляется на планшете/мобилке, где навигация `position: fixed`.

## Причина

В CSS свойства **`transform`**, **`filter`**, **`backdrop-filter`**, **`perspective`**, **`contain: paint`** и некоторые другие на **предке** создают новый containing block. Тогда `position: fixed` у потомка позиционируется **относительно этого предка**, а не viewport.

Типичная разметка шаблона:

```html
<header class="header">   <!-- backdrop-filter: blur(...) -->
  <nav class="nav">...</nav> <!-- position: fixed на ≤1023px -->
</header>
```

Пока страница вверху, шапка визуально совпадает с верхом экрана — меню кажется на месте. После скролла шапка `sticky` остаётся в viewport, но fixed-меню привязано к «старому» положению шапки в документе и уезжает вверх.

## Правильное решение (рекомендуется для site-template)

**Не вешать `backdrop-filter` / `filter` / `transform` на элемент, внутри которого лежит fixed-меню.**

Визуальный blur перенести на псевдоэлемент — он не делает потомков fixed относительно шапки:

```css
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--header-height);
  background: transparent;
  border-bottom: none;
}

.header::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgba(12, 12, 12, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-border);
  pointer-events: none;
}
```

`backdrop-filter` остаётся на `::before`, а не на `.header`, поэтому `.nav { position: fixed }` снова привязан к viewport.

## Альтернативы

1. **Вынести меню из шапки в DOM** — `<nav>` и overlay сразу после `</header>`, прямые дети `<body>`. На десктопе потребуется отдельная вёрстка для inline-навигации.
2. **Убрать blur** — оставить только полупрозрачный `background` без `backdrop-filter` (проще, но другой вид).
3. **Не использовать `position: fixed` для панели** — редко оправдано; fixed + overlay удобнее для мобильного drawer.

## Чеклист при отладке на другом сайте

1. Найти мобильное меню: `.nav`, `.mobile-menu`, `[data-menu]` и т.п. с `position: fixed`.
2. Пройти вверх по DOM и проверить каждого предка в DevTools → Computed:
   - `backdrop-filter` ≠ `none`
   - `filter` ≠ `none`
   - `transform` ≠ `none`
   - `perspective` ≠ `none`
   - `contain: paint` / `layout`
3. Убрать проблемное свойство с предка **или** вынести fixed-элемент из-под него.
4. Проверить: открыть страницу, проскроллить на 2–3 экрана, открыть бургер — панель и overlay должны быть на экране, шапка на месте.

## Дополнительно: шапка пропадает при открытом меню

### Симптом

Меню открывается на экране, но исчезают логотип, крестик бургера и переключатель языка.

### Причины (две частые)

1. **Z-index:** `.nav` с `z-index: 110` лежит в DOM рядом с кнопкой и логотипом и перекрывает их в stacking context, даже если drawer начинается ниже `top: var(--header-height)`.
2. **Scroll lock:** `body { overflow: hidden }` ломает `position: sticky` у шапки на iOS — полоска уезжает вместе со скроллом.

### Решение

**CSS (tablet.css, ≤1023px):**

```css
.header {
  z-index: 120;
}

.header__inner {
  position: relative;
  z-index: 115;
}

.burger,
.logo,
.header__actions {
  position: relative;
  z-index: 111;
}

.nav {
  z-index: 110;
  top: var(--header-height);
}

body.is-nav-open {
  touch-action: none; /* не overflow: hidden */
}
```

Chrome шапки (бургер, логотип, языки) должны быть **выше** drawer по z-index.

**JS (main.js):** фиксировать `body` с сохранением позиции скролла. Важно использовать `behavior: "instant"` при возврате скролла, иначе из-за `scroll-behavior: smooth` на `html` страницу будет плавно прокручивать сверху вниз при закрытии меню:

```javascript
let navScrollLockY = 0;

function setNavOpen(isOpen) {
  // ... toggle classes ...

  if (isOpen) {
    navScrollLockY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${navScrollLockY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    return;
  }

  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  window.scrollTo({ top: navScrollLockY, behavior: "instant" });
}
```

### Проверка

1. Проскроллить на 2–3 экрана.
2. Открыть бургер.
3. Вверху видны: ✕, логотип, UA/EN/RU.
4. Drawer — под шапкой, справа.
5. Закрыть меню — страница на том же месте скролла.

## Связанные файлы (GOLD RUSH / site-template)

| Файл | Роль |
|------|------|
| `css/styles.css` | `.header`, `.header::before` |
| `css/tablet.css` | `.nav`, z-index шапки, scroll lock CSS |
| `js/main.js` | `setNavOpen()`, scroll lock JS |

## Раньше: только блокировка скролла

`body { overflow: hidden }` при открытом меню на iOS иногда дёргает скролл и ломает sticky. **Не использовать одно только `overflow: hidden`** — нужен scroll lock через `position: fixed` на `body` (см. выше).
