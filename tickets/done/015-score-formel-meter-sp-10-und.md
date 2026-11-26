# 015 · Score-Formel (Meter + SP × 10) und +5 SP pro Breakthrough-Block umsetzen

| | |
|---|---|
| **Status** | ✅ Erledigt |
| **Typ** | enhancement |
| **Zugewiesen** | kuddl |
| **Erstellt** | 2026-11-26 |
| **Erledigt** | 2026-11-26 |
| **Herkunft** | GitHub [#15](https://github.com/kuddl/xmas-game/issues/15) |

## Ziel
Umsetzung der Entscheidung aus [#3](003-highscore-formel-mit-story-points.md): Die Story Points gehen in den Score ein, und zerschlagene Breakthrough-Blöcke bringen SP.

## Score-Formel
- `SCORE = Meter + SP × SP_SCORE_FACTOR`, neu in `src/config.js`: `SP_SCORE_FACTOR: 10`
- Einheit **PTS**
- SP aus der MVP-Phase zählen mit.

## Breakthrough: +5 SP pro Block
- Während **MERKLE BREAKTHROUGH** bringt jeder zerschlagene Buzzword-Block **+5 SP (= 50 PTS)**, neu in `src/config.js`: `BREAKTHROUGH_SMASH_SP: 5`
- Einen eigenen Bonus gibt es nicht, SP bleiben die einzige Währung.
- **Kleine Animation:** ein aufsteigendes, ausblendendes **„+5 SP“** an der Stelle des Blocks, eventuell mit Münzfunken
- Code: In `src/game.js` (ca. Z. 428) wird bisher nur `obstacles.smash()` und `effects.burst(...)` aufgerufen. Dort `storyPoints += 5` ergänzen und `ui.updateStoryPoints()` aufrufen.

## Anzeige
- **HUD:** Meter und SP wie bisher, dazu groß der **SCORE**
- **Game Over:** Meter, SP und der SCORE als Summe
- **Leaderboard:** sortiert nach SCORE, nur der Gesamtwert pro Eintrag. Der Highscore im HUD zeigt ebenfalls SCORE.
- **Lokale Highscores zurücksetzen:** Die alten Werte in `localStorage` sind Meter. `LEADERBOARD_KEY` auf eine neue Version setzen, damit Meter- und PTS-Werte nicht gemischt werden.

## Fertig, wenn
- [ ] Der Score wird nach der Formel berechnet und überall angezeigt (HUD, Game Over, Leaderboard).
- [ ] Ein zerschlagener Block bringt +5 SP, mit sichtbarer „+5 SP“-Animation.
- [ ] Alte Meter-Highscores tauchen nicht mehr auf.

Entscheidung: [#3](003-highscore-formel-mit-story-points.md)

## Verlauf

### 2026-11-26 · kuddl

Umgesetzt in 7c99167:
- `SCORE = Meter + SP × 10` (`SP_SCORE_FACTOR`), +5 SP pro zerschlagenem Block (`BREAKTHROUGH_SMASH_SP`)
- „+5 SP“-Float-Text mit Goldfunken
- HUD mit SCORE als Hauptzahl, Game Over mit Aufschlüsselung, Leaderboard in PTS
- neuer Leaderboard-Key `_v2`, die alten Meter-Scores fallen weg
