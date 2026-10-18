/* ============================================================
   build.mjs — data/ + projects/ + index.html i projecte.html (les
   plantilles) → dist/, la web tal com es publica.
       node build/build.mjs

   La home i una pàgina per projecte (/<slug>/), cadascuna amb el seu title,
   description, og:image i canonical, i el contingut ja escrit (el logo, la
   sinopsi, el text, la galeria i els crèdits), perquè Google i WhatsApp el
   llegeixin sense JS. En carregar, el JS de sempre torna a pintar el mateix.
   Substitueix tools/generar-paginas.mjs i la Action que commitejava les
   pàgines al repo: ara viuen a dist/, que no es commiteja.

   Si alguna cosa està malament (una coma, un camp mal escrit, una imatge que
   no hi és) s'atura i diu què, i no es publica res.
   ============================================================ */

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugsOf, toOld } from '../js/house.js';
import { validar } from '../js/validar.js';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const OUT = join(ROOT, 'dist');
const at = (...p) => join(ROOT, ...p);
const fail = (msg) => { console.error(`\n✗ ${msg}\n\nNo es publica res: la web es queda com estava.\n`); process.exit(1); };

/* ---------- llegir i revisar ---------- */

const read = (rel) => {
  if (!existsSync(at(rel))) fail(`no trobo ${rel}`);
  try { return JSON.parse(readFileSync(at(rel), 'utf8')); } catch (e) {
    fail(`${rel} no és un JSON vàlid: ${e.message}\n  Gairebé sempre és una coma de més o de menys, o unes cometes sense tancar.`);
  }
};
const schema = (t) => JSON.parse(readFileSync(at('schema', `${t}.json`), 'utf8'));
const site = read('data/site.json');
const errors = validar(site, schema('site'), 'data/site.json');
// totes les carpetes amb project.json tenen pàgina; "lists" diu quines surten a la home
const slugs = readdirSync(at('projects'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(at('projects', d.name, 'project.json'))).map((d) => d.name).sort();
const isImage = (v) => typeof v === 'string' && /\.(webp|png|jpe?g|gif|avif)$/i.test(v);
const img = (slug, f) => `projects/${slug}/img/${String(f).replace(/^\.?\/?(img\/)?/, '')}`;
const projects = {};
for (const slug of slugs) {
  const rel = `projects/${slug}/project.json`;
  const p = projects[slug] = read(rel);
  const before = errors.length;
  errors.push(...validar(p, schema('project'), rel));
  if (errors.length > before) continue;
  const files = [p.logo, typeof p.bg === 'string' ? p.bg : p.bg?.image, p.fun?.src, ...(p.gallery?.images || []),
    ...(p.extras || []).filter((x) => x.type === 'image').map((x) => x.src)].filter(isImage);
  for (const f of files) if (!existsSync(at(img(slug, f)))) errors.push(`${rel}: no trobo ${img(slug, f)}`);
}
for (const s of errors.length ? [] : slugsOf(site)) {
  if (!projects[s]) errors.push(`data/site.json: "lists" diu "${s}", i no hi ha cap projects/${s}/project.json`);
}
if (errors.length) fail(errors.join('\n✗ '));
const old = Object.fromEntries(slugs.map((s) => [s, toOld(s, projects[s])]));

/* On es publica, segons on es construeix (JAMstack, patrones §5): a l'Action
   de GitHub (la nostra còpia), meowrhino.github.io/<repo>/ i sense indexar;
   a qualsevol altre lloc (Cloudflare, a la còpia del Jaume), l'arrel amb el
   domini de site.json → "url", i s'indexa si n'hi ha. */
const github = process.env.GITHUB_ACTIONS === 'true';
const [owner, repo] = (process.env.GITHUB_REPOSITORY || '/').split('/');
const BASE = github ? `/${repo}` : '';
const SITE = github ? `https://${owner}.github.io${BASE}` : String(site.url || '').replace(/\/+$/, '');
const INDEX = !github && !!site.url;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const enc = (p) => p.split('/').map(encodeURIComponent).join('/');

function description(p) {
  const raw = p.synopsis || (Array.isArray(p.text) ? p.text[0] : '') || '';
  const flat = String(raw).replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_]/g, '').replace(/\s+/g, ' ').trim()
    .replace(/(.)\1{5,}/g, '$1$1$1…');   // els "Auuuu…" quilomètrics no ajuden a un cercador
  return flat.length > 200 ? flat.slice(0, 197).trimEnd() + '…' : flat;
}
// la imatge per compartir: el fons → el logo → la primera de la galeria
function shareSource(slug, p) {
  const bg = typeof p.bg === 'string' ? p.bg : p.bg?.image;
  const f = [bg, p.logo, ...(p.gallery?.images || [])].find(isImage);
  return f ? img(slug, f) : 'data/logo.webp';
}

/* ---------- la imatge per compartir, amb sharp ---------- */

let sharp = null;
try { sharp = (await import('sharp')).default; } catch (e) {
  console.warn(`⚠ sense sharp (${e.code || e.message}): en compartir surt la imatge tal qual. S'arregla amb: npm ci`);
}
const ogs = new Map();
for (const slug of slugs) {
  const src = shareSource(slug, projects[slug]);
  const cached = at('.cache', 'og', `${slug}.jpg`);
  if (!sharp) break;
  try {
    if (!(existsSync(cached) && statSync(cached).mtimeMs >= statSync(at(src)).mtimeMs)) {
      mkdirSync(dirname(cached), { recursive: true });
      await sharp(at(src)).resize(1200, 630, { fit: 'cover' }).flatten({ background: '#000000' })
        .jpeg({ quality: 85, mozjpeg: true }).toFile(cached);
    }
    ogs.set(slug, cached);
  } catch (e) {
    console.warn(`⚠ ${src}: sharp no la pot llegir (${e.message}); en compartir surt tal qual`);
  }
}
const ogUrl = (slug) => (ogs.has(slug) ? `${SITE}/og/${slug}.jpg` : `${SITE}/${enc(shareSource(slug, projects[slug]))}`);

