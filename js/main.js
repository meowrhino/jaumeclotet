// main.js — Home tiles con fallback a project.json (bg color/imagen) + unlock con slugs únicos

async function resolveAsset(slug, filenames) {
  for (const name of filenames) {
    const url = `data/${slug}/${name}`;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) return url;
    } catch (_) {}
  }
  return null; // <- si nada existe, devuelve null (antes devolvía una URL 404)
}

// --- helpers para detectar colores CSS y normalizar rutas de imágenes ---
function isCssColor(str) {
  if (typeof str !== 'string') return false;
  const s = str.trim().toLowerCase();
  return s.startsWith('#') ||
         s.startsWith('rgb(') || s.startsWith('rgba(') ||
         s.startsWith('hsl(') || s.startsWith('hsla(') ||
         s.startsWith('oklch(') || s.startsWith('oklab(') ||
         s.startsWith('linear-gradient(') || s.startsWith('radial-gradient(') ||
         ['white','black','transparent','red','green','blue','yellow','magenta','cyan','orange','purple','gray','grey'].includes(s);
}

function normalizeImgPath(slug, path) {
  if (!path) return null;
  let s = String(path).replace(/^\.?\//, '');
  if (!s.startsWith('img/')) s = 'img/' + s;
  return `data/${slug}/${s}`;
}

// --- obtiene el fondo del tile: imagen (url) o color (css) ---
async function getTileBackground(slug) {
  // 1) intentar fons.jpg / img/fons.jpg (modo clásico)
  const fons = await resolveAsset(slug, ['fons.jpg', 'img/fons.jpg']);
  if (fons) return { kind: 'image', value: fons };

  // 2) leer project.json para ver 'bg'
  try {
    const res = await fetch(`data/${slug}/project.json`);
    if (!res.ok) throw new Error('no project.json');
    const p = await res.json();

    if (typeof p.bg === 'string') {
      if (isCssColor(p.bg)) return { kind: 'color', value: p.bg };
      const url = normalizeImgPath(slug, p.bg);
      if (url) return { kind: 'image', value: url };
    } else if (p.bg && typeof p.bg === 'object') {
      if (p.bg.color && isCssColor(p.bg.color)) return { kind: 'color', value: p.bg.color };
      if (p.bg.image) {
        const url = normalizeImgPath(slug, p.bg.image);
        if (url) return { kind: 'image', value: url };
      }
    }
  } catch (_) {}
  return null;
}

async function loadFeatured() {
  const res = await fetch('featured.json');
  const data = await res.json();
  const grid = document.getElementById('projects-grid');

  const slugs = data.destacados.map(d => d.slug);
  const specialSlug = data.secreto?.slug || slugs[slugs.length - 1]; // 7º

  for (const slug of slugs) {
    const bg = await getTileBackground(slug); // <- ahora puede ser color o imagen
    const logoUrl =
      (await resolveAsset(slug, ['titol.png', 'img/titol.png'])) ||
      normalizeImgPath(slug, 'img/titol.png'); // última opción (si falla HEAD)

    const tile = document.createElement('div');
    tile.className = 'tile';

    if (bg && bg.kind === 'image') {
      tile.style.backgroundImage = `url(${bg.value})`;
      tile.style.backgroundSize = 'cover';
      tile.style.backgroundPosition = 'center';
    } else if (bg && bg.kind === 'color') {
      tile.style.background = bg.value;
      tile.style.backgroundImage = 'none';
    } else {
      // sin fondo declarable → deja el fallback del CSS (.tile { background: #000; })
    }

    const a = document.createElement('a');
    a.href = `projecte.html?slug=${encodeURIComponent(slug)}`;
    a.className = 'logo-link';

    const logo = document.createElement('img');
    logo.className = 'logo';
    logo.src = logoUrl;
    logo.alt = slug;

    a.appendChild(logo);
    tile.appendChild(a);
    grid.appendChild(tile);
  }

  checkUnlock(slugs, specialSlug);
}

// slugs únicos + overlay no bloqueante (se configura por CSS)
async function checkUnlock(slugs, specialSlug) {
  const uniq = [...new Set(slugs)]; // <- evita que ver 1 repetido desbloquee todo
  const overlay = document.getElementById('unlock7');
  if (!overlay) return;

  const allSeen = uniq.every(s => localStorage.getItem('proyecto-' + s + '-visto') === '1');

  if (allSeen) {
    overlay.classList.add('show');

    const logoUrl =
      (await resolveAsset(specialSlug, ['titol.png', 'img/titol.png'])) ||
      normalizeImgPath(specialSlug, 'img/titol.png');

    overlay.innerHTML = '';
    const a = document.createElement('a');
    a.href = `projecte.html?slug=${encodeURIComponent(specialSlug)}`;
    a.className = 'logo-link';

    const logo = document.createElement('img');
    logo.className = 'logo';
    logo.src = logoUrl;
    logo.alt = specialSlug;

    a.appendChild(logo);
    overlay.appendChild(a);

    // fondo transparente (la capa no intercepta clics si en CSS tienes pointer-events:none)
    overlay.style.background = 'transparent';
  } else {
    overlay.classList.remove('show');
  }
}

// refresco si cambia localStorage (p. ej., se marca visto desde otra pestaña)
window.addEventListener('storage', () => {
  fetch('featured.json')
    .then(r => r.json())
    .then(data => checkUnlock(data.destacados.map(d => d.slug), data.secreto?.slug || null))
    .catch(() => {});
});

window.addEventListener('DOMContentLoaded', loadFeatured);
