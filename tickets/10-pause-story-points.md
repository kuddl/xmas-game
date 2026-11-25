# Ticket 10: Pause & Story Points

**Type:** Grilling + Build (HITL)  
**Status:** ✅ Closed (Score-Verrechnung offen, siehe unten)  

## Question

Wie pausiert man das Spiel, und wie funktionieren sammelbare Bonuspunkte („Story Points“)?

## Resolution

### Pause
| **Aspekt** | **Entscheidung** |
|---|---|
| **Taste** | **ESC** (oder P) pausiert und setzt fort. Alternativ den RESUME-Button klicken. |
| **Overlay** | Kleines Fenster ohne Unschärfe, Szene und HUD bleiben sichtbar (gut für Screenshots) |
| **Auto-Pause** | Beim Wechsel von Tab oder Fenster pausiert das Spiel automatisch |
| **Tasten** | Beim Pausieren und Fortsetzen werden gehaltene Tasten (←/→/↓) losgelassen, damit nichts hängen bleibt |

### Story Points (Goldmünzen)
| **Muster** | **Wo** | **Wahrscheinlichkeit** |
|---|---|---|
| **Bogen** (5 Münzen) | Über Bodenblöcken, oberhalb des Schilds. Er zeigt die Sprungbahn. | 50 % pro Block |
| **Duck-Reihe** (4 Münzen) | Direkt über dem Boden unter Fliegern, als Belohnung fürs Ducken | 70 % pro Flieger |
| **Lücken-Reihe** (3–6 Münzen) | Am Boden in breiten Lücken, wenn kein Bogen gesetzt wurde | 35 % |
| **Plattform-Reihe** | Auf jeder Plattform (Ebene 2 und 3) | 80 % |

- **HUD:** Neue Zeile „SP“ mit Münz-Icon. Die Zahl hüpft beim Einsammeln kurz auf.
- **Game Over:** Zeile „STORY POINTS“
- **Feedback:** Kleiner goldener Funken-Burst pro Münze

### Offen (später)
- **Story Points in den Highscore einrechnen**: Formel noch offen (z. B. Distanz + SP × Faktor) und Speicherung im Leaderboard

### Assets & Code
- `public/assets/sprites/coin.png` (4 Drehframes, 12x12)
- `src/coins.js`: Muster, Bewegung, Einsammeln