/* ---------- les pàgines ---------- */

function swap(html, find, replace, file) {
  if (!find.test(html)) fail(`no trobo ${find} a ${file}: el build ho necessita per escriure les pàgines.`);
  return html.replace(find, replace);
}
const metaTags = ({ title, desc, url, image, type, robots }) => `
  <meta name="description" content="${esc(desc)}">
  <meta name="robots" content="${robots || (INDEX ? 'index,follow' : 'noindex')}">
  <link rel="canonical" href="${esc(url)}">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="${esc(site.title)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${esc(url)}">
  <meta property="og:image" content="${esc(image)}">
  <meta name="twitter:card" content="summary_large_image">`;

// markdown-lite com creditos.js: [text](url), **negreta**, *cursiva*, __subratllat__
const md = (s) => esc(s).replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+)__/g, '<u>$1</u>').replace(/\*([^*]+)\*/g, '<em>$1</em>')
  .replace(/\n/g, '<br>');

function projectPage(slug) {
  const file = 'projecte.html';
  const p = projects[slug];
  const url = `${SITE}/${encodeURIComponent(slug)}/`;
  let html = readFileSync(at(file), 'utf8');
  html = swap(html, /<html lang="[^"]*">/, '<html lang="ca" data-built>', file);
  html = swap(html, /<title>[^<]*<\/title>/, `<title>${esc(p.title)} · ${esc(site.title)}</title>`
    + metaTags({ title: p.title, desc: description(p), url, image: ogUrl(slug), type: 'article' })
    // base ../ = totes les rutes relatives (css, js, projects/…) van a l'arrel, també en una subcarpeta
    + `\n  <base href="../">\n  <script>window.__SLUG__ = ${JSON.stringify(slug).replace(/</g, '\\u003c')};</script>`, file);
  // el contingut, el que render.js torna a pintar (substitueix tot #project-root)
  const paras = (s) => String(s || '').trim().split(/\n\s*\n+/).map((x) => `<p>${md(x)}</p>`).join('');
  const body = [
    p.logo ? `<header class="project-header"><img class="project-logo" src="${enc(img(slug, p.logo))}" alt="${esc(p.title)}">` : `<header class="project-header"><h1>${esc(p.title)}</h1>`,
    p.synopsis ? `<div class="project-sinopsis sinopsis--ligera">${paras(p.synopsis)}</div></header>` : '</header>',
    ...(p.text || []).map((t) => `<p>${md(t)}</p>`),
    ...(p.gallery?.images || []).map((f) => `<img src="${enc(img(slug, f))}" alt="${esc(p.title)}" loading="lazy">`),
    p.credits ? `<section class="project-creditos">${paras(p.credits)}</section>` : '',
  ].join('\n    ');
  return swap(html, /<main id="project-root"><\/main>/, `<main id="project-root">\n    ${body}\n  </main>`, file);
}

function homePage() {
  const file = 'index.html';
  let html = readFileSync(at(file), 'utf8');
  html = swap(html, /<html lang="[^"]*">/, '<html lang="ca" data-built>', file);
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || site.title;
  html = html.replace(/\s*<meta name="description"[^>]*>|\s*<link rel="canonical"[^>]*>|\s*<meta property="og:[^>]*>/g, '');
  html = swap(html, /(<title>[^<]*<\/title>)/, `$1${metaTags({ title: site.title, desc, url: `${SITE}/`, image: `${SITE}/data/logo.webp`, type: 'website' })}`, file);
  // els destacats, per a qui no executa JS (main.js els canvia per les fitxes)
  const links = slugsOf(site).map((s) => `<a href="${encodeURIComponent(s)}/">${esc(projects[s].title)}</a>`).join('\n      ');
  return swap(html, /<div id="projects-grid" class="grid"><\/div>/, `<div id="projects-grid" class="grid">\n      ${links}\n    </div>`, file);
}

/* ---------- escriure dist/ ---------- */

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'projecte.html'), readFileSync(at('projecte.html'), 'utf8').replace('<html lang="ca">', '<html lang="ca" data-built>'));
for (const f of ['style.css', 'css', 'fonts', 'js', 'data', 'projects']) cpSync(at(f), join(OUT, f), { recursive: true, filter: (x) => !x.endsWith('.DS_Store') });
writeFileSync(join(OUT, 'index.html'), homePage());
// 404: la base, des de l'arrel de la web (també en una subcarpeta)
writeFileSync(join(OUT, '404.html'), swap(readFileSync(at('404.html'), 'utf8'), /<base href="\/">/, `<base href="${BASE}/">`, '404.html')
  .replace('<html lang="ca">', '<html lang="ca" data-built>').replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  <meta name="robots" content="noindex">'));
mkdirSync(join(OUT, 'og'), { recursive: true });
for (const [slug, cached] of ogs) cpSync(cached, join(OUT, 'og', `${slug}.jpg`));
for (const slug of slugs) {
  mkdirSync(join(OUT, slug), { recursive: true });
  writeFileSync(join(OUT, slug, 'index.html'), projectPage(slug));
}
const urls = [`${SITE}/`, ...slugs.map((s) => `${SITE}/${encodeURIComponent(s)}/`)];
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`);
writeFileSync(join(OUT, 'robots.txt'), INDEX ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
writeFileSync(join(OUT, '.nojekyll'), '');

console.log(`✓ dist/: home i ${slugs.length} projectes${INDEX ? ` · s'indexa (${SITE})` : ' · sense indexar'}`);
