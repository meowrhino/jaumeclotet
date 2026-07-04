// meta.js — título de página + favicon del proyecto

import { isCssColor } from "../assets.js";

export function setPageMeta(p, slug) {
  // Title: usa p.titulo si existe, si no el slug
  document.title = p.titulo || slug || document.title;

  // Favicon: prioriza el "fun"; si no hay, usa logo si es imagen
  const iconHref =
    p.elemento_divertido && p.elemento_divertido.src
      ? p.elemento_divertido.src
      : p.logo && !isCssColor(p.logo)
      ? p.logo
      : null;

  if (iconHref) setFavicon(iconHref);
}

function setFavicon(href) {
  // Limpia anteriores
  document
    .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
    .forEach((n) => n.remove());
  const link = document.createElement("link");
  link.rel = "icon";
  link.href = href;
  document.head.appendChild(link);
}
