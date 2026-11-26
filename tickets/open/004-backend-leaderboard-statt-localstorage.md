# 004 · Backend-Leaderboard statt localStorage

| | |
|---|---|
| **Status** | 🟡 Offen |
| **Typ** | enhancement, backlog |
| **Zugewiesen** | — |
| **Erstellt** | 2026-11-25 |
| **Erledigt** | — |
| **Herkunft** | GitHub [#4](https://github.com/kuddl/xmas-game/issues/4) |

Die Highscores liegen bisher nur lokal im Browser (`localStorage`). Für das Kundenspiel brauchen wir eine gemeinsame Rangliste.

Offene Punkte: Spielername bzw. Eingabe am Game Over, Speicherung (z. B. Cloudflare D1/KV, das Deployment läuft schon auf Cloudflare Workers), Schutz gegen manipulierte Scores.

Hängt von [#3](../done/003-highscore-formel-mit-story-points.md) (Highscore-Formel mit Story Points) ab.
