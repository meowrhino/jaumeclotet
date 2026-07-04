// comodines.js — inserta bloques "comodín" en anclas específicas del proyecto

import { renderCreditos } from "./creditos.js";

// Inserta comodines en lugares específicos
export function renderComodines(list) {
  const root = document.getElementById("project-root");
  if (!root) return;

  // Mapa rápido de anclas base
  const anchors = {
    header: root.querySelector(".project-header"),
    textos: root.querySelector(".project-textos"),
    galeria: root.querySelector(".project-galeria"),
    creditos: root.querySelector(".project-creditos"),
    root,
  };

  for (const item of list) {
    const el = createComodinElement(item);
    if (!el) continue;

    // Si tiene id, regístralo en el propio nodo para poder referenciarlo con @id
    if (item.id) {
      if (root.querySelector(`[data-comodin-id="${CSS.escape(item.id)}"]`)) {
        console.warn("[comodin] id duplicado:", item.id);
      }
      el.dataset.comodinId = item.id;
    }

    const { target, position } = resolvePlace(item.place, anchors, root);
    if (!target) {
      console.warn(
        "[comodin] place no resuelto, usando final de root:",
        item.place
      );
      root.appendChild(el);
      continue;
    }

    if (position === "append") target.appendChild(el);
    else target.insertAdjacentElement(position, el);
  }
}

// Crea el nodo HTML del comodín según su tipo
function createComodinElement(it) {
  const align = it.align ? ` align-${it.align}` : "";
  const widthClass = ` width-${it.width ? it.width : "whole"}`; // por defecto 'whole'

  if (it.type === "text") {
    const section = document.createElement("section");
    section.className = `comodin comodin-text${align}${widthClass}`;
    const ps = Array.isArray(it.prose) ? it.prose : it.prose ? [it.prose] : [];
    if (!ps.length && it.text) ps.push(it.text);
    if (!ps.length) return null;
    section.innerHTML = ps.map((p) => `<p>${p}</p>`).join("");
    return section;
  }

  if (it.type === "image" && it.src) {
    const fig = document.createElement("figure");
    fig.className = `comodin comodin-image${align}${widthClass}`;
    // Imagen con enlace opcional (si hay link: abre en nueva pestaña y no participa en overlay)
    const imgTag = `<img src="${it.src}" alt="">`;
    let wrapped = imgTag;
    if (it.link) {
      const href = typeof it.link === "string" ? it.link : it.link.href;
      if (href) wrapped = `<a href="${href}" target="_blank" rel="noopener noreferrer">${imgTag}</a>`;
    }
    fig.innerHTML = wrapped + (it.caption ? `<figcaption>${it.caption}</figcaption>` : "");
    return fig;
  }

  if (it.type === "video" && it.src) {
    const fig = document.createElement("figure");
    fig.className = `comodin comodin-video${align}${widthClass}`;
    const poster = it.poster ? ` poster="${it.poster}"` : "";
    const attrs = [
      "controls",
      "playsinline",
      'preload="metadata"',
      it.muted ? "muted" : "",
      it.loop ? "loop" : "",
      it.autoplay ? "autoplay" : "",
    ]
      .filter(Boolean)
      .join(" ");
    fig.innerHTML =
      `<video src="${it.src}" ${attrs}${poster}></video>` +
      (it.caption ? `<figcaption>${it.caption}</figcaption>` : "");
    return fig;
  }

  // (opcional) tipo 'html'
  if (it.type === "html" && it.raw) {
    const div = document.createElement("div");
    div.className = `comodin comodin-html${align}${widthClass}`;
    div.innerHTML = it.raw;
    return div;
  }

  // tipo 'credits' → nueva sección de créditos reutilizando renderCreditos
  if (it.type === "credits" && (it.text || it.contenido || it.creditos)) {
    const section = document.createElement("section");
    section.className = `project-creditos comodin comodin-credits${align}${widthClass}`;
    const txt = it.creditos || it.text || it.contenido || "";
    section.innerHTML = renderCreditos(txt);
    return section;
  }

  console.warn("[comodin] tipo no soportado o datos incompletos:", it);
  return null;
}

// Traduce place -> {target, position}
function resolvePlace(place, anchors, root) {
  const def = { target: anchors.root, position: "beforeend" }; // 'end' por defecto
  if (!place) return def;

  // formatos: "after:header", "before:creditos", "end", "after:@intro", "append:#selector"
  const [rawPos, rawKey] = String(place).split(":");
  const pos = rawPos || "end";
  const key = rawKey || "";

  if (pos === "end") return def;

  // objetivo por palabra clave
  const byKey = (name) => {
    if (anchors[name]) return anchors[name];
    return root.querySelector(name); // permite selectores CSS si no es palabra clave
  };

  let target = null;
  if (key.startsWith("@")) {
    const id = key.slice(1);
    target = root.querySelector(`[data-comodin-id="${CSS.escape(id)}"]`);
  } else if (key) {
    target = byKey(key);
  }

  if (!target) return def;

  if (pos === "after") return { target, position: "afterend" };
  if (pos === "before") return { target, position: "beforebegin" };
  if (pos === "append") return { target, position: "beforeend" };

  return def;
}
