// --- projecte loader (minimal + logs) ---
function param(name){ return new URLSearchParams(location.search).get(name); }

async function loadProject(){
  const slug = param('slug');
  console.log('[projecte] start, slug =', slug);
  if (!slug) {
    console.warn('[projecte] No slug in URL.');
    return;
  }
  try {
    const url = `data/${slug}/project.json`;
    console.log('[projecte] fetching', url);
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
    const p = await res.json();

    // Prefijo base para todas las rutas del JSON
    const base = `data/${slug}/`;
    normalizePaths(p, base);

    renderProject(p);
    localStorage.setItem('proyecto-' + slug + '-visto', '1');
    console.log('[projecte] render done');
  } catch(err){
    console.error('[projecte] load error:', err);
  }
}

function normalizePaths(p, base){
  const normImg = (path) => {
    if (!path) return path;
    let s = path.replace(/^\.?\//, ''); // quita ./ o /
    if (!s.startsWith('img/')) s = 'img/' + s; // fuerza carpeta img/
    return base + s;
  };

  // logo, bg
  if (p.logo) p.logo = normImg(p.logo);
  if (p.bg)   p.bg   = normImg(p.bg);

  // fun
  if (p.elemento_divertido?.src) {
    p.elemento_divertido.src = normImg(p.elemento_divertido.src);
  }
  
  // galería
  if (p.galeria?.images?.length) {
    p.galeria.images = p.galeria.images.map(src => normImg(src));
  }

  // hueco libre: solo normalizamos covers si existen, pero no forzamos img/
  if (Array.isArray(p.libre)) {
    p.libre = p.libre.map(item => {
      if (item.cover) {
        let s = item.cover.replace(/^\.?\//, '');
        // Si ya apunta a una carpeta (p.ej. libre/), no tocamos el prefijo
        if (!/^[^\/]+\//.test(s)) s = 'img/' + s;
        item.cover = base + s;
      }
      return item;
    });
  }
}

function renderProject(p){
  const root = document.getElementById('project-root');
  if (!root) { console.warn('[projecte] #project-root not found'); return; }
  root.innerHTML = `
    ${p.bg ? `<div class="project-bg"><img src="${p.bg}" alt=""></div>` : ''}
    <header class="project-header" style="display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:12px;">
      ${p.logo ? `<img class="project-logo" src="${p.logo}" alt="${p.titulo||p.slug}" style="max-width:420px;width:60vw;">` : ''}
      ${p.sinopsis ? `<p class='project-sinopsis' style="opacity:.9;text-align:center;max-width:800px;">${p.sinopsis}</p>` : ''}
    </header>
    ${Array.isArray(p.textos) ? `<section class='project-textos'>${p.textos.map(t=>`<p style="max-width:800px;margin:0 auto 1em;line-height:1.6;">${t}</p>`).join('')}</section>` : ''}
    ${p.galeria?.images?.length ? `<section class='project-galeria scroller' style="display:flex;gap:8px;overflow-x:auto;padding:8px 0;">${p.galeria.images.map(src=>`<img class='gal-thumb' src='${src}' loading='lazy' style="height:220px;flex:0 0 auto;border-radius:6px;cursor:pointer;">`).join('')}</section>` : ''}
    <section class="project-creditos">${renderCreditos(p.creditos)}</section>
    ${p.elemento_divertido?.src ? `<img id="fun" class="fun" src="${p.elemento_divertido.src}" alt="" style="position:fixed;left:0;top:0;width:72px;pointer-events:none;">` : ''}
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
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.96);display:none;align-items:center;justify-content:center;z-index:60;';
  overlay.innerHTML = '<img class="overlay-img" style="max-width:92vw;max-height:92vh;">';
  document.body.appendChild(overlay);
  const imgEl = overlay.querySelector('.overlay-img');
  imgs.forEach(img => {
    img.addEventListener('click', () => {
      imgEl.src = img.src;
      overlay.style.display = 'flex';
    });
  });
  overlay.addEventListener('click', () => overlay.style.display = 'none');
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