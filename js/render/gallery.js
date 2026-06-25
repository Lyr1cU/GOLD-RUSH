import { loadGallery } from "../content.js";
import { observeRevealElements } from "../reveal.js";
import { attachBrokenImageFallback, encodeAssetPath, pickLocalized } from "../utils.js";

const LAYOUT_SIZES = {
  normal: { width: 400, height: 320 },
  tall: { width: 400, height: 500 },
  wide: { width: 800, height: 400 },
};

function createGalleryItem(item, lang) {
  const layout = LAYOUT_SIZES[item.layout] ? item.layout : "normal";
  const { width, height } = LAYOUT_SIZES[layout];

  const button = document.createElement("button");
  button.className = "gallery-item";
  button.type = "button";

  if (layout === "tall") {
    button.classList.add("gallery-item--tall");
  }

  if (layout === "wide") {
    button.classList.add("gallery-item--wide");
  }

  const imagePath = encodeAssetPath(item.image);
  button.dataset.full = imagePath;

  const img = document.createElement("img");
  img.src = imagePath;
  img.alt = pickLocalized(item, lang, "alt");
  img.width = width;
  img.height = height;
  img.loading = "lazy";

  attachBrokenImageFallback(img);
  button.appendChild(img);

  return button;
}

export async function renderGallery(lang, options = {}) {
  const { reveal = true } = options;
  const data = await loadGallery();
  const sections = document.querySelectorAll("[data-gallery-section]");

  if (sections.length === 0) {
    return;
  }

  sections.forEach((section) => {
    const title = section.querySelector("[data-gallery-title]");
    const subtitle = section.querySelector("[data-gallery-subtitle]");
    const grid = section.querySelector("[data-gallery-grid]");

    if (!title || !subtitle || !grid) {
      return;
    }

    title.textContent = pickLocalized(data, lang, "title");
    subtitle.textContent = pickLocalized(data, lang, "subtitle");

    grid.replaceChildren();

    data.items.forEach((item) => {
      grid.appendChild(createGalleryItem(item, lang));
    });
  });

  if (!reveal) {
    return;
  }

  sections.forEach((section) => {
    const title = section.querySelector("[data-gallery-title]");
    const subtitle = section.querySelector("[data-gallery-subtitle]");
    const items = [...section.querySelectorAll(".gallery-item")];
    const headers = [title, subtitle].filter(Boolean);

    if (headers.length > 0) {
      observeRevealElements(headers, 70);
    }

    if (items.length > 0) {
      const baseDelay = headers.length > 0 ? 140 : 0;
      observeRevealElements(items, 55, { baseDelay });
    }
  });
}

export function initGalleryLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = lightbox?.querySelector(".lightbox__image");

  if (!lightbox || !lightboxImage || document.body.dataset.galleryLightboxReady === "true") {
    return;
  }

  document.addEventListener("click", (event) => {
    const item = event.target.closest(".gallery-item");

    if (!item || !item.closest("[data-gallery-section]")) {
      return;
    }

    const img = item.querySelector("img");

    if (!img || img.classList.contains("is-broken")) {
      return;
    }

    lightboxImage.src = item.dataset.full || img.src;
    lightboxImage.alt = img.alt;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  });

  document.body.dataset.galleryLightboxReady = "true";
}
