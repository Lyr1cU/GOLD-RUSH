import { loadMenu } from "../content.js";
import { observeRevealElements, revealPageHeroItems } from "../reveal.js";
import { attachBrokenImageFallback, encodeAssetPath, pickLocalized } from "../utils.js";

let activeCategory = "burgers";
let menuData = null;

function getCategoriesWithItems(data) {
  const used = new Set(data.items.map((item) => item.category));
  return data.categories.filter((category) => used.has(category.id));
}

function updateMenuCardElement(card, item, lang) {
  const img = card.querySelector("img");
  const name = pickLocalized(item, lang, "name");

  if (img) {
    img.alt = name;
    attachBrokenImageFallback(img);
  }

  card.querySelector(".menu-card__name").textContent = name;
  card.querySelector(".menu-card__desc").textContent = pickLocalized(item, lang, "desc");
  card.querySelector(".menu-card__price").textContent = pickLocalized(item, lang, "price");
}

function hydrateMenuPage(lang, data, { showTabs }) {
  const title = document.getElementById("menu-title");
  const subtitle = document.getElementById("menu-subtitle");
  const tabs = document.getElementById("menu-tabs");
  const panel = document.getElementById("menu-panel");
  const cards = panel.querySelectorAll(".menu-card");

  if (title) {
    title.textContent = pickLocalized(data, lang, "title");
  }

  if (subtitle) {
    subtitle.textContent = pickLocalized(data, lang, "subtitle");
  }

  if (tabs && showTabs) {
    tabs.querySelectorAll(".menu-tabs__btn").forEach((button) => {
      const category = data.categories.find((entry) => entry.id === button.dataset.tab);

      if (category) {
        button.textContent = pickLocalized(category, lang, "label");
      }
    });
  }

  cards.forEach((card) => {
    const index = Number(card.dataset.buildIndex);

    if (Number.isInteger(index) && data.items[index]) {
      updateMenuCardElement(card, data.items[index], lang);
    }
  });

  panel.removeAttribute("aria-busy");
}

function getVisibleMenuCards(panel = document.getElementById("menu-panel")) {
  if (!panel) {
    return [];
  }

  return [...panel.querySelectorAll(".menu-card")].filter(
    (card) => !card.classList.contains("is-hidden") && !card.hidden
  );
}

export function animateVisibleMenuCards() {
  const cards = getVisibleMenuCards();

  cards.forEach((card) => {
    card.classList.remove("is-visible", "reveal", "reveal--from-left");
  });

  requestAnimationFrame(() => {
    observeRevealElements(cards, 50, { variant: "from-left" });
  });
}

export function initMenuPageAnimations() {
  if (document.body.dataset.page !== "menu") {
    return;
  }

  revealPageHeroItems();

  const tabs = document.getElementById("menu-tabs");
  const tabButtons = tabs ? [...tabs.querySelectorAll(".menu-tabs__btn")] : [];
  const visibleCards = getVisibleMenuCards();

  if (tabButtons.length > 0) {
    observeRevealElements(tabButtons, 60, { variant: "from-left" });
  }

  if (visibleCards.length > 0) {
    const baseDelay = tabButtons.length > 0 ? 120 : 0;
    observeRevealElements(visibleCards, 50, { variant: "from-left", baseDelay });
  }
}

export function createMenuCard(item, lang) {
  const card = document.createElement("article");
  card.className = "menu-card";
  card.dataset.category = item.category;

  card.innerHTML = `
    <div class="menu-card__media">
      <img src="" alt="" width="280" height="280" loading="lazy" decoding="async">
    </div>
    <div class="menu-card__body">
      <div class="menu-card__info">
        <h3 class="menu-card__name"></h3>
        <p class="menu-card__desc"></p>
      </div>
      <span class="menu-card__price"></span>
    </div>
  `;

  const img = card.querySelector("img");
  img.src = encodeAssetPath(item.image);
  updateMenuCardElement(card, item, lang);

  return card;
}

