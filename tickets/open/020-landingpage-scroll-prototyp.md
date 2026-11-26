# 020 · Landingpage: Scroll-Prototyp

| | |
|---|---|
| **Status** | 🟡 Offen |
| **Typ** | wayfinder:prototype |
| **Map** | [Landingpage](../MAP-landingpage.md) |
| **Zugewiesen** | tsailer |
| **Erstellt** | 2026-11-26 |
| **Erledigt** | — |

## Frage

Fühlt sich die Mechanik aus [018](../done/018-landingpage-was-braucht-die-seite.md) wirklich **flüssig und High-End** an? Vertikal scrollen, horizontal bewegen, Parallax, Block anklicken und explodieren lassen, Spielfigur als Cursor. Oder brauchen wir zusätzlich z. B. GSAP?

Dafür ein **super einfacher Prototyp** unter `/welcome`:
- fixierte Bühne mit nativer CSS Scroll-Driven Animation (dazu die JS-Ersatzlösung)
- Parallax-Ebenen mit den Spiel-Assets (Himmel, Berge, Bäume, Boden)
- 2–3 Blöcke mit ersten Texten aus `welcome/content.js`, Explosion per PixiJS-Canvas
- Spielfigur folgt dem Mauszeiger (Desktop) bzw. läuft am Boden mit (Touch)
- Finale-Banner mit Link ins Spiel

Ergebnis: Tobias spielt den Prototyp durch und entscheidet: Mechanik passt, Anpassungen nötig, oder eine andere Technik.

## Verlauf

### 2026-11-26 · Prototyp gebaut (wartet auf Playtest)

Lokal: `npm run dev` → http://localhost:5173/welcome/ (im Build als `dist/welcome/index.html`).

- **Dateien:** `welcome/index.html`, `welcome/welcome.css`, `welcome/main.js`, `welcome/content.js` (Texte), Multi-Page-Eintrag in `vite.config.js`
- **Scroll:** Ein hoher Scroller mit fixierter Bühne. Die Strecke bewegt sich per nativer CSS Scroll-Driven Animation (`animation-timeline: scroll(root block)`) 1:1 zur Scrollposition. Bei 1720 px Breite ist der Weg etwa 3,1 Bildschirmbreiten lang. Ohne Browser-Support übernimmt eine JS-Ersatzlösung (rAF setzt `--p`).
- **Parallax:** dieselben Ebenen und Faktoren wie im Spiel (0,14 / 0,3 / 0,62), Boden 1:1. Bei „Bewegung reduzieren“ bleibt der Hintergrund stehen.
- **Blöcke:** 4 aus `content.js`. Klick, Tap oder Enter löst Trümmer, Funken, „+5 SP“ und Wackeln aus (PixiJS-Overlay mit dem `EffectsManager` aus dem Spiel), dann springt die Karte auf.
- **Cursor:** Die Spielfigur folgt der Maus mit Laufanimation, Drehung in Laufrichtung und Sprung-Frame beim Klicken. Auf Touch-Geräten läuft sie unten mit, solange gescrollt wird.
- **Finale:** Banner „PLAY THE CHRISTMAS PROJECT GAME“, Button „PRESS START“ führt auf `/`.
- **Geprüft:** Desktop 1720×1267 und Handy 390×844. Keine Konsolenfehler, Build ok.
- **Offen für den Playtest:** Fühlt es sich flüssig an? Passen Länge und Tempo? Ist die Figur als Cursor gut, und ist sie zu groß oder zu klein? Braucht es GSAP?
