# Guia de la web

> **Regla d'or: només toques `data/` i `projects/`.** La resta és el codi.

## Què hi ha

```
data/site.json             el nom, el domini i els projectes de la home, en ordre
data/                      també el logo, la fletxa, l'about i el secret
projects/<nom>/            un projecte, una carpeta:
  project.json               els seus textos
  img/                       les seves imatges: titol.webp, fons.webp, fun.webp, les de la galeria…
  media/                     els seus vídeos, si en té
```

El **nom de la carpeta** és també el de l'adreça: `projects/cantautot/` →
`jaumeclotet.com/cantautot/`. Minúscules, números i guions, sense accents ni espais. **No el
canviïs** un cop publicat: trencaria els enllaços que ja circulen.

## La primera vegada: preparar VS Code

Només es fa un cop.

1. A VS Code: **Fitxer → Nova finestra** i, a la benvinguda, **Clona el repositori Git…** →
   **Clona des de GitHub**. Entra amb el teu compte, tria el teu repositori i una carpeta.
2. En obrir-la, VS Code et proposa instal·lar **Live Server** (a baix a la dreta): **Instal·la**.
3. A baix a la dreta surt **Go Live**: és la vista prèvia.

**VS Code t'ajuda amb els camps**: si passes el ratolí per sobre d'un (`"title"`, `"gallery"`…)
et diu què és, i si n'escrius un malament ho subratlla en vermell. Per veure quins camps pots
posar, dins de les claus prem **Ctrl+Espai**. Ho sap per la primera línia de cada JSON
(`"$schema": …`): **no l'esborris**.

## Afegir un projecte, pas a pas

1. **Copia una carpeta** de `projects/` que s'hi assembli i posa-li el nom nou:
   `projects/difacil/` → `projects/nou/`.
2. **Les imatges**: passa-les per [imgToWeb](https://meowrhino.github.io/imgToWeb/), **en Chrome
   o Firefox** (Safari no sap fer `.webp`), i posa-les a `img/`: el títol (`titol.webp`), el fons
   (`fons.webp`), l'element divertit (`fun.webp`) i les de la galeria, amb el nom que vulguis.
3. **Els textos**: obre `project.json` i canvia el que calgui (els camps, a sota).
4. **A la home**: a `data/site.json`, afegeix el nom de la carpeta a la llista, al lloc on vulguis
   que surti. Un projecte que no hi és té la seva pàgina igualment (com l'about), però no surt a la home.
5. **Go Live** per veure-ho, i després **Pujar els canvis**.

## Els camps d'un projecte (`project.json`)

| camp | què fa |
|---|---|
| `title` | el títol: a la pestanya i a Google |
| `logo` | la imatge del títol, de `img/`: `"titol.webp"`. Surt a la home i a dalt del projecte |
| `bg` | el fons: una imatge de `img/` (`"fons.webp"`) o un color (`"#000000"`) |
| `synopsis` | la sinopsi, a dalt. Un salt de línia és una línia nova; una línia en blanc, un paràgraf nou. Surt a Google |
| `fun` | l'element divertit que segueix el ratolí: `{ "src": "fun.webp" }` |
| `text` | el text, una llista de paràgrafs: `["primer", "segon"]`. Dins: `**negreta**`, `*cursiva*`, `__subratllat__`, `[enllaç](https://…)` |
| `gallery` | la galeria: `{ "images": ["foto 1.webp", "foto 2.webp"] }`, en ordre |
| `credits` | els crèdits, en un sol text; cada línia, amb `\n` |
| `extras` | *opcional*: blocs extra en llocs concrets (una imatge amb enllaç, un vídeo, un text…). Copia'n un d'un altre projecte |

## Veure-ho abans de pujar-ho

**Go Live** a baix a la dreta de VS Code. S'obre la web al navegador i es refresca sola cada
cop que deses. Si hi ha alguna cosa que no es publicaria (una coma, un camp mal escrit), surt
a la pantalla, i diu on.

## Pujar els canvis

1. Pestanya **Control de codi font** (les tres boletes unides, a l'esquerra).
2. Escriu què has fet (`projecte nou: nou`) i **Confirma** (*Commit*). Si pregunta si vols
   afegir tots els canvis: **Sí**.
3. **Sincronitza els canvis** (*Sync*).
4. En un parell de minuts és a la web. A GitHub, al costat de l'últim canvi surt una boleta:
   groc és que està publicant, verd que ja està, vermell que alguna cosa no quadra.

**Abans de començar a tocar**, dona també a **Sincronitza**, per baixar el que hagi canviat.

## Què surt a Google i en compartir

| on | d'on surt |
|---|---|
| el títol | `title` del projecte |
| el text de sota, a Google | el principi de la sinopsi (o del text) |
| la imatge en compartir l'enllaç | el fons; si no n'hi ha, el logo o la primera de la galeria |

## Si surt en vermell

La web no es trenca: es queda com estava fins que s'arregla. Clica la boleta vermella, després
**Details**, i llegeix l'últim missatge, que diu el fitxer i què passa:

- **"no és un JSON vàlid"** → gairebé sempre **una coma** de més o de menys, o unes cometes
  sense tancar, a prop d'aquella línia.
- **"\"sinopsis\" no és un camp d'aquí (mal escrit?). Els que hi ha: title, logo, bg…"** →
  un camp mal escrit: copia'l de la llista que surt al missatge.
- **"no trobo projects/nou/img/fons.webp"** → una imatge que el JSON nomena i no és a `img/`
  (compte amb les majúscules i els espais).
- **"\"lists\" diu \"nou\", i no hi ha cap projects/nou/project.json"** → el nom de la llista
  i el de la carpeta no són iguals.
