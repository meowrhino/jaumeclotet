// assets.js — helpers compartidos para home y proyecto (ESM)

const _projectCache = new Map();

export async function resolveAsset(slug, filenames) {
    for (const name of filenames) {
        const url = `data/${slug}/${name}`;
        try {
            const res = await fetch(url, { method: 'HEAD' });
            if (res.ok) return url;
        } catch (_) { }
    }
    return null;
}

export function isCssColor(str) {
    if (typeof str !== 'string') return false;
    const s = str.trim().toLowerCase();
    return s.startsWith('#') ||
        s.startsWith('rgb(') || s.startsWith('rgba(') ||
        s.startsWith('hsl(') || s.startsWith('hsla(') ||
        s.startsWith('oklch(') || s.startsWith('oklab(') ||
        s.startsWith('linear-gradient(') || s.startsWith('radial-gradient(') ||
        ['white', 'black', 'transparent', 'red', 'green', 'blue', 'yellow', 'magenta', 'cyan', 'orange', 'purple', 'gray', 'grey'].includes(s);
}

export function normalizeImgPath(slug, path) {
    if (!path) return null;
    let s = String(path).replace(/^\.?\//, ''); // quita ./ o /
    if (!s.startsWith('img/')) s = 'img/' + s;   // fuerza carpeta img/ por convención
    return `data/${slug}/${s}`;
}

export async function getProjectMeta(slug) {
    if (_projectCache.has(slug)) return _projectCache.get(slug);
    const res = await fetch(`data/${slug}/project.json`);
    if (!res.ok) throw new Error('project.json not found for ' + slug);
    const p = await res.json();
    validateProjectMeta(p, slug);
    _projectCache.set(slug, p);
    return p;
}

function validateProjectMeta(p, slug){
    if (!p) {
        console.warn(`[${slug}] project.json vacío o inválido`);
        return;
    }
    if (!p.titulo && !p.title) {
        console.warn(`[${slug}] Falta "titulo" en project.json`);
    }
    if (!p.sinopsis) {
        console.warn(`[${slug}] Falta "sinopsis" — se recomienda una breve descripción (para SEO)`);
    }
    if (p.galeria && !Array.isArray(p.galeria.media || []) && !Array.isArray(p.galeria.images || [])) {
        console.warn(`[${slug}] "galeria" no tiene media ni images en array`);
    }
    if (p.bg && typeof p.bg === 'string' && !isCssColor(p.bg) && !p.bg.startsWith('img/')) {
        console.warn(`[${slug}] bg parece ruta inválida o no empieza por img/ → ${p.bg}`);
    }
}

// Fondo para tiles/páginas: respeta lo declarado en project.json si existe;
// si no hay bg, cae al comodín fons.(webp|jpg) de la carpeta.
export async function getBackground(slug) {
    const headOk = async (url) => {
        try {
            const r = await fetch(url, { method: 'HEAD' });
            return r.ok;
        } catch (_) { return false; }
    };

    // 1) Respetar bg explícito del project.json (sin cambiar extensión)
    try {
        const p = await getProjectMeta(slug);
        if (p && Object.prototype.hasOwnProperty.call(p, 'bg')) {
            const bg = p.bg;
            if (typeof bg === 'string') {
                if (isCssColor(bg)) return { kind: 'color', value: bg };
                const url = normalizeImgPath(slug, bg);
                if (url && await headOk(url)) return { kind: 'image', value: url };
                return null; // había bg declarado, no hacemos auto-fallback
            } else if (bg && typeof bg === 'object') {
                if (bg.color && isCssColor(bg.color)) return { kind: 'color', value: bg.color };
                if (bg.image) {
                    const url = normalizeImgPath(slug, bg.image);
                    if (url && await headOk(url)) return { kind: 'image', value: url };
                }
                return null; // bg explícito pero no resolvible
            }
            return null; // bg presente pero vacío/invalid
        }
    } catch (_) { }

    // 2) Fallback si no hay bg en JSON: buscar fons.(webp|jpg)
    const fons = await resolveAsset(slug, ['fons.webp', 'img/fons.webp', 'fons.jpg', 'img/fons.jpg']);
    if (fons) return { kind: 'image', value: fons };

    return null;
}
