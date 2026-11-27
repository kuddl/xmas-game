# Recherche: Leaderboard-Speicher für Vercel und lokal

**Stand:** 2026-11-27 · **Bezug:** [Ticket 024](../../tickets/open/024-leaderboard-top-20-claim-statt-mail.md) (Q10/Q11 Technik), [004](../../tickets/open/004-backend-leaderboard-statt-localstorage.md)
**Methode:** Nur Primärquellen (Hersteller-Doku, Quellcode auf GitHub, npm-Registry). Jede Aussage hat einen Link. Was nicht selbst nachgelesen wurde, steht als **nicht verifiziert** da.
**Hosting:** Vercel (aus dem GitLab-Repo). Lokal soll es ohne Setup gegen SQLite laufen.

---

## TL;DR

1. **Gewählt: SQL (SQLite-Dialekt) über `@libsql/client`, Turso Cloud als DB.** Lokal läuft derselbe Client gegen `file:./dev.db`, ohne Setup. Rangliste, „eine Adresse = ein Eintrag“ und Single-Use-Läufe lassen sich als atomare SQL-Statements bzw. als eine kurze Transaktion umsetzen.
2. **unstorage nicht für das Leaderboard verwenden.** Die API kennt nur `get`/`set`/`remove` pro Key, TTL je nach Driver. Atomare Ops, Transaktionen, Sorted Sets und Compare-and-Set gibt es nicht; CAS liegt nur als offener PR #772 vor. Ein Top-20-JSON unter einem Key führt bei parallelen Claims zu Lost Updates.
3. **Alternative 2:** `db0` (unjs) mit `libsql/web` auf Vercel und `node-sqlite` lokal. Das SQL bleibt gleich, db0 ist laut Projekt aber noch „early stages“.
4. **Alternative 3:** Upstash Redis (`@upstash/redis`, HTTP). Fachlich gut (ZSET, `SET NX EX`, `GETDEL`, Lua `EVAL` atomar), auf Vercel der offizielle KV-Nachfolger. Lokal braucht es aber Docker (Redis + SRH).
5. **Anbindung:** `server/api.js` mit `handleApi(request, ctx)`. Auf Vercel `api/index.js` mit `export default { fetch }` + Rewrite, lokal ein Vite-`configureServer`-Middleware-Plugin.

---

## Vergleichstabelle

| Option | Vercel | lokal (`npm run dev`) | atomare Rangliste + Eindeutigkeit | TTL / Single-Use | Free Tier | Notizen |
|---|---|---|---|---|---|---|
| **A · libSQL/Turso** (`@libsql/client`) | ✅ „SQL over HTTP“ | ✅ `file:./dev.db`, gleicher Client | ✅ `UNIQUE`/`PRIMARY KEY`, Upsert mit `WHERE`, Transaktion | keine native TTL; Ablauf per Zeitstempel, Single-Use per `UPDATE … WHERE claimed_at IS NULL` | 100 DBs, 5 GB, 500 Mio Rows read, 10 Mio Rows written / Monat | externer Dienst; Banner „Turso is joining Supabase“ |
| **B · db0** (libsql / node-sqlite) | ✅ `libsql/web` (Turso) oder `neon` | ✅ `node-sqlite`, `better-sqlite3` | ✅ gleiches SQL; Transaktionen je Connector verschieden | wie A | je Backend | „early stages“ |
| **C · Upstash Redis** (`@upstash/redis`) | ✅ (Marketplace) | ⚠️ nur mit Docker (Redis + SRH) oder Cloud-DB | ✅ ZSET + Lua `EVAL`, `MULTI/EXEC` | ✅ `SET NX EX`, `GETDEL` | 250 MB, 500k Commands/Monat | Logik in Lua; Free-DB archiviert nach ≥ 30 Tagen Inaktivität |
| **D · unstorage** (beliebiger Driver) | ✅ Blob, Upstash, Runtime Cache | ✅ memory, fs, db0 | ❌ nur get/set pro Key | TTL je Driver | je Backend | nur für simple Key/Value |

---

## Q1 · unstorage: Drivers, Fähigkeiten, Eignung

