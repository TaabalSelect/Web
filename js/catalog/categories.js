// js/catalog/categories.js
// Menú desplegable de categorías optimizado

const toggleBtn = document.getElementById("categoryToggle");
const menuEl = document.getElementById("categoryMenu");

function closeMenu() {
  menuEl.classList.remove("open");
  toggleBtn.setAttribute("aria-expanded", "false");
  document.removeEventListener("click", handleOutside);
  document.removeEventListener("keydown", handleEscape);
}

function openMenu() {
  menuEl.classList.add("open");
  toggleBtn.setAttribute("aria-expanded", "true");
  // solo agrega listeners mientras está abierto
  setTimeout(() => {
    document.addEventListener("click", handleOutside);
    document.addEventListener("keydown", handleEscape);
  });
}

function handleOutside(e) {
  if (!menuEl.contains(e.target) && !toggleBtn.contains(e.target)) closeMenu();
}

function handleEscape(e) {
  if (e.key === "Escape") closeMenu();
}

export function initCategories(allProducts) {
  const counts = new Map();
  allProducts.forEach(p => {
    const key = p.category || "Sin categoría";
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  menuEl.innerHTML = "";

  const all = document.createElement("button");
  all.className = "option";
  all.type = "button";
  all.setAttribute("role","menuitem");
  all.textContent = "Todas";
  all.addEventListener("click", () => {
    document.dispatchEvent(new CustomEvent("filter:category", { detail: { category: null } }));
    closeMenu();
  });
  menuEl.appendChild(all);

  [...counts.keys()].sort((a,b) => a.localeCompare(b, "es")).forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.type = "button";
    btn.setAttribute("role", "menuitem");
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("filter:category", { detail: { category: cat } }));
      closeMenu();
    });
    menuEl.appendChild(btn);
  });

  toggleBtn.addEventListener("click", () => {
    const open = menuEl.classList.contains("open");
    open ? closeMenu() : openMenu();
  });
}
