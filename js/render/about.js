import { observeRevealElements, revealPageHeroItems } from "../reveal.js";

function initAboutSectionAnimations() {
  const title = document.querySelector("#about .section-title");
  const text = document.querySelector("#about .about__text");
  const cards = [...document.querySelectorAll("#about .feature-card")];

  const sectionItems = [title, text].filter(Boolean);

  if (sectionItems.length > 0) {
    observeRevealElements(sectionItems, 70);
  }

  if (cards.length > 0) {
    const baseDelay = sectionItems.length > 0 ? 140 : 0;
    observeRevealElements(cards, 60, { variant: "from-left", baseDelay });
  }
}

function initAboutGalleryAnimations() {
  const section = document.querySelector("#gallery[data-gallery-section]");
  if (!section) {
    return;
  }

  const title = section.querySelector("[data-gallery-title]");
  const subtitle = section.querySelector("[data-gallery-subtitle]");
  const items = [...section.querySelectorAll(".gallery-item")];

  const headers = [title, subtitle].filter(Boolean);

  if (headers.length > 0) {
    observeRevealElements(headers, 70);
  }

  if (items.length > 0) {
    const baseDelay = headers.length > 0 ? 140 : 0;
    observeRevealElements(items, 55, { variant: "from-left", baseDelay });
  }
}

export function initAboutPageAnimations() {
  if (document.body.dataset.page !== "about") {
    return;
  }

  revealPageHeroItems();
  initAboutSectionAnimations();
  initAboutGalleryAnimations();
}
