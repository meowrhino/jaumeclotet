/* proyecto.js — versión revisada (galería vertical + sin inline styles + bg color)
   - Desktop: ratón (intacto).
   - Móvil: giroscopio → touch/drag → auto-animación.
*/

'use strict';

// ============ Utilidades básicas ============

function param(name) {
  return new URLSearchParams(location.search).get(name);
}

// Detección de "dispositivo táctil" (mejor que userAgent)
function isTouchDevice() {
  return (
    window.matchMedia &&
    window.matchMedia('(hover: none) and (pointer: coarse)').matches
  );
}

// Heurística simple para detectar si un string es color/gradiente CSS
function isCssColor(str) {
  if (typeof str !== 'string') return false;
  const s = str.trim().toLowerCase();
  return (
    s.startsWith('#') ||
    s.startsWith('rgb(') || s.startsWith('rgba(') ||
    s.startsWith('hsl(') || s.startsWith('hsla(') ||
    s.startsWith('oklch(') || s.startsWith('oklab(') ||
    s.startsWith('linear-gradient(') || s.startsWith('radial-gradient(') ||
    // keywords comunes
    ['white', 'black', 'transparent', 'red', 'green', 'blue', 'yellow', 'magenta', 'cyan', 'orange', 'purple', 'gray', 'grey'].includes(s)
  );
}

// ============ Carga de datos del proyecto ============

