# 022 · Spiel-Modi: freies Spiel (/game) und getracktes Spiel (/game/UUID)

| | |
|---|---|
| **Status** | 🟡 Offen |
| **Typ** | wayfinder:grilling |
| **Zugewiesen** | — |
| **Erstellt** | 2026-11-26 |
| **Erledigt** | — |
| **Hängt zusammen mit** | [004 · Backend-Leaderboard statt localStorage](004-backend-leaderboard-statt-localstorage.md), [008 · Training-Modus vs. Highscore-Modus](008-training-modus-vs-highscore-modus.md) (überschneidet sich stark, ggf. zusammenlegen) |

## Frage

Das Spiel bekommt **zwei Modi**. Wie genau funktionieren sie, und was braucht es dafür?

- **Freies Spiel** unter `/game/`: beliebig oft spielbar, nichts wird getrackt. So funktioniert das Spiel heute schon.
- **Getracktes Spiel** unter `/game/<UUID>`: Die UUID ist **einer E-Mail-Adresse und einem Nickname** zugeordnet. Das Ergebnis landet im **Leaderboard** unter dem Nickname. Jede E-Mail-Adresse darf **genau einmal** getrackt spielen, aber beliebig oft frei.

## Zu klären (später genauer)

- **Woher kommt die UUID?** Vorab erzeugt und per Mail verschickt, oder holt man sich den Link selbst mit E-Mail und Nickname? Wer legt den Nickname fest?
- **Was zählt als „einmal“?** Beim Start verbraucht, oder erst beim Game Over? Was passiert bei Abbruch, Reload oder Tab-Wechsel?
- **Backend & Speicher:** zusammen mit [004](004-backend-leaderboard-statt-localstorage.md). Zum Beispiel Cloudflare Workers + D1/KV, weil die Seite dort schon läuft.
- **Schummelschutz:** Wie weit vertrauen wir dem Score aus dem Browser (intern, also eher leicht)?
- **Routing (technischer Fakt):** `wrangler.jsonc` nutzt `not_found_handling: single-page-application`. Unbekannte Pfade wie `/game/<UUID>` liefern heute die **Landingpage** (Root-`index.html`) aus, nicht das Spiel. Dafür braucht es eine Weiterleitung im Worker oder eine `_redirects`-Regel.
- **Datenschutz:** E-Mail-Adressen von Merkle-Mitarbeitern. Wer sieht was, wie lange wird gespeichert?
- **UI:** Wie erkennt man im Spiel den getrackten Modus? Was zeigt Game Over, und was das Leaderboard (globale Top 20 statt lokal)?
- **Landingpage:** Führt „PRESS START“ immer ins freie Spiel, oder bei persönlichem Link ins getrackte?

## Verlauf

### 2026-11-27 · Gegenvorschlag

Tobias und Thomas schlagen vor, auf E-Mail-Versand und persönliche UUID-Links zu verzichten. Alle spielen frei, und nur wer in die Top 20 kommt, claimt seinen Platz mit Merkle-Adresse und Nickname. Details und offene Punkte: [024 · Leaderboard: Top 20 per Claim statt E-Mail-Versand](024-leaderboard-top-20-claim-statt-mail.md). Wird 024 angenommen, geht 022 darin auf.
