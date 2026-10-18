// carga.js — llegeix data/site.json i projects/<slug>/project.json (house.js)
//
// Les pàgines que escriu el build porten data-built a <html>. Sense això és la
// vista prèvia (Live Server, sense build): cada JSON es revisa amb el seu
// esquema (schema/), com fa el build, i el que estigui malament surt a la
// pantalla, no a la consola.

import { featuredOf, toOld } from "./house.js";
import { validar } from "./validar.js";

const BUILT = document.documentElement.hasAttribute("data-built");
const cache = new Map();

async function getJSON(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(path, { cache: BUILT ? "default" : "no-store" }).then(async (res) => {
      if (!res.ok) throw new Error(`no trobo ${path}`);
      const text = await res.text();
      try { return JSON.parse(text); } catch (e) {
        showErrors([`${path} no és un JSON vàlid: gairebé sempre és una coma de més o de menys, o unes cometes sense tancar. (${e.message})`]);
        throw e;
      }
    }));
  }
  return cache.get(path);
}

async function check(data, type, path) {
  if (BUILT) return;
  const errors = validar(data, await getJSON(`schema/${type}.json`), path);
  if (errors.length) showErrors(errors);
}

function showErrors(errors) {
  let box = document.getElementById("errors-preview");
  if (!box) {
    box = document.createElement("pre");
    box.id = "errors-preview";
    box.style.cssText = "position:fixed;inset:0;z-index:99999;margin:0;padding:2rem;overflow:auto;white-space:pre-wrap;"
      + "background:#000;color:#fff;font:15px/1.5 monospace;";
    box.textContent = "Això no es publicaria:\n\n";
    document.body.append(box);
  }
  box.textContent += errors.map((e) => `✗ ${e}`).join("\n") + "\n";
  box.dataset.end = "Arregla-ho, desa, i la pàgina es recarrega sola.";
}

export async function getFeatured() {
  const site = await getJSON("data/site.json");
  await check(site, "site", "data/site.json");
  return featuredOf(site);
}

export async function getProject(slug) {
  const path = `projects/${slug}/project.json`;
  const p = await getJSON(path);
  await check(p, "project", path);
  return toOld(slug, p);
}

// L'adreça d'un projecte: /<slug>/ a la web construïda; a la vista prèvia,
// projecte.html?slug=<slug>, perquè les pàgines /<slug>/ només existeixen a dist/.
export const projectUrl = (slug) =>
  BUILT ? `${encodeURIComponent(slug)}/` : `projecte.html?slug=${encodeURIComponent(slug)}`;
