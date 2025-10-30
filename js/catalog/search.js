// js/catalog/search.js — búsqueda universal sincronizada (desktop + móvil)

export function initSearch() {
  const inputDesktop = document.getElementById("searchInput");
  const inputMobile = document.querySelector(".search-mobile .search-input");

  const triggerSearch = (value) => {
    document.dispatchEvent(
      new CustomEvent("filter:search", {
        detail: { query: value.trim().toLowerCase() },
      })
    );
  };

  // Desktop
  if (inputDesktop) {
    inputDesktop.addEventListener("input", (e) => {
      triggerSearch(e.target.value);
    });
  }

  // Mobile
  if (inputMobile) {
    inputMobile.addEventListener("input", (e) => {
      triggerSearch(e.target.value);
    });
  }

  // Restablecer búsqueda con tecla Escape
  [inputDesktop, inputMobile].forEach((input) => {
    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          input.value = "";
          triggerSearch("");
        }
      });
    }
  });
}
