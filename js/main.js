import { resolveAsset, isCssColor, normalizeImgPath, getBackground } from './assets.js';

// main.js — Home tiles con lazy loading para fondos/logos y prioridad en el primer tile

async function loadFeatured() {
  const res = await fetch('featured.json');
  const data = await res.json();
  const grid = document.getElementById('projects-grid');

  // Observer para cargar fondos solo cuando se acerquen al viewport
  const bgObserver = new IntersectionObserver((entries, obs) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target; // .tile.lazy-bg con data-bg
      const bgUrl = el.dataset.bg;
      if (bgUrl) {
        el.style.backgroundImage = `url(${bgUrl})`;
        el.removeAttribute('data-bg');
        el.classList.remove('lazy-bg');
      }
      obs.unobserve(el);
    }
  }, { rootMargin: '300px 0px' }); // precarga antes de entrar

  const slugs = data.destacados.map(d => d.slug);

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    const isFirst = i === 0;

    // Fondo: puede ser color o imagen (si es imagen, solo el primero se pinta al instante)
    const bg = await getBackground(slug);

    // Intentar WebP para el logo primero, si no existe caer a PNG
    const logoUrl =
      (await resolveAsset(slug, ['titol.webp', 'img/titol.webp', 'titol.png', 'img/titol.png'])) ||
      normalizeImgPath(slug, 'img/titol.png'); // último fallback

    const tile = document.createElement('div');
    tile.className = 'tile';

    if (bg && bg.kind === 'image') {
      if (isFirst) {
        // Hero: priorizar para que aparezca YA
        tile.style.backgroundImage = `url(${bg.value})`;
      } else {
        // Lazy: cargar cuando se acerque
        tile.dataset.bg = bg.value;
        tile.classList.add('lazy-bg');
        bgObserver.observe(tile);
      }
    } else if (bg && bg.kind === 'color') {
      tile.style.background = bg.value;
      tile.style.backgroundImage = 'none';
    } else {
      // sin fondo declarable → fallback del CSS (.tile { background: #000; })
    }

    const a = document.createElement('a');
    a.href = `projecte.html?slug=${encodeURIComponent(slug)}`;
    a.className = 'logo-link';

    // Logo: lazy + decoding async; solo el primero eager + prioridad alta
    const logo = new Image();
    logo.className = 'logo';
    logo.src = logoUrl;
    logo.alt = slug;
    logo.decoding = 'async';
    if (isFirst) {
      logo.loading = 'eager';
      logo.fetchPriority = 'high';
    } else {
      logo.loading = 'lazy';
      // fetchPriority por defecto (auto) para no competir con el hero
    }

    a.appendChild(logo);
    tile.appendChild(a);
    grid.appendChild(tile);
  }
}

window.addEventListener('DOMContentLoaded', loadFeatured);
