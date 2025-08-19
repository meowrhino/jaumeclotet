# TODO - Web Jaume Clotet

> Leyenda: **[x] Hecho** · **[~] En curso** · **[ ] Pendiente**

---

## 0) Preparación de proyecto
- [x] Estructura de carpetas (`/data/{slug}/img`, `/data/{slug}/media`, `/js`, `/css`)  
- [x] Archivos base: `index.html`, `projecte.html`, `css/style.css`, `js/main.js`, `js/proyecto.js`
- [x] Datos de navegación: `featured.json` con `destacados` + `secreto`
- [ ] (opcional) Script de validación de carpetas y JSON (lint)

> Nota: Este proyecto **no** usa `/data/proyectos.json` global, sino un **`/data/{slug}/project.json`** por proyecto y un `featured.json` para la home.

---

## 1) Pantalla principal (index.html)
- [x] Grid responsivo (2×3 en retrato, 3×2 en apaisado; 1×6 en móvil con scroll)
- [x] Tiles dinámicos desde `featured.json`
- [x] Fondo del tile: `fons.jpg` → si no, `bg` del `project.json`
- [x] Logo del tile: `titol.png`
- [x] Click navega a `projecte.html?slug=...`
- [x] Tracking de proyectos vistos (localStorage `proyecto-{slug}-visto`)
- [x] Desbloqueo del 7º: usa **slugs únicos** y muestra overlay con el link del secreto
- [x] Overlay del 7º **no bloqueante** (solo su `<a>` es clicable)
- [ ] (opcional) Animación de aparición del 7º (fade/rebote/partículas)
- [ ] (opcional) Preload de `titol.png`/fondos para suavizar cargas

---

## 2) Datos de proyecto (`data/{slug}/project.json`)
- [x] Esquema definido y documentado en `readme.md`
- [x] `bg` admite **color** o **imagen** (o `{color,image}`)
- [x] `logo` (cabecera del proyecto)
- [x] `textos` (array de párrafos)
- [x] `galeria.media` con **`image`** y **`video`** (intercalables) + compat `images`/`video(s)`
- [x] `creditos` como **string** (texto plano con `\n`)
- [x] `elemento_divertido.src` (fun)
- [x] `comodin[]` con anclas `place` (`after:header|textos|galeria`, `before:creditos`, `end`, `after:@id`, `append:#selector`) e `id`
- [ ] (opcional) `theme` por proyecto (`light|dark`)
- [ ] (opcional) Validación de JSON con esquema ligero

---

## 3) Página de proyecto (`projecte.html`)
- [x] Lee `slug` por querystring
- [x] Carga `project.json`, normaliza rutas (img → `/img/`, video → `/media/`)
- [x] `<title>` dinámico (`titulo` o `slug`)
- [x] **Favicon** = `elemento_divertido.src` (si existe) → fallback `logo`
- [x] Render header (logo + sinopsis)
- [x] Render textos (`<p>` por entrada)
- [x] Render galería **vertical** (img + vídeo)
- [x] Overlay unificado (img + vídeo), también para `comodin`
- [x] Render créditos (string → `<pre>`)
- [x] `localStorage` marca proyecto como visto
- [x] Botón de permiso iOS para giroscopio (cuando aplica)
- [ ] (opcional) Botón “volver” persistente (si se requiere)
- [ ] (opcional) Tema por proyecto aplicado a `#project-root`

---

## 4) Elemento divertido (“fun”)
### Motor y configuración
- [x] Constantes **compartidas** `FUN_CFG` (lerp, umbrales, auto-velocidades)
- [x] Motor común `makeFunMover()` (interpolación, random-walk, rebotes, loop)

### Desktop
- [x] Sigue el **ratón**
- [x] Si el ratón queda **quieto 1s** → **auto-animación suave** (random-walk)
- [x] **Auto ON** desde el inicio (sale del auto al mover ratón)
- [ ] (opcional) Suavizar aún más velocidad máxima por proyecto

### Móvil
- [x] **Auto ON** desde el inicio
- [x] Si llega **giro válido** (|β|>0.5° o |γ|>0.5°) → sigue giroscopio y apaga auto
- [x] Si no hay giro durante **1s** → vuelve a auto
- [x] **Touch/drag** siempre disponible (apaga auto mientras arrastras)
- [x] Botón iOS “Activar movimiento” con `DeviceOrientationEvent.requestPermission()`

### Refactor pendiente
- [ ] **Extraer** el motor a `js/fun.js` y **importarlo** en `proyecto.js`
- [ ] Reubicar constantes `FUN_CFG` en `fun.js`
- [ ] Tests manuales (desktop/móvil) tras extracción

---

## 5) Detalles visuales/UX
- [x] Unificación de `style.css` (eliminar bloques duplicados)
- [x] Galería vertical (sin scroll horizontal)
- [x] Overlay `.overlay .overlay-media` (img+video)
- [x] `#unlock7` con `pointer-events` correctos
- [ ] (opcional) Animaciones de hover/tiles (escala/sombra)
- [ ] (opcional) Transiciones entre páginas
- [ ] (opcional) Modo “tema oscuro” por proyecto

---

