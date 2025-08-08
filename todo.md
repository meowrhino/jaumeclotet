# TODO - Web Jaume Clotet

## 0. Preparación de proyecto
- [ ] Crear estructura de carpetas básica (`/data`, `/img`, `/css`, `/js`)
- [ ] Crear archivos iniciales: `index.html`, `projecte.html`, `css/style.css`, `js/main.js`, `js/proyecto.js`
- [ ] Crear archivo `/data/proyectos.json` con estructura de datos de prueba

---

## 1. Pantalla principal (index.html)
- [ ] Maquetar grid responsivo (2x3 en móvil, 3x2 en desktop/cuadrado)
- [ ] Detectar aspect ratio vía JS y aplicar grid adecuado
- [ ] Añadir zonas "project-tile" dinámicamente desde JS usando datos de `proyectos.json`
- [ ] Mostrar fondo y logo en cada zona
- [ ] Añadir border divertido/animado (keyframes jelly u ondulado SVG/canvas)
- [ ] Añadir sombra, border-radius, detalles visuales a cada zona
- [ ] Crear animación sutil de los bordes de cada tile
- [ ] Implementar click en zona para ir a `projecte.html?slug=xxx`
- [ ] Añadir tracking de proyectos vistos (localStorage)
- [ ] Detectar si los 6 proyectos han sido visitados y mostrar logo del 7º proyecto centrado (desbloqueable)
- [ ] Animación de aparición para el 7º proyecto (fade in, rebote, etc.)

---

## 2. Datos de proyecto (`proyectos.json`)
- [ ] Definir estructura estándar: logo, fondo, sinopsis, texto largo, galería, elemento divertido, hueco libre, créditos
- [ ] Crear datos demo para los 6 proyectos principales + el 7º proyecto secreto
- [ ] Añadir enlaces a imágenes en `/img`

---

## 3. Página de proyecto (`projecte.html`)
- [ ] Recoger el parámetro `slug` de la URL
- [ ] Cargar datos del proyecto seleccionado desde `proyectos.json`
- [ ] Mostrar logo (png, centrado/top)
- [ ] Mostrar sinopsis (breve)
- [ ] Mostrar elemento "divertido" (png que persigue el ratón y rota según dirección)
    - [ ] Preparar lógica JS de interpolación de posición
    - [ ] Rotar imagen según ángulo al cursor
    - [ ] Optimizar para móvil (opcional: sigue el dedo, o movimiento random)
- [ ] Mostrar texto largo
- [ ] Renderizar galería de imágenes (slider o grid simple)
- [ ] Implementar hueco libre (render genérico para diferentes tipos: discos, links, embed, etc.)
- [ ] Mostrar créditos como bloque de texto enriquecido con enlaces
- [ ] Guardar en localStorage que este proyecto ha sido visitado (`proyecto-[slug]-visto`)
- [ ] Botón/Enlace para volver a la pantalla principal

---

## 4. Detalles visuales/UX
- [ ] Mejorar/afinar animación de bordes entre zonas (border-radius, SVG, canvas, etc.)
- [ ] Añadir animaciones de hover en tiles (escala, sombra, etc.)
- [ ] Transiciones suaves entre secciones y proyectos
- [ ] Preparar sistema de scroll locking (si galería o "hueco libre" lo requiere)
- [ ] Probar con distintos logos y fondos para ajustar contraste y legibilidad

---

## 5. Extras y pulidos
- [ ] Preparar favicon y metadata para SEO básico
- [ ] Preparar archivo `README.md` con instrucciones rápidas de despliegue
- [ ] Comprobar accesibilidad (alt en imágenes, contrastes)
- [ ] Añadir preload de imágenes para transiciones suaves
- [ ] Revisar que los datos de créditos sean fácilmente editables por texto plano
- [ ] Dejar comentarios en el código para facilitar ampliaciones

---

## 6. Futuro/mejoras opcionales
- [ ] Mejorar tracking de proyectos vistos para varios dispositivos (sincronizar vía backend o cookie, si hiciera falta)
- [ ] Añadir animación más avanzada a la aparición del 7º proyecto (partículas, sonido, etc.)
- [ ] Personalizar más el "hueco libre" con templates por tipo
- [ ] Añadir idiomas si se requiere

---

