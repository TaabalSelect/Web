// main.js — versión móvil + FAQ + buscador sincronizado 2025

import { loadProducts } from "./data.js";
import { renderCatalog } from "./catalog/catalog.js";
import { initCategories } from "./catalog/categories.js";
import { initSearch } from "./catalog/search.js";
import { CartController } from "./cart/cartActions.js";

/* ============================================================
   Estado Global
============================================================ */
const state = {
  all: [],
  filtered: [],
  query: "",
  category: null,
};

/* ============================================================
   Funciones auxiliares
============================================================ */
function normalize(str) {
  return str
    ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    : "";
}

function applyFilters() {
  const q = normalize(state.query);
  const cat = state.category ? normalize(state.category) : null;

  state.filtered = state.all.filter((p) => {
    const name = normalize(p.name);
    const desc = normalize(p.description);
    const brand = normalize(p.brand);
    const category = normalize(p.category);

    const matchesCat = !cat || category === cat;
    const matchesText =
      !q ||
      name.includes(q) ||
      desc.includes(q) ||
      brand.includes(q) ||
      category.includes(q);

    return matchesCat && matchesText;
  });

  renderCatalog(state.filtered);
}

/* ============================================================
   Inicialización principal
============================================================ */
async function bootstrap() {
  const loader = document.createElement("div");
  loader.className = "loader-bar";
  document.body.appendChild(loader);
  loader.classList.add("show");

  try {
    state.all = await loadProducts();
    state.filtered = state.all;

    initCategories(state.all);
    initSearch();
    renderCatalog(state.all);

    document.addEventListener("filter:category", (e) => {
      state.category = e.detail.category;
      applyFilters();
    });

    document.addEventListener("filter:search", (e) => {
      state.query = e.detail.query || "";
      applyFilters();
    });

    const cart = new CartController();
    window.__TS_CART__ = cart;
  } catch (err) {
    console.error(err);
  } finally {
    loader.classList.remove("show");
    setTimeout(() => loader.remove(), 600);
  }
}

bootstrap();

/* ============================================================
   MOBILE SEARCH — abrir y cerrar barra de búsqueda
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const mobileSearch = document.querySelector(".search-mobile");
  const searchBtn = document.querySelector(".search-toggle-btn");
  const searchInput = document.querySelector(".search-mobile .search-input");
  const searchIcon = document.querySelector(".search-mobile .search-icon");

  if (mobileSearch && searchBtn && searchInput) {
    // Abrir búsqueda
    searchBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      mobileSearch.classList.toggle("open");
      if (mobileSearch.classList.contains("open")) {
        searchInput.focus();
        if (searchIcon) searchIcon.style.opacity = "0"; // ocultar lupa
      } else {
        if (searchIcon) searchIcon.style.opacity = "1";
      }
    });

    // Cerrar tocando la zona izquierda (✕) o fuera
    document.addEventListener("click", (e) => {
      const isInside = mobileSearch.contains(e.target) || searchBtn.contains(e.target);
      if (!isInside && mobileSearch.classList.contains("open")) {
        mobileSearch.classList.remove("open");
        if (searchIcon) searchIcon.style.opacity = "1";
      }
    });

    // Detectar clic sobre la “X” (zona izquierda de la burbuja)
    mobileSearch.addEventListener("click", (e) => {
      if (mobileSearch.classList.contains("open") && e.offsetX < 35) {
        mobileSearch.classList.remove("open");
        if (searchIcon) searchIcon.style.opacity = "1";
      }
    });

    // Cerrar con Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileSearch.classList.contains("open")) {
        mobileSearch.classList.remove("open");
        if (searchIcon) searchIcon.style.opacity = "1";
      }
    });
  }

  /* ============================================================
     FAQ DIALOG — abrir / cerrar
  ============================================================ */
  const faqBtn = document.getElementById("faqBtn");
  const faqDialog = document.getElementById("faqDialog");
  const closeFaqBtn = document.getElementById("closeFaqBtn");

  if (faqBtn && faqDialog) {
    faqBtn.addEventListener("click", () => faqDialog.showModal());
    closeFaqBtn?.addEventListener("click", () => faqDialog.close());
    faqDialog.addEventListener("click", (e) => {
      if (e.target === faqDialog) faqDialog.close();
    });
  }
});
