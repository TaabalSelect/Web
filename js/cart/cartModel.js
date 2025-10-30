// js/cart/cartModel.js
// Modelo de datos del carrito con persistencia (debounce + robustez)

import { STORAGE_KEYS } from "../config.js";

function safeLoad(key, fallback = {}) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSave(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // si falla (quota o modo privado), simplemente no persiste
  }
}

export class CartModel {
  constructor() {
    this.items = safeLoad(STORAGE_KEYS.CART, {}); // { [id]: { id, name, price, image, qty } }
    this._t = null;
  }

  _scheduleSave() {
    clearTimeout(this._t);
    this._t = setTimeout(() => safeSave(STORAGE_KEYS.CART, this.items), 120);
  }

  add(product, qty = 1) {
    const q = Math.max(1, qty | 0);
    const cur = this.items[product.id];
    if (cur) cur.qty += q;
    else this.items[product.id] = { id: product.id, name: product.name, price: product.price, image: product.image, qty: q };
    this._scheduleSave();
  }

  remove(id) {
    delete this.items[id];
    this._scheduleSave();
  }

  setQty(id, qty) {
    const it = this.items[id];
    if (!it) return;
    it.qty = Math.max(1, qty | 0);
    this._scheduleSave();
  }

  clear() {
    this.items = {};
    this._scheduleSave();
  }

  count() {
    return Object.values(this.items).reduce((a,b) => a + b.qty, 0);
  }

  subtotal() {
    return Object.values(this.items).reduce((a,b) => a + b.qty * b.price, 0);
  }

  toArray() {
    return Object.values(this.items);
  }
}
