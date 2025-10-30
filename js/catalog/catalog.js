// js/catalog/catalog.js
// Renderizado del catálogo con control de visibilidad por columna

import { formatter } from "../config.js";
import { getColumnVisibility } from "../data.js";

const catalogEl = document.getElementById("catalog");
const cardTpl = document.getElementById("productCardTemplate");

let lastKey = ""; // firma de los resultados (ids)
function sameKey(products) {
  const key = products.map(p => p.id).join("|");
  const unchanged = key === lastKey;
  lastKey = key;
  return unchanged;
}

function buildCard(product) {
  const vis = getColumnVisibility();

  if (cardTpl && "content" in cardTpl) {
    const node = cardTpl.content.cloneNode(true);
    const article = node.querySelector("article.card");
    article.dataset.id = product.id;
    article.setAttribute("role", "article");
    article.setAttribute("aria-label", product.name);

    // ============================================================
    // Imagen — corregido para usar /assets/images/
    // ============================================================
    const imgWrap = node.querySelector(".img-wrap");
    const img = node.querySelector("img");
    if (vis.showImage) {
      img.src = product.image || "/assets/images/imagen-prueba.webp";
      img.alt = product.name || "Producto";
      img.loading = "lazy";
      img.decoding = "async";
    } else {
      imgWrap?.remove();
    }

    // ============================================================
    // Título
    // ============================================================
    const titleEl = node.querySelector(".title");
    if (vis.showName) titleEl.textContent = product.name;
    else titleEl.remove();

    // ============================================================
    // Descripción
    // ============================================================
    const descEl = node.querySelector(".desc");
    if (vis.showDescription) descEl.textContent = product.description || "";
    else descEl.remove();

    // ============================================================
    // Meta: precio + marca + categoría
    // ============================================================
    const metaEl = node.querySelector(".meta");
    // Marca
    if (vis.showBrand && product.brand) {
      const brandSpan = document.createElement("span");
      brandSpan.className = "brand";
      brandSpan.textContent = product.brand;
      brandSpan.style.marginRight = ".5rem";
      metaEl.appendChild(brandSpan);
    }
    // Precio
    const priceSpan = node.querySelector(".price");
    if (vis.showPrice) {
      priceSpan.textContent = formatter.format(product.price);
    } else {
      priceSpan.remove();
    }
    // Categoría opcional
    if (vis.showCategory && product.category) {
      const cat = document.createElement("span");
      cat.className = "category";
      cat.textContent = product.category;
      cat.style.marginLeft = ".5rem";
      metaEl.appendChild(cat);
    }

    // ============================================================
    // Cantidades y botón "Agregar"
    // ============================================================
    const qtyInput = node.querySelector(".qty-input");
    const minus = node.querySelector(".qty-btn.minus");
    const plus = node.querySelector(".qty-btn.plus");

    minus.addEventListener("click", () => {
      qtyInput.value = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1);
    });
    plus.addEventListener("click", () => {
      qtyInput.value = Math.max(1, (parseInt(qtyInput.value, 10) || 1) + 1);
    });

    const addBtn = node.querySelector(".add-btn");
    addBtn.addEventListener("click", () => {
      const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
      document.dispatchEvent(new CustomEvent("cart:add", { detail: { product, qty } }));
      article.classList.add("added");
      setTimeout(() => article.classList.remove("added"), 600);
    });

    return node;
  }

  // ============================================================
  // Fallback si no existe template (por compatibilidad)
  // ============================================================

  const fallback = document.createElement("article");
  fallback.className = "card";
  fallback.role = "article";
  fallback.ariaLabel = product.name;

  const parts = [];

  // ============================================================
  // Imagen (fallback) — corregido también
  // ============================================================
  if (vis.showImage) {
    parts.push(`
    <div class="img-wrap">
      <img src="${product.image || "/assets/images/imagen-prueba.webp"}" alt="${product.name}" loading="lazy">
    </div>`);
  }

  // ============================================================
  // Cuerpo de la tarjeta
  // ============================================================
  const desc = vis.showDescription ? `<p class="desc">${product.description || ""}</p>` : "";
  const brand = vis.showBrand && product.brand ? `<span class="brand">${product.brand}</span>` : "";
  const cat = vis.showCategory && product.category ? `<span class="category">${product.category}</span>` : "";
  const price = vis.showPrice ? `<span class="price">${formatter.format(product.price)}</span>` : "";

  parts.push(`
    <div class="card-body">
      ${vis.showName ? `<h3 class="title">${product.name}</h3>` : ""}
      ${desc}
      <div class="meta">${brand}${price}${cat}</div>
      <div class="qty">
        <button class="qty-btn minus">–</button>
        <input class="qty-input" type="number" min="1" value="1">
        <button class="qty-btn plus">+</button>
      </div>
      <button class="add-btn">Agregar</button>
    </div>`);

  fallback.innerHTML = parts.join("");

  fallback.querySelector(".add-btn").addEventListener("click", () => {
    const qty = parseInt(fallback.querySelector(".qty-input").value, 10) || 1;
    document.dispatchEvent(new CustomEvent("cart:add", { detail: { product, qty } }));
  });

  return fallback;
}

export function renderCatalog(products) {
  // si el conjunto de IDs no cambió, no re-renderizamos
  if (products.length && sameKey(products)) return;

  catalogEl.innerHTML = "";
  if (!products.length) {
    const wrap = document.createElement("div");
    wrap.className = "empty";
    wrap.innerHTML = `<div class="empty-box">
      <h3>Sin resultados</h3>
      <p>No encontramos productos con los filtros actuales.</p>
    </div>`;
    catalogEl.appendChild(wrap);
    return;
  }

  const frag = document.createDocumentFragment();
  for (const p of products) frag.appendChild(buildCard(p));
  catalogEl.appendChild(frag);
}
