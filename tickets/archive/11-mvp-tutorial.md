# Ticket 11: MVP-Tutorial (Spotlight-Momente)

**Type:** Prototype + Build (HITL)  
**Status:** ✅ Closed  

## Question

Wie stellen wir in der MVP-Phase jedes Spielelement einmal vor, und wie liest man in Ruhe, was ein Power-Up macht?

## Resolution

| **Aspekt** | **Entscheidung** |
|---|---|
| **Form** | „Spotlight-Moment“: Das Spiel friert ein, der Bildschirm wird abgedunkelt, das neue Element bekommt einen goldenen Ring, daneben eine Karte mit Icon, Name und Erklärung |
| **Weiter** | Mit **SPACE** (oder Tippen/Klicken). 0,4 s Sperre gegen versehentliches Wegdrücken. Space zum Weiterspielen löst keinen Sprung aus. |
| **Strecke** | Mit Tutorial läuft die MVP-Phase als feste Strecke statt zufällig, damit jedes Element sicher einmal vorkommt |
| **Power-Ups** | Beim Auftauchen: „Jump to grab“. **Beim Fangen** noch einmal anhalten und den Effekt erklären. Der 5-s-Timer startet erst nach dem Weiterspielen. |
| **Häufigkeit** | Wird im Browser gespeichert (`localStorage`). Danach ist das Tutorial aus. |
| **Startscreen** | Checkbox **„START WITH TUTORIAL“**: Beim ersten Besuch ist sie angehakt, danach nicht mehr. Man kann sie jederzeit wieder anhaken. |
| **Sprache** | Englisch (wie der Rest des Spiels) |

### Strecke (Spawn-Distanz)
| m | Element | Karte |
|---|---|---|
| 3 | Block DEADLINE | 1/7 BUZZWORD BLOCKS: SPACE = springen |
| 20 | Block TCO + Münzbogen | 2/7 STORY POINTS |
| 40 | Flieger MEETING + Duck-Münzen | 3/7 FLYING INVITES: ↓ = ducken |
| 62 | Plattform-Treppe (Ebene 2 + 3) mit Münzen | 4/7 ICE PLATFORMS: hoch springen, ↓ = runter |
| 100 | Merkle-Logo + 2 Blöcke zum Ausprobieren | 5/7 MERKLE LOGO, beim Fangen: MERKLE BREAKTHROUGH |
| 150 | Arc-Logo + 2 Blöcke | 6/7 ARC LOGO, beim Fangen: ARC DOUBLE JUMP |
| 200 | Block + Flieger, dann die Production-Linie | 7/7 GO LIVE!: ab hier nur 1 Leben |

Danach laufen die normalen Zufalls-Spawner.

### Code
- `src/tutorial.js`: Strecke, Auslöser, Speicherung
- `src/ui.js` → `showSpotlight()` / `hideSpotlight()`, Checkbox
- `src/game.js`: Zustand `INTRO` (eingefroren wie bei der Pause)
