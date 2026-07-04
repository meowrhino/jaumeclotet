# TODO — jaumeclotet (2025-09)

## ✅ Hecho recientemente
- Comodines: `width` con fracciones (`whole|half|third|fourth`) y normalización de sinónimos.
- Comodín `image` con `link` → abre en nueva pestaña; no dispara overlay.
- Comodín `credits` → segunda sección de créditos con el mismo render.
- Créditos: parser “markdown lite” (**bold**, *italic*, __underline__, `[texto](https://url)`), corrige `https: //`.
- Detección robusta de `Etiqueta:` (ignora `:` de `https://`).
- CSS ordenado: bloques por secciones; créditos en monoespaciada con síntesis de estilo.
- Galería: sombra en `.gal-img` y cierre con **Escape**.
- Navegación: flechas aleatorias con `PROB_ALTA/BAJA/LOCA`; izquierda rotada 180°.
- Deep‑link: `#id` hace scroll a comodines/elementos tras render.

## ⏭️ Próximos (alta prioridad)
- **Alt para galería**: permitir `alt` por imagen en `galeria.media` y caer en `""` si no hay.
- **srcset/sizes** para galería (mejora rendimiento en móvil).
- **Docs**: snippet de grid en el README para que dos `half` queden en fila.

## 🧰 Nice‑to‑have
- Flechas: navegación con teclado (←/→) y `aria-live` al cambiar de proyecto.
- Precarga de `prev/next` (logo + JSON) para transición más fluida.
- `robots.txt` y `sitemap.xml` cuando el mapa esté definitivo.
- OpenGraph/Twitter Cards por proyecto (título, sinopsis, imagen destacada).
- Service worker para cache estática simple (opcional).

## 🧪 Checklist de pruebas
- Créditos: varias líneas con etiquetas y con links/énfasis mezclados.
- Comodines: `image` con y sin `link` (las enlazadas abren en pestaña nueva).
- Galería: imágenes y vídeos alternados.
- Flechas: respetan `featured.json`; si el slug no está, no aparecen.
- Móvil iOS: permiso de giro y degradación a touch/auto.

## 📌 Decisiones
- Créditos en monoespaciada (look anterior) con síntesis para cursiva/peso.
- Enlaces siempre `target="_blank"` + `rel="noopener noreferrer"`.
- `width-*` en porcentaje (no px) para composición flexible.
