# Ticket 09: Ebenen (Plattformen zum Hochspringen)

**Type:** Grilling + Build (HITL)  
**Status:** ✅ Closed  

## Question

Wie funktionieren eine zweite und dritte Ebene, auf die man springen und auf der man laufen kann?

## Resolution

| **Aspekt** | **Entscheidung** |
|---|---|
| **Art** | **One-Way-Eisplattformen**: Von unten springt man hindurch, von oben landet man darauf. |
| **Ebene 2** | Oberkante 72 px über dem Boden, mit einem normalen Sprung erreichbar (Sprunghöhe ca. 86 px) |
| **Ebene 3** | Oberkante 144 px über dem Boden, von Ebene 2 aus erreichbar (oder per Double Jump) |
| **Muster** | Alle 6–11 s eine Plattform auf Ebene 2. In 50 % der Fälle zusätzlich eine „Treppe“: Ebene 3 beginnt auf halber Länge von Ebene 2 und reicht darüber hinaus. |
| **Länge** | 192–320 px, in 32-px-Kacheln für saubere Pixelkanten |
| **Runter** | ↓ auf einer Plattform lässt einen durchfallen (0,22 s werden Plattformen ignoriert). Am Ende der Plattform fällt man einfach herunter, Coyote-Time gilt auch hier. |
| **Belohnung** | Auf Ebene 3 liegt ein Power-Up, sofern gerade keines auf dem Bildschirm ist. |
| **Sicherheit** | Oben ist man vor Bodenblöcken und Fliegern sicher. Die Plattformen sind also eine „Fast Lane“. |
| **Power-Ups am Boden** | Werden nicht dort platziert, wo eine Plattform ist, damit sie nicht im Eis stecken. |

### Assets & Code
- `public/assets/sprites/platform-tile.png` (16x8, kachelbar)
- `src/platforms.js`: Spawning, Oberflächen für die Physik
- `src/player.js`: Landung auf Plattformen, Durchfallen, Schatten auf der Fläche unter der Figur

### Offen / später
- Hindernisse auch **auf** Plattformen
- Schilder von Bodenblöcken werden von Plattformen verdeckt, wenn beide übereinander liegen
