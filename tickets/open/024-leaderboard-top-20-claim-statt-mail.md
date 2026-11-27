# 024 · Leaderboard: Top 20 per Claim statt E-Mail-Versand

| | |
|---|---|
| **Status** | 🟡 Offen |
| **Typ** | wayfinder:grilling |
| **Zugewiesen** | — |
| **Erstellt** | 2026-11-27 |
| **Erledigt** | — |
| **Hängt zusammen mit** | [004 · Backend-Leaderboard statt localStorage](004-backend-leaderboard-statt-localstorage.md), [022 · Spiel-Modi: freies und getracktes Spiel](../done/022-spiel-modi-freies-und-getracktes-spiel.md) (dieser Vorschlag würde die UUID-pro-E-Mail-Idee aus 022 ersetzen), [008 · Training- vs. Highscore-Modus](../done/008-training-modus-vs-highscore-modus.md) |

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
- **Technik:** Backend-Leaderboard aus [004](004-backend-leaderboard-statt-localstorage.md), mit einer Serverless-Datenbank beim Hosting. Das Routing `/game/<UUID>` aus [022](../done/022-spiel-modi-freies-und-getracktes-spiel.md) wäre damit nicht mehr nötig.
- **Verhältnis zu 022:** Wird 022 durch diesen Vorschlag ersetzt, also freies Spiel für alle und Claim nur für die Top 20? Dann würden 022 und 008 hier aufgehen.

## Verlauf

### 2026-11-27 · Grilling Runde 1: Entscheidungen

- **Q1 Verhältnis zu 022/008:** 024 **ersetzt** 022. Die UUID-Links fallen weg, alle spielen frei unter `/game/`. 022 und 008 werden geschlossen und verweisen auf 024.
- **Q2 Top 20:** Im Board stehen nur geclaimte Einträge. Claimen darf, wer einen höheren Score als Platz 20 hat oder wenn noch keine 20 Einträge da sind. Geprüft wird **auf dem Server** beim Claim.
- **Q3 Zeitfenster:** nur auf dem Game-Over-Screen für genau diesen Lauf, **60 s lang**, **nur einmal**. Ein späteres Nachtragen gibt es nicht.
- **Q4 Verbessern:** Pro Adresse zählt der beste Score. Ein besserer Lauf darf neu claimen und ersetzt den alten Eintrag, ein schlechterer lässt den alten stehen.
- **Q5 Domains:** `@merkle.com` und `@dentsu.com`, als Liste in der Config. Nur ein Format-Check, keine Verifikation.
- **Q6 Nickname:** max. 16 Zeichen, Buchstaben, Ziffern, Leerzeichen, `-` und `.`, in Großbuchstaben angezeigt, kleiner Wortfilter, **keine Emojis**. Angezeigt wird nur der Nickname, nie die Adresse.
- **Q7 Gleichstand:** Der frühere Claim liegt vorn.
- **Q8 Schummelschutz:** **mehr als Klartext-JSON.** Die Spieler sind Webentwickler. Mindestens ein serverseitiges Token pro Spiel mit Zeit-Plausibilität (Zeit → maximal mögliche Meter). Gewünscht ist mehr, z. B. ein Seed pro Spiel und eine signierte Rückmeldung. → Runde 2
- **Q9 Datenschutz:** Die Adressen bleiben im Klartext gespeichert, damit wir z. B. den **Sieger benachrichtigen** können. Angezeigt werden sie nie. Zugriff nur fürs Projektteam, ein kurzer Hinweis auf der Seite. Das Löschdatum steht noch aus.
- **Q10 Technik:** Gehostet wird auf **Vercel** (aus dem GitLab-Repo). Lokal soll es ohne Setup laufen, z. B. mit SQLite. Im Gespräch: Redis oder eine Abstraktion wie **unstorage** mit Adaptern. → Recherche

### 2026-11-27 · Grilling Runde 2: Entscheidungen

Recherche: [docs/research/leaderboard-storage.md](../../docs/research/leaderboard-storage.md)

- **Q11 Speicher:** **libSQL/Turso**, Datenbank `xmas-game-vercel`. Lokal liegt die SQLite-Datei `dev.db` mit demselben Client (nicht im Repo). Region **EU (Frankfurt)**. unstorage wird **nicht** verwendet, weil es keine atomaren Operationen bietet und parallele Claims verloren gingen.
- **Q12 Server-Teil:** Modul `server/api.js`, auf Vercel als Function in `api/`, lokal als Vite-Plugin-Middleware. Secrets (DB-Zugang, HMAC-Schlüssel) liegen als Plattform-Secrets vor, nie im Repo.
- **Q13 Schummelschutz, Kern:** Der Server beobachtet den Lauf.
  1. **Start:** `POST /api/run` liefert eine Run-ID mit Seed, per HMAC signiert. Der Server speichert die Startzeit.
  2. **Checkpoints:** etwa alle 10 s Distanz und SP, monoton steigend und innerhalb der Obergrenzen, geprüft gegen die **Server-Uhr**.
  3. **Claim:** einmalig, höchstens 60 s nach dem letzten Checkpoint, der Score muss zum letzten Checkpoint passen.
