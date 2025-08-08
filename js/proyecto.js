function param(name){ return new URLSearchParams(location.search).get(name); }

async function loadProject(){
  const slug = param('slug');
  if (!slug) return;
  try {
    const res = await fetch(`data/${slug}/project.json`);
    const p = await res.json();

    // Prefijo base para todas las rutas del JSON
    const base = `data/${slug}/`;
    normalizePaths(p, base);

    renderProject(p);
    localStorage.setItem('proyecto-' + slug + '-visto', '1');
  } catch(err){
    console.error(err);
  }
}

function normalizePaths(p, base){
  // logo, bg
  if (p.logo) p.logo = base + p.logo.replace(/^.\//, '');
  if (p.bg)   p.bg   = base + p.bg.replace(/^.\//, '');
  // fun
  if (p.elemento_divertido?.src) {
    p.elemento_divertido.src = base + p.elemento_divertido.src.replace(/^.\//, '');
  }
  // galería
  if (p.galeria?.images?.length) {
    p.galeria.images = p.galeria.images.map(src => base + src.replace(/^.\//, ''));
  }
  // hueco libre (si tuvieses covers, etc.)
  if (Array.isArray(p.libre)) {
    p.libre = p.libre.map(item => {
      if (item.cover) item.cover = base + item.cover.replace(/^.\//, '');
      return item;
    });
  }
}

function renderProject(p){
  const root = document.getElementById('project-root');
  root.innerHTML = `
    <header class="project-header">
      ${p.logo ? `<img class="project-logo" src="${p.logo}" alt="${p.titulo||p.slug}">` : ''}
      ${p.sinopsis ? `<p class='project-sinopsis'>${p.sinopsis}</p>` : ''}
    </header>
    ${Array.isArray(p.textos) ? `<section class='project-textos'>${p.textos.map(t=>`<p>${t}</p>`).join('')}</section>` : ''}
    ${p.galeria?.images?.length ? `<section class='project-galeria scroller'>${p.galeria.images.map(src=>`<img class='gal-thumb' src='${src}' loading='lazy'>`).join('')}</section>` : ''}
    <section class="project-creditos">${renderCreditos(p.creditos)}</section>
    ${p.elemento_divertido?.src ? `<img id="fun" class="fun" src="${p.elemento_divertido.src}" alt="">` : ''}
  `;
  setupGalleryOverlay();
  setupFunFollower();
}

function renderCreditos(c){
  if (!c) return '';
  if (c.formato === 'html') return c.contenido || '';
  if (c.formato === 'markdown') return (c.contenido || ''); // parser opcional
  return `<pre>${(c.contenido||'')}</pre>`;
}

function setupGalleryOverlay(){
  const imgs = document.querySelectorAll('.project-galeria img');
  if (!imgs.length) return;
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = '<img class="overlay-img">';
  document.body.appendChild(overlay);
  const imgEl = overlay.querySelector('.overlay-img');
  imgs.forEach(img => {
    img.addEventListener('click', () => {
      imgEl.src = img.src;
      overlay.classList.add('show');
    });
  });
  overlay.addEventListener('click', () => overlay.classList.remove('show'));
}

function setupFunFollower(){
  const fun = document.getElementById('fun');
  if (!fun) return;
  let x = window.innerWidth/2, y = window.innerHeight/2;
  let tx = x, ty = y;
  window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
  function tick(){
    const lerp = 0.12;
    x += (tx - x) * lerp;
    y += (ty - y) * lerp;
    const ang = Math.atan2(ty - y, tx - x) * 180 / Math.PI;
    fun.style.transform = `translate(${x}px, ${y}px) rotate(${ang}deg)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

window.addEventListener('DOMContentLoaded', loadProject);