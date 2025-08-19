/* proyecto.js — galería con imágenes+vídeos + créditos solo texto
   - Desktop: ratón (intacto).
   - Móvil: giroscopio → touch/drag → auto-animación.
   - Créditos: string (compat con formato viejo).
*/

'use strict';
import { isCssColor } from './assets.js';

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

// --- Meta de página: título + favicon ---
function setPageMeta(p, slug) {
  // Title: usa p.titulo si existe, si no el slug
  document.title = p.titulo || slug || document.title;

  // Favicon: prioriza el "fun"; si no hay, usa logo si es imagen
  const iconHref = (p.elemento_divertido && p.elemento_divertido.src)
    ? p.elemento_divertido.src
    : (p.logo && !isCssColor(p.logo) ? p.logo : null);

  if (iconHref) setFavicon(iconHref);
}

function setFavicon(href) {
  // Limpia anteriores
  document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach(n => n.remove());
  // Crea nuevo (PNG funciona perfecto)
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = href;
  document.head.appendChild(link);
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
    setPageMeta(p, slug);   // <--- NUEVO
    renderProject(p);

    // Marca este proyecto como "visto" para el sistema de desbloqueo
    localStorage.setItem('proyecto-' + slug + '-visto', '1');
  } catch (err) {
    console.error('[projecte] load error:', err);
  }
}