- **Versionen:** npm `latest` = **`2.0.0-beta.0`** (2026-10-20), v1-Linie zuletzt `1.17.6` ([Releases](https://github.com/unjs/unstorage/releases)). Die Doku https://unstorage.unjs.io zeigt bereits v2.
- **Relevante Drivers** (geprüft in [`src/drivers` @ main](https://github.com/unjs/unstorage/tree/main/src/drivers)):
  - Vercel: `vercel-blob` ✅, `vercel-runtime-cache` („not a persistent store“) ✅, `vercel-kv` **entfernt** in [f15e5d5 (#744)](https://github.com/unjs/unstorage/commit/f15e5d5642) ([drivers/vercel](https://unstorage.unjs.io/drivers/vercel))
  - Redis: `upstash` (HTTP, [drivers/upstash](https://unstorage.unjs.io/drivers/upstash)), `redis` (ioredis, [drivers/redis](https://unstorage.unjs.io/drivers/redis))
  - lokal: `memory`, `fs`, `fs-lite`, `db0` („experimental“, [drivers/database](https://unstorage.unjs.io/drivers/database))
- **API:** `hasItem`, `getItem`, `setItem`, `removeItem`, `getKeys`, `clear`, `getMeta`, `watch`. Keine atomaren Increments, kein CAS, keine Transaktionen, keine Sorted Sets ([src/types.ts](https://github.com/unjs/unstorage/blob/main/src/types.ts)). „Transaction options such as `ttl` are also driver-specific“ ([Guide](https://unstorage.unjs.io/guide)).
- **TTL:** `upstash` und `redis` per `EX`, `memory` per Timer. `db0`, `fs` und `fs-lite` haben keine TTL ([db0.ts](https://github.com/unjs/unstorage/blob/main/src/drivers/db0.ts)).
- **Compare-and-Set:** nur offener PR [#772](https://github.com/unjs/unstorage/pull/772), nicht released.
- **fs-Atomizität:** Issue [#797](https://github.com/unjs/unstorage/issues/797) („writes are not atomic“).
- **Ein JSON-Dokument (Top 20) unter einem Key** wäre Read-Modify-Write ohne CAS: Der letzte Schreiber gewinnt, parallele Claims gehen verloren. Bei `vercel-blob` gilt zusätzlich Last-Write-Wins mit `allowOverwrite` ([Blob SDK](https://vercel.com/docs/vercel-blob/using-blob-sdk)).
- **Single-Use-Nonces:** `getItem` + `removeItem` sind zwei Schritte, zwei parallele Requests kommen beide durch.

**Fazit:** unstorage taugt hier nur für einfache Key/Value-Daten ohne Konkurrenz.

## Q2 · Vercel-Storage-Optionen

- **Vercel KV gibt es nicht mehr:** „Vercel KV is no longer available … we automatically moved it to Upstash Redis in December 2024. For new projects, install a Redis integration from the Marketplace.“ ([vercel.com/docs/redis](https://vercel.com/docs/redis))
- **Vercel Postgres** wurde ebenso zu Neon verschoben ([vercel.com/docs/postgres](https://vercel.com/docs/postgres)).
- **Eigene Produkte heute:** Blob, Global Config, Runtime Cache. Datenbanken kommen über den **Marketplace** („Neon, Upstash, and Supabase“), Redis wird für „real-time leaderboards, and rate limiting“ empfohlen ([vercel.com/docs/storage](https://vercel.com/docs/storage), [marketplace-storage](https://vercel.com/docs/marketplace-storage)).
- **Turso Cloud** ist als Marketplace-Integration vorhanden ([vercel.com/marketplace/tursocloud](https://vercel.com/marketplace/tursocloud)).
- Vom Marketplace injizierte Env-Var-Namen: **nicht verifiziert** (wir setzen `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` selbst).

## Q3 · Upstash Redis (`@upstash/redis`, HTTP)

- **Vercel:** Import `@upstash/redis`, Env `UPSTASH_REDIS_REST_URL`/`_TOKEN` ([Deployment](https://upstash.com/docs/redis/sdks/ts/deployment), [Vercel-Integration](https://upstash.com/docs/redis/howto/vercelintegration)).
- **Sorted Sets:** `ZADD` mit `gt` für „bester Score pro Mitglied“ ([zadd](https://upstash.com/docs/redis/sdks/ts/commands/zset/zadd)).
- **Nonces:** `SET nx ex` ([set](https://upstash.com/docs/redis/sdks/ts/commands/string/set)), `GETDEL` atomar ([getdel](https://upstash.com/docs/redis/sdks/ts/commands/string/getdel)).
- **Atomarität:** `redis.multi()` ([Pipeline & Transaction](https://upstash.com/docs/redis/sdks/ts/pipelining/pipeline-transaction)), Lua `EVAL` als „single atomic step“ ([EVAL](https://upstash.com/docs/redis/commands/scripting/eval)).
- **Free Tier:** 250 MB, 500K Commands/Monat ([pricing](https://upstash.com/pricing/redis.md)). Archivierung nach ≥ 30 Tagen Inaktivität ([FAQ](https://upstash.com/docs/redis/help/faq)).
- **Lokal:** nur mit SRH-Container vor einem lokalen Redis ([Developing](https://upstash.com/docs/redis/sdks/ts/developing)).

## Q4 · Turso / libSQL

- **Pakete:** `@libsql/client` ist „production-ready“. Für neue Remote-Projekte empfiehlt Turso `@tursodatabase/serverless` („fetch only“). Kompatible Runtimes laut Doku: Node.js, Deno, Vercel Edge u. a. ([TS Reference](https://docs.turso.tech/sdk/ts/reference)).
- **Lokal und Cloud mit demselben Client:** `createClient({ url: "file:…" })` lokal. „The `@libsql/client/web` does not support local file URLs“ (dto.). Deshalb nutzt Vercel `@libsql/client/web` (HTTP), lokal den Node-Build ([package.json Exports](https://github.com/tursodatabase/libsql-client-ts/blob/main/packages/libsql-client/package.json)).
- **Vercel:** „SQL over HTTP … works in any runtime“, Env `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` ([Turso + Vercel](https://docs.turso.tech/integrations/vercel)).
- **Transaktionen:** `client.batch([...], "write")` ist eine implizite Transaktion, interaktiv per `client.transaction("write")` ([TS Reference](https://docs.turso.tech/sdk/ts/reference)).
- **Upsert/RETURNING:** Standard-SQLite ([lang_upsert](https://www.sqlite.org/lang_upsert.html), [lang_returning](https://www.sqlite.org/lang_returning.html)).
- **Regionen:** Sie hängen an der Gruppe. Gültige IDs liefert `turso db locations`, z. B. `aws-eu-central-1` (Frankfurt); Kurzcodes wie `fra` werden nicht mehr akzeptiert (CLI v1.0.34, selbst geprüft).
- **Free Tier:** 100 DBs, 5 GB, 500 Mio Rows read, 10 Mio Rows written / Monat ([pricing](https://turso.tech/pricing.md)).

## Q5 · db0 als SQL-Analogon zu unstorage

- Ein API, Connectors pro Plattform ([src/connectors](https://github.com/unjs/db0/tree/main/src/connectors)): `node-sqlite`, `better-sqlite3`, `libsql` (`node`, `http`, `web`), `neon`, `postgresql` u. a.
- **Turso:** über den `libsql`-Connector ([db0 LibSQL](https://db0.unjs.io/connectors/libsql)).
- **Transaktionen je Connector** ([Capabilities](https://db0.unjs.io/guide/capabilities)): ✗ für `libsql-http`/`libsql-web`. Atomare Einzel-Statements wären nötig.
- **Reife:** „DB0 development is in the early stages“ ([README](https://github.com/unjs/db0)).

## Q6 · Anbindung auf Vercel und lokal

- **Vercel:** `api/index.js` mit `export default { fetch(request) }`. „Keep shared utilities and route modules outside `api/`“, weil jede Datei in `api/` eine eigene Function wird. Routing per Rewrite in `vercel.json` ([Functions quickstart](https://vercel.com/docs/functions/quickstart), [Node.js runtime](https://vercel.com/docs/functions/runtimes/node-js), [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)).
- **Env/Secrets:** Dashboard oder `vercel env add`, `vercel env pull` für lokal ([Environment variables](https://vercel.com/docs/environment-variables)).
- **Lokal:** Ein Vite-Plugin mit `configureServer(server) { server.middlewares.use(...) }` ([Vite Plugin API](https://vite.dev/guide/api-plugin#configureserver)) leitet `/api/*` an `handleApi` weiter. `vercel dev` ist nicht nötig („we do not recommend using `vercel dev`“, wenn das eigene Dev-Kommando reicht, [vercel dev](https://vercel.com/docs/cli/dev)).

---

## Offene Risiken

- **Turso-Zukunft:** „Turso is joining Supabase“ ([turso.tech/pricing](https://turso.tech/pricing)). Free Tier und Weiterentwicklung von `@libsql/client` beobachten.
- **Free-Tier-Inaktivität** bei Turso: **nicht verifiziert**.
- **Score-Vertrauen** ist Anwendungslogik (Ticket 024): Server-Uhr, Checkpoints, Single-Use. Der Speicher garantiert nur, dass parallele Claims das Ranking nicht zerstören.
