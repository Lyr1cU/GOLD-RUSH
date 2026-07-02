import { DEFAULT_LANG, STORAGE_KEY, translations } from "./i18n/index.js";
import { initReveal } from "./reveal.js";
import { initAboutPageAnimations } from "./render/about.js";
import { initGalleryLightbox, renderGallery } from "./render/gallery.js";
import { initMenuPageAnimations, initMenuTabs, renderMenu } from "./render/menu.js";
import {
  initContactsPageAnimations,
  renderContacts,
  setContactsLang,
} from "./render/contacts.js";
import { initPromosPageAnimations, renderPromos } from "./render/promos.js";
import { initReviewsSlider, renderReviews } from "./render/reviews.js";

const page = document.body.dataset.page || "home";
const langButtons = document.querySelectorAll(".lang-switch__btn");
const i18nNodes = document.querySelectorAll("[data-i18n]");
const i18nAltNodes = document.querySelectorAll("[data-i18n-alt]");
const i18nPlaceholderNodes = document.querySelectorAll("[data-i18n-placeholder]");
const i18nAriaNodes = document.querySelectorAll("[data-i18n-aria]");
const burger = document.querySelector(".burger");
const siteNav = document.getElementById("site-nav");
const navOverlay = document.getElementById("nav-overlay");
const navPanelLinks = document.querySelectorAll(".nav__link, .nav__cta");

let navScrollLockY = 0;
let currentLang = DEFAULT_LANG;

function getNavAriaLabel(isOpen) {
  const key = isOpen ? "navCloseMenu" : "navOpenMenu";
  return translations[currentLang]?.[key] || "";
}

function setLanguage(lang) {
  const strings = translations[lang];
  if (!strings) return;

  currentLang = lang;
  setContactsLang(lang);
  document.documentElement.lang = lang;

  if (strings.metaTitle && page === "home") {
    document.title = strings.metaTitle;
  }

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && strings.metaDescription && page === "home") {
    metaDesc.setAttribute("content", strings.metaDescription);
  }

  i18nNodes.forEach((node) => {
    const key = node.dataset.i18n;
    if (strings[key]) {
      node.textContent = strings[key];
    }
  });

  i18nAltNodes.forEach((node) => {
    const key = node.dataset.i18nAlt;
    if (strings[key]) {
      node.alt = strings[key];
    }
  });

  i18nPlaceholderNodes.forEach((node) => {
    const key = node.dataset.i18nPlaceholder;
    if (strings[key]) {
      node.placeholder = strings[key];
    }
  });

  i18nAriaNodes.forEach((node) => {
    const key = node.dataset.i18nAria;
    if (strings[key]) {
      node.setAttribute("aria-label", strings[key]);
    }
  });

  langButtons.forEach((btn) => {
    const isActive = btn.dataset.lang === lang;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });

  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }

  if (burger) {
    const isOpen = burger.classList.contains("is-active");
    burger.setAttribute("aria-label", getNavAriaLabel(isOpen));
  }
}

async function renderPageContent(lang) {
  const tasks = [];

  if (document.getElementById("promos-grid")) {
    if (page === "home") {
      tasks.push(renderPromos(lang, { limit: 3, reveal: true }));
    } else if (page === "promos") {
      tasks.push(renderPromos(lang, { reveal: false }));
    }
  }

  if (document.getElementById("menu-panel")) {
    if (page === "home") {
      tasks.push(renderMenu(lang, { limit: 8, showTabs: false, reveal: true }));
    } else if (page === "menu") {
      tasks.push(renderMenu(lang, { showAll: true, reveal: false }));
    }
  }

  if (document.querySelector("[data-gallery-section]")) {
    tasks.push(renderGallery(lang, { reveal: page !== "about" }));
  }

  if (document.getElementById("reviews-track")) {
    tasks.push(renderReviews(lang));
  }

  if (document.getElementById("contact-title") || document.getElementById("footer-socials")) {
    tasks.push(renderContacts(lang, { reveal: page === "home" }));
  }

  await Promise.all(tasks);
}

langButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    setLanguage(btn.dataset.lang);
    await renderPageContent(btn.dataset.lang);
  });
});

