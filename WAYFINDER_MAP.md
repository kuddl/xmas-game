# Xmas Game — Wayfinder Map

## Destination

**Ein spielbares, witziges Corporate-Satire-Run-Game**: Single-Player, Band-Scrolling (links→rechts), 8-Bit-Pixelart-Style. 

Das Spiel ist ein **Weihnachtsgame für Firmenkunden** — der Spieler läuft automatisch durch eine abstrakte "Projektwelt", überspringt/duckt sich unter Business-Buzzword-Hindernisse ("Deadline", "TCO", "Milestone", etc.), sammelt Firmen-Logos als Power-Ups. Die Progression zeigt zwei Welten:
- **MVP-Phase** (erste 2-3 Screens, langsam, Hintergrund zeigt "MVP-Status"): Spieler darf gegen Obstacles rennen, es passiert nichts — nur zum Warm-up
- **Real Production-Phase**: Spiel wird ernst, Obstacles haben echte Konsequenzen

**MVP-Feature-Set**: Spieler läuft automatisch mit Space-Jump + Links/Rechts (beschleunigen/verlangsamen zum Timing anpassen), einfache Blöcke auf Augenhöhe, Crouching-Mechanic wird später dazukommen. Leaderboard nach Distanz lokal. Eine Session dauert 20 Sekunden bis 2 Minuten.

## Notes

- **Corporate Satire Game für Kunden**: Hindernisse sind Business-Buzzwords (Deadline, TCO, Milestone, etc.), Collectibles sind Firmenlogos
- **Progression mit Welten**: MVP-Phase (safe, kein Game Over) → Real Production-Phase (echte Stakes)
- **Input-Mechaniken**: Space (Jump), Left/Right (beschleunigen/verlangsamen, nicht links/rechts bewegen!)
- **Crouching später**: Für fliegende Obstacles, nicht im MVP
- **Prototype-first**: Einfache Blöcke auf Augenhöhe zum Starten, später Höhenvarianz + fliegende Obstacles
- **Backlog-Mindset**: Power-Up-System, Crouching, Obstacle-Text-Rendering, Firma-Logos, Musik/Audio später
- **Three.js + Pixelart**: Asset-Austauschbarkeit kritisch für Text-Rendering auf Obstacles

## Decisions so far

(Noch keine — wir chartern gerade.)

## Open Tickets (Frontier)

**[MVP-Scope klarifizieren](tickets/01-mvp-scope.md)** — Genau definieren: Spieler-Modell, Obstacle-Arten, Game States, Visueller Style für Prototype

**[Progression-Design: MVP-Phase vs Real Production](tickets/05-progression-design.md)** — Wie sieht der Übergang aus? Wann schaltet Real Production frei? Wie zeigen wir das visuell (Hintergrund, Farbe, etc.)?

**[Pixel Art in Three.js: Laden & Rendern](tickets/02-pixel-art-approach.md)** — Welche Strategie: PNG-Atlas? SVG? Wie austauschbar? Kritisch: Text auf Obstacles rendern

**[Hindernisse-Generator: Semi-Random-Algorithmus](tickets/04-obstacle-gen.md)** — Faire, spielbare Hindernisse ohne Chaos (nicht zu viele auf einmal, nicht zu lange leere Pausen)

**[Scroll-Geschwindigkeit calibrieren](tickets/03-scroll-speed.md)** — Prototype: Spielbar fühlen, nicht zu schnell, später Difficulty-Scaling

## Not yet specified (Fog)

- **Obstacle-Text-Rendering**: Wie rendern wir die Business-Buzzwords auf den Blöcken? Custom Canvas-Textur? Text-Mesh in Three.js? Muss das austauschbar sein?
- **Collectibles/Power-Ups Visuell**: Wie sehen die Firma-Logos aus? Sind das separate Sprites, die eingesammelt werden? Welche Power-Ups genau? (Invincibility? Higher Jump? Both?)
- **Leben-System für Real Production**: Ein Leben, oder mehrere? Game Over sofort, oder Health-Bar? Respawning?
- **Business-Buzzword-Liste**: Welche Hindernisse (Deadline, TCO, Milestone, Scope Creep, etc.) sind eingeplant?
- **Schwierigkeits-Progression**: Wie und wann wird es schwerer? (Nach Distanz? Nach Zeit? Screen-by-Screen?)

## Out of scope

(Noch keine bewussten Out-of-Scope Entscheidungen — alles ist auf dem Radar für MVP oder Backlog.)

---

# Tickets

## [01-mvp-scope.md](tickets/01-mvp-scope.md)
**Type:** Grilling (HITL)  
**Status:** 🔄 In Progress (Claimed)  
**Blocks:** Alle anderen  

## [02-pixel-art-approach.md](tickets/02-pixel-art-approach.md)
**Type:** Research + Grilling (AFK + HITL)  
**Status:** Open, Unclaimed  
**Blocks:** Prototype-Build  

## [03-scroll-speed.md](tickets/03-scroll-speed.md)
**Type:** Prototype (HITL)  
**Status:** Open, Unclaimed  
**Blocked by:** MVP-Scope, Pixel Art  

## [04-obstacle-gen.md](tickets/04-obstacle-gen.md)
**Type:** Prototype (HITL)  
**Status:** Open, Unclaimed  
**Blocked by:** MVP-Scope  

## [05-progression-design.md](tickets/05-progression-design.md)
**Type:** Grilling (HITL)  
**Status:** Open, Unclaimed  
**Blocked by:** MVP-Scope
