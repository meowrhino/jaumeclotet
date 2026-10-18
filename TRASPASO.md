# Traspaso: la versión nueva a la copia de Jaume

Jaume ya tiene su copia, `jaumeclotet/jaumeclotet`, que publica `jaumeclotet.com`
con GitHub Pages (*legacy*), y **la edita él** (28 commits suyos hasta el
2026-09-16). Tiene una Action que regenera las páginas `/<slug>/` y las
commitea en el repo; las páginas llevan las meta, pero el contenido lo pinta el
JS y Google lo ve vacío. Podemos escribir en su repo (no somos admin).

**Su contenido viene de su copia** (traído el 2026-10-18, también el código que
se tocó allí en septiembre: `vampirtistes`, `arrows.js`). Lo que haya cambiado
desde entonces hay que traerlo antes.

La nueva la publica su Cloudflare con Workers Builds; el DNS de
`jaumeclotet.com` ya está en Cloudflare. En su copia la Action de publicar no
corre (lleva `if: github.repository_owner == 'meowrhino'`) y el build, al no
estar en GitHub, publica en la raíz con el `url` de `site.json`.

Tiempo: unos 30 minutos, y un rato con él: **cambia cómo edita** (de `data/<slug>/`
con campos en castellano a `projects/<slug>/` con campos en inglés). Hablarlo antes.

## Antes

- [ ] `main` de meowrhino al día y sin cambios a medias (`git status` limpio).
- [ ] ¿Ha tocado algo Jaume en su copia desde el 2026-10-18 (cuando se trajo su contenido; su último commit era del 2026-09-16)?
      `gh api repos/jaumeclotet/jaumeclotet/commits --jq '.[0:3][].commit.message'`. Si sí, pasar
      sus cambios aquí antes de seguir (`data/<slug>/project.json` → `projects/<slug>/project.json`, campos en inglés; `featured.json` → `data/site.json`).
- [ ] El DNS de `jaumeclotet.com` está en Cloudflare (`*.ns.cloudflare.com`). Mirar **en
      qué cuenta**: tiene que ser la de Jaume.

## 1. La versión nueva, en una rama de su copia

Las dos copias no comparten historia. Se sube a una rama aparte para que su web
siga igual mientras se prepara Cloudflare:

- [ ] `git push https://github.com/jaumeclotet/jaumeclotet.git main:receta`

## 2. Cloudflare (con Jaume, en su cuenta)

- [ ] **Workers & Pages → Create → Import a repository** → `jaumeclotet/jaumeclotet`, rama de
      producción **`receta`**. Lo demás lo lee de `wrangler.jsonc` (instala sharp con
      `npm install`, build `node build/build.mjs`, sale `dist/`).
- [ ] Mirar la web en su `*.workers.dev`: la home, un proyecto (`/cantautot/`: el fun, la
      galería, las flechas) y `/about/`.
- [ ] **Settings → Domains & Routes → Add → Custom domain**: `jaumeclotet.com` (y `www`).
      Cloudflare cambia los registros que apuntaban a GitHub Pages.

## 3. `main` pasa a ser la versión nueva

- [ ] Guardar la de antes: `git push https://github.com/jaumeclotet/jaumeclotet.git <sha-de-su-main>:refs/heads/antes`.
- [ ] `git push --force-with-lease=main:<sha-de-su-main> https://github.com/jaumeclotet/jaumeclotet.git main`
      (desde nuestra `main`).
- [ ] En Cloudflare, rama de producción → **`main`**. Borrar la rama `receta`.
- [ ] Jaume, en su repo: Settings → Pages → **Unpublish site** (ya no sirve nada).

## 4. Que nos deje entrar en Cloudflare

- [ ] Manage account → Members → nos invita. Ahí se ve el error entero de un build que falla.

## 5. Comprobar en su dominio

- [ ] La home, un proyecto y `/about/`.
- [ ] `view-source:` de un proyecto: la sinopsis, el texto y los créditos están en el HTML (antes, vacío).
- [ ] `view-source:`: `canonical` y `og:url` con `jaumeclotet.com`, y **sin**
      `<meta name="robots" content="noindex">`.
- [ ] `/robots.txt` dice `Allow` y `/sitemap.xml` tiene las direcciones de su dominio.
- [ ] Compartir un proyecto por WhatsApp: sale su fondo (la og).

## 6. Search Console, con su cuenta de Google

- [ ] Dar de alta el dominio (el registro TXT, en el DNS de Cloudflare) y enviar `sitemap.xml`.

## 7. Jaume en su ordenador

Con él delante, siguiendo [GUIA.md](GUIA.md) ("La primera vegada"):

- [ ] Clona **su** repositorio, no el de meowrhino (si ya lo tenía, **Sincronizar**: la
      estructura cambia entera).
- [ ] Live Server: **Go Live** y ve la vista previa.
- [ ] Un cambio pequeño (una coma en el about), Confirmar → Sincronizar, y la bolita verde.

## 8. Al acabar

- [ ] Fila de jaumeclotet en `JAMstack/inventario.md` con las dos direcciones (github.io y su dominio).
- [ ] La copia de meowrhino sigue en github.io con `noindex`: no compite en Google.
