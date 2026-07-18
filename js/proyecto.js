/* proyecto.js — bootstrap de la página de proyecto
   - Carga data/{slug}/project.json, normaliza rutas y renderiza.
   - Desktop: ratón (intacto).
   - Móvil: giroscopio → touch/drag → auto-animación.
   - Créditos: string (compat con formato viejo).
*/

"use strict";

import { param, escapeHtml } from "./proyecto/utils.js";
import { setPageMeta } from "./proyecto/meta.js";
import { normalizePaths } from "./proyecto/normalize.js";
import { renderProject } from "./proyecto/render.js";
import { setupRandomArrows } from "./proyecto/arrows.js";

// ============ Carga de datos del proyecto ============

async function loadProject() {
  // El slug puede venir de ?slug= (formato viejo), de window.__SLUG__
  // (páginas generadas /<slug>/ y 404.html) — en ese orden.
  const slug = param("slug") || window.__SLUG__ || "";
  if (!slug) {
    renderNotFound("");
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
    renderNotFound(slug);
  }
}

// Mensaje amable cuando el slug no existe (link roto, proyecto retirado…)
function renderNotFound(slug) {
  document.title = "Projecte no trobat · Jaume Clotet";
  const oldBack = document.querySelector(".back");
  if (oldBack) oldBack.remove();
  const root = document.getElementById("project-root");
  if (!root) return;
  root.innerHTML = `
    <div class="not-found">
      <h1>ups!</h1>
      <p>aquest projecte${slug ? ` («${escapeHtml(slug)}»)` : ""} no existeix — o encara no.</p>
      <p><a href="index.html">tornar a l'inici</a></p>
    </div>`;
}

// ============ Bootstrap ============

window.addEventListener("DOMContentLoaded", loadProject);
