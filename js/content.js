const cache = new Map();

function getSiteRoot() {
  const { origin, pathname } = window.location;
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] || "";

  if (segments.length === 0) {
    return `${origin}/`;
  }

  if (last.includes(".")) {
    const dir = pathname.slice(0, pathname.lastIndexOf("/") + 1);
    return `${origin}${dir || "/"}`;
  }

  return `${origin}/${segments[0]}/`;
}

export async function loadJson(path) {
  const url = new URL(path, getSiteRoot()).href;

  if (cache.has(url)) {
    return cache.get(url);
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }

  const data = await response.json();
  cache.set(url, data);
  return data;
}

export function loadMenu() {
  return loadJson("content/menu.json");
}

export function loadGallery() {
  return loadJson("content/gallery.json");
}

export function loadReviews() {
  return loadJson("content/reviews.json");
}

export function loadContacts() {
  return loadJson("content/contacts.json");
}

export function loadPromos() {
  return loadJson("content/promos.json");
}
