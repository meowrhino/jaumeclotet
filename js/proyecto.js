/* proyecto.js — versión revisada
   - Mantiene el comportamiento DESKTOP (ratón) intacto.
   - En MÓVIL: intenta GIROSCOPIO; si no hay permiso/eventos → fallback a TOUCH/DRAG;
     y si tampoco se usa, arranca AUTO-ANIMACIÓN (random walk suave) hasta que el usuario interactúa.
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

// ============ Carga de datos del proyecto ============

async function loadProject() {
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

    // Marca este proyecto como "visto" para el sistema de desbloqueo
    localStorage.setItem('proyecto-' + slug + '-visto', '1');
    console.log('[projecte] render done');
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

  // logo, bg
  if (p.logo) p.logo = normImg(p.logo);
  if (p.bg) p.bg = normImg(p.bg);

  // elemento divertido
  if (p.elemento_divertido?.src) {
    p.elemento_divertido.src = normImg(p.elemento_divertido.src);
  }

  // galería
  if (p.galeria?.images?.length) {
    p.galeria.images = p.galeria.images.map(src => normImg(src));
  }

  // libre: normaliza covers si existen (sin forzar 'img/' si ya hay carpeta)
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

  // ⚠️ Nota: 'fun' se crea con pointer-events:none por defecto para no tapar clics en desktop.
  root.innerHTML = `
    ${p.bg ? `<div class="project-bg"><img src="${p.bg}" alt=""></div>` : ''}
    <header class="project-header" style="display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:12px;">
      ${p.logo ? `<img class="project-logo" src="${p.logo}" alt="${p.titulo || p.slug}" style="max-width:420px;width:60vw;">` : ''}
      ${p.sinopsis ? `<p class='project-sinopsis' style="opacity:.9;text-align:center;max-width:800px;">${p.sinopsis}</p>` : ''}
    </header>
    ${Array.isArray(p.textos) ? `<section class='project-textos'>${p.textos.map(t => `<p style="max-width:800px;margin:0 auto 1em;line-height:1.6;">${t}</p>`).join('')}</section>` : ''}
    ${p.galeria?.images?.length ? `<section class='project-galeria scroller' style="display:flex;gap:8px;overflow-x:auto;padding:8px 0;">${p.galeria.images.map(src => `<img class='gal-thumb' src='${src}' loading='lazy' style="height:220px;flex:0 0 auto;border-radius:6px;cursor:pointer;">`).join('')}</section>` : ''}
    <section class="project-creditos">${renderCreditos(p.creditos)}</section>
    ${p.elemento_divertido?.src ? `<img id="fun" class="fun" src="${p.elemento_divertido.src}" alt="" style="position:fixed;left:0;top:0;width:72px;pointer-events:none;">` : ''}
  `;

  setupGalleryOverlay();

  // --- Inicializa comportamiento del "elemento divertido" ---
  if (document.getElementById('fun')) {
    if (isTouchDevice()) {
      // En móvil permitimos tocar/arrastrar el elemento (necesita recibir eventos)
      document.getElementById('fun').style.pointerEvents = 'auto'; // (antes era none en inline) :contentReference[oaicite:1]{index=1}
      setupFunFollowerGyro();     // Gyro → Touch → Auto
    } else {
      setupFunFollower();         // Desktop: ratón (tu versión intacta)
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

// ============ Elemento divertido: Desktop (ratón) ============
// (SIN CAMBIOS respecto a tu versión)
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
  let gyroAlive = false;         // se pondrá true cuando llegue el primer evento de orientación

  // --- Motor de animación (común a todos los modos) ---
  function tick() {
    const k = 0.12; // suavizado
    x += (tx - x) * k;
    y += (ty - y) * k;
    const ang = Math.atan2(ty - y, tx - x) * 180 / Math.PI;
    fun.style.transform = `translate(${x}px, ${y}px) rotate(${ang}deg)`;
    requestAnimationFrame(tick);
  }

  // --- Fallback 1: touch/drag ---
  function enableTouchDrag() {
    // Si el usuario toca, desactivamos la auto-animación (si estaba activa)
    const stopAutoOnUser = () => disableAuto();

    let dragging = false;

    const setFromTouch = (e) => {
      const t = (e.touches && e.touches[0]) ? e.touches[0] : e;
      tx = t.clientX; ty = t.clientY;
    };

    fun.addEventListener('touchstart', (e) => {
      dragging = true; setFromTouch(e); stopAutoOnUser();
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (dragging) setFromTouch(e);
    }, { passive: true });

    window.addEventListener('touchend', () => { dragging = false; }, { passive: true });
  }

  // --- Fallback 2: auto-animación (random walk suave) ---
  function enableAuto() {
    if (autoActive) return;
    autoActive = true;

    // Cambia objetivo cada ~1.8s a un punto aleatorio (con margen)
    const margin = 24;
    const pickTarget = () => {
      tx = margin + Math.random() * Math.max(1, innerWidth - margin * 2);
      ty = margin + Math.random() * Math.max(1, innerHeight - margin * 2);
    };
    pickTarget();
    autoTimer = setInterval(pickTarget, 1800);

    // Si el usuario toca en cualquier momento, paramos auto
    const stop = () => disableAuto();
    window.addEventListener('touchstart', stop, { passive: true, once: true });
  }

  function disableAuto() {
    if (!autoActive) return;
    autoActive = false;
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  }

  // --- Modo giroscopio ---
  function enableGyro() {
    function onOri(ev) {
      gyroAlive = true;          // Hemos recibido datos reales de sensor
      disableAuto();             // Si había auto, lo paramos al primer evento real

      // gamma: izq-der (-90..90), beta: delante-atrás (-180..180)
      const gamma = ev.gamma ?? 0;
      const beta = ev.beta ?? 0;

      // Normaliza a [-1..1] y mapea a pantalla
      const nx = Math.max(-1, Math.min(1, gamma / 45));
      const ny = Math.max(-1, Math.min(1, beta / 45));

      tx = innerWidth / 2 + nx * innerWidth * 0.45;
      ty = innerHeight / 2 + ny * innerHeight * 0.45;
    }

    // iOS (permiso requerido)
    if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {

      const btn = document.createElement('button');
      btn.textContent = 'Activar movimiento';
      Object.assign(btn.style, {
        position: 'fixed',
        right: '1rem',
        bottom: '1rem',
        zIndex: 10000,
        padding: '8px 12px',
        borderRadius: '999px',
        background: '#0008',
        color: '#fff',
        border: '1px solid #fff3',
        backdropFilter: 'blur(6px)',
        cursor: 'pointer'
      });

      btn.onclick = async () => {
        try {
          const res = await DeviceOrientationEvent.requestPermission();
          if (res === 'granted') {
            window.addEventListener('deviceorientation', onOri);
            btn.remove();

            // Si en ~1.2s no llegan datos del sensor, cae a touch + auto
            setTimeout(() => {
              if (!gyroAlive) { enableTouchDrag(); enableAuto(); }
            }, 1200);
          } else {
            btn.remove();
            enableTouchDrag();
            enableAuto();
          }
        } catch {
          btn.remove();
          enableTouchDrag();
          enableAuto();
        }
      };

      document.body.appendChild(btn);

    } else {
      // Android / otros: no piden permiso explícito
      window.addEventListener('deviceorientation', onOri);

      // Si no llegan eventos pronto, activa touch + auto
      setTimeout(() => {
        if (!gyroAlive) { enableTouchDrag(); enableAuto(); }
      }, 1200);
    }
  }

  // Arranca
  enableGyro();
  requestAnimationFrame(tick);

  // Mantén dentro de viewport si cambia el tamaño/orientación
  window.addEventListener('resize', () => {
    tx = Math.min(Math.max(12, tx), innerWidth - 12);
    ty = Math.min(Math.max(12, ty), innerHeight - 12);
  }, { passive: true });
}

// ============ Bootstrap ============

window.addEventListener('DOMContentLoaded', loadProject);
