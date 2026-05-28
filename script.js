function toCleanPath(pathname) {
  if (!pathname || pathname === "/") return pathname || "/";
  if (/\/index\.html$/i.test(pathname)) return pathname.replace(/\/index\.html$/i, "/");
  if (/\.html$/i.test(pathname)) return pathname.replace(/\.html$/i, "");
  return pathname;
}

function normalizeHtmlUrlInAddressBar() {
  const cleanPath = toCleanPath(window.location.pathname);
  if (!cleanPath || cleanPath === window.location.pathname) return;
  const nextUrl = `${cleanPath}${window.location.search}${window.location.hash}`;
  window.history.replaceState(null, "", nextUrl);
}

function rewriteInternalHtmlLinks() {
  const links = document.querySelectorAll('a[href$=".html"]');
  links.forEach((a) => {
    const raw = a.getAttribute("href");
    if (!raw) return;
    if (/^(mailto:|tel:|javascript:|#)/i.test(raw)) return;
    if (/^(admin|cms)\//i.test(raw)) return;
    const [pathPart, hashPart = ""] = raw.split("#");
    const [basePath, queryPart = ""] = pathPart.split("?");
    if (!/\.html$/i.test(basePath)) return;
    const clean = toCleanPath(basePath);
    const query = queryPart ? `?${queryPart}` : "";
    const hash = hashPart ? `#${hashPart}` : "";
    a.setAttribute("href", `${clean}${query}${hash}`);
  });
}

normalizeHtmlUrlInAddressBar();
rewriteInternalHtmlLinks();

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

function revealSection(target) {
  target.classList.add("is-visible");
  target.querySelectorAll(".section-reveal").forEach((nested) => {
    nested.classList.add("is-visible");
  });
}

function revealSectionsInView() {
  revealItems.forEach((item) => {
    if (item.classList.contains("is-visible")) {
      return;
    }

    const rect = item.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.92 && rect.bottom > window.innerHeight * 0.08;

    if (inView) {
      revealSection(item);
    }
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        revealSection(entry.target);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.06,
    rootMargin: "0px 0px -8px 0px",
  }
);

if ("IntersectionObserver" in window) {
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => revealSection(item));
}

revealSectionsInView();
window.addEventListener("load", revealSectionsInView, { once: true });
window.addEventListener(
  "scroll",
  () => {
    window.requestAnimationFrame(revealSectionsInView);
  },
  { passive: true }
);

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
  const itemSelector = carousel.dataset.carouselItem || ".solution-item";
  const items = Array.from(carousel.querySelectorAll(itemSelector));
  let activeIndex = 0;
  let autoplayId;

  if (!track || items.length === 0) {
    return;
  }

  if (!prevButton && !nextButton && !dotsContainer) {
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
    if (!dotsContainer) {
      return;
    }

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

    if (prevButton) {
      prevButton.disabled = activeIndex === 0;
    }

    if (nextButton) {
      nextButton.disabled = activeIndex >= getMaxIndex();
    }

    if (dotsContainer) {
      Array.from(dotsContainer.children).forEach((dot, index) => {
        dot.setAttribute("aria-current", String(index === activeIndex));
      });
    }

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

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      activeIndex -= 1;
      updateCarousel();
      restartAutoplay();
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      activeIndex += 1;
      updateCarousel();
      restartAutoplay();
    });
  }

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

const articleGrids = document.querySelectorAll("[data-article-grid]");

articleGrids.forEach((block) => {
  const searchInput = block.querySelector("[data-article-grid-search]");
  const filterSelect = block.querySelector("[data-article-grid-filter]");
  const clearButton = block.querySelector("[data-article-grid-clear]");
  const emptyText = block.querySelector("[data-article-grid-empty]");
  const items = Array.from(block.querySelectorAll(".solution-item"));

  if (items.length === 0) {
    return;
  }

  const applyFilters = () => {
    const query = searchInput?.value.trim().toLowerCase() || "";
    const category = filterSelect?.value || "all";

    items.forEach((item) => {
      const matchesQuery = query.length === 0 || item.textContent.toLowerCase().includes(query);
      const matchesCategory = category === "all" || item.dataset.category === category;
      item.hidden = !matchesQuery || !matchesCategory;
    });

    if (emptyText) {
      emptyText.hidden = items.some((item) => !item.hidden);
    }
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

const contactInterestSelect = document.getElementById("contact-interest");
const contactPlanLink = document.getElementById("contact-plan-link");
const contactPlanField = document.getElementById("contact-plan-field");
const contactInsurancePlan = document.getElementById("contact-insurance-plan");

if (contactInterestSelect) {
  const updateContactPurpose = () => {
    const purpose = contactInterestSelect.value;
    const isAgent = purpose === "สนใจสมัครตัวแทน";
    const isInsurance = purpose === "สนใจทำประกัน";

    if (contactPlanField && contactInsurancePlan) {
      contactPlanField.hidden = !isInsurance;
      contactInsurancePlan.required = isInsurance;

      if (!isInsurance) {
        contactInsurancePlan.value = "";
      }
    }

    if (contactPlanLink) {
      contactPlanLink.hidden = !isAgent;
    }
  };

  contactInterestSelect.addEventListener("change", updateContactPurpose);
  updateContactPurpose();
}

const contactNameField = document.querySelector(".contact-form input[name=\"name\"]");
const contactForm = document.querySelector(".contact-form");
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
  contactForm?.addEventListener("submit", ensureKhunPrefix);
}

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitBtn = contactForm.querySelector(".contact-submit");
    const note = contactForm.querySelector(".form-note");
    const name = contactForm.querySelector('[name="name"]')?.value?.trim() || "";
    const phone = contactForm.querySelector('[name="phone"]')?.value?.trim() || "";
    const interest = contactForm.querySelector('[name="interest"]')?.value?.trim() || "";
    const insurancePlan = contactForm.querySelector('[name="insurance_plan"]')?.value?.trim() || "";
    const message = contactForm.querySelector('[name="message"]')?.value?.trim() || "";

    const siteRoot = window.location.pathname.replace(/\/[^/]+(?:\.html)?$/, "").replace(/\/$/, "") || "";
    const apiPath = `${siteRoot}/cms/api/index.php?path=/public/contact`;
    const payload = {
      name,
      phone,
      interest,
      insurance_plan: insurancePlan,
      message,
      source_page: window.location.pathname,
    };

    if (submitBtn) {
      submitBtn.disabled = true;
    }

    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "ส่งข้อมูลไม่สำเร็จ");
      }
      contactForm.reset();
      if (note) {
        note.textContent = "ส่งข้อมูลเรียบร้อยแล้ว ทีมงานจะติดต่อกลับโดยเร็วที่สุด";
        note.style.color = "#027a48";
      }
    } catch (err) {
      if (note) {
        note.textContent = err.message || "ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่หรือโทรติดต่อโดยตรง";
        note.style.color = "#b42318";
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
      }
    }
  });
}
