async function loadFeatured() {
  const res = await fetch("featured.json");
  const data = await res.json();
  const grid = document.getElementById("projects-grid");

  const slugs = data.destacados.map((d) => d.slug);

  for (const slug of slugs) {
    const pjRes = await fetch(`data/${slug}/project.json`);
    if (!pjRes.ok) continue;
    const pj = await pjRes.json();

    // RUTAS CORRECTAS: prefijo base del proyecto
    const base = `data/${slug}/`;
    const tile = document.createElement("div");
    tile.className = "tile";

    const bg = document.createElement("img");
    bg.className = "bg";
    bg.src = base + (pj.bg.startsWith("img/") ? pj.bg : "img/" + pj.bg);
    tile.appendChild(bg);

    const a = document.createElement("a");
    a.href = `projecte.html?slug=${encodeURIComponent(slug)}`;
    a.className = "logo-link";

    const logo = document.createElement("img");
    logo.className = "logo";
    logo.src = base + (pj.logo ? (pj.logo.replace(/^\.?\//, '').startsWith('img/') ? pj.logo.replace(/^\.?\//, '') : 'img/' + pj.logo.replace(/^\.?\//, '')) : '');
    logo.alt = pj.titulo || slug;
    a.appendChild(logo);

    tile.appendChild(a);
    grid.appendChild(tile);
  }

  checkUnlock(slugs);
}

function checkUnlock(slugs) {
  const allSeen = slugs.every(
    (s) => localStorage.getItem("proyecto-" + s + "-visto") === "1"
  );
  const overlay = document.getElementById("unlock7");
  if (allSeen) overlay.classList.add("show");
}

window.addEventListener("storage", () => {
  fetch("featured.json")
    .then((r) => r.json())
    .then((data) => checkUnlock(data.destacados.map((d) => d.slug)))
    .catch(() => {});
});

window.addEventListener("DOMContentLoaded", loadFeatured);
