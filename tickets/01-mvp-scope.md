# Ticket 01: MVP-Scope klarifizieren

**Type:** Grilling (HITL)  
**Status:** Open, Unclaimed  
**Blocks:** Alle anderen Entscheidungen hängen daran  

## Question

Was genau ist der **minimal-spielbare Zustand** für den Prototype? Welche Spielmechaniken, Assets, States sind absolut nötig, damit wir Physik und Spielgefühl testen können?

Konkret:
- **Spieler-Modell**: Wie sieht die Spielfigur aus? (Simple 2D-Sprite, oder 3D-Voxel in Three.js?)
- **Hindernisse MVP**: Nur einfache Blöcke auf Augenhöhe? Oder auch unterschiedliche Höhen / Lücken im Boden?
- **Boden-Dynamik**: Ist der Boden flach, oder haben wir schon Höhenunterschiede?
- **Game States**: Was sind die minimalen States? (Menu, Playing, GameOver, Leaderboard?)
- **Visuals**: Welche Farben, wie "8-Bit" muss es *wirklich* aussehen? (Kann der Prototype noch rough sein?)
- **Input Handling**: Pfeiltasten + Space reichen, oder brauchen wir mehr?

## Notes

Das Ticket blockiert alles andere, weil die Antwort die Architektur formt. Wenn wir z.B. entscheiden, dass Hindernisse unterschiedliche Höhen haben, brauchen wir andere Physics als wenn alles auf einer Ebene ist.