## 6) Extras y pulidos
- [x] **README** completo (instalación, estructura, JSON, flujos)  
- [ ] Metadata SEO (title/description por proyecto, Open Graph, Twitter cards)
- [ ] Accesibilidad: `alt` descriptivos en galería (hoy blank), contraste
- [ ] Preload/decoding de imágenes clave (`decoding="async"`, `fetchpriority`)
- [ ] Lazy en vídeos (`preload="metadata"`, `loading="lazy"` donde aplique)

---

## 7) Arquitectura / Refactor
- [x] **ES Modules**: `assets.js` compartido; `main.js`/`proyecto.js` lo importan
- [x] `assets.js`: `normalizeImgPath`, `getBackground`, `isCssColor`, etc.
- [x] `proyecto.js`: rutas normalizadas, overlay unificado, comodines con anclas
- [x] `main.js`: desbloqueo con **Set** (slugs únicos), overlay secreto
- [ ] **Extraer `fun.js`** (motor) e importar (ver sección 4)
- [ ] (opcional) `utils/dom.js` para helpers (`el()`, `html()`, etc.)

---

## 8) Documentación
- [x] `readme.md` (guía completa + FAQ)
- [x] Instrucciones de DevTools → Sensors para simular giroscopio
- [ ] (opcional) `CONTRIBUTING.md` con convenciones y estilo
- [ ] (opcional) Plantilla `project.json` como archivo aparte

---

## 9) QA / Checklist de publicación
- [x] Navegar home → proyectos y volver
- [x] Desbloqueo 7º tras visitar todos (limpiando `localStorage` para probar)
- [x] Galería: ampliación img+video (incluye `comodin`)
- [x] “Fun” en desktop y móvil (idle → auto; actividad → seguimiento)
- [x] Favicon dinámico (fun o logo)
- [ ] Comprobar proyectos con fondo **oscuro** (añadir `theme` si hace falta)
- [ ] Pasar auditoría rápida (Lighthouse) y ajustar

---

## 10) Tareas nuevas detectadas hoy
- [ ] Extraer motor del “fun” a **`js/fun.js`** e importarlo en `proyecto.js`
- [ ] Añadir **logger de modo** (chip o consola): `desktop/móvil | auto/gyro | drag`
- [ ] Añadir `theme` por proyecto y clases CSS asociadas
- [ ] (opcional) Param de depuración `?force=mobile` (si no se mantiene)
- [ ] (opcional) Mini validador de `project.json` con mensajes claros en consola

---

## 11) Hecho hoy (resumen)
- Limpieza grande de `style.css` (duplicados fuera; overlay y galería vertical unificados)
- `project.json`: **créditos texto**, **vídeos en galería**, **comodín** con anclas e `id`
- `proyecto.js`: título dinámico + **favicon = fun**
- Elemento “fun”: **motor compartido**, **auto** ↔ **ratón/gyro** con watchdog
- README en **Markdown** y entrega como archivo descargable






uy me imprime todo esto la consola cuando abro el index en live server eh assets.js:9 
 HEAD http://127.0.0.1:5500/data/cantautot/fons.jpg net::ERR_ABORTED 404 (Not Found)
assets.js:9 
 HEAD http://127.0.0.1:5500/data/cantautot/img/fons.jpg net::ERR_ABORTED 404 (Not Found)
assets.js:9 
 HEAD http://127.0.0.1:5500/data/cantautot/titol.png net::ERR_ABORTED 404 (Not Found)
assets.js:9 
 HEAD http://127.0.0.1:5500/data/newywork/fons.jpg net::ERR_ABORTED 404 (Not Found)
assets.js:9 
 HEAD http://127.0.0.1:5500/data/newywork/img/fons.jpg net::ERR_ABORTED 404 (Not Found)
assets.js:9 
 HEAD http://127.0.0.1:5500/data/newywork/titol.png net::ERR_ABORTED 404 (Not Found)
assets.js:9 
 HEAD http://127.0.0.1:5500/data/alusinasons/fons.jpg net::ERR_ABORTED 404 (Not Found)
assets.js:9 
 HEAD http://127.0.0.1:5500/data/alusinasons/titol.png net::ERR_ABORTED 404 (Not Found)
assets.js:9 
 HEAD http://127.0.0.1:5500/data/cantautot/fons.jpg net::ERR_ABORTED 404 (Not Found)
assets.js:9 
 HEAD http://127.0.0.1:5500/data/cantautot/img/fons.jpg net::ERR_ABORTED 404 (Not Found)
assets.js:9 
 HEAD http://127.0.0.1:5500/data/cantautot/titol.png 404 (Not Found)
assets.js:9 
 HEAD http://127.0.0.1:5500/data/newywork/fons.jpg 404 (Not Found)
assets.js:9 
 HEAD http://127.0.0.1:5500/data/newywork/img/fons.jpg net::ERR_ABORTED 404 (Not Found)
assets.js:9 
 HEAD http://127.0.0.1:5500/data/newywork/titol.png net::ERR_ABORTED 404 (Not Found)
assets.js:9 
 HEAD http://127.0.0.1:5500/data/alusinasons/titol.png net::ERR_ABORTED 404 (Not Found)
﻿
 que crees que le esta pasando? estaba terminando de subir los datos de newywork