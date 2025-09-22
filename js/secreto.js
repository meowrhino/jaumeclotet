// js/secreto.js
(() => {
  const SECRET_IMG_BASE = 'data/0_secret/img/ghost';
  const SECRET_JSON_URL = 'data/0_secret/secreto.json';

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
    el.classList.add('secret-ghost');
    // estilos mínimos; el tamaño/pos se controlan por CSS
    Object.assign(el.style, {
      position: 'fixed',
      right: '16px',
      bottom: '16px',
      zIndex: '9999',
      pointerEvents: 'auto',
      transition: 'transform 900ms ease',
      willChange: 'transform',
      cursor: 'pointer',
      userSelect: 'none',
    });

    let tx = 0, ty = 0;

    function randomTarget() {
      const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      const rect = el.getBoundingClientRect();
      const w = rect.width || 140; // fallback tamaño
      const h = rect.height || 140;
      const margin = 12 + Math.max(w, h) / 2; // margen dinámico

      const x = Math.random() * (vw - margin * 2) + margin;
      const y = Math.random() * (vh - margin * 2) + margin;

      // translate relativo desde esquina inf. derecha
      tx = Math.min(0, x - (vw - w * 0.7));
      ty = Math.min(0, y - (vh - h * 0.7));
      el.style.transform = `translate(${tx}px, ${ty}px)`;
    }

    randomTarget();
    const id = setInterval(randomTarget, 2400);
    el.addEventListener('mouseenter', () => el.style.transition = 'transform 250ms ease');
    el.addEventListener('mouseleave', () => el.style.transition = 'transform 900ms ease');
    return () => clearInterval(id);
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
      startFloating(ghost);
    }

    // Activar click (idempotente)
    if (!ghost.dataset.ready) {
      ghost.dataset.ready = '1';
      ghost.addEventListener('click', async () => {
        const cfg = await secretCfgPromise;
        await spinAndOpen(ghost, cfg);
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