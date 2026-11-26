# Ticket 01: MVP-Scope klarifizieren

**Type:** Grilling (HITL)  
**Status:** ✅ Closed  
**Resolved:** Siehe MVP-Decision-Tabelle unten und Decisions so far in WAYFINDER_MAP.md  

## Question

Was genau ist der **minimal-spielbare Zustand** für den Prototype? Welche Spielmechaniken, Assets, States sind absolut nötig, damit wir Physik und Spielgefühl testen können?

## Resolution

### MVP-Scope definiert:

| **Aspekt** | **MVP-Decision** |
|---|---|
| **Spieler-Modell** | 2D-Pixel-Sprite, läuft mit Bein-Animation (2-3 Frames) |
| **Obstacles** | Einfache Blöcke auf einer Höhe (Jump-only, keine Höhenvarianz) |
| **Game States** | Playing-Screen → Game Over (minimal, kein Menu im MVP) |
| **UI-Platzhalter** | Running Time, Distanz-Score, Progress Bar, Leaderboard-Top-3 |
| **Input-Mechaniken** | Space (Jump), Left/Right (beschleunigen/verlangsamen, nicht bewegen!) |
| **Visual Style** | Blau-weiße Palette (winterlich/eisig), rote Akzente (Weihnacht + Business-Buzzwords) |
| **Audio** | Backlog (später) |

### Kontext:
- Spieler läuft automatisch vorwärts durch Obstacle-Stream
- MVP-Phase: Safe zone, Spieler darf crashen, es passiert nichts (Warm-up)
- Real Production-Phase: Erst später, nicht im Prototype
- Obstacles tragen Business-Buzzwords-Text (Deadline, TCO, etc.) — wird später mit Designer definiert
- Collectibles (Power-Ups): Firma-Logos — später umgesetzt

### Nächste Schritte:
- **Ticket 02** (Pixel Art Approach): Wie laden wir PNG-Sprites? Wie machen wir Text auf Obstacles?
- **Ticket 03** (Scroll-Speed): Welche Geschwindigkeit fühlt sich spielbar an?
- **Ticket 04** (Obstacle-Generator): Welcher Algorithmus generiert faire Hindernisse?
- **Ticket 05** (Progression-Design): Wann und wie wechseln wir in Real Production-Phase?
