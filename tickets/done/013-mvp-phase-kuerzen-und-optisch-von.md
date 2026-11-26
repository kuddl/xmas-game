# 013 · MVP-Phase kürzen und optisch von Production abheben

| | |
|---|---|
| **Status** | ✅ Erledigt |
| **Typ** | enhancement |
| **Zugewiesen** | kuddl |
| **Erstellt** | 2026-11-26 |
| **Erledigt** | 2026-11-26 |
| **Herkunft** | GitHub [#13](https://github.com/kuddl/xmas-game/issues/13) |

## Ziel
Die MVP-Phase soll **schneller vorbei sein** und sich **sichtbar von Real Production unterscheiden**. Ergebnis aus dem Playtest zu [#2](002-hindernis-generator-regeln-bestaetigen-oder-muster.md).

## Aufgaben
- **MVP kürzen:** `MVP_DISTANCE_METERS` in `src/config.js` senken (aktuell 250 m).
  - Achtung: Die Tutorial-Schritte in `src/tutorial.js` liegen bei 3 / 20 / 40 / 62 / 100 / 150 / 200 m. Sie müssen zusammengeschoben werden, damit alle vor dem Ende der MVP-Phase kommen.
- **MVP-Hintergrund unterscheiden:** Hintergrund in der MVP-Phase entweder **unscharf** oder mit **anderem Farbton**. Beim Übergang zu Production wird er wieder normal, am besten mit weichem Übergang.

## Offen (beim Umsetzen klären)
- Neue Länge: Vorschlag 150 m
- Blur oder Farbton (oder beides)? Gameplay-Objekte (Hindernisse, Coins, Spieler) bleiben scharf, nur der Hintergrund ändert sich.

## Verlauf

### 2026-11-26 · kuddl

Umgesetzt in f8373f5:
- MVP-Phase **175 m** (vorher 250 m), Tutorial-Schritte bei 3 / 15 / 28 / 42 / 60 / 100 / 130 m
- **Staging-Look:** Himmel und Parallax-Ebenen kühl, entsättigt und leicht unscharf. Boden und Gameplay-Objekte bleiben scharf.
- Hinter der REAL-PRODUCTION-Linie blendet der Hintergrund in **1 s** auf volle Farben über.
- Tuning: `GAME_CONFIG.MVP_BACKDROP` in `src/config.js`
