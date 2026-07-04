// render.js — render principal del proyecto (header, textos, galería, créditos, fun)

import { escapeHtml, isTouchDevice } from "./utils.js";
import { linkifyEscaped, renderCreditos } from "./creditos.js";
import { renderComodines } from "./comodines.js";
import { setupFunFollower, setupFunFollowerGyro } from "./fun.js";

export function renderSinopsisHtml(raw) {
  const txt = String(raw || "")
    .replace(/\r\n?/g, "\n")
    .trim();
  if (!txt) return "";
  // separa párrafos por líneas en blanco:
  const paras = txt.split(/\n\s*\n+/);
  // dentro de cada párrafo, \n -> <br>
  return paras
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

// Textos: array de párrafos; interpreta [link](url), **negrita**, *cursiva*, __subrayado__ y respeta \n -> <br>
function renderTextos(arr) {
  if (!Array.isArray(arr) || !arr.length) return "";
  return arr
    .map((raw) => {
      const esc = escapeHtml(String(raw || ""));
      const html = linkifyEscaped(esc).replace(/\n/g, "<br>");
      return `<p>${html}</p>`;
    })
    .join("");
}

export function renderProject(p) {
  const root = document.getElementById("project-root");
  if (!root) {
    console.warn("[projecte] #project-root not found");
    return;
  }

  // Setea var CSS para bg color (si hay)
  if (p.bgColor) root.style.setProperty("--bg-color", p.bgColor);

  root.innerHTML = `
    <div class="project-bg">
      ${p.bgImage ? `<img src="${p.bgImage}" alt="">` : ""}
    </div>

    <header class="project-header">
      ${
        p.logo
          ? `<img class="project-logo" src="${p.logo}" alt="${
              p.titulo || p.slug
            }">`
          : ""
      }
      ${
        p.sinopsis
          ? `<div class="project-sinopsis sinopsis--ligera">${renderSinopsisHtml(
              p.sinopsis
            )}</div>`
          : ""
      }
    </header>

    ${
      Array.isArray(p.textos)
        ? `<section class="project-textos">${renderTextos(p.textos)}</section>`
        : ""
    }

    ${
      p.galeria?.media?.length
        ? `<section class="project-galeria column">
           ${p.galeria.media
             .map((m) => {
               if (m.type === "video") {
                 const poster = m.poster ? ` poster="${m.poster}"` : "";
                 return `<video class="gal-video" src="${m.src}" controls playsinline preload="metadata"${poster}></video>`;
               } else {
                 return `<img class="gal-img" src="${m.src}" loading="lazy" decoding="async" alt="">`;
               }
             })
             .join("")}
         </section>`
        : ""
    }

    <section class="project-creditos">${renderCreditos(p.creditos)}</section>

    ${
      p.elemento_divertido?.src
        ? `<img id="fun" class="fun" src="${p.elemento_divertido.src}" alt="">`
        : ""
    }
  `;

  // --- Inserta comodines (si hay) ---
  if (Array.isArray(p.comodin) && p.comodin.length) {
    renderComodines(p.comodin);
  }

  // --- Inicializa comportamiento del "elemento divertido" ---
  const fun = document.getElementById("fun");
  if (fun) {
    if (isTouchDevice()) {
      fun.classList.add("touchable"); // pointer-events:auto vía CSS
      setupFunFollowerGyro(); // Gyro → Touch → Auto
    } else {
      setupFunFollower(); // Desktop: ratón
    }
  }
}
