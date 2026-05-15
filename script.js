const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const revealItems = document.querySelectorAll(".section-reveal");
const heroSliders = document.querySelectorAll("[data-hero-slider]");
const carousels = document.querySelectorAll("[data-carousel]");
const taxPlanTabs = document.querySelectorAll("[data-tax-tabs]");
const planCategoryLinks = document.querySelectorAll("[data-plan-category-link]");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.16,
    rootMargin: "0px 0px -40px 0px",
  }
);

revealItems.forEach((item) => revealObserver.observe(item));

heroSliders.forEach((slider) => {
  const slides = Array.from(slider.querySelectorAll("[data-hero-slide]"));
  const dotsContainer = slider.querySelector("[data-hero-dots]");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let activeIndex = 0;
  let autoplayId;

  if (!slides.length || !dotsContainer) {
    return;
  }

  const activateSlide = (index) => {
    activeIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === activeIndex);
    });

    const activeSlide = slides[activeIndex];
    if (activeSlide.dataset.heroRatio) {
      slider.style.setProperty("--hero-ratio", activeSlide.dataset.heroRatio);
    }

    Array.from(dotsContainer.children).forEach((dot, dotIndex) => {
      dot.setAttribute("aria-current", String(dotIndex === activeIndex));
    });
  };

  const stopAutoplay = () => {
    window.clearInterval(autoplayId);
  };

  const startAutoplay = () => {
    stopAutoplay();

    if (prefersReducedMotion || slides.length <= 1) {
      return;
    }

    autoplayId = window.setInterval(() => {
      activateSlide(activeIndex + 1);
    }, 4600);
  };

  slides.forEach((slide, index) => {
    const dot = document.createElement("button");
    dot.className = "hero-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `ไปยังภาพที่ ${index + 1}`);
    dot.addEventListener("click", () => {
      activateSlide(index);
      startAutoplay();
    });
    dotsContainer.append(dot);
  });

  slider.addEventListener("mouseenter", stopAutoplay);
  slider.addEventListener("mouseleave", startAutoplay);

  activateSlide(0);
  startAutoplay();
});

carousels.forEach((carousel) => {
  const track = carousel.querySelector("[data-carousel-track]");
  const prevButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const dotsContainer = carousel.querySelector("[data-carousel-dots]");
  const searchInput = carousel.querySelector("[data-carousel-search]");
  const filterSelect = carousel.querySelector("[data-carousel-filter]");
  const clearButton = carousel.querySelector("[data-carousel-clear]");
  const emptyText = carousel.querySelector("[data-carousel-empty]");
  const items = Array.from(carousel.querySelectorAll(".solution-item"));
  let activeIndex = 0;
  let autoplayId;

  if (!track || !prevButton || !nextButton || !dotsContainer || items.length === 0) {
    return;
  }

  const getVisibleCount = () => {
    const styles = window.getComputedStyle(carousel);
    return Math.max(1, Number.parseInt(styles.getPropertyValue("--carousel-columns"), 10) || 1);
  };

  const getVisibleItems = () => items.filter((item) => !item.hidden);

  const getStep = () => {
    const visibleItems = getVisibleItems();
    if (visibleItems.length === 0) {
      return track.clientWidth;
    }

    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
    return visibleItems[0].getBoundingClientRect().width + gap;
  };

  const getMaxIndex = () => Math.max(0, getVisibleItems().length - getVisibleCount());
  const getDotCount = () => (getVisibleItems().length === 0 ? 0 : getMaxIndex() + 1);

  const renderDots = () => {
    const dotCount = getDotCount();

    if (dotsContainer.children.length === dotCount) {
      return;
    }

    dotsContainer.replaceChildren();

    for (let index = 0; index < dotCount; index += 1) {
      const dot = document.createElement("button");
      dot.className = "carousel-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `ไปยังสไลด์ที่ ${index + 1}`);
      dot.addEventListener("click", () => {
        activeIndex = index;
        updateCarousel();
        restartAutoplay();
      });
      dotsContainer.append(dot);
    }
  };

  const updateCarousel = () => {
    renderDots();
    activeIndex = Math.min(Math.max(activeIndex, 0), getMaxIndex());
    track.style.transform = `translateX(${-activeIndex * getStep()}px)`;
    prevButton.disabled = activeIndex === 0;
    nextButton.disabled = activeIndex >= getMaxIndex();

    Array.from(dotsContainer.children).forEach((dot, index) => {
      dot.setAttribute("aria-current", String(index === activeIndex));
    });

    const visibleCount = getVisibleItems().length;
    if (emptyText) {
      emptyText.hidden = visibleCount > 0;
    }
  };

  const goNext = () => {
    if (getMaxIndex() === 0) {
      return;
    }

    activeIndex = activeIndex >= getMaxIndex() ? 0 : activeIndex + 1;
    updateCarousel();
  };

  const stopAutoplay = () => {
    window.clearInterval(autoplayId);
  };

  const startAutoplay = () => {
    stopAutoplay();
    if (getMaxIndex() === 0) {
      return;
    }

    autoplayId = window.setInterval(goNext, 4200);
  };

  const restartAutoplay = () => {
    stopAutoplay();
    startAutoplay();
  };

  prevButton.addEventListener("click", () => {
    activeIndex -= 1;
    updateCarousel();
    restartAutoplay();
  });

  nextButton.addEventListener("click", () => {
    activeIndex += 1;
    updateCarousel();
    restartAutoplay();
  });

  const applyFilters = () => {
    const query = searchInput?.value.trim().toLowerCase() || "";
    const category = filterSelect?.value || "all";

    items.forEach((item) => {
      const matchesQuery = query.length === 0 || item.textContent.toLowerCase().includes(query);
      const matchesCategory = category === "all" || item.dataset.category === category;
      item.hidden = !matchesQuery || !matchesCategory;
    });

    activeIndex = 0;
    renderDots();
    updateCarousel();
    restartAutoplay();
  };

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }

  if (filterSelect) {
    filterSelect.addEventListener("change", applyFilters);
  }

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
      }

      if (filterSelect) {
        filterSelect.value = "all";
      }

      applyFilters();
      searchInput?.focus();
    });
  }

  carousel.addEventListener("mouseenter", stopAutoplay);
  carousel.addEventListener("mouseleave", startAutoplay);

  window.addEventListener("resize", () => {
    renderDots();
    updateCarousel();
  });
  updateCarousel();
  startAutoplay();
});

