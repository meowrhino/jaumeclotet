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
    String(path).replace(/^\.?\//, '');
    if (!s.startsWith('img/')) s = 'img/' + s;
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

// Fondo para tiles/páginas: imagen o color
export async function getBackground(slug) {
    // 1) intentar fons.jpg / img/fons.jpg
    const fons = await resolveAsset(slug, ['fons.jpg', 'img/fons.jpg']);
    if (fons) return { kind: 'image', value: fons };

    // 2) mirar project.json
    try {
        const p = await getProjectMeta(slug);
        const bg = p.bg;
        if (typeof bg === 'string') {
            if (isCssColor(bg)) return { kind: 'color', value: bg };
            const url = normalizeImgPath(slug, bg);
            if (url) return { kind: 'image', value: url };
        } else if (bg && typeof bg === 'object') {
            if (bg.color && isCssColor(bg.color)) return { kind: 'color', value: bg.color };
            if (bg.image) {
                const url = normalizeImgPath(slug, bg.image);
                if (url) return { kind: 'image', value: url };
            }
        }
    } catch (_) { }
    return null;
}
