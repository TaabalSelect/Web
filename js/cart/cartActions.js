// js/cart/cartActions.js
// Conecta el modelo del carrito con la vista y acciones de envío

import { WHATSAPP_NUMBER, EMAIL_TO, formatter } from "../config.js";
import { CartModel } from "./cartModel.js";
import { bindOpenClose, updateBadge, renderItems, updateSubtotal, confirmClear } from "./cartView.js";
import { getColumnVisibility } from "../data.js";

const clearBtn = document.getElementById("clearCartBtn");
const waBtn = document.getElementById("whatsAppBtn");
const emailBtn = document.getElementById("emailBtn");

export class CartController {
  constructor() {
    this.model = new CartModel();
    this.ui = bindOpenClose();
    this.render();
    this.bindActions();
    this.syncLinks();
  }

  render() {
    updateBadge(this.model.count());
    renderItems(this.model.toArray());
    updateSubtotal(this.visibleSubtotal());
    this.syncLinks(); // asegura que los enlaces se refresquen tras cada render
  }

  visibleSubtotal() {
    const vis = getColumnVisibility();
    return vis.showPrice ? this.model.subtotal() : 0;
  }

  bindActions() {
    document.addEventListener("cart:add", (e) => {
      const { product, qty } = e.detail;
      this.model.add(product, qty);
      this.render();
      showToast("Agregado al carrito");
    });

    document.addEventListener("cart:remove", (e) => {
      this.model.remove(e.detail.id);
      this.render();
    });

    document.addEventListener("cart:setQty", (e) => {
      this.model.setQty(e.detail.id, e.detail.qty);
      this.render();
    });

    clearBtn?.addEventListener("click", () => {
      confirmClear(() => {
        this.model.clear();
        this.render();
      });
    });
  }

  syncLinks() {
    const vis = getColumnVisibility();
    const showPrice = !!vis.showPrice;

    const lines = this.model.toArray().map(it => {
      const unit = showPrice ? ` = ${formatter.format(it.qty * it.price)}` : "";
      return `• ${it.name} x ${it.qty}${unit}`;
    });

    const total = showPrice ? formatter.format(this.model.subtotal()) : "—";
    const body = [
      "Pedido Taabal Select",
      "",
      ...lines,
      "",
      `Subtotal: ${total}`,
      "",
      "Para facturación es necesaria su constancia de situación fiscal no mayor a 3 meses de antigüedad."
    ].join("\n");

    const waText = encodeURIComponent(body);
    if (waBtn) waBtn.href = `https://wa.me/${encodeURIComponent(WHATSAPP_NUMBER)}?text=${waText}`;

    const subject = encodeURIComponent("Pedido Taabal Select");
    const mailBody = encodeURIComponent(body);
    if (emailBtn) emailBtn.href = `mailto:${encodeURIComponent(EMAIL_TO)}?subject=${subject}&body=${mailBody}`;
  }
}

// Toast minimalista (coincide con .toast en components.css)
let toastEl;
function ensureToast() {
  if (toastEl) return toastEl;
  toastEl = document.createElement("div");
  toastEl.className = "toast";
  document.body.appendChild(toastEl);
  return toastEl;
}
export function showToast(msg = "") {
  const el = ensureToast();
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1600);
}
