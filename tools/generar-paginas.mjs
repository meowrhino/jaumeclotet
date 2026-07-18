#!/usr/bin/env node
/* generar-paginas.mjs — genera las páginas estáticas /<slug>/index.html
   con meta tags OpenGraph/Twitter, más sitemap.xml y robots.txt.

   Se ejecuta sin dependencias: `node tools/generar-paginas.mjs`
   La GitHub Action lo lanza automáticamente cuando cambia data/ o featured.json,
   así que al subir un proyecto nuevo su página se genera sola.

   Escanea data/<slug>/project.json (todo lo que tenga project.json cuenta;
   0_secret no lo tiene, así que queda fuera solo). */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Dominio para URLs absolutas (og:image, canonical, sitemap)
const ORIGIN = existsSync(join(ROOT, "CNAME"))
  ? "https://" + readFileSync(join(ROOT, "CNAME"), "utf8").trim()
  : "https://jaumeclotet.com";

// ---------- helpers ----------

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

// "./img/foto.webp" | "img/foto.webp" → URL absoluta dentro de data/<slug>/
function absAsset(slug, path) {
  if (!path || typeof path !== "string") return null;
  const clean = path.replace(/^\.?\//, "");
  return `${ORIGIN}/data/${encodeURIComponent(slug)}/${clean.split("/").map(encodeURIComponent).join("/")}`;
}

const CSS_COLOR = /^(#|rgb|hsl|[a-z]+$)/i;
const isImagePath = (v) => typeof v === "string" && /\.(webp|png|jpe?g|gif|avif)$/i.test(v);

// Imagen para og:image: fondo → logo → primera imagen de la galería
function pickImage(slug, p) {
  if (isImagePath(p.bg)) return absAsset(slug, p.bg);
  if (isImagePath(p.logo)) return absAsset(slug, p.logo);
  const media = p.galeria?.media || p.galeria?.images || [];
  const first = media.find((m) => isImagePath(m?.src || m));
  if (first) return absAsset(slug, first.src || first);
  return `${ORIGIN}/data/logo.webp`;
}

function description(p) {
  const raw = p.sinopsis || (Array.isArray(p.textos) ? p.textos[0] : "") || "";
  const flat = String(raw).replace(/\s+/g, " ").trim();
  // Los "Auuuu…" kilométricos no ayudan en un buscador
  const sane = flat.replace(/(.)\1{5,}/g, "$1$1$1…");
  return sane.length > 200 ? sane.slice(0, 197).trimEnd() + "…" : sane;
}

// ---------- plantilla ----------

function pageHtml(slug, p) {
  const title = `${p.titulo || slug} · Jaume Clotet`;
  const desc = description(p);
  const img = pickImage(slug, p);
  const url = `${ORIGIN}/${encodeURIComponent(slug)}/`;
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${esc(url)}">

  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Jaume Clotet">
  <meta property="og:title" content="${esc(p.titulo || slug)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${esc(url)}">
  <meta property="og:image" content="${esc(img)}">
  <meta name="twitter:card" content="summary_large_image">

  <!-- Página generada por tools/generar-paginas.mjs — NO editar a mano.
       base ../ = todas las rutas relativas (css, js, data/…) van a la raíz. -->
  <base href="../">
  <script>window.__SLUG__ = ${JSON.stringify(slug)};</script>

  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Spectral+SC:wght@200;300;400&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="style.css">
</head>

<body>
  <a class="back" href="index.html">volver</a>
  <main id="project-root"></main>

  <script type="module" src="js/proyecto.js"></script>
  <script type="module" src="js/secreto.js"></script>
</body>
</html>
`;
}

// ---------- main ----------

const slugs = readdirSync(join(ROOT, "data"), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(ROOT, "data", d.name, "project.json")))
  .map((d) => d.name)
  .sort();

const generated = [];
for (const slug of slugs) {
  let p;
  try {
    p = JSON.parse(readFileSync(join(ROOT, "data", slug, "project.json"), "utf8"));
  } catch (e) {
    console.error(`[gen] ${slug}: project.json inválido, lo salto (${e.message})`);
    continue;
  }
  mkdirSync(join(ROOT, slug), { recursive: true });
  writeFileSync(join(ROOT, slug, "index.html"), pageHtml(slug, p));
  generated.push(slug);
  console.log(`[gen] ${slug}/index.html (${p.titulo || slug})`);
}

// sitemap.xml: home + páginas de proyecto
const urls = [`${ORIGIN}/`, ...generated.map((s) => `${ORIGIN}/${encodeURIComponent(s)}/`)];
writeFileSync(
  join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${esc(u)}</loc></url>`).join("\n") +
    `\n</urlset>\n`
);

writeFileSync(join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);

console.log(`[gen] listo: ${generated.length} proyectos + sitemap.xml + robots.txt`);
