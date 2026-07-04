// normalize.js — normalización de rutas y datos del project.json

import { isCssColor } from "../assets.js";

export function normalizePaths(p, base) {
  const normImg = (path) => {
    if (!path) return path;
    let s = path.replace(/^\.?\//, ""); // quita ./ o /
    if (!s.startsWith("img/")) s = "img/" + s; // fuerza carpeta img/ para imágenes
    return base + s;
  };
  const normAny = (path) => {
    if (!path) return path;
    let s = path.replace(/^\.?\//, "");
    return base + s; // para vídeos/otros no forzamos img/
  };

  // logo
  if (p.logo && !isCssColor(p.logo)) p.logo = normImg(p.logo);

  // bg admite color o imagen o un objeto {color, image}
  p.bgColor = null;
  p.bgImage = null;
  if (p.bg) {
    if (typeof p.bg === "string") {
      if (isCssColor(p.bg)) p.bgColor = p.bg;
      else p.bgImage = normImg(p.bg);
    } else if (typeof p.bg === "object") {
      if (p.bg.color && isCssColor(p.bg.color)) p.bgColor = p.bg.color;
      if (p.bg.image) p.bgImage = normImg(p.bg.image);
    }
  }

  // --- GALERÍA ---
  // Preferente: media[] con items {type:'image'|'video', src, poster?}
  let media = [];
  if (p.galeria?.media?.length) {
    media = p.galeria.media.map((item) => {
      const it = { ...item };
      if (it.type === "image" && it.src) it.src = normImg(it.src);
      else if (it.type === "video" && it.src) it.src = normAny(it.src);
      if (it.poster) it.poster = normImg(it.poster);
      return it;
    });
  } else {
    // Compat: images[] y video/videos[]
    if (p.galeria?.images?.length) {
      media.push(
        ...p.galeria.images.map((src) => ({ type: "image", src: normImg(src) }))
      );
    }
    const vids = p.galeria?.video || p.galeria?.videos;
    if (Array.isArray(vids) && vids.length) {
      media.push(...vids.map((src) => ({ type: "video", src: normAny(src) })));
    }
  }
  p.galeria = p.galeria || {};
  p.galeria.media = media;

  // elemento divertido
  if (p.elemento_divertido?.src) {
    p.elemento_divertido.src = normImg(p.elemento_divertido.src);
  }

  // --- COMODÍN ---
  if (Array.isArray(p.comodin)) {
    p.comodin = p.comodin.map((raw) => {
      const it = { ...raw };
      // Normaliza rutas donde aplique
      if (it.type === "image" && it.src) it.src = normImg(it.src);
      if (it.type === "video" && it.src) it.src = normAny(it.src);
      if (it.poster) it.poster = normImg(it.poster);
      // sanea align
      if (it.align && !["left", "center", "right"].includes(it.align)) {
        delete it.align;
      }
      // sanea width ampliado: whole|half|third|fourth (y sinónimos legacy)
      if (it.width) {
        const m = String(it.width).toLowerCase().trim();
        const map = { full: "whole", auto: "whole", whole: "whole", half: "half", third: "third", fourth: "fourth", quarter: "fourth" };
        const w = map[m];
        if (w) it.width = w; else delete it.width;
      }
      return it;
    });
  }
}
