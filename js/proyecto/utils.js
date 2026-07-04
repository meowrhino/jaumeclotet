// utils.js — helpers básicos compartidos entre módulos de proyecto.js

export function param(name) {
  return new URLSearchParams(location.search).get(name);
}

// Detección de "dispositivo táctil" (mejor que userAgent)
export function isTouchDevice() {
  return (
    window.matchMedia &&
    window.matchMedia("(hover: none) and (pointer: coarse)").matches
  );
}

export function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        m
      ])
  );
}
