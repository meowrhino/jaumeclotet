// arrows.js — flechas de navegación aleatoria prev/next + atajo About

// Probabilidades compartidas para navegación de flechas (puedes ajustar)
// Preferencias: IZQ (alta=Home, baja=Anterior, loca=Random) | DER (alta=Siguiente, baja=Anterior, loca=Random)
const PROB_ALTA = 0.7; // preferido (izq=home, der=adelante)
const PROB_BAJA = 0.2; // lo contrario
const PROB_LOCA = 0.1; // random

// Guard: advierte si la suma de probabilidades no es 1
if (Math.abs((PROB_ALTA + PROB_BAJA + PROB_LOCA) - 1) > 1e-6) {
  console.warn("[arrows] Suma de probabilidades ≠ 1:", PROB_ALTA + PROB_BAJA + PROB_LOCA);
}

// Selección de tier con las tres probabilidades explícitas (alta/baja/loca)
function pickTier() {
  const total = PROB_ALTA + PROB_BAJA + PROB_LOCA;
  const r = Math.random() * (total > 0 ? total : 1);
  if (r < PROB_ALTA) return "alta";
  if (r < PROB_ALTA + PROB_BAJA) return "baja";
  return "loca"; // resto
}

// --- Random prev/next arrows al final del proyecto ---
export async function setupRandomArrows(currentSlug) {
  try {
    // Caso especial: ABOUT → solo flecha izquierda a Home (no dependas de featured.json)
    if (currentSlug === "about") {
      const root = document.getElementById("project-root");
      if (root) {
        const section = document.createElement("section");
        section.className = "project-nav";

        const b = document.createElement("button");
        b.type = "button";
        b.className = "nav-arrow nav-arrow--left";
        b.setAttribute("aria-label", "Volver a Home");

        const img = document.createElement("img");
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        img.src = "data/arrow.webp";
        b.appendChild(img);

        b.addEventListener("click", () => {
          location.href = "index.html";
        });

        section.appendChild(b);
        root.appendChild(section);

        // Añade un badge/link al final del scroll: "web: meowrhino"
        // Evita duplicados si ya existe
        if (!root.querySelector('.about-web')) {
          const p = document.createElement('p');
          p.className = 'about-web';
          const a = document.createElement('a');
          a.href = 'https://meowrhino.github.io/becasDigMeow/';
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = 'web: meowrhino';
          p.appendChild(a);
          root.appendChild(p);
        }
      }
      return; // corta aquí; no hace falta featured.json
    }
    const r = await fetch("featured.json", { cache: "no-cache" });
    if (!r.ok) throw new Error("featured.json not found");
    const data = await r.json();
    const arr = Array.isArray(data)
      ? data
      : data.destacados || data.featured || [];
    const slugs = arr
      .map((x) => (typeof x === "string" ? x : x.slug))
      .filter(Boolean);
    const idx = slugs.indexOf(currentSlug);
    if (idx === -1 || slugs.length < 2) return; // no arrows si no encontramos el slug

    const prev = slugs[(idx - 1 + slugs.length) % slugs.length];
    const next = slugs[(idx + 1) % slugs.length];

    const root = document.getElementById("project-root");
    if (!root) return;

    // --- NO CSS injection here; styles in style.css ---

    const section = document.createElement("section");
    section.className = "project-nav";

    // Selector con probabilidades compartidas usando pickTier
    function pickDest(preferred, prevSlug, nextSlug) {
      const tier = pickTier();
      if (tier === "alta") {
        return preferred === "prev" ? prevSlug : nextSlug;
      } else if (tier === "baja") {
        return preferred === "prev" ? nextSlug : prevSlug; // contrario
      } else {
        return Math.random() < 0.5 ? prevSlug : nextSlug; // loca
      }
    }

    const mkBtn = (side /* 'left' | 'right' */) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `nav-arrow nav-arrow--${side}`;
      b.setAttribute(
        "aria-label",
        side === "left"
          ? "Ir a proyecto anterior o siguiente"
          : "Ir a proyecto siguiente o anterior"
      );

      const img = document.createElement("img");
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.src = "data/arrow.webp"; // flecha: ruta indicada por ti
      b.appendChild(img);

      if (side === "left") {
        b.addEventListener("click", () => {
          // IZQUIERDA — mapping pedido:
          // alta  → Home
          // baja  → Anterior
          // loca  → Random entre Anterior/Siguiente
          const tier = pickTier();
          if (tier === "alta") {
            location.href = `index.html`;
            return;
          }
          if (tier === "baja") {
            location.href = `${encodeURIComponent(prev)}/`;
            return;
          }
          // loca
          const target = Math.random() < 0.5 ? prev : next;
          location.href = `${encodeURIComponent(target)}/`;
        });
      } else {
        // DERECHA: se mantiene la lógica original (preferido, contrario, random)
        b.addEventListener("click", () => {
          const preferred = "next";
          const target = pickDest(preferred, prev, next);
          location.href = `${encodeURIComponent(target)}/`;
        });
      }
      return b;
    };

    // Evita duplicados de atajo About si venimos de otra render
    root.querySelectorAll(".about-shortcut").forEach(n => n.remove());

    section.appendChild(mkBtn("left"));
    // Crea el atajo About como elemento central
    const a = document.createElement("a");
    a.className = "about-shortcut";
    a.href = "about/";
    a.setAttribute("aria-label", "Ir a About");
    a.title = "About";
    const img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.src = "data/about.webp";
    a.appendChild(img);
    section.appendChild(a);
    // Y ahora la flecha derecha
    section.appendChild(mkBtn("right"));
    root.appendChild(section);
  } catch (e) {
    console.warn("Arrows setup skipped:", e);
  }
}
