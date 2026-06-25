export function pickLocalized(item, lang, field) {
  return item[`${field}_${lang}`] || item[`${field}_uk`] || "";
}

export function encodeAssetPath(path) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function attachBrokenImageFallback(img) {
  img.addEventListener("error", () => {
    img.classList.add("is-broken");
  });

  if (img.complete && img.naturalWidth === 0) {
    img.classList.add("is-broken");
  }
}
