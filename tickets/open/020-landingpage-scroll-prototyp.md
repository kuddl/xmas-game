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
