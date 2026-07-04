// fun.js — motor y comportamiento del "elemento divertido" (desktop + móvil)

/* ====== FUN: constantes compartidas (desktop + móvil) ====== */
export const FUN_CFG = {
  LERP: 0.1, // suavizado hacia el objetivo
  THRESHOLDS: {
    IDLE_MS: 1000, // inactividad (ratón o giro) -> auto
    GYRO_MIN_DEG: 0.5, // ignora ruido < 0.5°
  },
  AUTO: {
    MARGIN: 24, // borde de seguridad
    DIR_INTERVAL_MIN: 350, // ms
    DIR_INTERVAL_MAX: 900, // ms
    SPEED_STEP: 6, // px/s añadidos por “tick” de dirección
    SPEED_MAX: 28, // px/s tope
    SPEED_MIN: 6, // px/s mínimo cuando no es 0
  },
};

/* ====== Motor compartido para el “fun” ======
   Se ocupa de:
   - Estado (x,y) y objetivo (tx,ty)
   - Auto-animación tipo random-walk (vx,vy + rebote)
   - Interpolación + rotación del sprite
   - Bucle de animación con callback por frame
*/
export function makeFunMover(fun, cfg = FUN_CFG) {
  // Estado base
  let x = innerWidth / 2,
    y = innerHeight / 2;
  let tx = x,
    ty = y;

  // Estado auto-move
  let autoActive = false;
  let vx = 0,
    vy = 0;
  let dirTimer = null;

  // Utils locales
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = () => [-1, 0, 1][(Math.random() * 3) | 0];

  function scheduleDirChange() {
    clearTimeout(dirTimer);
    dirTimer = setTimeout(() => {
      // Pasos discretos en cada eje: -1, 0, 1
      vx += pick() * cfg.AUTO.SPEED_STEP;
      vy += pick() * cfg.AUTO.SPEED_STEP;

      // Pausitas ocasionales
      if (Math.random() < 0.12) {
        vx = 0;
        vy = 0;
      }

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
    vx = 0;
    vy = 0;
  }

  function setTarget(nx, ny) {
    tx = nx;
    ty = ny;
  }

  function clampTargetToViewport() {
    const m = cfg.AUTO.MARGIN;
    tx = clamp(tx, m, innerWidth - m);
    ty = clamp(ty, m, innerHeight - m);
  }

  function isAuto() {
    return autoActive;
  }

  // Un paso de simulación (llamado en cada frame)
  function step(dt) {
    // Avanza el objetivo si está en auto
    if (autoActive) {
      tx += vx * dt;
      ty += vy * dt;

      // Rebote suave en los bordes
      const m = cfg.AUTO.MARGIN;
      const minX = m,
        maxX = innerWidth - m;
      const minY = m,
        maxY = innerHeight - m;
      if (tx <= minX || tx >= maxX) {
        vx = -vx;
        tx = clamp(tx, minX, maxX);
      }
      if (ty <= minY || ty >= maxY) {
        vy = -vy;
        ty = clamp(ty, minY, maxY);
      }
    }

    // Interpolación hacia el objetivo
    x += (tx - x) * cfg.LERP;
    y += (ty - y) * cfg.LERP;

    // Rotación hacia el movimiento
    const ang = (Math.atan2(ty - y, tx - x) * 180) / Math.PI;
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

  return {
    setTarget,
    enableAuto,
    disableAuto,
    isAuto,
    startLoop,
    clampTargetToViewport,
  };
}

/* ============ Elemento divertido: Desktop (ratón ↔ auto con random-walk) ============ */
export function setupFunFollower() {
  const fun = document.getElementById("fun");
  if (!fun) return;

  const mover = makeFunMover(fun, FUN_CFG);
  let lastMouseTs = performance.now();

  // Seguir ratón cuando se mueve; salir del auto si estaba activo
  window.addEventListener(
    "mousemove",
    (e) => {
      lastMouseTs = performance.now();
      if (mover.isAuto()) mover.disableAuto();
      mover.setTarget(e.clientX, e.clientY);
    },
    { passive: true }
  );

  // Si el cursor sale de la ventana, considera “idle”
  window.addEventListener("mouseleave", () => {
    lastMouseTs = performance.now() - FUN_CFG.THRESHOLDS.IDLE_MS - 1;
  });

  // 👇 Como pediste: auto ON desde el inicio en desktop
  mover.enableAuto();

  // Watchdog: si no hay ratón 1s → auto; si hay, sal del auto
  mover.startLoop((now) => {
    const fresh = now - lastMouseTs <= FUN_CFG.THRESHOLDS.IDLE_MS;
    if (!fresh && !mover.isAuto()) mover.enableAuto();
    if (fresh && mover.isAuto()) mover.disableAuto();
  });

  // Mantener objetivo dentro del viewport si cambia el tamaño
  window.addEventListener("resize", () => mover.clampTargetToViewport(), {
    passive: true,
  });
}

/* ============ Elemento divertido: Móvil (gyro ↔ auto + touch, shared engine) ============ */
export function setupFunFollowerGyro() {
  const fun = document.getElementById("fun");
  if (!fun) return;

  const mover = makeFunMover(fun, FUN_CFG);
  let lastGyroTs = 0;
  let dragging = false;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // --- Touch/drag siempre disponible (apaga auto mientras arrastras)
  const setFromTouch = (e) => {
    const t = e.touches && e.touches[0] ? e.touches[0] : e;
    mover.setTarget(t.clientX, t.clientY);
  };
  fun.addEventListener(
    "touchstart",
    (e) => {
      dragging = true;
      mover.disableAuto();
      setFromTouch(e);
    },
    { passive: true }
  );
  window.addEventListener(
    "touchmove",
    (e) => {
      if (dragging) setFromTouch(e);
    },
    { passive: true }
  );
  window.addEventListener(
    "touchend",
    () => {
      dragging = false; /* el watchdog decidirá auto */
    },
    { passive: true }
  );

  // --- Giroscopio
  function onOri(ev) {
    const g = typeof ev.gamma === "number" ? ev.gamma : null; // -90..90 (X)
    const b = typeof ev.beta === "number" ? ev.beta : null; // -180..180 (Y)
    const valid =
      g !== null &&
      b !== null &&
      (Math.abs(g) > FUN_CFG.THRESHOLDS.GYRO_MIN_DEG ||
        Math.abs(b) > FUN_CFG.THRESHOLDS.GYRO_MIN_DEG);
    if (!valid) return;

    lastGyroTs = performance.now();

    const nx = clamp(g / 45, -1, 1);
    const ny = clamp(b / 45, -1, 1);
    const tx = innerWidth / 2 + nx * innerWidth * 0.45;
    const ty = innerHeight / 2 + ny * innerHeight * 0.45;
    mover.setTarget(tx, ty);
  }

  function enableGyro() {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      // iOS: permiso explícito
      const btn = document.createElement("button");
      btn.className = "gyro-btn";
      btn.textContent = "Activar movimiento";
      btn.onclick = async () => {
        try {
          const res = await DeviceOrientationEvent.requestPermission();
          if (res === "granted") {
            window.addEventListener("deviceorientation", onOri);
            btn.remove();
          } else {
            btn.remove(); // nos quedamos con auto + touch
          }
        } catch {
          btn.remove();
        }
      };
      document.body.appendChild(btn);
    } else {
      // Android/desktop (Sensors): engancha directo
      window.addEventListener("deviceorientation", onOri);
    }
  }

  // Arranque: auto ON; si llega giro válido, el watchdog lo apagará
  mover.enableAuto();
  enableGyro();

  // Watchdog: si no hay giro 1s (y no estás arrastrando) -> auto; si llega giro -> salir de auto
  mover.startLoop((now) => {
    const gyroFresh = now - lastGyroTs <= FUN_CFG.THRESHOLDS.IDLE_MS;
    if (!dragging && !gyroFresh && !mover.isAuto()) mover.enableAuto();
    if (gyroFresh && mover.isAuto()) mover.disableAuto();
  });

  window.addEventListener("resize", () => mover.clampTargetToViewport(), {
    passive: true,
  });
}
