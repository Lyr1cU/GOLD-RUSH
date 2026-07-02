import { loadContacts } from "../content.js";
import { observeRevealElements, revealPageHeroItems } from "../reveal.js";
import { pickLocalized } from "../utils.js";

let contactsData = null;
let activeLocationId = null;
let currentLang = "uk";
let renderGeneration = 0;

export function setContactsLang(lang) {
  currentLang = lang;
}

const ADDRESS_ICON = `<svg class="contact-list__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;

const SOCIAL_ICONS = {
  telegram:
    '<path d="M22 3L2 11l7 2 2 7 11-17z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  instagram:
    '<rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="7" r="1" fill="currentColor"/>',
  facebook:
    '<path d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H6v4h3v8h4v-8h3l1-4h-4V9c0-.6.4-1 1-1z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
};

function getLocations(data) {
  return Array.isArray(data.locations) ? data.locations : [];
}

function getActiveLocation(data) {
  const locations = getLocations(data);
  return locations.find((loc) => loc.id === activeLocationId) || locations[0] || null;
}

function mapLanguage(lang) {
  if (lang === "en") return "en";
  if (lang === "ru") return "ru";
  return "uk";
}

function createSocialLink(social, size) {
  const iconPath = SOCIAL_ICONS[social.id];

  if (!iconPath) {
    return null;
  }

  const link = document.createElement("a");
  link.className = "socials__link";
  link.href = social.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", social.label);
  link.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${iconPath}</svg>`;

  return link;
}

function renderSocials(container, socials, size) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  socials.forEach((social) => {
    const link = createSocialLink(social, size);

    if (link) {
      container.appendChild(link);
    }
  });
}

function renderLocationChips(data, lang) {
  const chips = document.getElementById("location-chips");

  if (!chips) {
    return;
  }

  const locations = getLocations(data);
  const existing = [...chips.querySelectorAll(".location-chip")];
  const canUpdate =
    existing.length === locations.length &&
    existing.every((button, index) => button.dataset.locationId === locations[index]?.id);

  if (canUpdate) {
    existing.forEach((button, index) => {
      const location = locations[index];
      button.textContent = pickLocalized(location, lang, "name");
      button.classList.toggle("is-active", location.id === activeLocationId);
      button.setAttribute("aria-pressed", String(location.id === activeLocationId));
    });
    return;
  }

  chips.replaceChildren();

  locations.forEach((location) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "location-chip";
    button.dataset.locationId = location.id;
    button.textContent = pickLocalized(location, lang, "name");
    button.classList.toggle("is-active", location.id === activeLocationId);
    button.setAttribute("aria-pressed", String(location.id === activeLocationId));
    chips.appendChild(button);
  });
}

function renderContactList(data, lang) {
  const list = document.getElementById("contact-list");
  const location = getActiveLocation(data);

  if (!list || !location) {
    return;
  }

  const existing = [...list.querySelectorAll(".contact-list__item")];

  if (existing.length === 3) {
    existing[0].querySelector("dt").textContent = pickLocalized(data, lang, "addressLabel");
    existing[0].querySelector("span").textContent = pickLocalized(location, lang, "address");
    existing[1].querySelector("dt").textContent = pickLocalized(data, lang, "hoursLabel");
    existing[1].querySelector("dd").textContent = pickLocalized(location, lang, "hours");
    existing[2].querySelector("dt").textContent = pickLocalized(data, lang, "phoneLabel");

    const phoneLink = existing[2].querySelector("a");
    phoneLink.href = `tel:${data.phone}`;
    phoneLink.textContent = pickLocalized(data, lang, "phoneDisplay");
    return;
  }

  list.replaceChildren();

  const addressItem = document.createElement("div");
  addressItem.className = "contact-list__item";
  addressItem.innerHTML = `
    <dt></dt>
    <dd>
      ${ADDRESS_ICON}
      <span></span>
    </dd>
  `;
  addressItem.querySelector("dt").textContent = pickLocalized(data, lang, "addressLabel");
  addressItem.querySelector("span").textContent = pickLocalized(location, lang, "address");
  list.appendChild(addressItem);

  const hoursItem = document.createElement("div");
  hoursItem.className = "contact-list__item";
  hoursItem.innerHTML = "<dt></dt><dd></dd>";
  hoursItem.querySelector("dt").textContent = pickLocalized(data, lang, "hoursLabel");
  hoursItem.querySelector("dd").textContent = pickLocalized(location, lang, "hours");
  list.appendChild(hoursItem);

  const phoneItem = document.createElement("div");
  phoneItem.className = "contact-list__item";
  phoneItem.innerHTML = "<dt></dt><dd><a></a></dd>";
  phoneItem.querySelector("dt").textContent = pickLocalized(data, lang, "phoneLabel");

  const phoneLink = phoneItem.querySelector("a");
  phoneLink.href = `tel:${data.phone}`;
  phoneLink.textContent = pickLocalized(data, lang, "phoneDisplay");
  list.appendChild(phoneItem);
}

