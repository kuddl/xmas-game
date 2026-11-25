# Ticket 07: Power-Ups mit Firmen-Logos

**Type:** Grilling + Build (HITL)  
**Status:** ✅ Closed  

## Question

Welche Power-Ups gibt es, wie sammelt man sie ein, wie lange wirken sie, und wie sieht der Spieler, dass ein Power-Up aktiv ist?

## Resolution

| **Aspekt** | **Entscheidung** |
|---|---|
| **Merkle-Logo** (weißes M + rotes Dreieck auf Gulf Blue) | **MERKLE BREAKTHROUGH**: Man bricht durch Buzzword-Blöcke hindurch. Der Block zerplatzt in Pixel-Splitter, dazu ein kurzer Screen-Shake. |
| **Arc-Logo** (Bogen / umgedrehtes Y) | **ARC DOUBLE JUMP**: In der Luft ein zweites Mal Space drücken. Gewählt statt „Super Jump“, weil die Steuerung bei Space bleibt und man trotzdem etwa doppelt so hoch kommt. |
| **Dauer** | 5 Sekunden pro Power-Up (`config.js` → `POWERUPS.*.duration`) |
| **Einsammeln** | Logos schweben auf Sprunghöhe mittig in breiten Lücken zwischen Blöcken, also nur durch Springen erreichbar. Frühestens nach 5 s, danach alle 7–12 s. Abwechselnd per Shuffle-Bag. |
| **Feedback an der Figur** | Pulsierende Aura in Power-Up-Farbe + Funken im Asterix-Stil um die Figur. Bei Double Jump gibt es einen Funken-Burst. |
| **HUD** | Leiste unten links: Logo, Name, Restzeit und ein Balken, der sich leert. In der letzten 1,5 s blinken HUD und Aura als Warnung. |
| **Beide gleichzeitig** | Möglich, jedes Power-Up hat einen eigenen Timer und einen eigenen Balken. |
| **Brand-Farben** | Pomegranate `#F23A1D`, Maize `#F7D1A8`, Gulf Blue `#040E4B` |

### Assets (vom Designer austauschbar über `spritesheet.json`)
- `public/assets/sprites/powerup-merkle.png` (16x16)
- `public/assets/sprites/powerup-arc.png` (16x16)
- `public/assets/sprites/sparkle.png` (5x5, wird pro Power-Up eingefärbt)

### Code
- `src/powerups.js`: Spawning, Pickup-Kollision, Timer
- `src/effects.js`: Partikel-Pool (Funken, Splitter)
- `src/player.js`: Double Jump + Aura
- `src/ui.js`: HUD-Leiste