let savedLang = DEFAULT_LANG;
try {
  savedLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
} catch {
  /* ignore */
}

const initialLang = translations[savedLang] ? savedLang : DEFAULT_LANG;
setLanguage(initialLang);

function setNavOpen(isOpen) {
  burger?.classList.toggle("is-active", isOpen);
  siteNav?.classList.toggle("is-open", isOpen);
  navOverlay?.classList.toggle("is-visible", isOpen);
  burger?.setAttribute("aria-expanded", String(isOpen));

  if (burger) {
    burger.setAttribute("aria-label", getNavAriaLabel(isOpen));
  }

  document.body.classList.toggle("is-nav-open", isOpen);

  if (navOverlay) {
    navOverlay.hidden = !isOpen;
  }

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

burger?.addEventListener("click", () => {
  setNavOpen(!burger.classList.contains("is-active"));
});

navOverlay?.addEventListener("click", () => {
  setNavOpen(false);
});

navPanelLinks.forEach((link) => {
  link.addEventListener("click", () => {
    setNavOpen(false);
  });
});

window.matchMedia("(min-width: 1024px)").addEventListener("change", (event) => {
  if (event.matches) {
    setNavOpen(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && burger?.classList.contains("is-active")) {
    setNavOpen(false);
  }
});

const lightbox = document.getElementById("lightbox");
const lightboxImage = lightbox?.querySelector(".lightbox__image");
const lightboxClose = lightbox?.querySelector(".lightbox__close");

function closeLightbox() {
  if (!lightbox) return;
  lightbox.hidden = true;
  lightboxImage.src = "";
  document.body.style.overflow = "";
}

lightboxClose?.addEventListener("click", closeLightbox);

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox && !lightbox.hidden) {
    closeLightbox();
  }
});

const contactForm = document.getElementById("contact-form");
const formSuccess = document.getElementById("form-success");

const phonePattern = /^[\d\s+()-]{7,}$/;

function getFormError(key) {
  return translations[currentLang]?.[key] || "";
}

function validateForm(formData) {
  const errors = {};
  const name = formData.get("name")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim();
  const location = formData.get("location")?.toString();
  const pickup = formData.get("pickup")?.toString();
  const order = formData.get("order")?.toString().trim();

  if (!name) {
    errors.name = getFormError("formErrorName");
  }

  if (!phone || !phonePattern.test(phone)) {
    errors.phone = getFormError("formErrorPhone");
  }

  if (!location) {
    errors.location = getFormError("formErrorLocation");
  }

  if (!pickup) {
    errors.pickup = getFormError("formErrorPickup");
  }

  if (!order) {
    errors.order = getFormError("formErrorOrder");
  }

  return errors;
}

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const errors = validateForm(formData);

  contactForm.querySelectorAll("[data-error]").forEach((el) => {
    el.textContent = "";
  });

  Object.entries(errors).forEach(([field, message]) => {
    const errorEl = contactForm.querySelector(`[data-error="${field}"]`);
    if (errorEl) {
      errorEl.textContent = message;
    }
  });

  if (Object.keys(errors).length > 0) {
    formSuccess.hidden = true;
    return;
  }

  contactForm.hidden = true;
  formSuccess.hidden = false;
});

function showContentError(containerId, message) {
  const container = document.getElementById(containerId);

  if (container) {
    container.innerHTML = `<p class="content-error">${message}</p>`;
  }
}

async function bootstrap() {
  initMenuTabs();
  initGalleryLightbox();
  initReviewsSlider();

  const contentError =
    "Не вдалося завантажити дані. Запустіть сайт через локальний сервер (не file://).";

  try {
    await renderPageContent(currentLang);
  } catch (error) {
    console.error("Failed to render page content:", error);
    ["menu-panel", "promos-grid", "gallery-grid", "reviews-track", "contact-list"].forEach(
      (id) => showContentError(id, contentError)
    );
  }

  initReveal();

  if (page === "menu") {
    initMenuPageAnimations();
  }

  if (page === "promos") {
    initPromosPageAnimations();
  }

  if (page === "about") {
    initAboutPageAnimations();
  }

  if (page === "contacts") {
    initContactsPageAnimations();
  }
}

bootstrap();
