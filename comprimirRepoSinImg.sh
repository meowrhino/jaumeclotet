#!/usr/bin/env bash
# comprimirRepoSinImg.sh - versión corregida
# Empaqueta un proyecto en un ZIP excluyendo imágenes y binarios pesados.

set -euo pipefail

abort(){ echo "❌ $*" >&2; exit 1; }
human_date(){ date +"%Y%m%d-%H%M"; }

ORIG="${1:-.}"
OUT="${2:-}"
MODE="exclude"

for arg in "${@:3}"; do
  case "$arg" in
    --mode=exclude|--mode=stub|--mode=recompress) MODE="${arg#--mode=}";;
    *) abort "Parámetro no reconocido: $arg (usa --mode=exclude|stub|recompress)";;
  esac
done || true

[ -d "$ORIG" ] || abort "La carpeta origen no existe: $ORIG"
ORIG_ABS="$(cd "$ORIG" && pwd)"

if [ -z "${OUT:-}" ]; then
  base="$(basename "$ORIG_ABS")"
  OUT="$HOME/Desktop/${base}_src-$(human_date).zip"
fi

command -v rsync >/dev/null || abort "Necesitas rsync instalado."
command -v zip >/dev/null || abort "Necesitas 'zip' instalado."

TMP_DIR="$(mktemp -d)"
cleanup(){ [ -d "$TMP_DIR" ] && rm -rf "$TMP_DIR" || true; }
trap cleanup EXIT

echo "📦 Preparando copia en $TMP_DIR ..."
rsync -a   --delete   --chmod=Du+rwx,Fu+rw   --exclude ".git/"   --exclude ".svn/"   --exclude ".hg/"   --exclude ".DS_Store"   --exclude "node_modules/"   --exclude "dist/"   --exclude "build/"   --exclude ".next/"   --exclude ".cache/"   --exclude "coverage/"   --exclude ".venv/"   --exclude "venv/"   --exclude ".idea/"   --exclude ".vscode/"   --exclude "tmp/"   --exclude "logs/"   --exclude "*/img/**"   --exclude "*/images/**"   --exclude "*/assets/**"   "$ORIG_ABS"/ "$TMP_DIR"/

MULTI_EXTS=(
  jpg jpeg png gif webp svg heic heif tif tiff bmp ico
  psd ai eps indd pdf
  mp4 mov m4v avi mkv webm wav mp3 aac flac ogg
  raw arw cr2 cr3 nef orf rw2 raf dng
)

iname_clause=()
for e in "${MULTI_EXTS[@]}"; do
  iname_clause+=(-iname "*.${e}")
  iname_clause+=(-o)
done
unset 'iname_clause[${#iname_clause[@]}-1]'

echo "🚫 Tratando multimedia (${MODE})…"
case "$MODE" in
  exclude)
    [ ${#iname_clause[@]} -gt 0 ] && find "$TMP_DIR" -type f \( "${iname_clause[@]}" \) -delete
    ;;
  stub)
    [ ${#iname_clause[@]} -gt 0 ] && while IFS= read -r -d '' f; do : > "$f"; done < <(find "$TMP_DIR" -type f \( "${iname_clause[@]}" \) -print0)
    ;;
  recompress)
    command -v sips >/dev/null || echo "⚠️ sips no encontrado, solo excluyendo"
    if command -v sips >/dev/null; then
      while IFS= read -r -d '' f; do tmp="${f}.tmp.jpg"; sips -s format jpeg -s formatOptions 60 "$f" --out "$tmp" >/dev/null 2>&1 || true; [ -f "$tmp" ] && mv -f "$tmp" "$f"; done < <(find "$TMP_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" \) -print0)
      while IFS= read -r -d '' f; do tmp="${f}.tmp.png"; sips -s format png "$f" --out "$tmp" >/dev/null 2>&1 || true; [ -f "$tmp" ] && mv -f "$tmp" "$f"; done < <(find "$TMP_DIR" -type f -iname "*.png" -print0)
    fi
    [ ${#iname_clause[@]} -gt 0 ] && find "$TMP_DIR" -type f \( \( "${iname_clause[@]}" \) -a -not -iname "*.jpg" -a -not -iname "*.jpeg" -a -not -iname "*.png" \) -delete
    ;;
  *)
    abort "Modo no soportado: $MODE"
    ;;
esac

left_imgs=$(find "$TMP_DIR" -type f \( "${iname_clause[@]}" \) | wc -l | tr -d ' ')
echo "🔎 Archivos multimedia restantes en temp: $left_imgs"

mkdir -p "$(dirname "$OUT")"
echo "📦 Creando zip en $OUT ..."
( cd "$TMP_DIR" && zip -r -y -q "$OUT" . )

echo "✅ Listo: $OUT ($(stat -f%z "$OUT" 2>/dev/null || wc -c <"$OUT") bytes)"
echo "🔍 Comprobación rápida:"
if unzip -l "$OUT" | grep -qE '/\.git/'; then echo "⚠️  Hay .git"; else echo "✅ Sin .git"; fi
if unzip -l "$OUT" | grep -Eiq '\.(jpe?g|png|gif|webp|svg|heic|heif|tiff?|bmp|ico|psd|ai|eps|indd|pdf|mp4|mov|m4v|avi|mkv|webm|wav|mp3|aac|flac|ogg|raw|arw|cr2|cr3|nef|orf|rw2|raf|dng)$'; then
  echo "⚠️ Parece que quedaron archivos multimedia."
  unzip -l "$OUT" | awk '{print $4}' | grep -Ei '\.(jpe?g|png|gif|webp|svg|heic|heif|tiff?|bmp|ico|psd|ai|eps|indd|pdf|mp4|mov|m4v|avi|mkv|webm|wav|mp3|aac|flac|ogg|raw|arw|cr2|cr3|nef|orf|rw2|raf|dng)$' | head -5
else
  echo "✅ Sin archivos multimedia"
fi