- **Q14 Zweite Schicht:** Jede Meldung wird mit einem aus dem Seed abgeleiteten Schlüssel signiert. Das ist bewusst nur **Verschleierung**, ein einfacher `curl` reicht damit aber nicht mehr. Der Seed steuert außerdem den Zufall von Hindernissen und Münzen.
- **Q15 Obergrenzen:** aus `src/config.js` abgeleitet. Meter: 410 px/s × 1,32 ≈ **18 m/s**, SP: ≈ **4 SP/s**, jeweils +15 % Toleranz. Die Werte stehen in der Config.
- **Q16 Fehlgeschlagene Prüfung:** neutrale Meldung „CLAIM REJECTED“, der Lauf wird fürs Team protokolliert. Niemand wird gesperrt oder öffentlich angeprangert.
- **Q17 Löschen:** Die E-Mail-Adressen werden **bis zum 31. Januar manuell vom Team gelöscht**. Es gibt **keinen automatischen Löschjob im Code**, auf der Seite steht nur ein Hinweistext. Danach bleiben nur Nickname und Score.
  - Anleitung:
    ```sql
    -- siehe docs/leaderboard-setup.md (email ist Primärschlüssel -> Platzhalter statt NULL)
    UPDATE claims SET email = 'deleted-' || run_id;
    DELETE FROM runs;
    DELETE FROM rejections;
    ```
  - **Offen:** Wer im Team ist verantwortlich, und wo steht die Erinnerung (Kalender)?

### 2026-11-27 · Umsetzung (Agent, ohne Runde 3 – Details selbst entschieden)

**Gebaut:**
- `server/api.js`: gemeinsame API mit Schema-Anlage, Top 20, Run-Token, Checkpoints und Claim, alles in einer Transaktion.
- `src/online/protocol.js`: Score-Formel, Obergrenzen, E-Mail- und Nickname-Regeln, Wortfilter, HMAC. Gilt gemeinsam für Spiel und Server.
- Adapter:
  - `api/index.js` + `vercel.json` (Rewrite `/api/:path*`)
  - Vite-Plugin in `vite.config.js` (lokal `.data/dev.db`)
- **Seed:** `src/rng.js` (mulberry32). Hindernisse, Münzen, Plattformen, Power-ups und Pilze nutzen den Seed des Laufs, offline einen zufälligen.
- **Spiel:**
  - `src/online/client.js` holt den nächsten Lauf vorab (kein Warten beim Start) und sendet Start, Checkpoints alle 10 s und das Finale.
  - Fällt die API aus, läuft alles offline weiter wie bisher.
- **Game Over:**
  - Claim-Formular nur für Top-20-Läufe: „TOP 20! YOU ARE #n“, Nickname + Firmen-E-Mail, 60-s-Countdown, Datenschutz-Hinweis.
  - Fehlermeldungen laufen über `role="status"`.
  - Beim Tippen reagiert das Spiel nicht mehr auf die Tasten.
- **Leaderboard:** online die echten Top 20 (Überschrift „TOP 20“, eigener Eintrag gold), offline wie bisher „LOCAL TOP 20“. Nicknames werden HTML-escaped.
- **Doku:** [docs/leaderboard-setup.md](../../docs/leaderboard-setup.md) mit Turso-DBs, Secrets, Auswertung und Lösch-SQL.

**Getestet:**
- `npm run test:leaderboard`: 22/22 grün. Geprüft werden:
  - ehrlicher Lauf und Claim, Single-Use, nur Nickname sichtbar
  - schlechterer und besserer Lauf mit derselben Adresse, Domains, Emoji und Wortfilter
  - 60-s-Fenster, 6.000 m nach 10 s, gefälschte Signatur
  - volle Top 20, Protokoll, Offline-Modus
- Browser lokal:
  - Ein echter Lauf (415 PTS) zeigt das Formular. Eine falsche Domain zeigt eine Fehlermeldung, Leerzeichen im Nickname gehen.
  - Der Claim landet auf #1 im HUD und im Leaderboard.
  - Ein Konsolen-Betrug (`distanceMeters = 5000`) wird als `IMPLAUSIBLE` abgelehnt, es erscheint kein Formular.
- Vercel ist nicht lokal getestet, kein Projekt bzw. CLI-Login vorhanden.

**Selbst entschieden (Runde 3 war offen):**
- Geclaimt wird nur auf dem Game-Over-Screen.
- Die Landingpage zeigt (noch) kein Leaderboard.
- Offline gibt es keinen Claim.

**Offen / To-do für das Team:**
1. Turso-DB anlegen und die Umgebungsvariablen in Vercel setzen (Anleitung in `docs/leaderboard-setup.md`). Bis dahin läuft alles offline.
2. Verantwortliche Person für das Löschen bis 31. Januar festlegen.
3. Vercel-Deployment nach dem Setzen der Secrets einmal prüfen (`/api/leaderboard`).
4. Optional (Runde 3): Leaderboard auf der Landingpage, Text für die Einladungsmail.

### 2026-11-27 · Datenbank & erster Live-Test

- Turso-Datenbank `xmas-game-vercel` liegt in Gruppe `default` = `aws-eu-central-1` (Frankfurt).
- Die API ist mit Turso erfolgreich live getestet: `/api/leaderboard` liefert `ok`, `/api/run` legt Läufe an. Tobias hat es im Browser bestätigt.
- Lehre: Ein falsch eingefügter Token führt zu HTTP 401 bei Turso bzw. `SERVER_ERROR` in der API. Werte direkt aus der Turso-CLI übernehmen.

### 2026-11-27 · Hosting nur noch Vercel

Die frühere zweite Hosting-Variante wurde aus dem Projekt entfernt, gehostet wird nur noch auf Vercel aus dem GitLab-Repo.

- **Offen:** Umgebungsvariablen für `xmas-game-vercel` in Vercel setzen und `/api/leaderboard` prüfen. Verantwortliche Person für das Löschen bis 31. Januar festlegen.
