# 017 · Coin-Wolke in der Luft während Arc Double Jump

| | |
|---|---|
| **Status** | ✅ Erledigt |
| **Typ** | backlog |
| **Zugewiesen** | — |
| **Erstellt** | 2026-11-26 |
| **Erledigt** | 2026-11-26 |
| **Herkunft** | GitHub [#17](https://github.com/kuddl/xmas-game/issues/17) |

## Idee
Während **ARC DOUBLE JUMP** aktiv ist, erscheint in der Luft eine **Coin-Wolke**: ein dichter Haufen Münzen, in den man reinspringt und auf einen Schlag viele Story Points einsammelt. Belohnung dafür, dass man das Arc-Logo erwischt und den Doppelsprung nutzt.

> Hinweis: Den Double Jump gibt das **Arc-Logo**. Das Merkle-Logo ist Breakthrough.

## Rahmen
- Spawnt nur, solange Double Jump aktiv ist (oder direkt nach dem Einsammeln des Arc-Logos), in einer freien Lücke ohne Hindernisse darunter
- Form: lockere Wolke bzw. Cluster aus Münzen (z. B. 3–4 Reihen versetzt), die bestehenden Coin-Sprites
- Höhe: etwa auf Ebene 2 oder höher (siehe unten)
- Einsammeln wie normale Münzen, 1 SP pro Münze, damit ×10 im Score

## Fakten zur Höhe (aktuelle `config.js`)
| | Höhe über Boden |
|---|---|
| Ebene 2 (`PLATFORM_LEVELS[0]`) | 72 px |
| Ebene 3 (`PLATFORM_LEVELS[1]`) | 144 px |
| Einfacher Sprung, Füße am Scheitel | ca. 86 px, Kopf ca. 134 px |
| Doppelsprung, Füße am Scheitel | ca. 157 px, Kopf ca. 205 px |

Eine Wolke **genau auf Ebene 2** erreicht man also auch **ohne** Double Jump. Damit man den Doppelsprung wirklich braucht, muss die Wolke etwa **ab 140 px** anfangen.

## Offen
- Höhe: auf Ebene 2 (für alle erreichbar, mit Doppelsprung trifft man mehr Münzen) oder erst ab ca. 140 px (nur mit Doppelsprung)?
- Anzahl der Münzen pro Wolke (Vorschlag 15–20, also 150–200 PTS)
- Eine Wolke pro Double Jump oder mehrere?
- Bekommt die Wolke eine eigene Optik (z. B. weiße Pixel-Wolke hinter den Münzen) oder sind es nur Münzen?

## Verlauf

### 2026-11-26 · kuddl

Umgesetzt in 39c1f2c:
- **18 Münzen** (Reihen 6/7/5) auf 152–192 px Höhe vor einer Pixel-Wolke (`coin-cloud.png`). Mit einfachem Sprung kommt man nicht hin, nur mit dem Doppelsprung. Im Script-Test: einfacher Sprung 0 SP, Doppelsprung 7 SP.
- Die Wolke erscheint 0,6 s nach dem Einsammeln des Arc-Logos und ploppt auf. In Production bleibt der Boden darunter frei von Hindernissen und Plattformen.
- Werte zum Tunen: `GAME_CONFIG.COIN_CLOUD`. Das Sprite liegt auch in Figma (ABX Game Assets → Pickups & Effects).
