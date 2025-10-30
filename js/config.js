// js/config.js
// Configuración global y constantes del proyecto Taabal Select

export const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ41A4D1cmN23Xi9S1w0ANAg8G7LtD8LcE5f5NsDoI3RnajTFJMndjIsEa6L9z75g/pub?gid=94817388&single=true&output=csv";

export const WHATSAPP_NUMBER = "111"; // Número de prueba
export const EMAIL_TO = "Ventas@TabaalSelect.com";

export const STORAGE_KEYS = Object.freeze({
  CART: "taabal-select:cart:v1"
});

export const formatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2
});

// Utilidad: normaliza claves (headers) para mapeo flexible
export function normalizeKey(key) {
  return String(key || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Utilidad: interpreta valores booleanos provenientes del CSV
// Compatibilidad con Google Sheets en español (VERDADERO/FALSO)
export function isTruthy(value) {
  const v = String(value ?? "").trim().toLowerCase();
  if (["falso", "false", "no", "0", ""].includes(v)) return false;
  return [
    "1","true","si","sí","yes","x","✓","check","checked",
    "activo","activa","ok","verdadero"
  ].includes(v);
}

// Utilidad: parsea números/moneda de forma robusta
export function toNumber(value) {
  if (typeof value === "number") return value;
  if (value == null) return 0;
  const cleaned = String(value)
    .replace(/[^0-9,.\-]/g, "")
    .replace(/\.(?=.*\.)/g, "") // deja solo el último punto
    .replace(/,(?=[0-9]{3}\b)/g, ""); // elimina comas miles
  const num = Number(cleaned.replace(",", "."));
  return Number.isFinite(num) ? num : 0;
}
