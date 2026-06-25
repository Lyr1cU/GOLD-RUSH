const HERO_STAGGER_MS = 130;
const OBSERVER_OPTIONS = {
  threshold: 0.12,
  rootMargin: "0px 0px -6% 0px",
};

let revealObserver = null;

function markReveal(el, delay = 0, variant) {
  el.classList.add("reveal");
  el.classList.toggle("reveal--from-left", variant === "from-left");

  if (delay > 0) {
    el.style.setProperty("--reveal-delay", `${delay}ms`);
  } else {
    el.style.removeProperty("--reveal-delay");
  }
}

function getRevealDelay(el) {
  const value = el.style.getPropertyValue("--reveal-delay");
  if (!value) {
    return 0;
  }

  return Number.parseInt(value, 10) || 0;
}

function activateReveal(el, delay = getRevealDelay(el)) {
  window.setTimeout(() => {
    el.classList.add("is-visible");
  }, 80 + delay);
}

function revealHero() {
  const heroItems = document.querySelectorAll(".hero__content > *");
  heroItems.forEach((el, index) => {
    const delay = index * HERO_STAGGER_MS;
    markReveal(el, delay);
    window.setTimeout(() => {
      el.classList.add("is-visible");
    }, 80 + delay);
  });
}

export function revealPageHeroItems() {
  const container = document.querySelector(".page-hero .container");
  if (!container) {
    return;
  }

  const items = [...container.children];
  if (items.length === 0) {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  items.forEach((el, index) => {
    const delay = index * HERO_STAGGER_MS;
    markReveal(el, delay);
    window.setTimeout(() => {
      el.classList.add("is-visible");
    }, 80 + delay);
  });
}

function shouldSkipReveal(el) {
  const containers = "#promos, #menu, #gallery, #reviews, #contact";

  if (document.body.dataset.page === "about") {
    return Boolean(el.closest(`${containers}, #about`));
  }

  if (document.body.dataset.page === "contacts") {
    return Boolean(el.closest(containers));
  }

  return Boolean(el.closest(containers));
}

function addStaggered(parentSelector, childSelector, stagger) {
  const elements = [];

  document.querySelectorAll(parentSelector).forEach((parent) => {
    if (document.body.dataset.page === "about" && parent.closest("#about")) {
      return;
    }

    if (document.body.dataset.page === "contacts" && parent.closest("#contact")) {
      return;
    }

    const children =
      childSelector === ":scope > *"
        ? [...parent.children]
        : parent.querySelectorAll(childSelector);

    children.forEach((el, index) => {
      markReveal(el, index * stagger);
      elements.push(el);
    });
  });

  return elements;
}

function addSingles(selectors, skipInside = "") {
  const elements = [];

  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      if (shouldSkipReveal(el)) {
        return;
      }

      if (skipInside && el.parentElement?.closest(skipInside)) {
        return;
      }
      markReveal(el);
      elements.push(el);
    });
  });

  return elements;
}

function onReveal(entries, observer) {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) {
      return;
    }

    activateReveal(entry.target);
    observer.unobserve(entry.target);
  });
}

function isInViewport(el) {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
}

function ensureRevealObserver() {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(onReveal, OBSERVER_OPTIONS);
  }
}

export function observeRevealElements(elements, stagger = 70, options = {}) {
  const { variant, baseDelay = 0 } = options;
  const targets = elements.filter(Boolean);

  if (targets.length === 0) {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  ensureRevealObserver();

  targets.forEach((el, index) => {
    el.classList.remove("is-visible", "reveal", "reveal--from-left");
    el.style.removeProperty("--reveal-delay");

    const delay = baseDelay + index * stagger;
    markReveal(el, 0, variant);

    // Reflow so the hidden state is painted before we animate in.
    void el.offsetWidth;

    if (isInViewport(el)) {
      activateReveal(el, delay);
      return;
    }

    revealObserver.observe(el);
  });
}

function initFooterReveal() {
  const items = [...document.querySelectorAll(".footer__inner > *")];
  if (items.length === 0) {
    return;
  }

  observeRevealElements(items, 90);
}

export function initReveal() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const tracked = new Set();
  const observeList = [];

  revealHero();

  document.querySelectorAll(".hero__content > *").forEach((el) => {
    tracked.add(el);
  });

  const staggered = [
    ...addStaggered(".features", ".feature-card", 90),
    ...addStaggered(".contact__grid", ":scope > *", 110),
  ];

  staggered.forEach((el) => {
    if (!tracked.has(el)) {
      tracked.add(el);
      observeList.push(el);
    }
  });

  const singles = addSingles(
    [
      ".section-label",
      ".section-title",
      ".section-subtitle",
      ".about__text",
      ".contact-map",
    ],
    ".contact__info, .contact__form-wrap"
  );

  document.querySelectorAll(".section-more").forEach((el) => {
    if (!tracked.has(el)) {
      markReveal(el);
      tracked.add(el);
      observeList.push(el);
    }
  });

  singles.forEach((el) => {
    if (!tracked.has(el)) {
      tracked.add(el);
      observeList.push(el);
    }
  });

  ensureRevealObserver();
  observeList.forEach((el) => revealObserver.observe(el));

  initFooterReveal();
}
