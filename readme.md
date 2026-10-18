# jaumeclotet — README (2026-10)

Guía rápida para nosotros (`main.js`, `proyecto.js` + módulos, `secreto.js`). Sigue la receta de [meowrhino/JAMstack](https://github.com/meowrhino/JAMstack) desde el 2026-10-18. Para Jaume: [GUIA.md](GUIA.md). Traspaso: [TRASPASO.md](TRASPASO.md). Si el build falla: [CLAUDE.md](CLAUDE.md).

---

## 1) Puesta en marcha
- **Vista previa**: Live Server sobre la carpeta → `index.html`. Un proyecto se ve en `projecte.html?slug=mi-slug` (las páginas `/mi-slug/` solo existen en `dist/`). Sin `data-built` en `<html>`, `js/carga.js` revisa los JSON con `schema/` y enseña los errores en pantalla.
- **Build**: `npm ci && node build/build.mjs` → `dist/` (no se commitea): la home y `/<slug>/` con su contenido dentro, og 1200×630 con sharp, sitemap y robots.
- **Publicar**: la Action (`deploy.yml`, solo en `meowrhino`) a `meowrhino.github.io/jaumeclotet/` sin indexar; la copia de Jaume, Workers Builds (`wrangler.jsonc`).

---

## 2) Estructura
```
index.html, projecte.html, 404.html, style.css   # plantillas y estilos
fonts/            # Spectral SC en woff2 (sin Google Fonts)
build/build.mjs   # → dist/
schema/           # qué campos lleva cada JSON (VS Code, el build y la vista previa)

/js
  house.js    # la forma de la casa → la de antes (titulo, sinopsis, galeria…, featured.json)
  carga.js    # lee data/site.json y projects/<slug>/project.json; projectUrl()
  validar.js  # el JSON Schema sin dependencias (de JAMstack)
  assets.js, main.js, proyecto.js, secreto.js, /proyecto/*   # como antes

data/site.json    # "lists.featured": los proyectos de la home, en orden
data/             # logo, flecha, about.webp y 0_secret/
/projects/{slug}/
  project.json    # title, logo, bg, synopsis, fun, text, gallery, credits, extras
  img/            # logos, galería, fun…
  media/          # vídeos (opcional)
```

---

## 3) Home (`index.html` + `js/main.js`)
- Lee `data/site.json` → `lists.featured` (vía `carga.js`) y crea 6 tiles en un grid **3x2** (2x3 en retrato, 1x6 en móvil).
- Fondo del tile: prioridad `project.json.bg` (color o imagen); si no existe, fallback a `fons.webp/jpg` de la carpeta. El primer tile se pinta al instante; los demás cargan el fondo con **IntersectionObserver** (rootMargin 300px).
- Logos: intenta `titol.webp` → `img/titol.webp` → `titol.png` → `img/titol.png`. El primero va `eager` con `fetchPriority=high`; el resto `lazy`.
- Clic en tile → `/{slug}/`. El orden es el de `lists.featured` en `data/site.json` (reutilizado por las flechas).
- Cada proyecto visitado marca `localStorage["proyecto-"+slug+"-visto"]="1"`; el fantasma secreto usa este estado.

---

## 4) Datos de proyecto (`projecte.html` + `js/proyecto.js` + `js/proyecto/*.js`)

### 4.1 JSON base (`projects/{slug}/project.json`)
```json
{
  "slug": "mi-slug",
  "titulo": "Nombre",
  "logo": "img/titol.webp",
  "bg": { "color": "#0b0b0b", "image": "img/fons.webp" },   // también vale string "img/fons.jpg" o "#111"
  "sinopsis": "Líneas\ncon\nsaltos",
  "textos": ["Párrafo 1", "Párrafo 2"],
  "galeria": {
    "media": [
      { "type": "image", "src": "img/1.jpg" },
      { "type": "video", "src": "media/clip.mp4", "poster": "img/poster.jpg" }
    ]
  },
  "creditos": "Dirección: Nombre\nWeb: [site](https://ejemplo.com)",
  "elemento_divertido": { "src": "img/fun.png" },
  "comodin": []
}
```

### 4.2 Fondo, título y meta
- `bg` acepta color CSS o imagen; también objeto `{color, image}`. Si no hay `bg`, se busca `fons.webp/jpg` en la carpeta.
- El color se inyecta como `--bg-color`; la imagen se coloca en `.project-bg` fija al fondo.
- El `<title>` usa `titulo` o el slug. El favicon intenta `elemento_divertido.src`; si no hay, usa `logo` (si no es color).

### 4.3 Sinopsis y textos
- Sinopsis: string con `\n`; separa párrafos por líneas en blanco y dentro convierte `\n` en `<br>`. Va con Spectral SC en mayúsculas.
- `textos`: array de párrafos. Soporta markdown ligero (enlaces, **negrita**, *cursiva*, __subrayado__) y `\n` → `<br>`.

### 4.4 Galería
- Preferido: `galeria.media` con items `{type:"image"|"video", src, poster?}`. Compat: `galeria.images` (array) y `galeria.video|videos` (array) se fusionan detrás.
- Imágenes fuerzan prefijo `img/`; vídeos no. Rutas se normalizan con base `projects/{slug}/`.
- Render: `<img loading="lazy" decoding="async">` con sombra; `<video controls playsinline preload="metadata">` (+ `poster` si viene).
- **Sin overlay**: no hay pantalla completa custom al hacer clic; el navegador hace lo nativo (p.ej. abrir controles del vídeo en el propio reproductor).

### 4.5 Créditos (string → HTML)
- Acepta string o `{ contenido: "..." }`. Separa por líneas. Si una línea empieza por `Etiqueta: resto`, la etiqueta va en `<strong>`.
- Markdown ligero en cualquier línea: `[texto](https://url|mailto:...)`, **negrita**, *cursiva*, __subrayado__, o `<a href="https://…">…</a>` escapado. Los `https://` no rompen la detección de etiquetas.
- Se pinta en monoespaciada (`font-synthesis` activa cursiva/peso). Links subrayados; `alt` vacío.

### 4.6 Elemento divertido (`elemento_divertido`)
- Si trae `src`, se muestra como `#fun` fijo. En desktop sigue el ratón y entra en **auto-movimiento** aleatorio tras 1s de inactividad (arranca ya en auto).
- En móvil/tablet: giroscopio (pide permiso en iOS) + drag; si no hay señal 1s pasa a auto. Pointer-events se activan con `.touchable`.

### 4.7 Comodines
- Tipos soportados:
  - `text` → `{ text:"...", prose:["P1","P2"], align?, width? }`
  - `image` → `{ src:"img/...", caption?, link?(string|{href}), align?, width? }` (si hay `link`, no participa en overlay y abre en nueva pestaña).
  - `video` → `{ src:"media/...", poster?, muted?, loop?, autoplay?, align?, width? }`
  - `html` → `{ raw:"<blockquote>...</blockquote>" }`
  - `credits` → `{ text|creditos|contenido:"...", place?, width?, align? }`
- `place`: `after:header`, `after:textos`, `after:galeria`, `before:creditos`, `after:creditos`, `end`, `after:@id`/`before:@id` (otro comodín) o `append:#selector`/`before:#selector`/`after:#selector` (selector CSS). Por defecto se añaden al final de `#project-root`.
- `width`: `whole` (defecto), `half`, `third`, `fourth`. Sinónimos aceptados: `full|auto → whole`, `quarter → fourth`. En ≤640px todo se apila al 100%.
- `align`: `left|center|right` (otros valores se ignoran). El `id` solo sirve para referenciar con `@id` (no hace ancla/scroll).

---

## 5) Navegación con flechas
- Orden sacado de `data/site.json` → `lists.featured` (vía `carga.js`). Si el slug no está o hay <2 proyectos, no se pintan.
- Probabilidades: `PROB_ALTA=0.7`, `PROB_BAJA=0.2`, `PROB_LOCA=0.1`.
  - Flecha **izquierda**: alta → **Home**, baja → anterior, loca → random entre anterior/siguiente.
  - Flecha **derecha**: alta → siguiente, baja → anterior, loca → random entre anterior/siguiente.
- El raster es `data/arrow.webp`; la izquierda rota 180° vía CSS. Se insertan al final de la página y entre ellas aparece un botón About (usa `data/about.webp`).
- Caso especial `slug=about`: solo hay flecha izquierda a Home y se añade un badge con `web: meowrhino` al final.

---

## 6) Fantasma secreto (`js/secreto.js`)
- Corre en home y proyectos. Comprueba si **todos** los slugs de `data/site.json` → `lists.featured` (vía `carga.js`) tienen `localStorage["proyecto-"+slug+"-visto"]="1"`.
- Si se cumplen, monta un fantasma (`data/0_secret/img/ghost0-6.webp`, fallback `.png`) fijo abajo-derecha. El tamaño se puede forzar con `window.SECRET_GHOST_SIZE = 'clamp(...)'` o `data-ghost-size` en `<body>`.
- Se queda quieto hasta la primera interacción; luego flota moviéndose. Clic → anima un “dado”, muestra cara 1..6 y abre en nueva pestaña la URL mapeada en `data/0_secret/secreto.json`.
- Rechequea en el evento `storage` por si desbloqueas en otra pestaña.

---

## 7) CSS y contenido
- Home: grid fluido, gap 4px, cuerpos negros; logos con drop-shadow.
- Proyectos: fondo fijo detrás (`.project-bg`), `#project-root` hasta 800px/80vw con padding 16px, sinopsis Spectral SC mayúscula, galería en columna con sombra suave, créditos monoespaciados, `about-shortcut` centrado bajo las flechas.
- Comodines tienen clases `.width-whole/half/third/fourth` y colapsan al 100% en móvil. Los links accesibles usan `outline` en focus.
- Consejos rápidos: imágenes <= 2000px lado mayor en JPEG/WebP; añade `poster` a vídeos, `preload="metadata"` ya está. Rellena `sinopsis` con saltos `\n` si necesitas cortes.
