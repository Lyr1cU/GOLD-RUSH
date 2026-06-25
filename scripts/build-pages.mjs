import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getMenuCategories,
  menuCardHtml,
  menuTabsHtml,
  pickLocalized,
  promoCardHtml,
} from "./lib/catalog-html.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const DEFAULT_LANG = "uk";

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(root, relativePath), "utf8"));
}

function readHtml(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function writeHtml(relativePath, html) {
  writeFileSync(join(root, relativePath), html, "utf8");
}

function replaceBuildBlock(html, blockName, content) {
  const start = `<!-- build:${blockName} -->`;
  const end = `<!-- /build:${blockName} -->`;
  const pattern = new RegExp(
    `${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`
  );

  if (!pattern.test(html)) {
    throw new Error(`Build marker not found: ${blockName}`);
  }

  return html.replace(pattern, `${start}\n${content}\n${end}`);
}

function setElementAttribute(html, id, attribute, value) {
  const pattern = new RegExp(`(<[^>]+id="${id}"[^>]*)>`);

  if (!pattern.test(html)) {
    throw new Error(`Element #${id} not found`);
  }

  return html.replace(pattern, (match, opening) => {
    const withoutAttr = opening.replace(new RegExp(` ${attribute}="[^"]*"`), "");
    return `${withoutAttr} ${attribute}="${value}">`;
  });
}

function buildMenuPage(lang = DEFAULT_LANG) {
  const data = readJson("content/menu.json");
  let html = readHtml("menu.html");
  const categories = getMenuCategories(data);
  const activeCategory = categories[0]?.id || "burgers";

  const cards = data.items
    .map((item, index) => menuCardHtml(item, lang, index, activeCategory))
    .join("\n");

  const tabs = categories.length > 0 ? menuTabsHtml(categories, lang, activeCategory) : "";

  html = replaceBuildBlock(html, "menu-tabs", tabs);
  html = replaceBuildBlock(html, "menu-grid", cards);
  html = replaceBuildBlock(
    html,
    "menu-subtitle",
    pickLocalized(data, lang, "subtitle")
  );

  html = setElementAttribute(html, "menu-panel", "data-prebuilt", "true");
  html = setElementAttribute(html, "menu-panel", "aria-labelledby", `menu-tab-${activeCategory}`);

  writeHtml("menu.html", html);
  console.log(`Built menu.html (${data.items.length} items, lang=${lang})`);
}

function buildPromosPage(lang = DEFAULT_LANG) {
  const data = readJson("content/promos.json");
  let html = readHtml("promos.html");

  const cards = data.items
    .map((item, index) => promoCardHtml(item, lang, index))
    .join("\n");

  html = replaceBuildBlock(html, "promos-grid", cards);
  html = replaceBuildBlock(
    html,
    "promos-subtitle",
    pickLocalized(data, lang, "subtitle")
  );

  html = setElementAttribute(html, "promos-grid", "data-prebuilt", "true");

  writeHtml("promos.html", html);
  console.log(`Built promos.html (${data.items.length} items, lang=${lang})`);
}

buildMenuPage();
buildPromosPage();
