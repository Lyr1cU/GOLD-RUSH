export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function pickLocalized(item, lang, field) {
  return item[`${field}_${lang}`] || item[`${field}_uk`] || "";
}

export function encodeAssetPath(path) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function menuCardHtml(item, lang, index, activeCategory) {
  const isVisible = item.category === activeCategory;
  const hiddenClass = isVisible ? "" : " is-hidden";
  const hiddenAttr = isVisible ? "" : " hidden";

  return `<article class="menu-card${hiddenClass}" data-category="${escapeHtml(item.category)}" data-build-index="${index}"${hiddenAttr}>
  <div class="menu-card__media">
    <img src="${escapeHtml(encodeAssetPath(item.image))}" alt="${escapeHtml(pickLocalized(item, lang, "name"))}" width="280" height="280" loading="lazy" decoding="async">
  </div>
  <div class="menu-card__body">
    <div class="menu-card__info">
      <h3 class="menu-card__name">${escapeHtml(pickLocalized(item, lang, "name"))}</h3>
      <p class="menu-card__desc">${escapeHtml(pickLocalized(item, lang, "desc"))}</p>
    </div>
    <span class="menu-card__price">${escapeHtml(pickLocalized(item, lang, "price"))}</span>
  </div>
</article>`;
}

export function menuTabsHtml(categories, lang, activeCategory) {
  return categories
    .map((category, index) => {
      const isActive = category.id === activeCategory;
      const activeClass = isActive ? " is-active" : "";
      const selected = isActive ? "true" : "false";

      return `<button class="menu-tabs__btn${activeClass}" type="button" role="tab" id="menu-tab-${escapeHtml(category.id)}" data-tab="${escapeHtml(category.id)}" aria-controls="menu-panel" aria-selected="${selected}">${escapeHtml(pickLocalized(category, lang, "label"))}</button>`;
    })
    .join("\n");
}

export function promoCardHtml(item, lang, index) {
  return `<article class="promo-card" data-build-index="${index}">
  <div class="promo-card__media">
    <img src="${escapeHtml(encodeAssetPath(item.image))}" alt="${escapeHtml(pickLocalized(item, lang, "name"))}" width="400" height="260" loading="lazy" decoding="async">
  </div>
  <div class="promo-card__body">
    <div class="promo-card__head">
      <h3 class="promo-card__name">${escapeHtml(pickLocalized(item, lang, "name"))}</h3>
      <span class="promo-card__price">${escapeHtml(pickLocalized(item, lang, "price"))}</span>
    </div>
    <p class="promo-card__desc">${escapeHtml(pickLocalized(item, lang, "desc"))}</p>
    <p class="promo-card__terms">${escapeHtml(pickLocalized(item, lang, "terms"))}</p>
  </div>
</article>`;
}

export function getMenuCategories(data) {
  return data.categories.filter((category) =>
    data.items.some((item) => item.category === category.id)
  );
}
