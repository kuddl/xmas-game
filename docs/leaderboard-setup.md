# Online-Leaderboard: Setup & Betrieb

Bezug: [Ticket 024](../tickets/open/024-leaderboard-top-20-claim-statt-mail.md) · Recherche: [research/leaderboard-storage.md](research/leaderboard-storage.md)

Ohne Konfiguration antwortet die API mit `503 OFFLINE`, und das Spiel nutzt wie bisher das **lokale** Leaderboard. Nichts geht kaputt, solange die Umgebungsvariablen fehlen.

## Überblick

| | Vercel (aus GitLab) | lokal (`npm run dev`) |
|---|---|---|
| Einstieg | `api/index.js` + Rewrite `/api/:path*` in `vercel.json` | Vite-Plugin in `vite.config.js` |
| Logik | `server/api.js` | `server/api.js` |
| Datenbank | Turso (libSQL) `xmas-game-vercel` | SQLite-Datei `.data/dev.db` (nicht im Repo) |

Endpunkte: `GET /api/leaderboard`, `POST /api/run`, `POST /api/run/start`, `POST /api/run/checkpoint`, `POST /api/claim`. Das Schema legt der Server beim ersten Aufruf selbst an (`CREATE TABLE IF NOT EXISTS`).

## Einmalig einrichten

### 1. Turso-Datenbank (Region EU / Frankfurt)

Bei Turso hängt die Region an der **Gruppe**. Die Gruppe `default` liegt in Frankfurt (`aws-eu-central-1`), prüfen mit `turso group list`. Gültige Regionen listet `turso db locations`.

```sh
turso auth login
turso db create xmas-game-vercel              # falls noch nicht vorhanden
turso db show xmas-game-vercel --url          # -> TURSO_DATABASE_URL (libsql://…)
turso db tokens create xmas-game-vercel       # -> TURSO_AUTH_TOKEN
```

### 2. Signier-Schlüssel erzeugen

```sh
openssl rand -hex 32   # -> LEADERBOARD_SECRET
```

### 3. Umgebungsvariablen in Vercel

Project → Settings → Environment Variables (Production): `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `LEADERBOARD_SECRET`. Danach neu deployen.

Tipp gegen Copy-and-Paste-Fehler (ein falscher Token führt zu HTTP 401 bei Turso bzw. `SERVER_ERROR` in der API): Werte direkt aus der CLI übernehmen, z. B. `turso db tokens create xmas-game-vercel | pbcopy`.

### 4. Prüfen

`https://<vercel-domain>/api/leaderboard` → `{"ok":true,"size":20,"entries":[]}`

## Lokal

`npm run dev` startet das Spiel mit lokaler API unter `/api/*`, gegen `.data/dev.db`. Zum Zurücksetzen die Datei löschen. Der Selbsttest der Server-Logik läuft mit `npm run test:leaderboard` (temporäre DB, simulierte Uhr).

## Schummelschutz (Kurzfassung)

1. `POST /api/run` liefert eine Run-ID, einen Seed und einen Run-Key. Der Key wird vom Server aus `LEADERBOARD_SECRET` abgeleitet, der Seed steuert den Zufall des Laufs.
2. `POST /api/run/start` startet die **Server-Uhr**.
3. Etwa alle 10 s ein Checkpoint mit Distanz und SP. Der Server prüft gegen seine eigene Uhr: Höchsttempo × Zeit, SP-Rate × Zeit (+15 %), nur steigende Werte, Signatur.
4. Der letzte Checkpoint (`final`) beendet den Lauf. Danach darf er **einmalig und höchstens 60 s lang** geclaimt werden, und nur, wenn er in die Top 20 kommt.
5. Abgelehnte Meldungen landen in der Tabelle `rejections` (Grund, Details, IP), zum Nachsehen fürs Team.

Die Signatur im Browser ist bewusst nur Verschleierung. Der echte Schutz ist die Server-Uhr.

## Auswerten

```sql
-- aktuelle Top 20
SELECT nickname, score, email, datetime(claimed_at / 1000, 'unixepoch') AS claimed
FROM claims ORDER BY score DESC, claimed_at ASC LIMIT 20;

-- Auffälligkeiten
SELECT reason, detail, ip, datetime(at / 1000, 'unixepoch') AS at FROM rejections ORDER BY at DESC;
```

(`turso db shell xmas-game-vercel`)

## Löschen bis 31. Januar (manuell, kein automatischer Job)

Ausführen, nachdem der Sieger benachrichtigt ist:

```sql
UPDATE claims SET email = 'deleted-' || run_id;  -- Adressen entfernen, Nickname + Score bleiben
DELETE FROM runs;                                 -- Lauf-Protokolle inkl. IPs
DELETE FROM rejections;                           -- Ablehnungs-Protokoll inkl. IPs
```

Hinweis: `email` ist Primärschlüssel, deshalb wird sie durch einen eindeutigen Platzhalter ersetzt statt auf `NULL` gesetzt.

**Verantwortlich:** _noch festlegen (siehe Ticket 024)_
