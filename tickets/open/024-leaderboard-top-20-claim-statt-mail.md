# 024 · Leaderboard: Top 20 per Claim statt E-Mail-Versand

| | |
|---|---|
| **Status** | 🟡 Offen |
| **Typ** | wayfinder:grilling |
| **Zugewiesen** | — |
| **Erstellt** | 2026-11-27 |
| **Erledigt** | — |
| **Hängt zusammen mit** | [004 · Backend-Leaderboard statt localStorage](004-backend-leaderboard-statt-localstorage.md), [022 · Spiel-Modi: freies und getracktes Spiel](022-spiel-modi-freies-und-getracktes-spiel.md) (dieser Vorschlag würde die UUID-pro-E-Mail-Idee aus 022 ersetzen), [008 · Training- vs. Highscore-Modus](008-training-modus-vs-highscore-modus.md) |

## Frage ans Team

**Seid ihr mit dieser Leaderboard-Mechanik einverstanden?** Vorschlag von Tobias und Thomas, 2026-11-27.

## Vorschlag

- **Kein E-Mail-Versand.** Mails zu verschicken ist auch intern kritisch: Welche Absenderadresse nehmen wir, und brauchen wir eine Genehmigung? Damit würden wir ein großes Fass aufmachen. Wir verzichten darauf.
- **Leaderboard mit den Top 20.** Nur wer es mit einem Lauf in die Top 20 schafft, darf am Spielende seinen Highscore **claimen**.
  - Beispiel: Ich sterbe mit 5.000 Punkten, das wäre Platz 2 → ich kann claimen.
  - Wer auf Platz 21 oder 22 landet, bekommt gar keine Möglichkeit zum Claimen.
- **Claimen:** Man gibt eine **Merkle-E-Mail-Adresse** und einen **Nickname** ein und bekommt damit den Platz im Leaderboard. Beispiel: „Rudolf the Red-Nosed Reindeer“ mit tobias.sailer@merkle.com.
- **Eine Adresse, ein Eintrag:** Jede E-Mail-Adresse erscheint genau einmal im Leaderboard.
- **Missbrauchsschutz:** Wer nicht in den Top 20 ist, kann keine fremde Adresse eintragen und damit niemanden blockieren. Wer nach 2.000 Punkten stirbt, kann also nicht „armin.wurmser@merkle.com“ eintragen, um Armin zu sperren.
  - Wer in den Top 20 ist, könnte theoretisch eine fremde Adresse eintragen, z. B. Armin einen Thomas auf Platz 2 setzen. Er verschenkt damit aber nur seinen eigenen Platz. Sinnvoll schummeln kann man so nicht.
- **Vorteil:** kein E-Mail-Provider, keine Freigabe durch die Firma nötig.
- **Zusatzidee:** Die Spiel-URL verschicken wir trotzdem, verpackt in einer schönen **Einladungsmail**. Die verschickt ein Mensch über ganz normale Firmenmail, das System selbst verschickt nichts.

## Offene Punkte

- **Verbessern:** Wer schon in den Top 20 steht und später einen besseren Score erreicht, soll sich **neu claimen** dürfen. Dann ersetzt der neue Score den alten, und die Adresse steht weiter nur einmal im Board. Bisher stand „Verbesserung um einen Platz“ im Raum. Genau definieren:
  - Wird der alte Eintrag ersetzt, oder zählt nur der beste Score pro Adresse?
  - Beispiel: Tobias steht auf Platz 3, Armin auf Platz 5. Armin spielt noch einmal und erreicht Platz 2. Er darf neu claimen, sein alter Platz 5 wird frei, und alle rücken auf.
- **Verdrängte Einträge:** Wer aus den Top 20 rausfällt, verschwindet. Oder speichern wir intern mehr als 20 Einträge?
- **Prüfung der Adresse:** Reicht ein Format-Check (`…@merkle.com`, ggf. weitere Firmen-Domains wie dentsu)? Es gibt keine Bestätigungsmail, also ist die Adresse nicht verifiziert. Das ist bewusst so.
- **Anzeige:** Im Leaderboard steht nur der **Nickname**, nie die E-Mail-Adresse. Braucht es Regeln für Nicknames (Länge, Filter für Anstößiges)?
- **Zeitfenster:** Wie lange nach dem Game Over kann man claimen? Nur direkt auf dem Game-Over-Screen, oder auch später?
- **Gleichstand:** Wer liegt bei gleichem Score vorn, der frühere oder der spätere Lauf?
- **Score-Vertrauen:** Der Score kommt aus dem Browser. Intern reicht vermutlich eine einfache Plausibilitätsprüfung (z. B. Score passend zur Laufzeit).
- **Datenschutz:** Wir speichern E-Mail-Adressen. Wo, wie lange (z. B. Löschung nach der Weihnachtsaktion), und wer hat Zugriff?
- **Technik:** Backend-Leaderboard aus [004](004-backend-leaderboard-statt-localstorage.md), z. B. Cloudflare Worker + D1/KV, weil die Seite dort schon läuft. Das Routing `/game/<UUID>` aus [022](022-spiel-modi-freies-und-getracktes-spiel.md) wäre damit nicht mehr nötig.
- **Verhältnis zu 022:** Wird 022 durch diesen Vorschlag ersetzt, also freies Spiel für alle und Claim nur für die Top 20? Dann würden 022 und 008 hier aufgehen.

## Verlauf
