# GOLD RUSH — демо «Розширений пакет»

Демо-сайт фастфуд-мережі для портфоліо. Показує можливості **розширеного пакету (14 650 грн)**:

- головна + 3 додаткові сторінки (`menu.html`, `promos.html`, `contacts.html`)
- 3 мови: UA / EN / RU
- scroll-анімації (`reveal.js`)
- секція «Акції та комбо» + повний каталог
- перемикач локацій з картою Google Maps
- Decap CMS для контенту

**Це не реальний бізнес** — вигадана мережа GOLD RUSH для вітрини портфоліо.

## Локальний запуск

```bash
node scripts/build-pages.mjs
python -m http.server 8080 --bind 127.0.0.1
```

Відкрити: **http://127.0.0.1:8080/** (на Windows надійніше, ніж `localhost`)

> Не відкривайте `index.html` через `file://` — JSON не завантажиться.  
> Build потрібен для `menu.html` / `promos.html` (вшиває картки з JSON перед переглядом або деплоєм).

### Windows: npm заблокований PowerShell

Якщо `npm run build` дає помилку *running scripts is disabled*:

```powershell
node scripts/build-pages.mjs
```

Або один раз для поточного користувача: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

## Адмінка (Decap CMS)

```bash
npx decap-server
python -m http.server 8080
```

Відкрити: `http://localhost:8080/admin/`

## Деплой

GitHub Pages: репозиторій `Lyr1cU/Gold-Rush`, гілка `main`.  
Workflow: `.github/workflows/pages.yml` (перед публікацією запускає `npm run build`).

VPS: `.github/workflows/deploy-vps.yml` — те саме: build → rsync на сервер.

## Структура

| Файл | Призначення |
|---|---|
| `index.html` | Головна: hero, promos preview, menu preview, about, gallery, reviews, contacts |
| `menu.html` | Повне меню (22 позиції, 4 категорії) |
| `promos.html` | Акції та комбо (8 карток) |
| `contacts.html` | Контакти з перемикачем локацій |
| `about.html` | Про нас |
| `content/*.json` | Дані для рендеру та CMS |
| `js/main.js` | Єдиний bootstrap: i18n, nav, `renderPageContent()`, reveal |
| `js/content.js` | Завантаження JSON |
| `js/utils.js` | Спільні хелпери (i18n поля, шляхи до зображень) |
| `js/render/*.js` | Рендер секцій (menu, promos, gallery, reviews, contacts) |
| `scripts/build-pages.mjs` | Збірка catalog HTML з JSON (CI + локально перед тестом menu/promos) |
| `components/` | HTML-фрагменти для копіювання в сторінки (не підключаються автоматично) |

## Бренд

- **Назва:** GOLD RUSH
- **Стиль:** чорно-золотистий (#0c0c0c + #d4af37)
- **Місто:** Дніпро (вигадані адреси)

База коду: `site-template`. Референс якості: Zerno.