// Normalización de rutas y datos
function normalizePaths(p, base) {
  const normImg = (path) => {
    if (!path) return path;
    let s = path.replace(/^\.?\//, ''); // quita ./ o /
    if (!s.startsWith('img/')) s = 'img/' + s; // fuerza carpeta img/ para imágenes
    return base + s;
  };
  const normAny = (path) => {
    if (!path) return path;
    let s = path.replace(/^\.?\//, '');
    return base + s; // para vídeos/otros no forzamos img/
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

  // --- GALERÍA ---
  // Preferente: media[] con items {type:'image'|'video', src, poster?}
  let media = [];
  if (p.galeria?.media?.length) {
    media = p.galeria.media.map(item => {
      const it = { ...item };
      if (it.type === 'image' && it.src) it.src = normImg(it.src);
      else if (it.type === 'video' && it.src) it.src = normAny(it.src);
      if (it.poster) it.poster = normImg(it.poster);
      return it;
    });
  } else {
    // Compat: images[] y video/videos[]
    if (p.galeria?.images?.length) {
      media.push(...p.galeria.images.map(src => ({ type: 'image', src: normImg(src) })));
    }
    const vids = p.galeria?.video || p.galeria?.videos;
    if (Array.isArray(vids) && vids.length) {
      media.push(...vids.map(src => ({ type: 'video', src: normAny(src) })));
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
    p.comodin = p.comodin.map(raw => {
      const it = { ...raw };
      if (it.type === 'image' && it.src) it.src = normImg(it.src);
      if (it.type === 'video' && it.src) it.src = normAny(it.src);
      if (it.poster) it.poster = normImg(it.poster);
      // sanea align/width
      if (it.align && !['left','center','right'].includes(it.align)) delete it.align;
      if (it.width && !['auto','half','full'].includes(it.width)) delete it.width;
      return it;
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

    ${p.galeria?.media?.length
      ? `<section class="project-galeria column">
           ${p.galeria.media.map(m => {
        if (m.type === 'video') {
          const poster = m.poster ? ` poster="${m.poster}"` : '';
          return `<video class="gal-video" src="${m.src}" controls playsinline preload="metadata"${poster}></video>`;
        } else {
          return `<img class="gal-img" src="${m.src}" loading="lazy" alt="">`;
        }
      }).join('')}
         </section>`
      : ''}

    <section class="project-creditos">${renderCreditos(p.creditos)}</section>

    ${p.elemento_divertido?.src ? `<img id="fun" class="fun" src="${p.elemento_divertido.src}" alt="">` : ''}
  `;

  setupGalleryOverlay();

  // --- Inserta comodines (si hay) ---
if (Array.isArray(p.comodin) && p.comodin.length) {
  renderComodines(p.comodin);
  // Como ahora hay más imágenes/vídeos clicables, re-inicializamos el overlay para incluirlos
  setupGalleryOverlay(true); // le pasamos true para refrescar (ver función abajo)
}


  // --- Inicializa comportamiento del "elemento divertido" ---
  const fun = document.getElementById('fun');
  if (fun) {
    if (isTouchDevice()) {
      fun.classList.add('touchable'); // pointer-events:auto vía CSS
      setupFunFollowerGyro();         // Gyro → Touch → Auto
    } else {
      setupFunFollower();             // Desktop: ratón
    }
  }
}

// Créditos: solo texto (compat con formato viejo)
function renderCreditos(c) {
  if (!c) return '';
  const text = typeof c === 'string' ? c : (c.contenido || '');
  return `<pre>${text}</pre>`;
}

// ============ Overlay de galería (click para ampliar) ============

// Inserta comodines en lugares específicos
function renderComodines(list) {
  const root = document.getElementById('project-root');
  if (!root) return;

  // Mapa rápido de anclas base
  const anchors = {
    header: root.querySelector('.project-header'),
    textos: root.querySelector('.project-textos'),
    galeria: root.querySelector('.project-galeria'),
    creditos: root.querySelector('.project-creditos'),
    root
  };

  for (const item of list) {
    const el = createComodinElement(item);
    if (!el) continue;

    // Si tiene id, regístralo en el propio nodo para poder referenciarlo con @id
    if (item.id) {
      if (root.querySelector(`[data-comodin-id="${CSS.escape(item.id)}"]`)) {
        console.warn('[comodin] id duplicado:', item.id);
      }
      el.dataset.comodinId = item.id;
    }

    const { target, position } = resolvePlace(item.place, anchors, root);
    if (!target) {
      console.warn('[comodin] place no resuelto, usando final de root:', item.place);
      root.appendChild(el);
      continue;
    }

    if (position === 'append') target.appendChild(el);
    else target.insertAdjacentElement(position, el);
  }
}

// Crea el nodo HTML del comodín según su tipo
function createComodinElement(it) {
  const align = it.align ? ` align-${it.align}` : '';
  const width = it.width ? ` width-${it.width}` : '';

  if (it.type === 'text') {
    const section = document.createElement('section');
    section.className = `comodin comodin-text${align}${width}`;
    const ps = Array.isArray(it.prose) ? it.prose : (it.prose ? [it.prose] : []);
    if (!ps.length && it.text) ps.push(it.text);
    if (!ps.length) return null;
    section.innerHTML = ps.map(p => `<p>${p}</p>`).join('');
    return section;
  }

  if (it.type === 'image' && it.src) {
    const fig = document.createElement('figure');
    fig.className = `comodin comodin-image${align}${width}`;
    fig.innerHTML = `<img src="${it.src}" alt="">` +
                    (it.caption ? `<figcaption>${it.caption}</figcaption>` : '');
    return fig;
  }

  if (it.type === 'video' && it.src) {
    const fig = document.createElement('figure');
    fig.className = `comodin comodin-video${align}${width}`;
    const poster = it.poster ? ` poster="${it.poster}"` : '';
    const attrs = [
      'controls',
      'playsinline',
      'preload="metadata"',
      it.muted ? 'muted' : '',
      it.loop ? 'loop' : '',
      it.autoplay ? 'autoplay' : ''
    ].filter(Boolean).join(' ');
    fig.innerHTML = `<video src="${it.src}" ${attrs}${poster}></video>` +
                    (it.caption ? `<figcaption>${it.caption}</figcaption>` : '');
    return fig;
  }

  // (opcional) tipo 'html'
  if (it.type === 'html' && it.raw) {
    const div = document.createElement('div');
    div.className = `comodin comodin-html${align}${width}`;
    div.innerHTML = it.raw;
    return div;
  }

  console.warn('[comodin] tipo no soportado o datos incompletos:', it);
  return null;
}

// Traduce place -> {target, position}
function resolvePlace(place, anchors, root) {
  const def = { target: anchors.root, position: 'beforeend' }; // 'end' por defecto
  if (!place) return def;

  // formatos: "after:header", "before:creditos", "end", "after:@intro", "append:#selector"
  const [rawPos, rawKey] = String(place).split(':');
  const pos = rawPos || 'end';
  const key = rawKey || '';

  if (pos === 'end') return def;

  // objetivo por palabra clave
  const byKey = (name) => {
    if (anchors[name]) return anchors[name];
    return root.querySelector(name); // permite selectores CSS si no es palabra clave
  };

  let target = null;
  if (key.startsWith('@')) {
    const id = key.slice(1);
    target = root.querySelector(`[data-comodin-id="${CSS.escape(id)}"]`);
  } else if (key) {
    target = byKey(key);
  }

  if (!target) return def;

  if (pos === 'after')  return { target, position: 'afterend' };
  if (pos === 'before') return { target, position: 'beforebegin' };
  if (pos === 'append') return { target, position: 'beforeend' };

  return def;
}

/* Overlay — actualizado para captar también los medios de 'comodin'.
   Cuando se llama con refresh=true, elimina overlay previo y vuelve a enganchar. */
function setupGalleryOverlay(refresh = false) {
  if (refresh) {
    document.querySelectorAll('.overlay').forEach(n => n.remove());
    // quitamos listeners anteriores simplemente recreando todo
  }

  const medias = document.querySelectorAll(
    '.project-galeria img, .project-galeria video, .comodin img, .comodin video'
  );
  if (!medias.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  document.body.appendChild(overlay);

  function showImage(src) {
    overlay.innerHTML = `<img class="overlay-media" src="${src}" alt="">`;
    overlay.classList.add('show');
  }
  function showVideo(src, poster) {
    overlay.innerHTML = `<video class="overlay-media"${poster ? ` poster="${poster}"` : ''} src="${src}" controls playsinline preload="metadata"></video>`;
    overlay.classList.add('show');
  }

  medias.forEach(el => {
    el.addEventListener('click', () => {
      if (el.tagName === 'VIDEO') {
        try { el.pause(); } catch(_) {}
        const poster = el.getAttribute('poster') || '';
        showVideo(el.currentSrc || el.src, poster);
      } else {
        showImage(el.currentSrc || el.src);
      }
    });
  });

  overlay.addEventListener('click', () => {
    overlay.classList.remove('show');
    overlay.innerHTML = '';
  });
}


// ============ Elemento divertido: Desktop (ratón ↔ auto con random-walk) ============

function setupFunFollower() {
  const fun = document.getElementById('fun');
  if (!fun) return;

  // ---- Ajustes
  const LERP = 0.10;          // suavizado hacia el objetivo
  const IDLE_MS = 1000;       // sin ratón 1s -> auto

  // Auto-movimiento (random walk)
  const AUTO_MARGIN = 24;                 // borde de seguridad
  const AUTO_DIR_INTERVAL_MIN = 350;      // ms
  const AUTO_DIR_INTERVAL_MAX = 900;      // ms
  const AUTO_SPEED_STEP = 6;              // px/s por “tick” de dirección
  const AUTO_SPEED_MAX  = 28;             // px/s tope
  const AUTO_SPEED_MIN  = 6;              // px/s mínimo cuando no sea 0

  // ---- Estado
  let x = innerWidth / 2, y = innerHeight / 2;
  let tx = x, ty = y;

  let autoActive = false;
  let dirTimer = null;        // temporizador para cambiar dirección
  let vx = 0, vy = 0;         // velocidad auto en px/s

  let lastMouseTs = performance.now(); // último movimiento de ratón

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand  = (a, b) => a + Math.random() * (b - a);
  const pick  = () => [-1, 0, 1][(Math.random() * 3) | 0];

  // ---- Eventos ratón
  window.addEventListener('mousemove', (e) => {
    lastMouseTs = performance.now();
    // sal del auto inmediatamente y sigue el cursor
    if (autoActive) disableAuto();
    tx = e.clientX;
    ty = e.clientY;
  }, { passive: true });

  // si el cursor sale de la ventana, considera “idle” para que arranque el auto
  window.addEventListener('mouseleave', () => {
    lastMouseTs = performance.now() - IDLE_MS - 1;
  });

  // ---- Animación principal
  let last = performance.now();
  function tick() {
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;

    // Watchdog auto <-> ratón (si no hay ratón en 1s, activa auto; si hay, apágalo)
    const mouseFresh = (now - lastMouseTs) <= IDLE_MS;
    if (!mouseFresh && !autoActive) enableAuto();
    if (mouseFresh && autoActive)   disableAuto();

    // Integración del random-walk (mueve el objetivo tx,ty)
    if (autoActive) {
      tx += vx * dt;
      ty += vy * dt;

      // Rebote suave en bordes
      const minX = AUTO_MARGIN, maxX = innerWidth  - AUTO_MARGIN;
      const minY = AUTO_MARGIN, maxY = innerHeight - AUTO_MARGIN;
      if (tx <= minX || tx >= maxX) { vx = -vx; tx = clamp(tx, minX, maxX); }
      if (ty <= minY || ty >= maxY) { vy = -vy; ty = clamp(ty, minY, maxY); }
    }

    // Interpola hacia el objetivo y rota
    x += (tx - x) * LERP;
    y += (ty - y) * LERP;
    const ang = Math.atan2(ty - y, tx - x) * 180 / Math.PI;
    fun.style.transform = `translate(${x}px, ${y}px) rotate(${ang}deg)`;

    requestAnimationFrame(tick);
  }

  // ---- Auto-animación (random walk: cambia dir cada X ms con pasos -1/0/1)
  function scheduleDirChange() {
    clearTimeout(dirTimer);
    dirTimer = setTimeout(() => {
      // Cambia un poco la velocidad en cada eje con pasos -1 / 0 / 1
      vx += pick() * AUTO_SPEED_STEP;
      vy += pick() * AUTO_SPEED_STEP;

      // A veces “pausa” (velocidad 0) un ratito
      if (Math.random() < 0.12) { vx = 0; vy = 0; }

      // Limita y asegura mínimos cuando no sea 0
      const clampSpeed = (v) => {
        if (v === 0) return 0;
        const s = clamp(Math.abs(v), AUTO_SPEED_MIN, AUTO_SPEED_MAX);
        return Math.sign(v) * s;
      };
      vx = clampSpeed(vx);
      vy = clampSpeed(vy);

      scheduleDirChange();
    }, rand(AUTO_DIR_INTERVAL_MIN, AUTO_DIR_INTERVAL_MAX));
  }

  function enableAuto() {
    if (autoActive) return;
    autoActive = true;
    // Semilla de velocidad muy suave
    if (vx === 0 && vy === 0) {
      vx = (Math.random() < 0.5 ? -1 : 1) * AUTO_SPEED_MIN;
      vy = (Math.random() < 0.5 ? -1 : 1) * AUTO_SPEED_MIN;
    }
    scheduleDirChange();
  }

  function disableAuto() {
    if (!autoActive) return;
    autoActive = false;
    clearTimeout(dirTimer);
    dirTimer = null;
    vx = 0; vy = 0;
  }

  // ---- Arranque
  // No activamos auto inmediatamente; el watchdog lo activará tras 1s sin ratón.
  requestAnimationFrame(tick);

  // Mantener dentro del viewport si cambia tamaño
  window.addEventListener('resize', () => {
    tx = clamp(tx, AUTO_MARGIN, innerWidth  - AUTO_MARGIN);
    ty = clamp(ty, AUTO_MARGIN, innerHeight - AUTO_MARGIN);
  }, { passive: true });
}


// ============ Elemento divertido: Móvil (gyro ↔ auto con watchdog + touch) ============

// ============ Elemento divertido: Móvil (gyro ↔ auto con random-walk suave + touch) ============

function setupFunFollowerGyro() {
  const fun = document.getElementById('fun');
  if (!fun) return;

  // ---- Ajustes
  const LERP = 0.10;          // suavizado hacia el objetivo
  const GYRO_MIN_DEG = 0.5;   // umbral para considerar "movimiento real"
  const GYRO_IDLE_MS = 1000;  // sin giro 1s -> vuelve a auto

  // Auto-movimiento (random walk)
  const AUTO_MARGIN = 24;                 // borde de seguridad
  const AUTO_DIR_INTERVAL_MIN = 350;      // ms
  const AUTO_DIR_INTERVAL_MAX = 900;      // ms
  const AUTO_SPEED_STEP = 6;              // px/s por “tick” de dirección
  const AUTO_SPEED_MAX  = 28;             // px/s tope
  const AUTO_SPEED_MIN  = 6;              // px/s mínimo cuando no es 0

  // ---- Estado
  let x = innerWidth / 2, y = innerHeight / 2;
  let tx = x, ty = y;

  let autoActive = false;
  let dirTimer = null;        // temporizador para cambiar dirección
  let vx = 0, vy = 0;         // velocidad auto en px/s

  let lastGyroTs = 0;         // último giro válido
  let dragging = false;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand  = (a, b) => a + Math.random() * (b - a);
  const pick  = () => [-1, 0, 1][(Math.random() * 3) | 0];

  // ---- Animación principal
  let last = performance.now();
  function tick() {
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;

    // Watchdog auto <-> giro (si no hay giro en 1s, activa auto; si hay, apágalo)
    const gyroFresh = (now - lastGyroTs) <= GYRO_IDLE_MS;
    if (!dragging && !gyroFresh && !autoActive) enableAuto();
    if (gyroFresh && autoActive) disableAuto();

    // Integración del random-walk (mueve el objetivo tx,ty)
    if (autoActive) {
      tx += vx * dt;
      ty += vy * dt;

      // Rebote suave en bordes
      const minX = AUTO_MARGIN, maxX = innerWidth  - AUTO_MARGIN;
      const minY = AUTO_MARGIN, maxY = innerHeight - AUTO_MARGIN;
      if (tx <= minX || tx >= maxX) { vx = -vx; tx = clamp(tx, minX, maxX); }
      if (ty <= minY || ty >= maxY) { vy = -vy; ty = clamp(ty, minY, maxY); }
    }

    // Interpola hacia el objetivo y rota
    x += (tx - x) * LERP;
    y += (ty - y) * LERP;
    const ang = Math.atan2(ty - y, tx - x) * 180 / Math.PI;
    fun.style.transform = `translate(${x}px, ${y}px) rotate(${ang}deg)`;

    requestAnimationFrame(tick);
  }

  // ---- Auto-animación (random walk: cambia dir cada X ms con pasos -1/0/1)
  function scheduleDirChange() {
    clearTimeout(dirTimer);
    dirTimer = setTimeout(() => {
      // Cambia un poco la velocidad en cada eje con pasos -1 / 0 / 1
      vx += pick() * AUTO_SPEED_STEP;
      vy += pick() * AUTO_SPEED_STEP;

      // A veces “pausa” (velocidad 0) un ratito
      if (Math.random() < 0.12) { vx = 0; vy = 0; }

      // Limita y asegura mínimos cuando no sea 0
      const clampSpeed = (v) => {
        if (v === 0) return 0;
        const s = clamp(Math.abs(v), AUTO_SPEED_MIN, AUTO_SPEED_MAX);
        return Math.sign(v) * s;
      };
      vx = clampSpeed(vx);
      vy = clampSpeed(vy);

      scheduleDirChange();
    }, rand(AUTO_DIR_INTERVAL_MIN, AUTO_DIR_INTERVAL_MAX));
  }

  function enableAuto() {
    if (autoActive) return;
    autoActive = true;
    // Semilla de velocidad muy suave
    if (vx === 0 && vy === 0) {
      vx = (Math.random() < 0.5 ? -1 : 1) * AUTO_SPEED_MIN;
      vy = (Math.random() < 0.5 ? -1 : 1) * AUTO_SPEED_MIN;
    }
    scheduleDirChange();
  }

  function disableAuto() {
    if (!autoActive) return;
    autoActive = false;
    clearTimeout(dirTimer);
    dirTimer = null;
    vx = 0; vy = 0;
  }

  // ---- Touch/drag
  function enableTouchDrag() {
    const setFromTouch = (e) => {
      const t = (e.touches && e.touches[0]) ? e.touches[0] : e;
      tx = t.clientX; ty = t.clientY;
    };
    fun.addEventListener('touchstart', (e) => { dragging = true; disableAuto(); setFromTouch(e); }, { passive: true });
    window.addEventListener('touchmove', (e) => { if (dragging) setFromTouch(e); }, { passive: true });
    window.addEventListener('touchend', () => { dragging = false; /* watchdog decide auto */ }, { passive: true });
  }

  // ---- Giroscopio
  function enableGyro() {
    function onOri(ev) {
      const g = (typeof ev.gamma === 'number') ? ev.gamma : null; // -90..90
      const b = (typeof ev.beta  === 'number') ? ev.beta  : null; // -180..180
      const valid = g !== null && b !== null && (Math.abs(g) > GYRO_MIN_DEG || Math.abs(b) > GYRO_MIN_DEG);
      if (!valid) return;

      lastGyroTs = performance.now();

      const nx = clamp(g / 45, -1, 1);
      const ny = clamp(b / 45, -1, 1);
      tx = innerWidth  / 2 + nx * innerWidth  * 0.45;
      ty = innerHeight / 2 + ny * innerHeight * 0.45;
    }

    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS: pedir permiso (auto ya activo de base)
      const btn = document.createElement('button');
      btn.className = 'gyro-btn';
      btn.textContent = 'Activar movimiento';
      btn.onclick = async () => {
        try {
          const res = await DeviceOrientationEvent.requestPermission();
          if (res === 'granted') {
            window.addEventListener('deviceorientation', onOri);
            btn.remove();
          } else {
            btn.remove();
          }
        } catch { btn.remove(); }
      };
      document.body.appendChild(btn);
    } else {
      // Android/desktop (Sensors)
      window.addEventListener('deviceorientation', onOri);
    }
  }

  // ---- Arranque
  enableAuto();       // siempre empieza suave en auto
  enableGyro();       // si llega giro, lo seguirá y apagará el auto
  enableTouchDrag();  // arrastrar siempre disponible
  requestAnimationFrame(tick);

  window.addEventListener('resize', () => {
    tx = clamp(tx, AUTO_MARGIN, innerWidth  - AUTO_MARGIN);
    ty = clamp(ty, AUTO_MARGIN, innerHeight - AUTO_MARGIN);
  }, { passive: true });
}



// ============ Bootstrap ============

window.addEventListener('DOMContentLoaded', loadProject);