export function filterMenu(category) {
  const categoryChanged = activeCategory !== category;
  activeCategory = category;

  const tabButtons = document.querySelectorAll(".menu-tabs__btn");
  const menuCards = document.querySelectorAll(".menu-card");
  const menuPanel = document.getElementById("menu-panel");

  tabButtons.forEach((btn) => {
    const isActive = btn.dataset.tab === category;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });

  const activeTab = document.getElementById(`menu-tab-${category}`);
  if (menuPanel && activeTab) {
    menuPanel.setAttribute("aria-labelledby", activeTab.id);
  }

  menuCards.forEach((card) => {
    const isVisible = card.dataset.category === category;
    card.classList.toggle("is-hidden", !isVisible);
    card.hidden = !isVisible;
  });

  if (document.body.dataset.page === "menu" && categoryChanged) {
    animateVisibleMenuCards();
  }
}

export async function renderMenu(lang, options = {}) {
  const { limit = null, showTabs = true, showAll = false, reveal = true } = options;
  menuData = await loadMenu();

  const title = document.getElementById("menu-title");
  const subtitle = document.getElementById("menu-subtitle");
  const tabs = document.getElementById("menu-tabs");
  const panel = document.getElementById("menu-panel");

  if (!panel) {
    return;
  }

  const isPrebuilt = panel.dataset.prebuilt === "true";

  if (isPrebuilt && showAll) {
    hydrateMenuPage(lang, menuData, { showTabs });
    return;
  }

  if (title) {
    title.textContent = pickLocalized(menuData, lang, "title");
  }

  if (subtitle) {
    subtitle.textContent = pickLocalized(menuData, lang, "subtitle");
  }

  const items = limit ? menuData.items.slice(0, limit) : menuData.items;
  const categories = showAll
    ? menuData.categories.filter((category) =>
        menuData.items.some((item) => item.category === category.id)
      )
    : getCategoriesWithItems({ ...menuData, items });

  if (tabs) {
    tabs.replaceChildren();
    tabs.hidden = !showTabs;

    if (showTabs) {
      categories.forEach((category, index) => {
        const button = document.createElement("button");
        button.className = "menu-tabs__btn";
        button.type = "button";
        button.role = "tab";
        button.id = `menu-tab-${category.id}`;
        button.dataset.tab = category.id;
        button.setAttribute("aria-controls", "menu-panel");
        button.setAttribute("aria-selected", "false");
        button.textContent = pickLocalized(category, lang, "label");
        if (index === 0) {
          button.classList.add("is-active");
          button.setAttribute("aria-selected", "true");
        }
        tabs.appendChild(button);
      });
    }
  }

  panel.replaceChildren();

  if (showTabs && !categories.some((category) => category.id === activeCategory)) {
    activeCategory = categories[0]?.id || "burgers";
  }

  items.forEach((item, index) => {
    const card = createMenuCard(item, lang);
    card.dataset.buildIndex = String(index);

    if (showTabs) {
      const isVisible = item.category === activeCategory;
      card.classList.toggle("is-hidden", !isVisible);
      card.hidden = !isVisible;
    } else {
      card.hidden = false;
    }

    panel.appendChild(card);
  });

  if (showTabs) {
    filterMenu(activeCategory);
  }

  panel.removeAttribute("aria-busy");

  if (!reveal) {
    return;
  }

  const revealTargets = [title, subtitle, ...panel.querySelectorAll(".menu-card")].filter(Boolean);

  if (showTabs && tabs) {
    revealTargets.splice(2, 0, tabs);
  }

  observeRevealElements(revealTargets, 70);
}

export function initMenuTabs() {
  const tabs = document.getElementById("menu-tabs");
  const menuSection = tabs?.closest(".menu");

  if (!menuSection || menuSection.dataset.tabsReady === "true") {
    return;
  }

  menuSection.addEventListener("click", (event) => {
    const button = event.target.closest(".menu-tabs__btn");
    if (button) {
      filterMenu(button.dataset.tab);
    }
  });

  menuSection.dataset.tabsReady = "true";
}
