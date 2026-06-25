import { loadPromos } from "../content.js";
import { observeRevealElements, revealPageHeroItems } from "../reveal.js";
import { attachBrokenImageFallback, encodeAssetPath, pickLocalized } from "../utils.js";

function updatePromoCardElement(card, item, lang) {
  const img = card.querySelector("img");
  const name = pickLocalized(item, lang, "name");

  if (img) {
    img.alt = name;
    attachBrokenImageFallback(img);
  }

  card.querySelector(".promo-card__name").textContent = name;
  card.querySelector(".promo-card__desc").textContent = pickLocalized(item, lang, "desc");
  card.querySelector(".promo-card__price").textContent = pickLocalized(item, lang, "price");
  card.querySelector(".promo-card__terms").textContent = pickLocalized(item, lang, "terms");
}

function hydratePromosPage(lang, data) {
  const title = document.getElementById("promos-title");
  const subtitle = document.getElementById("promos-subtitle");
  const grid = document.getElementById("promos-grid");
  const cards = grid.querySelectorAll(".promo-card");

  if (title) {
    title.textContent = pickLocalized(data, lang, "title");
  }

  if (subtitle) {
    subtitle.textContent = pickLocalized(data, lang, "subtitle");
  }

  cards.forEach((card) => {
    const index = Number(card.dataset.buildIndex);

    if (Number.isInteger(index) && data.items[index]) {
      updatePromoCardElement(card, data.items[index], lang);
    }
  });

  grid.removeAttribute("aria-busy");
}

function getPromoCards(grid = document.getElementById("promos-grid")) {
  if (!grid) {
    return [];
  }

  return [...grid.querySelectorAll(".promo-card")];
}

export function initPromosPageAnimations() {
  if (document.body.dataset.page !== "promos") {
    return;
  }

  revealPageHeroItems();

  const cards = getPromoCards();
  if (cards.length > 0) {
    observeRevealElements(cards, 50, { variant: "from-left" });
  }
}

export function createPromoCard(item, lang) {
  const card = document.createElement("article");
  card.className = "promo-card";

  card.innerHTML = `
    <div class="promo-card__media">
      <img src="" alt="" width="400" height="260" loading="lazy" decoding="async">
    </div>
    <div class="promo-card__body">
      <div class="promo-card__head">
        <h3 class="promo-card__name"></h3>
        <span class="promo-card__price"></span>
      </div>
      <p class="promo-card__desc"></p>
      <p class="promo-card__terms"></p>
    </div>
  `;

  const img = card.querySelector("img");
  img.src = encodeAssetPath(item.image);
  updatePromoCardElement(card, item, lang);

  return card;
}

export async function renderPromos(lang, options = {}) {
  const { limit, reveal = true } = options;
  const data = await loadPromos();

  const title = document.getElementById("promos-title");
  const subtitle = document.getElementById("promos-subtitle");
  const grid = document.getElementById("promos-grid");

  if (!grid) {
    return;
  }

  const isPrebuilt = grid.dataset.prebuilt === "true";

  if (isPrebuilt && limit == null) {
    hydratePromosPage(lang, data);
    return;
  }

  if (title) {
    title.textContent = pickLocalized(data, lang, "title");
  }

  if (subtitle) {
    subtitle.textContent = pickLocalized(data, lang, "subtitle");
  }

  const items = limit ? data.items.slice(0, limit) : data.items;
  grid.replaceChildren();

  items.forEach((item, index) => {
    const card = createPromoCard(item, lang);
    card.dataset.buildIndex = String(index);
    grid.appendChild(card);
  });

  grid.removeAttribute("aria-busy");

  if (!reveal) {
    return;
  }

  observeRevealElements(
    [title, subtitle, ...grid.querySelectorAll(".promo-card")].filter(Boolean),
    70
  );
}
