async function resolveAsset(slug, filenames) {
  // Try a list of candidate relative paths under data/{slug}/
  for (const name of filenames) {
    const url = `data/${slug}/${name}`;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) return url;
    } catch (_) { /* ignore and try next */ }
  }
  // If none worked, return the first (will 404 visibly so we detect it)
  return `data/${slug}/${filenames[0]}`;
}

async function loadFeatured() {
  const res = await fetch('featured.json');
  const data = await res.json();
  const grid = document.getElementById('projects-grid');

  const slugs = data.destacados.map(d => d.slug);

  for (const slug of slugs) {
    // Resolve background (fons.jpg) and logo (titol.png)
    const bgUrl = await resolveAsset(slug, ['fons.jpg', 'img/fons.jpg']);
    const logoUrl = await resolveAsset(slug, ['titol.png', 'img/titol.png']);

    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.style.backgroundImage = `url(${bgUrl})`;
    tile.style.backgroundSize = 'cover';
    tile.style.backgroundPosition = 'center';

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

  checkUnlock(slugs);
}

async function checkUnlock(slugs) {
  const allSeen = slugs.every(s => localStorage.getItem('proyecto-' + s + '-visto') === '1');
  const overlay = document.getElementById('unlock7');
  if (!overlay) return;

  if (allSeen) {
    overlay.classList.add('show');

    // Usar el último slug o uno especial para el 7º
    const specialSlug = 'alusinasons'; // o el que quieras
    const logoUrl = await resolveAsset(specialSlug, ['titol.png', 'img/titol.png']);

    // Limpiar el contenido y poner solo el logo centrado
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

    // Quitar fondo oscuro si no quieres velo
    overlay.style.background = 'transparent';
  } else {
    overlay.classList.remove('show');
  }
}

window.addEventListener('storage', () => {
  fetch('featured.json')
    .then(r => r.json())
    .then(data => checkUnlock(data.destacados.map(d => d.slug)))
    .catch(() => {});
});

window.addEventListener('DOMContentLoaded', loadFeatured);