taxPlanTabs.forEach((tabs) => {
  const buttons = Array.from(tabs.querySelectorAll("[data-tax-category]"));
  const grid = tabs.querySelector("[data-tax-plan-grid]");
  const empty = tabs.querySelector("[data-tax-plan-empty]");
  const moreButton = tabs.querySelector("[data-tax-plan-more]");
  const cards = Array.from(tabs.querySelectorAll("[data-tax-plan-card]"));
  const planSection = tabs.closest(".tax-plans");
  const initialVisibleCount = 6;
  let activeCategory = buttons.find((button) => button.classList.contains("is-active"))?.dataset.taxCategory || "savings";
  let isExpanded = false;

  if (!buttons.length || !grid || !empty) {
    return;
  }

  cards.forEach((card) => {
    const content = card.querySelector(".tax-plan-content");
    const titleLink = content?.querySelector("h3 a");

    if (!content || !titleLink || content.querySelector(".tax-plan-detail")) {
      return;
    }

    const detailLink = document.createElement("a");
    detailLink.className = "tax-plan-detail";
    detailLink.href = titleLink.getAttribute("href") || "#";
    detailLink.textContent = "ดูรายละเอียด";
    detailLink.setAttribute("aria-label", `ดูรายละเอียด ${titleLink.textContent.trim()}`);
    content.append(detailLink);
  });

  const updateVisibleCards = () => {
    const activeCards = cards.filter((card) => (card.dataset.taxPlanCategory || "savings") === activeCategory);

    cards.forEach((card, index) => {
      const isActiveCategory = (card.dataset.taxPlanCategory || "savings") === activeCategory;
      const activeIndex = activeCards.indexOf(card);
      card.hidden = !isActiveCategory || (!isExpanded && activeIndex >= initialVisibleCount);
    });

    const hasCards = activeCards.length > 0;
    grid.hidden = !hasCards;
    empty.hidden = hasCards;

    if (moreButton) {
      moreButton.hidden = activeCards.length <= initialVisibleCount || !hasCards;
      moreButton.textContent = isExpanded ? "แสดงน้อยลง" : "ดูเพิ่มเติม";
    }
  };

  const activateCategory = (category) => {
    if (!buttons.some((button) => button.dataset.taxCategory === category)) {
      return false;
    }

    activeCategory = category;

    buttons.forEach((button) => {
      const isActive = button.dataset.taxCategory === category;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    isExpanded = false;
    updateVisibleCards();
    return true;
  };

  const activateCategoryFromHash = () => {
    const category = window.location.hash.replace("#tax-plans-", "");
    return category.length > 0 && activateCategory(category);
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      activateCategory(button.dataset.taxCategory);
    });
  });

  planCategoryLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const category = link.dataset.planCategoryLink;

      if (!category || !activateCategory(category)) {
        return;
      }

      event.preventDefault();
      window.history.pushState(null, "", `#tax-plans-${category}`);
      planSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  window.addEventListener("hashchange", activateCategoryFromHash);

  if (moreButton) {
    moreButton.addEventListener("click", () => {
      isExpanded = !isExpanded;
      updateVisibleCards();
    });
  }

  if (!activateCategoryFromHash()) {
    updateVisibleCards();
  }
});

const contactNameField = document.querySelector(".contact-form input[name=\"name\"]");
if (contactNameField) {
  const ensureKhunPrefix = () => {
    const raw = contactNameField.value.trim();
    if (!raw) {
      return;
    }
    if (/^คุณ\s+/u.test(raw)) {
      return;
    }
    contactNameField.value = `คุณ ${raw}`;
  };

  contactNameField.addEventListener("blur", ensureKhunPrefix);
  contactNameField.closest("form")?.addEventListener("submit", ensureKhunPrefix);
}
