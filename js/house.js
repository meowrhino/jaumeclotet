// house.js — el contingut a la manera de l'estudi (JAMstack) → el d'abans
//
// El contingut viu així: data/site.json (quins projectes surten a la home i en
// quin ordre, "lists") i cada projecte a projects/<slug>/project.json, amb les
// seves imatges a img/ i els vídeos a media/. Camps en anglès.
//
// La resta del JS segueix treballant amb la forma d'abans (titulo, sinopsis,
// galeria, comodin…, i featured.json); toOld() i featuredOf() passen d'una a
// l'altra. Ho fan servir el navegador (carga.js) i el build: sense DOM ni disc.

// "lists": { "featured": { "projects": [...] } } → ["alusinasons", …]
export const slugsOf = (site) => Object.values(site.lists || {}).flatMap((l) => l.projects || []);

// la forma de featured.json
export const featuredOf = (site) => ({ destacados: slugsOf(site).map((slug) => ({ slug })) });

export function toOld(slug, p) {
  const old = { slug, titulo: p.title };
  if (p.logo !== undefined) old.logo = p.logo;
  if (p.bg !== undefined) old.bg = p.bg;
  if (p.synopsis !== undefined) old.sinopsis = p.synopsis;
  if (p.fun) old.elemento_divertido = p.fun;
  if (p.text) old.textos = p.text;
  if (p.gallery) old.galeria = p.gallery;
  if (p.credits !== undefined) old.creditos = p.credits;
  if (p.extras) old.comodin = p.extras;
  return old;
}
