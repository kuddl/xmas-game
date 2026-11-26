# Ticket 08: Ducken & fliegende Hindernisse

**Type:** Grilling + Build (HITL)  
**Status:** ✅ Closed  

## Question

Wie steuert man das Ducken, und welche fliegenden Hindernisse machen es nötig?

## Resolution

| **Aspekt** | **Entscheidung** |
|---|---|
| **Steuerung** | Variante A: **Space = Springen, ↓ (oder S) = Ducken**. Long-Press auf Space ist verworfen, weil jeder Sprung sonst ca. 150–200 ms verzögert wäre. |
| **↓ je nach Situation** | Am Boden: **ducken**. Auf einer Plattform: **nach unten durchfallen** (siehe Ticket 09). In der Luft: **schneller fallen** (Gravitation ×1,9). |
| **Fliegende Hindernisse** | Geflügelte „Meeting-Invite“-Umschläge, die ein Buzzword-Banner hinter sich herziehen: MEETING, SCOPE CREEP, ASAP, KPI, REPLY ALL |
| **Höhe** | Unterkante 34 px über dem Boden. Geduckt (ca. 22 px) passt man drunter durch, stehend (ca. 39 px) nicht. Drüberspringen geht auch. |
| **Auftreten** | Ab 60 m, mit 35 % Wahrscheinlichkeit pro Hindernis, nie zwei Flieger hintereinander. Nach einem Flieger gibt es 0,35 s extra Abstand. |
| **Tempo** | Flieger sind 45 px/s schneller als die Welt, sie „fliegen auf einen zu“. |
| **Breakthrough-Power-Up** | Zerschmettert auch Flieger. |

### Assets
- `public/assets/sprites/obstacle-flyer.png` (24x16)
- `player.png` hat jetzt 5 Frames, Frame 4 ist die Duck-Pose (`spritesheet.json` → `animations.duck`)
