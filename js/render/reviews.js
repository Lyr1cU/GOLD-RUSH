import { loadReviews } from "../content.js";
import { observeRevealElements } from "../reveal.js";
import { pickLocalized } from "../utils.js";

let reviewIndex = 0;

function renderStars(count) {
  const safeCount = Math.max(1, Math.min(5, Number(count) || 5));
  return "★".repeat(safeCount);
}

function createReviewCard(item, lang, isActive) {
  const card = document.createElement("article");
  card.className = "review-card";

  if (isActive) {
    card.classList.add("is-active");
  }

  const stars = document.createElement("div");
  stars.className = "review-card__stars";
  stars.setAttribute("aria-label", `${item.stars || 5} / 5`);
  stars.textContent = renderStars(item.stars);

  const text = document.createElement("blockquote");
  text.className = "review-card__text";
  text.textContent = pickLocalized(item, lang, "text");

  const author = document.createElement("cite");
  author.className = "review-card__author";
  author.textContent = pickLocalized(item, lang, "author");

  card.append(stars, text, author);
  return card;
}

function showReview(index) {
  const cards = document.querySelectorAll("#reviews-track .review-card");
  const dots = document.querySelectorAll("#reviews-dots .reviews-dots__btn");

  if (cards.length === 0) {
    return;
  }

  reviewIndex = (index + cards.length) % cards.length;

  cards.forEach((card, i) => {
    card.classList.toggle("is-active", i === reviewIndex);
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle("is-active", i === reviewIndex);
    dot.setAttribute("aria-selected", String(i === reviewIndex));
  });
}

export async function renderReviews(lang) {
  const data = await loadReviews();

  const title = document.getElementById("reviews-title");
  const subtitle = document.getElementById("reviews-subtitle");
  const track = document.getElementById("reviews-track");
  const dots = document.getElementById("reviews-dots");

  if (!title || !subtitle || !track || !dots) {
    return;
  }

  title.textContent = pickLocalized(data, lang, "title");
  subtitle.textContent = pickLocalized(data, lang, "subtitle");

  track.replaceChildren();
  dots.replaceChildren();

  data.items.forEach((item, index) => {
    track.appendChild(createReviewCard(item, lang, index === 0));
  });

  data.items.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.className = "reviews-dots__btn";
    dot.type = "button";
    dot.dataset.slide = String(index);
    dot.setAttribute("aria-selected", String(index === 0));

    if (index === 0) {
      dot.classList.add("is-active");
    }

    dots.appendChild(dot);
  });

  reviewIndex = 0;
  showReview(0);

  observeRevealElements(
    [title, subtitle, document.querySelector("#reviews .reviews-slider"), dots],
    80
  );
}

export function initReviewsSlider() {
  const reviews = document.getElementById("reviews");

  if (!reviews || reviews.dataset.sliderReady === "true") {
    return;
  }

  reviews.addEventListener("click", (event) => {
    if (event.target.closest(".reviews-slider__arrow--prev")) {
      showReview(reviewIndex - 1);
      return;
    }

    if (event.target.closest(".reviews-slider__arrow--next")) {
      showReview(reviewIndex + 1);
      return;
    }

    const dot = event.target.closest(".reviews-dots__btn");

    if (dot) {
      showReview(Number(dot.dataset.slide));
    }
  });

  reviews.dataset.sliderReady = "true";
}
