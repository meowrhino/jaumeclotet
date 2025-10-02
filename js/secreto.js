// js/secreto.js
(() => {
  const SECRET_IMG_BASE = 'data/0_secret/img/ghost';
  const SECRET_JSON_URL = 'data/0_secret/secreto.json';

  // --- Config centralizada (fácil de tunear desde aquí o la consola) ---
  const GHOST_CFG = {
    sizeVarDefault: 'clamp(120px, 10vw, 400px)',
    offsetRight: -50,       // px (negativo = asomado)
    offsetBottom: -50,      // px (negativo = asomado)
    moveIntervalMs: 2200,   // intervalo entre saltos
    marginBase: 12,         // margen mínimo con bordes

    // Rotación: sensibilidad y límites
    horizSensitivity: 0.22, // cuánto gira por pixel horizontal
    clampPrimary: 24,       // clamp inicial (|°|)
    clampFinal: 28,         // clamp final tras factor vertical (|°|)
    vertUpFactor: 0.80,     // subir = menos giro
    vertDownFactor: 1.15,   // bajar = un poco más
    rotLerp: 0.45,          // inercia del giro (0..1)
  };

  function cfgForMotion() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) return GHOST_CFG;
    // En modo reduce: menos saltos y nada de transición
    return {
      ...GHOST_CFG,
      moveIntervalMs: Math.max(3000, GHOST_CFG.moveIntervalMs + 1000),
      horizSensitivity: GHOST_CFG.horizSensitivity * 0.5,
      clampPrimary: Math.min(GHOST_CFG.clampPrimary, 16),
      clampFinal: Math.min(GHOST_CFG.clampFinal, 18),
      rotLerp: 0.3,
    };
  }

  // Preload de frames del dado (evita parpadeos al click)
  (function preloadGhostFrames(){
    for (let i = 0; i <= 6; i++) {
      const im = new Image();
      im.decoding = 'async';
      im.loading = 'eager';
      im.src = `${SECRET_IMG_BASE}${i}.png`;
    }
  })();

  // Permite controlar el tamaño vía window.SECRET_GHOST_SIZE (e.g. '120px' o 'clamp(110px,10vw,160px)')
  function applyGhostSizeVar() {
    const v = (window.SECRET_GHOST_SIZE) || document.body?.dataset?.ghostSize;
    if (v && typeof v === 'string') {
      document.documentElement.style.setProperty('--ghost-size', v);
    }
  }

  // -------- Utils
  const uniq = (arr) => [...new Set(arr)];
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  async function fetchJSON(url) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error(r.statusText);
      return await r.json();
    } catch (e) {
      console.warn('[secreto] fetchJSON error:', e);
      return null;
    }
  }

  function allFeaturedSeen(destacados) {
    const slugs = uniq(destacados.map(d => d.slug));
    return slugs.length > 0 && slugs.every(s => localStorage.getItem('proyecto-' + s + '-visto') === '1');
  }

  function resolveSecretUrl(cfg, n) {
    if (!cfg || typeof cfg !== 'object') return null;
    if (Array.isArray(cfg.links)) {
      const hit = cfg.links.find(e => String(e.n) === String(n));
      return hit && hit.url ? String(hit.url) : null;
    }
    if (cfg[String(n)]) return String(cfg[String(n)]);
    return null;
  }

  // -------- Ghost mover
  function startFloating(el) {
    const C = cfgForMotion();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.style.transition = reduceMotion ? 'none' : 'transform 900ms ease';
    el.style.willChange = reduceMotion ? 'auto' : 'transform';

    // Si ya hubiera un bucle activo en este elemento, lo paramos
    if (el._ghostStop) { try { el._ghostStop(); } catch(e){} }

    let prevTx = 0, prevTy = 0, prevRot = -12; // inclinación de partida
    let tx = 0, ty = 0;

    function randomTarget() {
      const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      const rect = el.getBoundingClientRect();
      const w = rect.width || 140;
      const h = rect.height || 140;
      const margin = C.marginBase + Math.max(w, h) / 2;

      const x = Math.random() * (vw - margin * 2) + margin;
      const y = Math.random() * (vh - margin * 2) + margin;

      // translate relativo desde esquina inf. derecha
      tx = Math.min(0, x - (vw - w * 0.7));
      ty = Math.min(0, y - (vh - h * 0.7));

      // Rotación con sentido según desplazamiento reciente
      const dx = tx - prevTx;
      const dy = ty - prevTy;
      const primary = clamp(dx * C.horizSensitivity, -C.clampPrimary, C.clampPrimary);
      const factor = dy < 0 ? C.vertUpFactor : C.vertDownFactor;
      const targetDeg = clamp(primary * factor, -C.clampFinal, C.clampFinal);
      const lerp = (a, b, t) => a + (b - a) * t;
      const nextDeg = lerp(prevRot, targetDeg, C.rotLerp);

      el.style.transform = `translate(${tx}px, ${ty}px) rotate(${nextDeg}deg)`;

      prevTx = tx; prevTy = ty; prevRot = nextDeg;
    }

    randomTarget();
    const id = setInterval(randomTarget, C.moveIntervalMs);
    el._ghostStop = () => clearInterval(id);
    return el._ghostStop;
  }

  // Aplica estilo base sin movimiento (posición fija abajo-derecha)
  function applyGhostBaseStyle(el) {
    const C = cfgForMotion();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sz = (window.SECRET_GHOST_SIZE) || document.body?.dataset?.ghostSize || C.sizeVarDefault;
    Object.assign(el.style, {
      position: 'fixed',
      right: (C.offsetRight|0) + 'px',    // asomado hacia fuera
      bottom: (C.offsetBottom|0) + 'px',  // asomado desde abajo
      zIndex: '9999',
      pointerEvents: 'auto',
      cursor: 'pointer',
      userSelect: 'none',
      width: sz,
      height: 'auto',
      display: 'block',
      transformOrigin: 'bottom right',
      transform: 'translate(0, 0) rotate(-12deg)',
      transition: reduceMotion ? 'none' : 'transform 900ms ease',
      willChange: reduceMotion ? 'auto' : 'transform',
    });
  }

  // Arranca el "flotado" en la primera interacción del usuario (hover, scroll, toque, etc.)
  function setupFloatingOnFirstInteraction(el) {
    let started = false;
    let cleanup = null;

    const trigger = () => {
      if (started) return;
      started = true;
      cleanup && cleanup();
      startFloating(el);
    };

    const listeners = [
      [el, window.matchMedia('(hover: hover)').matches ? 'mouseenter' : 'pointerenter', trigger],
      [window, 'mousemove', trigger],
      [window, 'wheel', trigger, { passive: true }],
      [window, 'scroll', trigger, { passive: true }],
      [window, 'touchstart', trigger, { passive: true }],
      [window, 'touchmove', trigger, { passive: true }],
      [window, 'pointerdown', trigger],
      [window, 'keydown', trigger],
    ];

    listeners.forEach(([t, ev, fn, opts]) => t.addEventListener(ev, fn, opts || false));
    cleanup = () => listeners.forEach(([t, ev, fn]) => t.removeEventListener(ev, fn));

    // Referencia por si se quiere forzar/parar desde consola
    el._ghostStartCleanup = cleanup;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // -------- Animación ruleta + abrir link (siempre nueva pestaña)
  async function spinAndOpen(imgEl, secretCfg) {
    // 1) Elegimos el número final primero
    const finalN = Math.floor(Math.random() * 6) + 1; // 1..6

    // 2) Una vuelta barajada por todas las caras
    const seq = shuffle([1,2,3,4,5,6]);
    for (const frame of seq) {
      imgEl.src = `${SECRET_IMG_BASE}${frame}.png`;
      await sleep(110);
    }

    // 3) Mostrar el definitivo y dejarlo visible un instante
    imgEl.src = `${SECRET_IMG_BASE}${finalN}.png`;
    await sleep(220);

    // 4) Resolver URL y abrirla en nueva pestaña
    const url = resolveSecretUrl(secretCfg, finalN);
    if (url) {
      window.open(url, '_blank', 'noopener');
    } else {
      console.warn('[secreto] No URL for', finalN);
    }
  }

  // -------- Crear e inyectar el ghost
  async function maybeMountGhost() {
    const featured = await fetchJSON('featured.json');
    if (!featured || !Array.isArray(featured.destacados) || featured.destacados.length === 0) return;

    if (!allFeaturedSeen(featured.destacados)) return;

    // Prefetch de secreto.json para que esté listo al click
    const secretCfgPromise = fetchJSON(SECRET_JSON_URL);

    // Crear contenedor (si no existe)
    let ghost = document.getElementById('secret-ghost');
    if (!ghost) {
      ghost = document.createElement('img');
      ghost.id = 'secret-ghost';
      ghost.alt = 'ghost';
      ghost.decoding = 'async';
      ghost.loading = 'lazy';
      ghost.src = `${SECRET_IMG_BASE}0.png`;
      document.body.appendChild(ghost);
      // Estilo base (quieto) y arranque perezoso en la primera interacción (hover/scroll/touch)
      applyGhostBaseStyle(ghost);
      setupFloatingOnFirstInteraction(ghost);
    }

    // Activar click (idempotente)
    if (!ghost.dataset.ready) {
      ghost.dataset.ready = '1';
      let spinning = false;
      ghost.addEventListener('click', async () => {
        if (spinning) return;
        spinning = true;
        try {
          const cfg = await secretCfgPromise;
          await spinAndOpen(ghost, cfg);
        } finally {
          spinning = false;
        }
      });
    }
  }

  // -------- Init en ambas páginas
  function init() {
    applyGhostSizeVar();
    // Comprobar al cargar
    maybeMountGhost();

    // Re-chequear si cambia el storage (p.ej. marcamos visto en otra pestaña)
    window.addEventListener('storage', () => {
      maybeMountGhost();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();