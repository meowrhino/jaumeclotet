/* proyecto.js — bootstrap de la página de proyecto
   - Carga data/{slug}/project.json, normaliza rutas y renderiza.
   - Desktop: ratón (intacto).
   - Móvil: giroscopio → touch/drag → auto-animación.
   - Créditos: string (compat con formato viejo).
*/

"use strict";

import { param } from "./proyecto/utils.js";
import { setPageMeta } from "./proyecto/meta.js";
import { normalizePaths } from "./proyecto/normalize.js";
import { renderProject } from "./proyecto/render.js";
import { setupRandomArrows } from "./proyecto/arrows.js";

// ============ Carga de datos del proyecto ============

async function loadProject() {
  const slug = param("slug");
  if (!slug) {
    console.warn("[projecte] No slug in URL.");
    return;
  }
  try {
    const url = `data/${slug}/project.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status + " for " + url);
    const p = await res.json();

    // Prefijo base para todas las rutas del JSON
    const base = `data/${slug}/`;
    normalizePaths(p, base);
    setPageMeta(p, slug);
    renderProject(p);

    // Quita el botón "volver" del HTML (lo sustituimos por flechas al final)
    const oldBack = document.querySelector(".back");
    if (oldBack) oldBack.remove();

    // Inserta las dos flechas que navegan aleatoriamente a prev/next
    setupRandomArrows(slug);

    // Marca este proyecto como "visto" para el sistema de desbloqueo
    localStorage.setItem("proyecto-" + slug + "-visto", "1");
  } catch (err) {
    console.error("[projecte] load error:", err);
  }
}

// ============ Bootstrap ============

window.addEventListener("DOMContentLoaded", loadProject);
