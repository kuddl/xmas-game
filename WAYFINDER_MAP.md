# Xmas Game — Wayfinder Map

## Destination

**Ein spielbares Chrome-Dino-ähnliches Run-Game**: Single-Player, Band-Scrolling (links→rechts), 8-Bit-Pixelart-Style. MVP: Spieler läuft mit Pfeiltasten + Jump (Space), Hindernisse (Blöcke), Physik funktioniert, Leaderboard nach Distanz lokal. Eine Session dauert 20 Sekunden bis 2 Minuten. Die Architektur ermöglicht schnellen Asset-Austausch für einen späteren Designer.

## Notes

- **Prototype-first**: Wir bauen schnell was spielbar ist, bevor wir Assets feineifeln
- **Backlog-Mindset**: Alles, was nicht MVP ist (Audio, Difficulty-Scaling, komplexere Hindernisse, Server-Backend) landet im Backlog
- **Three.js + Pixelart**: Noch unklar, wie wir PNG/SVG-Sprites in Three.js laden — Research braucht es
- **Asset-Austauschbarkeit**: Kritisch, wir müssen eine Strategie haben, damit Assets nicht im Code verhärtet sind

## Decisions so far

(Noch keine — wir chartern gerade.)

## Open Tickets (Frontier)

**[MVP-Scope klarifizieren](#ticket-mvp-scope)** — Genau definieren: Welche Spielmechaniken, Assets, States sind im Prototype minimal nötig?

**[Pixel Art in Three.js: Laden & Rendern](#ticket-pixel-art-approach)** — Welche Strategie: PNG-Atlas? SVG? Voxel? Wie stellen wir sicher, dass Assets austauschbar sind?

**[Scroll-Geschwindigkeit calibrieren](#ticket-scroll-speed)** — Prototype: Spielbar fühlen, nicht zu schnell, später Difficulty-Scaling

**[Hindernisse-Generator: Semi-Random-Algorithmus](#ticket-obstacle-gen)** — Faire, spielbare Hindernisse ohne Chaos (nicht zu viele auf einmal, nicht zu lange leere Pausen)

## Backlog (später)

- Difficulty-Scaling (schneller werden, dichtere Hindernisse, neue Obstacle-Typen)
- Audio & Sound Design
- Particle Effects & Visual Juice (Screenshake, Impact Feedback)
- Backend Leaderboard & Persistenz
- Weitere Obstacle-Typen (Lücken, fliegende Feinde, etc.)
- Power-Ups & Bonussysteme
- Polished Pixelart & Animation

---

# Tickets

## [MVP-Scope klarifizieren](tickets/01-mvp-scope.md)
**Type:** Grilling (HITL)  
**Status:** Open, Unclaimed  
**Blocks:** Alle anderen  

## [Pixel Art in Three.js: Laden & Rendern](tickets/02-pixel-art-approach.md)
**Type:** Research + Grilling (AFK + HITL)  
**Status:** Open, Unclaimed  
**Blocks:** Prototype-Build  

## [Scroll-Geschwindigkeit calibrieren](tickets/03-scroll-speed.md)
**Type:** Prototype (HITL)  
**Status:** Open, Unclaimed  
**Blocked by:** MVP-Scope, Pixel Art  

## [Hindernisse-Generator: Semi-Random-Algorithmus](tickets/04-obstacle-gen.md)
**Type:** Prototype (HITL)  
**Status:** Open, Unclaimed  
**Blocked by:** MVP-Scope  
