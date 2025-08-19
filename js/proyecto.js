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


/* ====== FUN: constantes compartidas (desktop + móvil) ====== */
const FUN_CFG = {
  LERP: 0.10,                 // suavizado hacia el objetivo
  THRESHOLDS: {
    IDLE_MS: 1000,            // inactividad (ratón o giro) -> auto
    GYRO_MIN_DEG: 0.5         // ignora ruido < 0.5°
  },
  AUTO: {
    MARGIN: 24,               // borde de seguridad
    DIR_INTERVAL_MIN: 350,    // ms
    DIR_INTERVAL_MAX: 900,    // ms
    SPEED_STEP: 6,            // px/s añadidos por “tick” de dirección
    SPEED_MAX: 28,            // px/s tope
    SPEED_MIN: 6              // px/s mínimo cuando no es 0
  }
};

/* ====== Motor compartido para el “fun” ======
   Se ocupa de:
   - Estado (x,y) y objetivo (tx,ty)
   - Auto-animación tipo random-walk (vx,vy + rebote)
   - Interpolación + rotación del sprite
   - Bucle de animación con callback por frame
*/
function makeFunMover(fun, cfg = FUN_CFG) {
  // Estado base
  let x = innerWidth / 2, y = innerHeight / 2;
  let tx = x, ty = y;

  // Estado auto-move
  let autoActive = false;
  let vx = 0, vy = 0;
  let dirTimer = null;

  // Utils locales
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand  = (a, b) => a + Math.random() * (b - a);
  const pick  = () => [-1, 0, 1][(Math.random() * 3) | 0];

  function scheduleDirChange() {
    clearTimeout(dirTimer);
    dirTimer = setTimeout(() => {
      // Pasos discretos en cada eje: -1, 0, 1
      vx += pick() * cfg.AUTO.SPEED_STEP;
      vy += pick() * cfg.AUTO.SPEED_STEP;

      // Pausitas ocasionales
      if (Math.random() < 0.12) { vx = 0; vy = 0; }

      // Limitar velocidad (y aplicar mínimos si no es 0)
      const clampSpeed = (v) => {
        if (v === 0) return 0;
        const s = clamp(Math.abs(v), cfg.AUTO.SPEED_MIN, cfg.AUTO.SPEED_MAX);
        return Math.sign(v) * s;
      };
      vx = clampSpeed(vx);
      vy = clampSpeed(vy);

      scheduleDirChange();
    }, rand(cfg.AUTO.DIR_INTERVAL_MIN, cfg.AUTO.DIR_INTERVAL_MAX));
  }

  function enableAuto() {
    if (autoActive) return;
    autoActive = true;
    // Semilla suave si estaba parado
    if (vx === 0 && vy === 0) {
      vx = (Math.random() < 0.5 ? -1 : 1) * cfg.AUTO.SPEED_MIN;
      vy = (Math.random() < 0.5 ? -1 : 1) * cfg.AUTO.SPEED_MIN;
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

  function setTarget(nx, ny) {
    tx = nx; ty = ny;
  }

  function clampTargetToViewport() {
    const m = cfg.AUTO.MARGIN;
    tx = clamp(tx, m, innerWidth  - m);
    ty = clamp(ty, m, innerHeight - m);
  }

  function isAuto() { return autoActive; }

  // Un paso de simulación (llamado en cada frame)
  function step(dt) {
    // Avanza el objetivo si está en auto
    if (autoActive) {
      tx += vx * dt;
      ty += vy * dt;

      // Rebote suave en los bordes
      const m = cfg.AUTO.MARGIN;
      const minX = m, maxX = innerWidth  - m;
      const minY = m, maxY = innerHeight - m;
      if (tx <= minX || tx >= maxX) { vx = -vx; tx = clamp(tx, minX, maxX); }
      if (ty <= minY || ty >= maxY) { vy = -vy; ty = clamp(ty, minY, maxY); }
    }

    // Interpolación hacia el objetivo
    x += (tx - x) * cfg.LERP;
    y += (ty - y) * cfg.LERP;

    // Rotación hacia el movimiento
    const ang = Math.atan2(ty - y, tx - x) * 180 / Math.PI;
    fun.style.transform = `translate(${x}px, ${y}px) rotate(${ang}deg)`;
  }

  // Inicia el bucle; onFrame(now) se ejecuta en cada frame para lógica externa
  function startLoop(onFrame) {
    let last = performance.now();
    function loop() {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      step(dt);
      if (onFrame) onFrame(now);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  return { setTarget, enableAuto, disableAuto, isAuto, startLoop, clampTargetToViewport };
}

/* ============ Elemento divertido: Desktop (ratón ↔ auto con random-walk) ============ */
function setupFunFollower() {
  const fun = document.getElementById('fun');
  if (!fun) return;

  const mover = makeFunMover(fun, FUN_CFG);
  let lastMouseTs = performance.now();

  // Seguir ratón cuando se mueve; salir del auto si estaba activo
  window.addEventListener('mousemove', (e) => {
    lastMouseTs = performance.now();
    if (mover.isAuto()) mover.disableAuto();
    mover.setTarget(e.clientX, e.clientY);
  }, { passive: true });

  // Si el cursor sale de la ventana, considera “idle”
  window.addEventListener('mouseleave', () => {
    lastMouseTs = performance.now() - FUN_CFG.THRESHOLDS.IDLE_MS - 1;
  });

  // 👇 Como pediste: auto ON desde el inicio en desktop
  mover.enableAuto();

  // Watchdog: si no hay ratón 1s → auto; si hay, sal del auto
  mover.startLoop((now) => {
    const fresh = (now - lastMouseTs) <= FUN_CFG.THRESHOLDS.IDLE_MS;
    if (!fresh && !mover.isAuto()) mover.enableAuto();
    if (fresh && mover.isAuto())   mover.disableAuto();
  });

  // Mantener objetivo dentro del viewport si cambia el tamaño
  window.addEventListener('resize', () => mover.clampTargetToViewport(), { passive: true });
}

/* ============ Elemento divertido: Móvil (gyro ↔ auto + touch, shared engine) ============ */
function setupFunFollowerGyro() {
  const fun = document.getElementById('fun');
  if (!fun) return;

  const mover = makeFunMover(fun, FUN_CFG);
  let lastGyroTs = 0;
  let dragging = false;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // --- Touch/drag siempre disponible (apaga auto mientras arrastras)
  const setFromTouch = (e) => {
    const t = (e.touches && e.touches[0]) ? e.touches[0] : e;
    mover.setTarget(t.clientX, t.clientY);
  };
  fun.addEventListener('touchstart', (e) => { dragging = true; mover.disableAuto(); setFromTouch(e); }, { passive: true });
  window.addEventListener('touchmove', (e) => { if (dragging) setFromTouch(e); }, { passive: true });
  window.addEventListener('touchend',  () => { dragging = false; /* el watchdog decidirá auto */ }, { passive: true });

  // --- Giroscopio
  function onOri(ev) {
    const g = (typeof ev.gamma === 'number') ? ev.gamma : null; // -90..90 (X)
    const b = (typeof ev.beta  === 'number') ? ev.beta  : null; // -180..180 (Y)
    const valid = g !== null && b !== null &&
                  (Math.abs(g) > FUN_CFG.THRESHOLDS.GYRO_MIN_DEG ||
                   Math.abs(b) > FUN_CFG.THRESHOLDS.GYRO_MIN_DEG);
    if (!valid) return;

    lastGyroTs = performance.now();

    const nx = clamp(g / 45, -1, 1);
    const ny = clamp(b / 45, -1, 1);
    const tx = innerWidth  / 2 + nx * innerWidth  * 0.45;
    const ty = innerHeight / 2 + ny * innerHeight * 0.45;
    mover.setTarget(tx, ty);
  }

  function enableGyro() {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS: permiso explícito
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
            btn.remove(); // nos quedamos con auto + touch
          }
        } catch { btn.remove(); }
      };
      document.body.appendChild(btn);
    } else {
      // Android/desktop (Sensors): engancha directo
      window.addEventListener('deviceorientation', onOri);
    }
  }

  // Arranque: auto ON; si llega giro válido, el watchdog lo apagará
  mover.enableAuto();
  enableGyro();

  // Watchdog: si no hay giro 1s (y no estás arrastrando) -> auto; si llega giro -> salir de auto
  mover.startLoop((now) => {
    const gyroFresh = (now - lastGyroTs) <= FUN_CFG.THRESHOLDS.IDLE_MS;
    if (!dragging && !gyroFresh && !mover.isAuto()) mover.enableAuto();
    if (gyroFresh && mover.isAuto())               mover.disableAuto();
  });

  window.addEventListener('resize', () => mover.clampTargetToViewport(), { passive: true });
}

// ============ Bootstrap ============

window.addEventListener('DOMContentLoaded', loadProject);
