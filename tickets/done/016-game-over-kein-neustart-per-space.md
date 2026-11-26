# 016 · Game Over: kein Neustart per SPACE, Buttons für Leaderboard und Neu starten

| | |
|---|---|
| **Status** | ✅ Erledigt |
| **Typ** | bug, enhancement |
| **Zugewiesen** | kuddl |
| **Erstellt** | 2026-11-26 |
| **Erledigt** | 2026-11-26 |
| **Herkunft** | GitHub [#16](https://github.com/kuddl/xmas-game/issues/16) |

## Problem
Auf dem Game-Over-Screen startet **SPACE** sofort einen neuen Lauf. Weil man beim Spielen ständig SPACE drückt, landet man oft **ungewollt** im nächsten Lauf und sieht den Game-Over-Screen gar nicht richtig.

Ursache: `src/game.js` Keydown-Handler, `state === 'GAME_OVER'` → `startRun()` bei Space/ArrowUp/W.

## Lösung
- **SPACE (und ↑/W) starten auf dem Game-Over-Screen nichts mehr.**
- Der Game-Over-Screen bekommt **zwei Buttons**, die man mit der Maus bzw. per Tap auslöst:
  - **VIEW LEADERBOARD** → eigener Leaderboard-Screen (von dort wieder *Neu starten*)
  - **PLAY AGAIN** → neuer Lauf
- Kein Enter-Shortcut nötig.

## Offen (beim Umsetzen klären)
- Inhalt des Leaderboard-Screens: im Moment nur die lokalen Highscores (Top 5 in `localStorage`). Das echte Backend-Leaderboard kommt mit [#4](../open/004-backend-leaderboard-statt-localstorage.md).
- Startscreen: Dort soll SPACE zum Starten weiter funktionieren (nur Game Over ändert sich).

## Verlauf

### 2026-11-26 · kuddl

Umgesetzt in e5b2e48:
- SPACE, ↑ und W starten auf dem Game-Over-Screen nichts mehr. Auf dem Startscreen startet SPACE weiterhin das Spiel.
- Buttons **VIEW LEADERBOARD** und **PLAY AGAIN**, nur per Maus bzw. Tap. Sie verlieren nach dem Klick den Fokus und sind 600 ms nach dem Tod gesperrt (`GAME_OVER_INPUT_LOCK_MS`), damit ein Sprung-Klick nicht sofort neu startet.
- Leaderboard-Screen: lokale **Top 20** (`LEADERBOARD_SIZE`) in zwei Spalten. Leere Plätze stehen als Platzhalter da, der letzte Lauf ist gold markiert. BACK und PLAY AGAIN.
- Das Backend-Leaderboard bleibt [#4](../open/004-backend-leaderboard-statt-localstorage.md).