function renderMap(location, data, lang) {
  const map = document.getElementById("contact-map");

  if (!map || !location) {
    return;
  }

  const lat = Number(location.mapLat) || 48.4647;
  const lng = Number(location.mapLng) || 35.0462;
  const zoom = Number(location.mapZoom) || 16;
  const hl = mapLanguage(lang);
  const label = pickLocalized(data, lang, "mapLabel");

  map.setAttribute("aria-label", label);

  let iframe = map.querySelector(".contact-map__frame");

  if (!iframe) {
    map.replaceChildren();
    iframe = document.createElement("iframe");
    iframe.className = "contact-map__frame";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.title = label;
    iframe.setAttribute("allowfullscreen", "");
    map.appendChild(iframe);
  }

  iframe.src = `https://www.google.com/maps?q=${lat},${lng}&hl=${hl}&z=${zoom}&output=embed`;
}

function selectLocation(locationId) {
  if (!contactsData) {
    return;
  }

  activeLocationId = locationId;
  renderLocationChips(contactsData, currentLang);
  renderContactList(contactsData, currentLang);
  renderMap(getActiveLocation(contactsData), contactsData, currentLang);
  syncOrderFormLocation(locationId);
}

function renderOrderFormLocations(data, lang) {
  const select = document.getElementById("form-location");

  if (!select) {
    return;
  }

  select.replaceChildren();

  getLocations(data).forEach((location) => {
    const option = document.createElement("option");
    option.value = location.id;
    option.textContent = pickLocalized(location, lang, "name");
    option.selected = location.id === activeLocationId;
    select.appendChild(option);
  });
}

function syncOrderFormLocation(locationId) {
  const select = document.getElementById("form-location");

  if (select && locationId) {
    select.value = locationId;
  }
}

function initOrderForm() {
  const select = document.getElementById("form-location");

  if (!select || select.dataset.ready === "true") {
    return;
  }

  select.addEventListener("change", () => {
    if (select.value) {
      selectLocation(select.value);
    }
  });

  select.dataset.ready = "true";
}

function initLocationChips() {
  const chips = document.getElementById("location-chips");

  if (!chips || chips.dataset.ready === "true") {
    return;
  }

  chips.addEventListener("click", (event) => {
    const button = event.target.closest(".location-chip");

    if (button?.dataset.locationId) {
      selectLocation(button.dataset.locationId);
    }
  });

  chips.dataset.ready = "true";
}

function getContactListItems() {
  return [...document.querySelectorAll("#contact-list .contact-list__item")];
}

function initContactSectionAnimations() {
  const title = document.getElementById("contact-title");
  const chips = document.getElementById("location-chips");
  const chipButtons = chips ? [...chips.querySelectorAll(".location-chip")] : [];
  const listItems = getContactListItems();
  const socials = document.getElementById("contact-socials");
  const formWrap = document.querySelector("#contact .contact__form-wrap");
  const map = document.getElementById("contact-map");

  let baseDelay = 0;

  if (title) {
    observeRevealElements([title], 70);
    baseDelay = 140;
  }

  if (chipButtons.length > 0) {
    observeRevealElements(chipButtons, 60, { variant: "from-left", baseDelay });
    baseDelay += 120 + chipButtons.length * 60;
  }

  if (listItems.length > 0) {
    observeRevealElements(listItems, 50, { variant: "from-left", baseDelay });
    baseDelay += 80 + listItems.length * 50;
  }

  if (socials) {
    observeRevealElements([socials], 70, { variant: "from-left", baseDelay });
    baseDelay += 140;
  }

  if (formWrap) {
    observeRevealElements([formWrap], 70, { baseDelay });
    baseDelay += 140;
  }

  if (map) {
    observeRevealElements([map], 70, { baseDelay });
  }
}

export function initContactsPageAnimations() {
  if (document.body.dataset.page !== "contacts") {
    return;
  }

  revealPageHeroItems();
  initContactSectionAnimations();
}

export async function renderContacts(lang, options = {}) {
  const { reveal = true } = options;
  const generation = ++renderGeneration;
  currentLang = lang;
  const data = await loadContacts();

  if (generation !== renderGeneration) {
    return;
  }

  contactsData = data;
  const locations = getLocations(contactsData);
  const title = document.getElementById("contact-title");

  if (!activeLocationId && locations[0]) {
    activeLocationId = locations[0].id;
  }

  if (title) {
    if (!title.hasAttribute("data-i18n")) {
      title.textContent = pickLocalized(contactsData, lang, "title");
    }
    initLocationChips();
    initOrderForm();
    renderLocationChips(contactsData, lang);
    renderContactList(contactsData, lang);
    renderMap(getActiveLocation(contactsData), contactsData, lang);
    renderOrderFormLocations(contactsData, lang);
    renderSocials(document.getElementById("contact-socials"), contactsData.socials, 22);

    if (reveal) {
      observeRevealElements(
        [
          title,
          document.getElementById("location-chips"),
          ...getContactListItems(),
          document.getElementById("contact-socials"),
          document.querySelector(".contact__form-wrap"),
          document.getElementById("contact-map"),
        ].filter(Boolean),
        70
      );
    }
  }

  renderSocials(document.getElementById("footer-socials"), contactsData.socials, 20);
}