async function loadProject() {
  const slug = param('slug');
  if (!slug) {
    console.warn('[projecte] No slug in URL.');
    return;
  }
  try {
    const url = `data/${slug}/project.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
    const p = await res.json();

    // Prefijo base para todas las rutas del JSON
    const base = `data/${slug}/`;
    normalizePaths(p, base);

    renderProject(p);

    // Marca este proyecto como "visto" para el sistema de desbloqueo
    localStorage.setItem('proyecto-' + slug + '-visto', '1');
  } catch (err) {
    console.error('[projecte] load error:', err);
  }
}

function normalizePaths(p, base) {
  const normImg = (path) => {
    if (!path) return path;
    let s = path.replace(/^\.?\//, ''); // quita ./ o /
    if (!s.startsWith('img/')) s = 'img/' + s; // fuerza carpeta img/
    return base + s;
  };

  // logo
  if (p.logo && !isCssColor(p.logo)) p.logo = normImg(p.logo);

  // bg admite color o imagen o un objeto {color, image}
  p.bgColor = null;
  p.bgImage = null;
  if (p.bg) {
    if (typeof p.bg === 'string') {
      if (isCssColor(p.bg)) p.bgColor = p.bg;
      else p.bgImage = normImg(p.bg);
    } else if (typeof p.bg === 'object') {
      if (p.bg.color && isCssColor(p.bg.color)) p.bgColor = p.bg.color;
      if (p.bg.image) p.bgImage = normImg(p.bg.image);
    }
  }

  // elemento divertido
  if (p.elemento_divertido?.src) {
    p.elemento_divertido.src = normImg(p.elemento_divertido.src);
  }

  // galería
  if (p.galeria?.images?.length) {
    p.galeria.images = p.galeria.images.map(src => normImg(src));
  }

  // libre: normaliza covers si existen
  if (Array.isArray(p.libre)) {
    p.libre = p.libre.map(item => {
      if (item.cover) {
        let s = item.cover.replace(/^\.?\//, '');
        if (!/^[^\/]+\//.test(s)) s = 'img/' + s;
        item.cover = base + s;
      }
      return item;
    });
  }
}

// ============ Render principal del proyecto ============

function renderProject(p) {
  const root = document.getElementById('project-root');
  if (!root) { console.warn('[projecte] #project-root not found'); return; }

  // Setea var CSS para bg color (si hay)
  if (p.bgColor) root.style.setProperty('--bg-color', p.bgColor);

  root.innerHTML = `
    <div class="project-bg">
      ${p.bgImage ? `<img src="${p.bgImage}" alt="">` : ''}
    </div>

    <header class="project-header">
      ${p.logo ? `<img class="project-logo" src="${p.logo}" alt="${p.titulo || p.slug}">` : ''}
      ${p.sinopsis ? `<p class="project-sinopsis">${p.sinopsis}</p>` : ''}
    </header>

    ${Array.isArray(p.textos)
      ? `<section class="project-textos">
           ${p.textos.map(t => `<p>${t}</p>`).join('')}
         </section>`
      : ''}

    ${p.galeria?.images?.length
      ? `<section class="project-galeria column">
           ${p.galeria.images.map(src => `<img class="gal-img" src="${src}" loading="lazy" alt="">`).join('')}
         </section>`
      : ''}

    <section class="project-creditos">${renderCreditos(p.creditos)}</section>

    ${p.elemento_divertido?.src ? `<img id="fun" class="fun" src="${p.elemento_divertido.src}" alt="">` : ''}
  `;

  setupGalleryOverlay();

  // --- Inicializa comportamiento del "elemento divertido" ---
  const fun = document.getElementById('fun');
  if (fun) {
    if (isTouchDevice()) {
      fun.classList.add('touchable'); // pointer-events:auto vía CSS
      setupFunFollowerGyro();         // Gyro → Touch → Auto
    } else {
      setupFunFollower();             // Desktop: ratón (tu versión intacta)
    }
  }
}

function renderCreditos(c) {
  if (!c) return '';
  if (c.formato === 'html') return c.contenido || '';
  if (c.formato === 'markdown') return (c.contenido || ''); // parser opcional
  return `<pre>${(c.contenido || '')}</pre>`;
}

// ============ Overlay de galería (click para ampliar) ============

function setupGalleryOverlay() {
  const imgs = document.querySelectorAll('.project-galeria img');
  if (!imgs.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = '<img class="overlay-img" alt="">';
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

// ============ Elemento divertido: Desktop (ratón) ============
// (Se mantiene igual que tu versión original)
function setupFunFollower() {
  const fun = document.getElementById('fun');
  if (!fun) return;
  let x = window.innerWidth / 2, y = window.innerHeight / 2;
  let tx = x, ty = y;

  window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });

  function tick() {
    const lerp = 0.12;
    x += (tx - x) * lerp;
    y += (ty - y) * lerp;
    const ang = Math.atan2(ty - y, tx - x) * 180 / Math.PI;
    fun.style.transform = `translate(${x}px, ${y}px) rotate(${ang}deg)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ============ Elemento divertido: Móvil (gyro → touch → auto) ============

function setupFunFollowerGyro() {
  const fun = document.getElementById('fun');
  if (!fun) return;

  // Estado de animación
  let x = innerWidth / 2, y = innerHeight / 2;
  let tx = x, ty = y;

  // Fallbacks / estado
  let autoTimer = null;
  let autoActive = false;
  let gyroAlive = false; // true cuando llega el primer evento

  // Motor de animación (común)
  function tick() {
    const k = 0.12;
    x += (tx - x) * k;
    y += (ty - y) * k;
    const ang = Math.atan2(ty - y, tx - x) * 180 / Math.PI;
    fun.style.transform = `translate(${x}px, ${y}px) rotate(${ang}deg)`;
    requestAnimationFrame(tick);
  }

  // Touch/drag
  function enableTouchDrag() {
    const stopAutoOnUser = () => disableAuto();
    let dragging = false;
    const setFromTouch = (e) => {
      const t = (e.touches && e.touches[0]) ? e.touches[0] : e;
      tx = t.clientX; ty = t.clientY;
    };
    fun.addEventListener('touchstart', (e) => { dragging = true; setFromTouch(e); stopAutoOnUser(); }, { passive: true });
    window.addEventListener('touchmove', (e) => { if (dragging) setFromTouch(e); }, { passive: true });
    window.addEventListener('touchend', () => { dragging = false; }, { passive: true });
  }

  // Auto-animación (random walk suave)
  function enableAuto() {
    if (autoActive) return;
    autoActive = true;
    const margin = 24;
    const pickTarget = () => {
      tx = margin + Math.random() * Math.max(1, innerWidth - margin * 2);
      ty = margin + Math.random() * Math.max(1, innerHeight - margin * 2);
    };
    pickTarget();
    autoTimer = setInterval(pickTarget, 1800);
    const stop = () => disableAuto();
    window.addEventListener('touchstart', stop, { passive: true, once: true });
  }
  function disableAuto() {
    if (!autoActive) return;
    autoActive = false;
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  }

  // Giroscopio
  function enableGyro() {
    function onOri(ev) {
      gyroAlive = true;
      disableAuto();
      const gamma = ev.gamma ?? 0; // izq-der (-90..90)
      const beta = ev.beta ?? 0; // delante-atrás (-180..180)
      const nx = Math.max(-1, Math.min(1, gamma / 45));
      const ny = Math.max(-1, Math.min(1, beta / 45));
      tx = innerWidth / 2 + nx * innerWidth * 0.45;
      ty = innerHeight / 2 + ny * innerHeight * 0.45;
    }

    // iOS (permiso)
    if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {

      const btn = document.createElement('button');
      btn.className = 'gyro-btn';
      btn.textContent = 'Activar movimiento';
      btn.onclick = async () => {
        try {
          const res = await DeviceOrientationEvent.requestPermission();
          if (res === 'granted') {
            window.addEventListener('deviceorientation', onOri);
            btn.remove();
            setTimeout(() => { if (!gyroAlive) { enableTouchDrag(); enableAuto(); } }, 1200);
          } else {
            btn.remove(); enableTouchDrag(); enableAuto();
          }
        } catch {
          btn.remove(); enableTouchDrag(); enableAuto();
        }
      };
      document.body.appendChild(btn);

    } else {
      // Android / otros: sin permiso explícito
      window.addEventListener('deviceorientation', onOri);
      setTimeout(() => { if (!gyroAlive) { enableTouchDrag(); enableAuto(); } }, 1200);
    }
  }

  enableGyro();
  requestAnimationFrame(tick);

  window.addEventListener('resize', () => {
    tx = Math.min(Math.max(12, tx), innerWidth - 12);
    ty = Math.min(Math.max(12, ty), innerHeight - 12);
  }, { passive: true });
}

// ============ Bootstrap ============

window.addEventListener('DOMContentLoaded', loadProject);
