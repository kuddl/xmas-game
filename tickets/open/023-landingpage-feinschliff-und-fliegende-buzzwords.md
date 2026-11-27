# 023 · Landingpage: Feinschliff und Fliegende Buzzwords

| | |
|---|---|
| **Status** | 🟡 Offen |
| **Typ** | enhancement |
| **Map** | [Landingpage](../MAP-landingpage.md) |
| **Zugewiesen** | Agent (Review: tsailer) |
| **Erstellt** | 2026-11-26 |
| **Erledigt** | — |

## Ziel

Die Landingpage vor dem Versand an alle Merkle-Mitarbeiter fertig machen. Entschieden im Gespräch am 2026-11-26, alle Empfehlungen angenommen (Q1–Q7 mit „Ja“):

- **Tab-Navigation:** Bekommt ein Block, Flieger oder Button den Fokus, scrollt die Strecke zu ihm.
- **Hinweis** „↑ SCROLL UP TO RUN“, passend zur umgekehrten Scrollrichtung.
- **Q1 Fliegende Buzzwords:** 5–6 Meeting-Invites mit Buzzwords am Himmel. Berühren mit der Cursor-Figur friert sie 2 s ein und zeigt einen Toast (z. B. „OOPS! YOU BLEW THE BUDGET“, „OUT OF AI TOKENS“). Anklicken zerstört den Flieger (Trümmer, +5 SP). Die Meldungen stehen in `content.js`.
- **Q2 Einfrieren:** Die Figur bleibt stehen, Klicks werden 2 s ignoriert, danach läuft sie zur Maus zurück.
- **Q3 Dizzy:** Sterne kreisen um die Figur, sie wackelt, und die Szene schwankt kurz (ca. 0,5 s). Kein Zoom. Bei „Bewegung reduzieren“ nur die Meldung.
- **Q4 Touch:** Flieger nur antippen und zerstören, kein Einfrieren.
- **Q5 Kisten auf Eisplattformen:** abwechselnd Boden, Ebene 2 und Ebene 3 (wie im Spiel), pro Kiste mit `level` in `content.js` einstellbar. Die Karte öffnet sich dort, wo Platz ist.
- **Q6 Kompakter:** Abstand etwa 0,4 Bildschirmbreiten, die Länge ergibt sich automatisch aus der Anzahl der Kisten.
- **Q7 Finale:** groß und mittig (auch vertikal), Lametta-Girlanden, dauerhaftes Glitzern, Feuerwerk beim Freischalten, pulsierender „PRESS START“.
- **Zusätzlich:** Der **Weihnachtsmann mit Schlitten und fliegenden Rentieren** fliegt ab und zu durch den Hintergrund.
- **Versand:** Link-Vorschau für Mail, Teams und Slack (Open Graph, Vorschaubild) und ein Favicon.

## Verlauf

### 2026-11-26 · Umgesetzt (wartet auf Review von Tobias)

- **Tab-Navigation:** `focusin` auf der Strecke scrollt sanft zum fokussierten Element. Nach dem Aufsprengen springt der Fokus auf die geöffnete Karte.
- **Hinweis:** „↑ SCROLL UP TO RUN“. Der Pfeil richtet sich nach `layout.scrollDirection`.
- **Fliegende Buzzwords:** 6 Flieger aus `content.js` → `flyers` (Wort + Meldung), jeweils mittig in den Lücken zwischen den Kisten und auf wechselnden Höhen.
  - Berühren mit der Cursor-Figur: 2 s eingefroren (`effects.freezeSeconds`), Toast, Figur dizzy mit kreisenden Sternen, die Szene schwankt 0,55 s. Klicks sind in der Zeit blockiert.
  - Anklicken oder Antippen: Trümmer und +5 SP.
- **Kisten auf Eis:** automatisch Boden / Ebene 2 / Ebene 3 (oder per `level`), mit Eisplattform darunter. Die Karte geht oben auf, oder unten, wenn oben kein Platz ist.
- **Kompakter:** `beatSpacing` 0,4, mindestens 300 px.
- **Finale:** groß und mittig. Lametta-Girlanden (`tinsel.png`, zwei schwingende Stränge), dauerhaftes Glitzern ums Banner, beim ersten Sichtkontakt nach dem Freischalten ein Feuerwerk mit 7 Salven, pulsierender „PRESS START“.
- **Weihnachtsmann:** `santa-sleigh.png` (2 Frames, 2 Rentiere), fliegt alle 18 s (`effects.santaEverySeconds`) hinter den Bergen durchs Bild und hinterlässt eine Glitzerspur.
- **Versand:** Open-Graph- und Twitter-Tags, `public/og-image.png` (1200×630, Screenshot der Startszene), `favicon.png` (Geschenk) für Landingpage und Spiel.
- **Neue Sprites** in `scripts/generate-assets.mjs` und `spritesheet.json`: `santaSleigh`, `tinsel`, `favicon`.
- **Geprüft:**
  - Desktop 1720×1267 und 1440×900, Handy 390×844 (auch als echtes Touch-Gerät emuliert)
  - „Bewegung reduzieren“: ohne Parallax, Weihnachtsmann, Explosionen und Schwanken, die Karten bleiben sichtbar
  - Einfrieren inklusive Klick-Sperre, Tab-Navigation, Freischalten des Geschenks, das Spiel unter `/game/` startet weiter
  - keine Konsolenfehler
- **Figma:** neue Gruppe „Landing Page“ mit `santaSleigh`, `tinsel` und `favicon` auf der Asset-Seite (ABX Game Assets).
- **Nachjustiert:** Das Schwanken der Szene beim Treffer auf einen Flieger hat jetzt die halbe Amplitude (Drehung max. 0,7° statt 1,4°, Zoom 0,5 % statt 1 %).
- **Nachjustiert:** Das Wackeln der Figur im Dizzy-Zustand ist gedrittelt (±3° statt ±9°). Das Schwanken der Szene bleibt auf der halben Amplitude.
