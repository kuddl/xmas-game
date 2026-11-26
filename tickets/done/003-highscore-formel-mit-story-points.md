# 003 · Highscore-Formel mit Story Points

| | |
|---|---|
| **Status** | ✅ Erledigt |
| **Typ** | wayfinder:grilling |
| **Zugewiesen** | kuddl |
| **Erstellt** | 2026-11-25 |
| **Erledigt** | 2026-11-26 |
| **Herkunft** | GitHub [#3](https://github.com/kuddl/xmas-game/issues/3) |

## Question

Wie fließen die **Story Points** (Goldmünzen) in den Highscore ein, und wie werden Punkte im Leaderboard gespeichert und angezeigt?

## Ausgangslage
- Bisher zählt nur die Distanz (Meter). Die Story Points werden gesammelt und im HUD bzw. auf dem Game-Over-Screen angezeigt, gehen aber nicht in den Score ein.
- Ursprüngliche Idee: Die SP werden „als Bonus mit in die Zeit verrechnet“.

## Zu entscheiden
- Formel, z. B. `Score = Meter + SP × Faktor`, oder SP als Zeit- bzw. Distanzbonus
- Zählen SP aus der MVP-Phase mit?
- Was zeigt das Leaderboard an: nur den Gesamt-Score oder Meter und SP getrennt?
- Zählen Power-Ups (z. B. zerschmetterte Blöcke) extra?

Übernommen aus der Fog-Notiz „Highscore-Formel mit Story Points“. Das Backend-Leaderboard hängt davon ab.

## Verlauf

### 2026-11-26 · kuddl

## Entscheidung

- **Formel:** `SCORE = Meter + SP × 10` (Addition, Einheit **PTS**). Den Faktor gibt es als `SP_SCORE_FACTOR: 10` in `src/config.js`.
- **MVP-Phase:** SP aus der MVP-Phase zählen mit.
- **Breakthrough:** Jeder zerschlagene Block bringt **+5 SP (= 50 PTS)**, mit kleiner Animation. Einen eigenen Bonus gibt es nicht, SP bleiben die einzige Währung.
- **Anzeige:**
  - HUD: Meter und SP wie bisher, dazu groß der SCORE
  - Game Over: Meter, SP und der SCORE als Summe
  - Leaderboard: sortiert nach SCORE, nur der Gesamtwert
- **Bestehende lokale Highscores** (in Metern gespeichert) werden beim Umstellen zurückgesetzt.

Umsetzung: [#15](015-score-formel-meter-sp-10-und.md). Damit ist auch [#4](../open/004-backend-leaderboard-statt-localstorage.md) (Backend-Leaderboard) entsperrt: gespeichert wird der SCORE.
