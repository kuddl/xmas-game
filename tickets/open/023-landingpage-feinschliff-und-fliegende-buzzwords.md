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
