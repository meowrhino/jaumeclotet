# jaumeclotet — README (2025-09)

Guía rápida para mantener el sitio y publicar proyectos. Esta versión incluye **todas las updates recientes**: comodines con fracciones, créditos con “markdown lite”, flechas aleatorias, overlay con Escape, y créditos en monoespaciada.

---

## 1) Puesta en marcha (dev)
- Abre la carpeta en VS Code.
- Lanza **Live Server** y abre `index.html`.
- Navega a proyectos con `projecte.html?slug=mi-slug`.

> Consejo: usa **hard reload** (Cmd/Ctrl‑Shift‑R) si no ves cambios de JS/CSS por caché.

---

## 2) Estructura
```
index.html
projecte.html
style.css

/js
  assets.js
  main.js
  proyecto.js

/data/{slug}/
  project.json
  img/           # imágenes (logo, galería, etc.)
  media/         # vídeos (opcional)
  titol.png      # logo del tile (home)
  fons.jpg       # fondo del tile (opcional)

featured.json    # orden de proyectos (home y flechas)
```

---

## 3) Home (`index.html` + `js/main.js`)
- Carga `featured.json` → pinta tiles con `titol.png` y fondo (`fons.jpg` o `bg` del JSON).
- **Desbloqueo**: al visitar todos los slugs únicos de `destacados`, aparece el overlay del proyecto secreto (clicable).

---

## 4) Página de proyecto (`projecte.html` + `js/proyecto.js`)

### 4.1 JSON mínimo (`data/{slug}/project.json`)
```json
{
  "titulo": "Nombre",
  "logo": "img/titol.png",
  "bg": "img/fons.jpg",
  "sinopsis": "Líneas\ncon\nsaltos",
  "textos": ["P1", "P2"],
  "galeria": {
    "media": [
      { "type":"image", "src":"img/1.jpg" },
      { "type":"video", "src":"media/clip.mp4", "poster":"img/poster.jpg" }
    ]
  },
  "creditos": "Direcció: Nom\nWeb: [site](https://ejemplo.com)",
  "elemento_divertido": { "src":"img/fun.png" },
  "comodin": []
}
```

### 4.2 Galería
- Soporta `image` y `video` en **un único array ordenado** `galeria.media`.
- Overlay al clic (imagen/vídeo). **ESC cierra**.

### 4.3 Créditos (string → HTML)
- Es un **string** con líneas separadas por `\n`.
- Si una línea empieza con `Etiqueta: …`, se renderiza como `<strong>Etiqueta:</strong> …`.
- **Markdown lite soportado** en cualquier parte:
  - Enlaces: `[texto](https://url)` → abre en nueva pestaña.
  - **Negrita**: `**así**`
  - *Cursiva*: `*así*` (se ve oblicua en monospace)
  - __Subrayado__: `__así__`
- También acepta `<a href="https://…">…</a>` si viene escapado desde JSON.
- El parser **ignora** el `:` dentro de `https://` (no lo toma como etiqueta).

**Estilos:** `.project-creditos` usa **monoespaciada**, con síntesis de cursiva/peso y subrayado claro.

### 4.4 Comodines
Bloques libres insertables en posiciones del layout.

**Tipos**
- `text` → `{ "text":"..."/"prose":["P1","P2"], "align":"left|center|right", "width":"whole|half|third|fourth" }`
- `image` → `{ "src":"img/...", "caption"?, "link"?, "align"?, "width"? }`  
  - `link` (string u objeto) envuelve la imagen en `<a target="_blank">…</a>` y **no** dispara el overlay (para respetar el enlace).
- `video` → `{ "src":"media/...", "poster"?, "muted"?, "loop"?, "autoplay"?, "align"?, "width"? }`
- `html` → `{ "raw":"<blockquote>…</blockquote>" }`
- `credits` → `{ "text":"Direcció: ...", "place":"before:creditos", "width":"half" }`

**Anchors `place`**
- `after:header`, `after:textos`, `after:galeria`
- `before:creditos`, `after:creditos`, `end`
- `after:@id` / `before:@id` (referencia otro comodín con `id`)
- `append:#selector`, `before:#selector`, `after:#selector`

**Anchura `width` (fracciones)**: `whole`=100%, `half`=50%, `third`=33.33%, `fourth`=25%.  
Sinónimos admitidos en JSON: `full|auto → whole`, `quarter → fourth`.

**Deep‑link a un comodín**
- Si pones `"id":"intro"`, puedes enlazar a `projecte.html?slug=mi-slug#intro` (scroll suave).

### 4.5 Navegación con flechas
- Al final del proyecto se inyecta `<section class="project-nav">` con **dos botones** (izq/der).  
- Cada clic decide destino **aleatorio** entre anterior/siguiente (wrap-around) con estas **probabilidades** compartidas (en `proyecto.js`):
  ```js
  const PROB_ALTA = 0.7; // preferido (izq=prev, der=next)
  const PROB_BAJA = 0.2; // contrario
  const PROB_LOCA = 0.1; // random puro
  ```
- La flecha izquierda está rotada 180° vía CSS.  
- Imagen de flecha: `data/arrow.png`.

---

## 5) CSS (resumen)
- **Comodines**: clases `.width-whole/half/third/fourth` (fracciones); responsive apila al 100% en ≤640px.
- **Créditos**: monoespaciada, soporte a `<strong>`, `<em>` (oblicua), `<u>`, enlaces subrayados.
- **Galería**: sombra sutil en imágenes `.gal-img`.
- **Flechas**: `.project-nav` + `.nav-arrow` con focus visible y rotación en la izquierda.

---

## 6) Consejos de contenido
- Optimiza imágenes (<= 2000px lado mayor, JPEG/WebP).  
- Usa `poster` en vídeos y `preload="metadata"` (ya está).  
- Rellena `sinopsis` con saltos `\n` o párrafos en blanco.

---

## 7) Cosas a vigilar (a futuro)
- Alt text para imágenes de galería (ahora es `alt=""`).
- OpenGraph/Twitter Cards por proyecto.
- `robots.txt` y `sitemap.xml` (cuando la estructura esté cerrada).
- `srcset/sizes` para galería.
- Accesibilidad extra: roles/aria en overlay, navegación con teclado entre medios.
- Preload de fuentes/pesos si usamos Spectral SC fuera de sinopsis.
