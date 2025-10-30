// js/data.js
// Google Sheets: Fila 1 = checkboxes de visibilidad por columna
//                Fila 2 = encabezados
//                Fila 3+ = productos
// Incluye cache-busting y saneo de imagen para evitar URLs inválidas.

import { CSV_URL, normalizeKey, isTruthy, toNumber } from "./config.js";

/** Estado global de visibilidad por columna (fila 1) */
let columnVisibility = {
  showImage: true,
  showName: true,
  showDescription: true,
  showBrand: true,
  showCategory: true,
  showPrice: true,
};
export function getColumnVisibility() {
  return columnVisibility;
}

/** CSV -> filas (array de arrays) robusto con comillas y saltos */
function csvToRows(text) {
  const rows = [];
  let i = 0, field = "", row = [], inQuotes = false;

  const endField = () => { row.push(field); field = ""; };
  const endRow = () => { rows.push(row); row = []; };

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") endField();
      else if (c === "\n") { endField(); endRow(); }
      else if (c !== "\r") field += c;
    }
    i++;
  }
  if (field.length || row.length) { endField(); endRow(); }
  return rows.filter(r => r.length && r.some(c => String(c).trim() !== ""));
}

/** Mapea nombres de columnas tolerante a variaciones */
function mapFields(headerNorm) {
  const findKey = (cands) => {
    const set = new Set(headerNorm);
    for (const c of cands) if (set.has(c)) return c;
    for (const c of cands) {
      const hit = headerNorm.find(k => k.includes(c));
      if (hit) return hit;
    }
    return null;
  };
  return {
    kName: findKey(["nombre","producto","name","titulo","title"]),
    kDesc: findKey(["descripcion","description","detalle","resumen"]),
    kBrand: findKey(["marca","brand"]),
    kCat:  findKey(["categoria","category"]),
    kImg:  findKey(["imagen","image","url_imagen","foto","image_url","url","img"]),
    kPrice:findKey(["precio","price","costo"]),
    kId:   findKey(["id","sku","codigo","codigo_producto","code"]),
    kRowActive: findKey(["activo","activo_fila","habilitado","visible","mostrar"]),
    kColActive: findKey(["activo_columna","columna_activa","activo_general","publicado","publish"]),
  };
}

/** ¿Parece URL de imagen válida? si no, tratamos como vacío */
function isLikelyImageURL(v) {
  const s = String(v || "").trim().toLowerCase();
  if (!s) return false;
  // acepta http(s), data:image y extensiones comunes
  return /^(https?:\/\/|data:image\/)/.test(s) || /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/.test(s);
}

/** Normaliza un producto */
function normalizeProduct(rowObj, map, idx) {
  const id = String(rowObj[map.kId] ?? `p_${idx + 1}`);
  const name = String(rowObj[map.kName] ?? "").trim() || "(Sin nombre)";
  const description = String(rowObj[map.kDesc] ?? "").trim();
  const brand = String(rowObj[map.kBrand] ?? "").trim();
  const category = String(rowObj[map.kCat] ?? "Sin categoría").trim() || "Sin categoría";
  const rawImg = rowObj[map.kImg];
  const image = isLikelyImageURL(rawImg) ? String(rawImg).trim() : ""; // placeholder si vacío
  const price = toNumber(rowObj[map.kPrice]);
  return { id, name, description, brand, category, image, price, raw: rowObj };
}

/** Reglas por fila: visible + activo_columna si existiera */
function isActive(rowObj, map) {
  const rowFlag = map.kRowActive ? isTruthy(rowObj[map.kRowActive]) : true;
  const colFlag = map.kColActive ? isTruthy(rowObj[map.kColActive]) : true;
  return rowFlag && colFlag;
}

export async function loadProducts() {
  // Cache-busting agresivo para evitar CSV cacheado por Google
  const resp = await fetch(`${CSV_URL}&ts=${Date.now()}`, { cache: "no-store" });
  if (!resp.ok) throw new Error(`No se pudo cargar el CSV (${resp.status})`);
  const text = await resp.text();

  const rows = csvToRows(text);
  if (rows.length < 2) return [];

  // Fila 1 = checkboxes (config), Fila 2 = encabezados
  const configRow = rows[0];
  const headerRow = rows[1];
  const headerNorm = headerRow.map(h => normalizeKey(h));

  // Construimos objetos para filas 3+
  const dataRows = rows.slice(2);
  const json = dataRows.map(r => {
    const obj = {};
    for (let k = 0; k < headerNorm.length; k++) obj[headerNorm[k]] = r[k] ?? "";
    return obj;
  }).filter(r => Object.values(r).some(v => String(v).trim() !== ""));

  // Mapeos
  const map = mapFields(headerNorm);

  // Visibilidad por columna (fila 1). Si celda vacía => visible por defecto (true).
  const visOrDefault = (val) => (String(val).trim() === "" ? true : isTruthy(val));
  const byIdx = (key) => {
    if (!key) return null;
    const colIndex = headerNorm.indexOf(key);
    return colIndex >= 0 ? configRow[colIndex] : null;
  };

  columnVisibility = {
    showImage: visOrDefault(byIdx(map.kImg)),
    showName: visOrDefault(byIdx(map.kName)),
    showDescription: visOrDefault(byIdx(map.kDesc)),
    showBrand: visOrDefault(byIdx(map.kBrand)),
    showCategory: visOrDefault(byIdx(map.kCat)),
    showPrice: visOrDefault(byIdx(map.kPrice)),
  };

  // Productos activos
  const products = [];
  for (let i = 0; i < json.length; i++) {
    const rowObj = json[i];
    if (!isActive(rowObj, map)) continue;
    products.push(normalizeProduct(rowObj, map, i));
  }
  return products;
}
