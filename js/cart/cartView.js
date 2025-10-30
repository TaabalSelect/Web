// js/cart/cartView.js
// Versión visual 2025 — tarjetas detalladas con estilo Taabal Select

import { formatter } from "../config.js";
import { getColumnVisibility } from "../data.js";

const overlay = document.getElementById("overlay");
const drawer = document.getElementById("cartDrawer");
const itemsEl = document.getElementById("cartItems");
const subtotalWrap = document.querySelector(".totals");
const subtotalValue = document.querySelector(".totals span");
const badge = document.getElementById("cartBadge");
const openBtn = document.getElementById("openCartBtn");
const closeBtn = document.getElementById("closeCartBtn");
const confirmDialog = document.getElementById("confirmDialog");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");
const invoiceHint = document.querySelector(".invoice-hint");

let delegatedBound = false;

// ============================================================
// Delegación de eventos internos del carrito
// ============================================================
function bindDelegatedEvents() {
  if (delegatedBound) return;
  delegatedBound = true;

  // Cambios de cantidad
  itemsEl.addEventListener("change", (e) => {
    const input = e.target.closest(".qty-input");
    if (!input) return;
    const row = e.target.closest(".cart-item");
    const id = row?.dataset?.id;
    const qty = Math.max(1, parseInt(input.value, 10) || 1);
    if (id)
      document.dispatchEvent(new CustomEvent("cart:setQty", { detail: { id, qty } }));
  });

  // Eliminar ítem
  itemsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".remove");
    if (!btn) return;
    const row = btn.closest(".cart-item");
    const id = row?.dataset?.id;
    if (id)
      document.dispatchEvent(new CustomEvent("cart:remove", { detail: { id } }));
  });
}

// ============================================================
// Apertura / cierre del drawer
// ============================================================
export function bindOpenClose() {
  bindDelegatedEvents();

  const open = () => {
    drawer.hidden = false;
    overlay.hidden = false;
    requestAnimationFrame(() => {
      drawer.classList.add("open");
      overlay.classList.add("show");
    });
  };
  const close = () => {
    drawer.classList.remove("open");
    overlay.classList.remove("show");
    setTimeout(() => {
      drawer.hidden = true;
      overlay.hidden = true;
    }, 250);
  };

  openBtn?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  overlay?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !drawer.hidden) close();
  });

  return { open, close };
}

// ============================================================
// Badge (contador superior)
// ============================================================
export function updateBadge(count) {
  if (badge) badge.textContent = String(count);
}

// ============================================================
// Render de los ítems — NUEVA ESTRUCTURA
// ============================================================
export function renderItems(cartArray) {
  const vis = getColumnVisibility();
  itemsEl.innerHTML = "";

  if (!cartArray.length) {
    itemsEl.innerHTML = `<p class="text-muted">Tu carrito está vacío.</p>`;
    updateSubtotal(0);
    return;
  }

  const frag = document.createDocumentFragment();

  cartArray.forEach((it) => {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.dataset.id = it.id;

    // Plantilla HTML del producto
    row.innerHTML = `
      ${vis.showImage ? `<div class="cart-thumb"><img src="${it.image || "./assets/images/imagen-prueba.webp"}" alt="${it.name}"></div>` : ""}
      <div class="cart-item-info">
        <p class="code"><strong>Código:</strong> ${it.code || "N/D"}</p>
        <p class="name">${vis.showName ? it.name : "Producto"}</p>
        <p class="desc">${it.description || ""}</p>
        <div class="qty-line">
          <span>Cantidad:</span>
          <input class="qty-input" type="number" min="1" value="${it.qty}">
          ${
            vis.showPrice && it.price
              ? `<span class="total">${formatter.format(it.price * it.qty)}</span>`
              : ""
          }
        </div>
      </div>
      <button class="remove" aria-label="Eliminar del carrito">
        <span class="x-icon">×</span>
      </button>
    `;

    frag.appendChild(row);
  });

  itemsEl.appendChild(frag);
}

// ============================================================
// Subtotal dinámico + visibilidad global
// ============================================================
export function updateSubtotal(totalValue) {
  const vis = getColumnVisibility();
  if (!subtotalWrap || !invoiceHint) return;

  if (!vis.showPrice) {
    subtotalWrap.style.display = "none";
    invoiceHint.style.display = "block";
    if (subtotalValue) subtotalValue.textContent = "";
  } else {
    subtotalWrap.style.display = "flex";
    invoiceHint.style.display = "block";
    if (subtotalValue) subtotalValue.textContent = formatter.format(totalValue);
  }
}

// ============================================================
// Confirmación de vaciado
// ============================================================
export function confirmClear(onConfirm) {
  if (!confirmDialog) {
    if (window.confirm("¿Vaciar carrito?")) onConfirm?.();
    return;
  }

  confirmDialog.showModal();

  const cleanup = () => {
    confirmYes.removeEventListener("click", yes);
    confirmNo.removeEventListener("click", no);
  };

  const yes = () => {
    cleanup();
    confirmDialog.close();
    onConfirm?.();
  };
  const no = () => {
    cleanup();
    confirmDialog.close();
  };

  confirmYes.addEventListener("click", yes);
  confirmNo.addEventListener("click", no);
}
