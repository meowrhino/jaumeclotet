import { resolveAsset, isCssColor, normalizeImgPath, getBackground } from './assets.js';

// main.js — Home tiles con fallback a project.json (bg color/imagen) + unlock con slugs únicos

async function loadFeatured() {
  const res = await fetch('featured.json');
  const data = await res.json();
  const grid = document.getElementById('projects-grid');

  const slugs = data.destacados.map(d => d.slug);
  const specialSlug = data.secreto?.slug || slugs[slugs.length - 1]; // 7º

  for (const slug of slugs) {
    const bg = await getBackground(slug); // <- ahora puede ser color o imagen
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
      // sin fondo declarable → fallback del CSS (.tile { background: #000; })
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
  const uniq = [...new Set(slugs)];
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

    // capa transparente (si en CSS: #unlock7 { pointer-events:none })
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
