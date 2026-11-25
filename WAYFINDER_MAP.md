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
- **Backlog-Mindset**: Musik/Audio später
- **PixiJS v8 + Pixelart**: Umstellung von Three.js auf PixiJS v8 (native 2D-Engine mit `AnimatedSprite`, `TilingSprite`, `Assets`-API & `scaleMode: 'nearest'`). Offizielle `pixijs-skills` im Repo unter `.agents/skills/` eingebunden.

## Decisions so far

- [**MVP-Scope klarifizieren**](tickets/01-mvp-scope.md) — 2D-Pixel-Sprite mit Lauf-Animation, einfache Blöcke auf einer Höhe, Blau-Weiße Farben mit roten Akzenten
- [**Pixel Art in Three.js: Laden & Rendern**](tickets/02-pixel-art-approach.md) — PlaneGeometry + NearestFilter für crisp Pixels, spritesheet.json Config für Designer-Austausch, Text-Mesh für Buzzwords
- [**Start & Game Over Screen Design**](tickets/06-ui-screens-design.md) — Start: Blurred Szenerie + "Christmas Game"-Titel. Game Over: 80er-Konsolen-Scores
- [**Progression-Design: MVP-Phase vs Real Production**](tickets/05-progression-design.md) — MVP-Phase: erste 200-300 Units (25-40 Sekunden), dann Production mit 1 Leben Game Over. Kompletter Score von Anfang bis Ende
- [**Power-Ups mit Firmen-Logos**](tickets/07-powerups.md) — Merkle-Logo = Breakthrough (durch Blöcke brechen), Arc-Logo = Double Jump; je 5 s, Aura + Funken an der Figur, HUD-Balken unten links
- [**Ducken & fliegende Hindernisse**](tickets/08-ducking.md) — ↓ = ducken (Boden) / durchfallen (Plattform) / schneller fallen (Luft); geflügelte Meeting-Invites mit Buzzword-Banner ab 60 m
- [**Ebenen (Plattformen zum Hochspringen)**](tickets/09-platform-levels.md) — One-Way-Eisplattformen auf Ebene 2 (72 px) und 3 (144 px), Treppen-Muster, Power-Up als Belohnung oben
- [**Pause & Story Points**](tickets/10-pause-story-points.md) — ESC/P pausiert (Auto-Pause bei Tab-Wechsel); Goldmünzen als Bögen, Duck-Reihen und Plattform-Reihen, Zähler im HUD und auf dem Game-Over-Screen

## Open Tickets (Frontier)

**[Hindernisse-Generator: Semi-Random-Algorithmus](tickets/04-obstacle-gen.md)** — Faire, spielbare Hindernisse ohne Chaos (nicht zu viele auf einmal, nicht zu lange leere Pausen)

**[Scroll-Geschwindigkeit calibrieren](tickets/03-scroll-speed.md)** — Prototype: Spielbar fühlen, nicht zu schnell, später Difficulty-Scaling

## Not yet specified (Fog)

- **Highscore-Formel mit Story Points**: Wie werden SP mit der Distanz verrechnet (Faktor? Zeitbonus?), und wie werden sie im Leaderboard gespeichert und angezeigt?
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
**Status:** ✅ Closed  
**Decision:** MVP-Scope ist sharp — siehe Resolution im Ticket  

## [02-pixel-art-approach.md](tickets/02-pixel-art-approach.md)
**Type:** Research + Grilling (AFK + HITL)  
**Status:** ✅ Closed  
**Decision:** Asset-Pipeline definiert — PlaneGeometry + NearestFilter, spritesheet.json Config, Text-Mesh für Buzzwords  

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
**Status:** ✅ Closed  
**Decision:** MVP-Phase (200-300 Units), 1 Leben in Production, kompletter Score

## [06-ui-screens-design.md](tickets/06-ui-screens-design.md)
**Type:** Grilling (HITL)  
**Status:** ✅ Closed  
**Decision:** Start-Screen & Game Over-Screen + MVP→Production-Linie definiert
