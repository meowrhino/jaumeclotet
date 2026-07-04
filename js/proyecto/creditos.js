// creditos.js — créditos y markdown-lite (negrita/cursiva/subrayado/links)

import { escapeHtml } from "./utils.js";

// Convierte un string YA ESCAPADO (seguro) a HTML “permitido”
// Soporta: [link](url) / <a href="...">...</a> (escapado),
// **negrita**, *cursiva*, __subrayado__, y <strong>/<em>/<u> escapados.
export function linkifyEscaped(esc) {
  if (!esc) return esc;

  // Arregla “https: //” → “https://”
  const fixHref = (href) =>
    href ? href.replace(/^(https?):\s*\/\//i, "$1://").trim() : href;

  // 0) Énfasis HTML escapado (sin atributos) → real
  esc = esc.replace(/&lt;(strong|b)&gt;([\s\S]*?)&lt;\/\1&gt;/gi, "<strong>$2</strong>");
  esc = esc.replace(/&lt;(em|i)&gt;([\s\S]*?)&lt;\/\1&gt;/gi, "<em>$2</em>");
  esc = esc.replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi, "<u>$1</u>");

  // 1) <a href="...">…</a> escapado → real (solo http/https/mailto)
  esc = esc.replace(
    /&lt;a\s+href\s*=\s*(['"])(.*?)\1\s*&gt;([\s\S]*?)&lt;\/a&gt;/gi,
    (m, _q, href, inner) => {
      const safe = fixHref(href);
      if (!/^(https?:\/\/|mailto:)/i.test(safe)) return m;
      return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
    }
  );

  // 2) Links markdown: [texto](https://... | mailto:...) (tolera espacios alrededor del URL y tras https:)
  esc = esc.replace(
    /\[([^\]]+)\]\(\s*(https?:\s*\/\/[^\s)]+|mailto:[^\s)]+)\s*\)/g,
    (m, text, href) => {
      const safe = fixHref(href);
      return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    }
  );

  // 3) Énfasis markdown (orden pensado para que no colisione)
  esc = esc.replace(/__([^_]+?)__/g, "<u>$1</u>");                      // __subrayado__
  esc = esc.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");        // **negrita**
  esc = esc.replace(/(^|[^*])\*([^*]+?)\*(?!\*)/g, (m, p, t) => `${p}<em>${t}</em>`); // *cursiva*

  return esc;
}

// Créditos: parsea por líneas, pone en negrita lo anterior a ":" y permite enlaces seguros
export function renderCreditos(c) {
  if (!c) return "";
  const raw = typeof c === "string" ? c : c.contenido || "";
  const lines = String(raw).replace(/\r\n?/g, "\n").split("\n");

  const html = lines
    .map((line) => {
      const t = line.trim();
      if (!t) return "<br>";
      // Detecta "Etiqueta:" solo si está al principio de la línea y antes de cualquier `[` o `(`
      const m = t.match(/^([^:\[\(]+?):\s*(.*)$/);
      if (m) {
        const label = escapeHtml(m[1].trim());
        const restEsc = escapeHtml(m[2].trim());
        const rest = linkifyEscaped(restEsc);
        return `<div class="credit-line"><strong>${label}:</strong> ${rest}</div>`;
      } else {
        const full = linkifyEscaped(escapeHtml(t));
        return `<div class="credit-line">${full}</div>`;
      }
    })
    .join("");

  return html;
}
