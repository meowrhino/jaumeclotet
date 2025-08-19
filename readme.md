# jaumeclotet · README

Guía completa para entender, publicar y mantener el sitio.

- [Parte A — Publicar proyectos](#parte-a--publicar-proyectos)
  - [Requisitos y entorno local](#requisitos-y-entorno-local)
  - [Estructura de carpetas](#estructura-de-carpetas)
  - [Cómo funciona la Home](#cómo-funciona-la-home)
  - [Añadir un proyecto nuevo (paso a paso)](#añadir-un-proyecto-nuevo-paso-a-paso)
  - [Plantilla y campos de `project.json`](#plantilla-y-campos-de-projectjson)
  - [Bloques “comodín”](#bloques-comodín)
- [Parte B — Mantenimiento / Dev](#parte-b--mantenimiento--dev)
  - [Tecnologías y arquitectura](#tecnologías-y-arquitectura)
  - [Scripts: qué hace cada uno](#scripts-qué-hace-cada-uno)
  - [CSS: resumen de clases](#css-resumen-de-clases)
  - [Depurar y probar](#depurar-y-probar)
  - [Checklist de publicación](#checklist-de-publicación)
  - [FAQ](#faq)
  - [Decisiones clave](#decisiones-clave)

---

## Parte A — Publicar proyectos

### Requisitos y entorno local

- **VS Code** (o tu editor favorito).
- Extensión **Live Server** (sirve la web en `http://localhost:PORT`).
- Abre la carpeta del proyecto en VS Code → botón **“Go Live”** → abre `index.html`.

> **iOS**: para que funcione el giroscopio, mejor en **HTTPS** (producción) o **localhost** (dev). Safari pedirá permiso la primera vez.

---

### Estructura de carpetas

```
index.html                 # Home (grid 6)
projecte.html              # Página de proyecto

/js
  assets.js                # utilidades compartidas (ES modules)
  main.js                  # lógica de la home
  proyecto.js              # lógica de la página de proyecto

/data
  {slug}/
    project.json           # ficha del proyecto
    img/                   # imágenes (logo, galería, etc.)
    media/                 # vídeos u otros (opcional)
    titol.png              # logo del tile de la home (obligatorio)
    fons.jpg               # fondo del tile (opcional; ver "bg")

featured.json              # lista de proyectos destacados + "secreto"
style.css                  # estilos (home + proyecto)
```

---

### Cómo funciona la Home

Carga `featured.json`:

```json
{
  "destacados": [{ "slug": "alusinasons" }, { "slug": "cantautot" }],
  "secreto": { "slug": "..." }
}
```

Para cada `slug` crea un **tile**:

- **Fondo**: intenta `data/{slug}/fons.jpg`. Si no existe, abre `data/{slug}/project.json` y usa `bg` (color o imagen).
- **Logo del tile**: `data/{slug}/titol.png` (archivo físico).
- Enlace a `projecte.html?slug={slug}`.

**Desbloqueo 7º**: cuando todos los **slugs únicos** de `destacados` se han visitado (cada página de proyecto guarda `localStorage["proyecto-{slug}-visto"]="1"`), aparece un overlay con el **logo del `secreto.slug`**. La capa **no bloquea** la home; solo su `<a>` es clicable.

---

### Añadir un proyecto nuevo (paso a paso)

1. Crea `/data/mi-slug/` y dentro `img/` (y opcional `media/`).
2. Añade **`titol.png`** (logo del tile en la home).
3. (Opcional) **`fons.jpg`** si quieres fijar la imagen de fondo del tile.
4. Crea **`project.json`** (usa la plantilla de abajo).
5. En `featured.json` añade `{"slug":"mi-slug"}` dentro de `destacados` (decide si va como `secreto.slug` también).
6. Abre la home y la página del proyecto para comprobar todo.

---

### Plantilla y campos de `project.json`

#### Plantilla mínima

```json
{
  "titulo": "Nombre del proyecto",
  "sinopsis": "Texto corto bajo el logo.",

  "bg": "white",
  // alternativas:
  // "bg": "fondo.jpg"
  // "bg": { "color": "#ffffff", "image": "fondo.jpg" }

  "logo": "img/logo-portada.png",

  "textos": [
    "Párrafo 1…",
    "Párrafo 2…"
  ],

  "galeria": {
    "media": [
      { "type": "image", "src": "img/foto1.jpg" },
      { "type": "video", "src": "media/clip1.mp4", "poster": "img/clip1-poster.jpg" },
      { "type": "image", "src": "img/foto2.jpg" }
    ]
    /* Compatibilidad rápida (sin control de orden):
    "images": ["img/foto1.jpg", "img/foto2.jpg"],
    "video":  ["media/clip1.mp4"]
    */
  },

  "creditos": "Dirección: ...\\nProducción: ...\\n…",

  "elemento_divertido": { "src": "img/fun.png" },

  "comodin": [
    { "id": "intro", "place": "after:textos", "type": "text", "prose": ["Bloque libre con uno o varios párrafos."] },
    { "place": "after:@intro", "type": "image", "src": "img/extra.jpg", "caption": "Leyenda opcional" },
    { "place": "before:creditos", "type": "video", "src": "media/extra.mp4", "poster": "img/extra-poster.jpg" }
  ]
}
```

#### Significado de cada campo

- **`titulo`** → `<title>` de la página y `alt` del logo de cabecera.
- **`sinopsis`** → texto centrado bajo el logo.
- **`bg`**:
  - **Color** (p.ej. `"white"`, `"#fafafa"`, `"rgb(...)"`, `"linear-gradient(...)"`) → fondo CSS.
  - **Imagen** (p.ej. `"fondo.jpg"`) → `<img>` fijo a pantalla completa.
  - **Objeto** `{ "color": "...", "image": "..." }` → combina ambos.
  - En la **home**, si existe `fons.jpg` se prioriza; si no, usa `bg`.
- **`logo`** → imagen de cabecera de la página del proyecto (no confundir con `titol.png` del tile).
- **`textos`** → array de párrafos (cada string se renderiza como `<p>`).
- **`galeria.media`** → lista ordenada de `image`/`video` (permite intercalar).  
  `video` admite `poster`, y todos se amplían con overlay.
- **`creditos`** → **string** (se muestra dentro de `<pre>`; usa `\n` para saltos de línea).
- **`elemento_divertido.src`** → imagen del “fun” (pegatina que se mueve):
  - **Desktop**: sigue al **ratón**.
  - **Móvil**: **giroscopio** (si hay permiso) → si no, **drag** → si no hay giro durante **1 s**, **auto-animación suave**.
- **`comodin`** → bloques libres insertados donde quieras (ver siguiente sección).

---

### Bloques “comodín”

Permiten insertar contenido **extra** en posiciones concretas de la página, en el **orden** del array.

**Tipos soportados**

- `text` → `{ "prose": ["P1","P2"], "align":"center|left|right", "width":"auto|half|full" }`
- `image` → `{ "src":"img/...", "caption"?, "align"?, "width"?, }`
- `video` → `{ "src":"media/...", "poster"?, "muted"?, "loop"?, "autoplay"?, "align"?, "width"? }`
- `html` *(opcional)* → `{ "raw":"<blockquote>…</blockquote>" }`

**`place`** (anclas de inserción)

- `after:header`, `after:textos`, `after:galeria`
- `before:creditos`, `after:creditos`
- `end` (al final del `#project-root`)
- `after:@id` / `before:@id` (posicionar relativo a *otro* comodín con ese `id`)
- `append:#selector` (avanzado; inserta dentro del selector)

> **Rutas**: imágenes se normalizan a `data/{slug}/img/...`; vídeos **no** se fuerzan a `/img` (pueden ir en `media/`). Evita URLs externas.

---

## Parte B — Mantenimiento / Dev

### Tecnologías y arquitectura

- **Sitio estático** (HTML/CSS/JS).
- **ES Modules**: `main.js` y `proyecto.js` importan `./js/assets.js` con `<script type="module">`.
- **localStorage**: marca proyectos visitados (para el desbloqueo).
- **CSS**: grid en home, galería vertical en proyecto, overlay unificado (imagen y vídeo).

---

### Scripts: qué hace cada uno

#### `js/assets.js` (módulo compartido)

- `resolveAsset(slug, filenames)` → hace `HEAD` y devuelve la primera URL existente.
- `isCssColor(str)` → heurística para colores/gradientes CSS.
- `normalizeImgPath(slug, path)` → normaliza a `data/{slug}/img/...`.
- `getProjectMeta(slug)` → carga y **cachea** `project.json`.
- `getBackground(slug)` → `{ kind: 'image'|'color', value }` para el tile.

#### `js/main.js` (Home)

- Carga `featured.json`.
- Construye tiles (fondo via `getBackground`, logo `titol.png`).
- `checkUnlock(slugs, specialSlug)` → usa **slugs únicos**; si todos vistos → muestra `#unlock7` con link al secreto.

#### `js/proyecto.js` (Página de proyecto)

- `loadProject()` → carga `project.json`, **normaliza rutas**, **pone `<title>` y favicon** (usa `elemento_divertido.src` si existe), renderiza, guarda `visto=1`.
- `normalizePaths(p, base)`:
  - `bg`: color/imagen/objeto.
  - `galeria.media` preferente; compat `images` + `video/videos`.
  - `comodin[]`: normaliza imágenes/vídeos y valida `align/width`.
- `renderProject(p)`:
  - Fondo, header, textos, galería vertical, créditos, fun.
  - `setupGalleryOverlay()` (overlay para **img + vídeo**).
  - `renderComodines(p.comodin)` (inserción por `place`) + **refresh** del overlay.
- **“Fun”**:
  - Desktop: `setupFunFollower()` (ratón).
  - Móvil: `setupFunFollowerGyro()`  
    - **Auto** (random-walk lento) **desde el inicio**.  
    - Si llega giro válido (|β|>0.5° o |γ|>0.5°), **sigue el sensor** y apaga auto.  
    - Si en **1 s** no hay giro, **vuelve a auto**.  
    - **Touch/drag** siempre disponible (apaga auto mientras arrastras).
  - Ajustables: `LERP`, `GYRO_MIN_DEG`, `GYRO_IDLE_MS`, `AUTO_*` (velocidad, intervalos, márgenes).

---

### CSS: resumen de clases

- **Home**: `.grid`, `.tile`, `.logo`, `#unlock7`.
- **Proyecto**:
  - Fondo: `.project-bg` (+ var `--bg-color`).
  - Cabecera: `.project-header`, `.project-logo`, `.project-sinopsis`.
  - Texto: `.project-textos p`.
  - Galería: `.project-galeria.column`, `.gal-img`, `.gal-video`.
  - Overlay: `.overlay` + `.overlay-media`.
  - Fun: `.fun` (+ `.touchable` para permitir drag en móvil).
  - Comodín: `.comodin`, `.comodin-image img`, `.comodin-video video`, `figcaption`, y helpers de `align-*/width-*`.

---

### Depurar y probar

- **Simular giroscopio**: Chrome DevTools → **More tools → Sensors** → **Orientation: Custom** → mueve **β/γ**.
- **Auto ↔ gyro**: el fun empieza **auto**. Si recibes giro válido, **sigue el giro**; si no hay giro durante **1 s**, vuelve a **auto**.
- **Forzar “modo móvil”** (opcional para depurar): añade un helper `isForcedMobile()` y activa el flujo móvil con `?force=mobile`.
- **Limpiar desbloqueo**:

```js
Object.keys(localStorage)
  .filter(k => k.startsWith('proyecto-'))
  .forEach(k => localStorage.removeItem(k));
```

- **Overlay**: si algo no se amplía, revisa que el selector incluya `.project-galeria` **y** `.comodin`.

---

### Checklist de publicación

- [ ] `/data/{slug}/img` con imágenes y **`titol.png`**.
- [ ] `project.json` válido (usa un validador si hace falta).
- [ ] Fondo del tile: **`fons.jpg`** o `bg` en el JSON.
- [ ] Vídeos en `/media/` con `poster` si es posible.
- [ ] Probar en **móvil real** (iOS pedirá permiso de movimiento).
- [ ] Probar overlay (galería + comodines).
- [ ] Verificar desbloqueo (limpiar `localStorage` y navegar).

---

### FAQ

- **El tile sale negro** → No hay `fons.jpg` ni `bg` válido. Añade uno de los dos.  
- **El 7º se desbloquea demasiado pronto** → Había slugs repetidos; ahora se usa `Set`. Limpia `localStorage` por si acaso.  
- **El fun no se mueve en móvil** → iOS: falta permiso (botón *Activar movimiento*). Android: puede tardar ~1 s en emitir; si no, drag/auto.  
- **Un vídeo no se amplía** → Asegúrate de usar `type:"video"` (galería o comodín) y formato compatible (ideal `.mp4` H.264/AAC).

---

### Decisiones clave

- **ES Modules** (sin bundler).  
- **Créditos** siempre **texto** (string → `<pre>`).  
- **Galería vertical** y **overlay** unificado (img + vídeo).  
- **Fondo** por `bg` (color/imagen); la home prioriza `fons.jpg`.  
- **Comodín** con anclas (`place`) e `id` para encadenar.  
- **Fun** con watchdog (**gyro ↔ auto**) + **touch**.
