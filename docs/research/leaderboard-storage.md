# Recherche: Leaderboard-Speicher für Cloudflare Workers, Vercel und lokal

**Stand:** 2026-11-27 · **Bezug:** [Ticket 024](../../tickets/open/024-leaderboard-top-20-claim-statt-mail.md) (Q10 Technik), [004](../../tickets/open/004-backend-leaderboard-statt-localstorage.md)
**Methode:** Nur Primärquellen (Hersteller-Doku, Quellcode auf GitHub, npm-Registry). Jede Aussage hat einen Link. Was ich nicht selbst nachgelesen habe, steht als **nicht verifiziert** da.

---

## TL;DR

1. **Erste Wahl: SQL (SQLite-Dialekt) über `@libsql/client`, Turso Cloud als DB.** Es gibt zwei Turso-Datenbanken, eine pro Deployment (Cloudflare bzw. Vercel). Lokal läuft derselbe Client gegen `file:./dev.db`, ohne Setup. Rangliste, „eine Adresse = ein Eintrag“ und Single-Use-Tokens sind je **ein atomares SQL-Statement** (`UNIQUE`/`PRIMARY KEY`, `INSERT … ON CONFLICT … WHERE`). Dafür braucht es weder Transaktionen noch Locks.
2. **unstorage nicht für das Leaderboard verwenden.** Die API kennt nur `get`/`set`/`remove` pro Key, TTL je nach Driver. Atomare Ops, Transaktionen, Sorted Sets und Compare-and-Set gibt es nicht; CAS liegt als offener PR #772 vor, ist aber nicht gemergt. Ein Top-20-JSON unter einem Key führt auf jedem Driver zu Lost Updates, und Nonces lassen sich damit nicht sicher einmalig verbrauchen.
3. **Alternative 2:** `db0` mit nativer DB pro Plattform: D1 auf Cloudflare, libSQL/Turso auf Vercel, `node-sqlite` lokal. Das SQL bleibt gleich und Cloudflare braucht keinen externen Account. db0 ist laut Projekt aber „early stages“, die Transaktionssemantik unterscheidet sich je Connector, und es entsteht mehr Adapter-Code.
4. **Alternative 3:** Upstash Redis (`@upstash/redis`, HTTP). Das passt fachlich sehr gut (ZSET, `SET NX EX`, `GETDEL`, Lua `EVAL` atomar) und läuft auf CF und Vercel. Lokal braucht es aber Docker (Redis + SRH-Proxy), also kein Zero-Setup, und die Claim-Logik steckt in Lua.
5. **Ablauf ist für alle Optionen gleich:** eine gemeinsame `handleApi(request, config)`-Funktion, auf Cloudflare über `main` + `assets.run_worker_first: ["/api/*"]`, auf Vercel über `api/index.js` mit `export default { fetch }` + Rewrite, lokal über ein Vite-`configureServer`-Middleware-Plugin.

---

## Vergleichstabelle

| Option | Cloudflare Workers | Vercel | lokal (`npm run dev`) | atomare Rangliste + Eindeutigkeit | TTL / Single-Use-Nonce | Free Tier | Notizen |
|---|---|---|---|---|---|---|---|
| **A · libSQL/Turso** (`@libsql/client`) | ✅ Web-Build (`workerd`-Export) (s. Q5) | ✅ „SQL over HTTP“ (s. Q5) | ✅ `file:./dev.db` gleicher Client (s. Q5) | ✅ SQL `UNIQUE`, Upsert mit `WHERE`, `batch()` = Transaktion | Keine native TTL. Ablauf über signierten `exp` im Token, Single-Use über `PRIMARY KEY(run_id)` | 100 DBs, 5 GB, 500 Mio Rows read, 10 Mio Rows written / Monat (s. Q5) | Externer Dienst auch auf CF. Banner „Turso is joining Supabase“ (Risiko) |
| **B · db0** (D1 / libSQL / node-sqlite) | ✅ `cloudflare-d1` (nur Binding) | ✅ `libsql/web` (Turso) oder `neon` | ✅ `node-sqlite`, `better-sqlite3` | ✅ gleiches SQL; Transaktion je Connector verschieden (D1: kein `BEGIN`) | wie A | D1: 5 Mio Rows read, 100k Rows written / Tag (s. Q4) | db0 „early stages“; keine `batch()`-Abstraktion verifiziert |
| **C · Upstash Redis** (`@upstash/redis`) | ✅ `@upstash/redis/cloudflare` | ✅ (Marketplace) | ⚠️ nur mit Docker (Redis + SRH) oder echter Cloud-DB | ✅ ZSET + Lua `EVAL` atomar, `MULTI/EXEC` | ✅ `SET NX EX`, `GETDEL`, `EXPIRE` | 250 MB, 500k Commands/Monat; Archivierung nach ≥ 30 Tagen Inaktivität | Logik in Lua; Free-DB kann „einschlafen“ |
| **D · unstorage** (beliebiger Driver) | ✅ KV/R2/Cache-Binding | ✅ Blob, Upstash, Runtime Cache | ✅ memory, fs, db0 | ❌ nur get/set pro Key, kein CAS/Transaktion | TTL je Driver (Upstash, Redis, KV ≥ 60 s, memory); db0/fs: keine | je Backend | nur für simple Key/Value |
| **E · Cloudflare KV direkt** | ✅ | ❌ (nur REST-API) | ✅ Miniflare | ❌ eventual consistent, Last-Write-Wins, 1 Write/s/Key | TTL ≥ 60 s, aber nicht atomar | 1.000 Writes/Tag (Free) | für Leaderboard ungeeignet |
| **F · D1 direkt / Durable Objects** | ✅ stark konsistent | ❌ (D1-REST ist Control Plane; DO nur in Workers) | ✅ Wrangler/Miniflare | ✅ | wie A (D1) bzw. DO-Alarm (nicht verifiziert) | D1 s. o.; DO-SQLite im Free Plan | nur Cloudflare, Vercel bräuchte zweite Lösung |

---

## Q1 · unstorage: Drivers, Fähigkeiten, Eignung

### Versionen

- npm `latest` = **`2.0.0-beta.0`**, Release vom 2026-10-20, v1-Linie zuletzt `1.17.6` (`npm view unstorage dist-tags`; [Releases](https://github.com/unjs/unstorage/releases)). Die Doku-Seite https://unstorage.unjs.io zeigt bereits den Stand von `main` (v2): Die Vercel-Seite führt kein „Vercel KV“ mehr ([unstorage.unjs.io/drivers/vercel](https://unstorage.unjs.io/drivers/vercel)).

### Drivers (geprüft per GitHub API auf [`src/drivers` @ main](https://github.com/unjs/unstorage/tree/main/src/drivers) und [`@ v1`](https://github.com/unjs/unstorage/tree/v1/src/drivers))

| Plattform | Driver | in `main` (v2) | in `v1` | Doku |
|---|---|---|---|---|
| Cloudflare | `cloudflare-kv-binding` | ✅ | ✅ | [drivers/cloudflare](https://unstorage.unjs.io/drivers/cloudflare) |
| Cloudflare | `cloudflare-kv-http` | ✅ | ✅ | dto. |
| Cloudflare | `cloudflare-r2-binding` („experimental“) | ✅ | ✅ | dto. |
| Cloudflare | `cloudflare-cache-binding` (Cache API, kein `getKeys`) | ✅ | ❌ | dto. |
| Cloudflare | **D1** | ❌ kein eigener Driver, nur indirekt über `db0`-Driver + db0-Connector `cloudflare-d1` | – | [drivers/database](https://unstorage.unjs.io/drivers/database), [db0 Cloudflare](https://db0.unjs.io/connectors/cloudflare) |
| Vercel | `vercel-kv` | ❌ **entfernt** in [f15e5d5 „remove deprecated `@vercel/kv` driver (#744)“](https://github.com/unjs/unstorage/commit/f15e5d5642), 2026-02-25 | ✅ ([v1-Doku](https://github.com/unjs/unstorage/blob/v1/docs/2.drivers/vercel.md)) | – |
| Vercel | `vercel-blob` | ✅ | ✅ | [drivers/vercel](https://unstorage.unjs.io/drivers/vercel) |
| Vercel | `vercel-runtime-cache` („not a persistent store“) | ✅ | ✅ | dto. |
| Redis/HTTP | `upstash` (nutzt `@upstash/redis`) | ✅ | ✅ | [drivers/upstash](https://unstorage.unjs.io/drivers/upstash) |
| Redis/TCP | `redis` (nutzt `ioredis`) | ✅ | ✅ | [drivers/redis](https://unstorage.unjs.io/drivers/redis) |
| lokal | `memory`, `fs`, `fs-lite` | ✅ | ✅ | [drivers/memory](https://unstorage.unjs.io/drivers/memory), [drivers/fs](https://unstorage.unjs.io/drivers/fs) |
| lokal/SQL | `db0` (sqlite, libsql, postgresql, mysql; „experimental“) | ✅ | ✅ | [drivers/database](https://unstorage.unjs.io/drivers/database) |

### Fähigkeiten der API

- **Interface:** Ein Driver hat `hasItem`, `getItem`, `getItems`, `setItem`, `setItems`, `removeItem`, `getKeys`, `clear`, `getMeta`, `watch`, `dispose`. Atomare Increments, CAS, Transaktionen oder Sorted Sets gibt es nicht. `TransactionOptions` ist nur `Record<string, any>` mit `// TODO: type ttl` ([src/types.ts](https://github.com/unjs/unstorage/blob/main/src/types.ts)). „Transaction options such as `ttl` are also driver-specific“ ([Guide](https://unstorage.unjs.io/guide)).
- **TTL pro Driver** (im Quellcode geprüft):
  - `upstash`: `set(key, value, { ex: ttl })` ([upstash.ts](https://github.com/unjs/unstorage/blob/main/src/drivers/upstash.ts))
  - `redis`: `SET … EX ttl` ([redis.ts](https://github.com/unjs/unstorage/blob/main/src/drivers/redis.ts))
  - `cloudflare-kv-binding`: `expirationTtl: max(ttl, minTTL ?? 60)`, also **mindestens 60 s** ([cloudflare-kv-binding.ts](https://github.com/unjs/unstorage/blob/main/src/drivers/cloudflare-kv-binding.ts))
  - `memory`: Timer-basiert ([memory.ts](https://github.com/unjs/unstorage/blob/main/src/drivers/memory.ts))
  - `db0`, `fs`, `fs-lite`, `cloudflare-r2-binding`: **kein TTL** im Code (`db0.ts` macht nur `INSERT … ON CONFLICT(key) DO UPDATE` bzw. `ON DUPLICATE KEY UPDATE`, [db0.ts](https://github.com/unjs/unstorage/blob/main/src/drivers/db0.ts))
- **Compare-and-Set:** Das gibt es nur als **offenen PR** [#772 „feat: atomic compare and swap via `ifMatch`, `ifNoneMatch`“](https://github.com/unjs/unstorage/pull/772), Branch [`feat/cas`](https://github.com/unjs/unstorage/tree/feat/cas), nicht in `main` und nicht in einem Release. Darin fehlen `cloudflare-kv-binding` und `upstash` (geänderte Dateien laut [compare main…feat/cas](https://github.com/unjs/unstorage/compare/main...feat/cas)).
- **fs-Atomizität:** Issue [#797 „fs / fs-lite: writes are not atomic — a concurrent read returns a truncated value“](https://github.com/unjs/unstorage/issues/797). Der zugehörige PR [#798](https://github.com/unjs/unstorage/pull/798) ist geschlossen.

### Ein JSON-Dokument (Top-20-Array) unter einem Key?

Technisch geht das, aber der Claim ist dann **Read-Modify-Write** (`getItem` → Array ändern → `setItem`). Ohne CAS gewinnt der letzte Schreiber, und ein paralleler Claim geht still verloren. Je Driver kommt noch etwas hinzu:

| Driver | Race-/Konsistenzproblem |
|---|---|
| `cloudflare-kv-binding` | Zusätzlich eventual consistent: Ein anderer PoP sieht den alten Stand bis ≥ 60 s lang. „If concurrent writes are made to the same key, the last write will take precedence“, max. **1 Write/s pro Key** ([KV write docs](https://developers.cloudflare.com/kv/api/write-key-value-pairs/), [KV limits](https://developers.cloudflare.com/kv/platform/limits/)). Das ist die schlechteste Wahl. |
| `upstash` / `redis` | Jeder Befehl ist atomar, `GET` + `SET` zusammen aber nicht. Das gibt Lost Updates bei gleichzeitigen Claims. Abhilfe wäre Lua oder `WATCH`, und beides bietet unstorage nicht an. |
| `vercel-blob` | Last-Write-Wins. Überschreiben verlangt in `@vercel/blob` `allowOverwrite: true` ([Blob SDK](https://vercel.com/docs/vercel-blob/using-blob-sdk)); der unstorage-Driver setzt das nicht selbst (er spreizt nur `callOpts`, [vercel-blob.ts](https://github.com/unjs/unstorage/blob/main/src/drivers/vercel-blob.ts)). `ifMatch`-CAS gäbe es im SDK, unstorage reicht es in `main` aber nicht durch. Ob Lesen mit Cache veraltete Werte liefert, ist für diesen Fall **nicht verifiziert**. |
| `db0` | Upsert pro Key ist atomar, Read-Modify-Write aber nicht → Lost Update. |
| `fs` / `fs-lite` | Lost Update, dazu nicht-atomare Writes (#797). Lokal bei einem User eher harmlos. |
| `memory` | Zwischen `await getItem` und `await setItem` kann ein anderer Request dazwischenkommen → Lost Update. Nach Neustart ist alles weg. |

**Single-Use-Nonces mit unstorage:** `getItem` + `removeItem` sind zwei Schritte. Zwei parallele Requests mit demselben Token kommen beide durch. Ein atomares `SET NX`/`GETDEL` gibt es in der API nicht.

**Fazit Q1:** unstorage taugt hier nur für einfache Key/Value-Daten ohne Konkurrenz, etwa Caches oder Feature-Flags. Für Top-20 + Eindeutigkeit + Single-Use reicht es nicht.

---

## Q2 · Vercel KV und aktuelle Vercel-Storage-Optionen

- **Vercel KV gibt es nicht mehr:** „Vercel KV is no longer available. If you had an existing Vercel KV store, we automatically moved it to Upstash Redis in December 2024. For new projects, install a Redis integration from the Marketplace.“ ([vercel.com/docs/redis](https://vercel.com/docs/redis); `vercel.com/docs/storage/vercel-kv` leitet dorthin weiter)
- **Vercel Postgres ebenso:** „automatically moved it to Neon in December 2024“ ([vercel.com/docs/postgres](https://vercel.com/docs/postgres))
- **Eigene Vercel-Produkte heute:** Blob, Global Config, Runtime Cache. Datenbanken kommen über den **Marketplace**: „through providers like Neon, Upstash, and Supabase“. Redis empfiehlt Vercel explizit für „real-time leaderboards, and rate limiting“ ([vercel.com/docs/storage](https://vercel.com/docs/storage)).
- **Marketplace-Liste:** Postgres: AWS Aurora, Neon, Prisma Postgres, Supabase. Redis: Redis, Upstash for Redis ([vercel.com/docs/marketplace-storage](https://vercel.com/docs/marketplace-storage)). **Turso Cloud** ist als Marketplace-Integration vorhanden (`vc i tursocloud`, [vercel.com/marketplace/tursocloud](https://vercel.com/marketplace/tursocloud)), steht aber nicht in der Kurzliste der Storage-Doku.
- **Runtime Cache** ist laut unstorage-Doku „not a persistent store“ ([drivers/vercel](https://unstorage.unjs.io/drivers/vercel)) und scheidet damit aus.
- Vom Marketplace injizierte Env-Var-Namen (z. B. `KV_REST_API_URL` vs. `UPSTASH_REDIS_REST_URL`, `TURSO_DATABASE_URL`): **nicht verifiziert**, bei der Einrichtung im Dashboard prüfen.

---

## Q3 · Upstash Redis (`@upstash/redis`, HTTP/REST)

- **Cloudflare Workers:** `import { Redis } from "@upstash/redis/cloudflare"`, `Redis.fromEnv(env)`, Secrets per `wrangler secret put` ([Deployment](https://upstash.com/docs/redis/sdks/ts/deployment)).
- **Vercel:** Node-Import `@upstash/redis`, Env `UPSTASH_REDIS_REST_URL`/`_TOKEN` ([Deployment](https://upstash.com/docs/redis/sdks/ts/deployment), [Vercel-Integration](https://upstash.com/docs/redis/howto/vercelintegration)).
- **Sorted Sets:** `ZADD` mit `nx`/`xx`/`gt`/`lt` ([zadd](https://upstash.com/docs/redis/sdks/ts/commands/zset/zadd)). Damit lassen sich „bester Score pro Mitglied“ (`gt`) und Ranking abbilden.
- **Nonces:** `SET` mit `nx` und `ex`/`px` ([set](https://upstash.com/docs/redis/sdks/ts/commands/string/set)). `GETDEL` liefert den Wert und löscht ihn in einem Schritt, das ist der atomare Verbrauch ([getdel](https://upstash.com/docs/redis/sdks/ts/commands/string/getdel)).
- **Atomarität:** Pipelines sind „not atomic“, `redis.multi()` ist atomar ([Pipeline & Transaction](https://upstash.com/docs/redis/sdks/ts/pipelining/pipeline-transaction)). REST-Endpoint `/multi-exec` ([REST API](https://upstash.com/docs/redis/features/restapi)). Achtung: Ein einzelner fehlschlagender Befehl stoppt die Transaktion nicht. **`EVAL`**: „The script runs as a single atomic step … such as … a compare-and-set update“, auch über REST ([EVAL](https://upstash.com/docs/redis/commands/scripting/eval)). Für „prüfe #20, ersetze alten Eintrag, prüfe E-Mail“ in einem Schritt braucht es also Lua.
- **Free Tier:** 250 MB Daten, 10 GB Bandbreite, **500K Commands pro Monat**, max. 10.000 cmd/s, 10 Datenbanken frei ([pricing/redis.md](https://upstash.com/pricing/redis.md)). „Free tier databases are archived after a minimum of 30 days of inactivity“ mit Warn-Mails ([FAQ](https://upstash.com/docs/redis/help/faq)). Bei Überschreitung der Commands: „The exceeding commands return an exception“ (dto.).
- **Lokal:** Upstash verweist auf das Community-Projekt **SRH** (Serverless Redis HTTP) als Docker-Container vor einem lokalen Redis ([Developing or Testing](https://upstash.com/docs/redis/sdks/ts/developing)). Das ist kein Zero-Setup.

---

## Q4 · Cloudflare: KV, D1, Durable Objects

### KV (Wortlaut der Doku)

- „KV achieves high performance by being eventually-consistent. At the Cloudflare global network location at which changes are made, these changes are usually immediately visible. However, this is not guaranteed and therefore it is not advised to rely on this behaviour. In other global network locations changes may take up to 60 seconds or more to be visible as their cached versions of the data time-out.“ ([How KV works](https://developers.cloudflare.com/kv/concepts/how-kv-works/))
- „Negative lookups indicating that the key does not exist are also cached“ (dto.). Ein gerade gesetzter Nonce kann also anderswo noch „nicht vorhanden“ sein.
- „KV is not ideal for applications where you need support for atomic operations or where values must be read and written in a single transaction. If you need stronger consistency guarantees, consider using Durable Objects.“ (dto.)
- „If concurrent writes are made to the same key, the last write will take precedence.“ `expirationTtl` minimum 60 s ([Write key-value pairs](https://developers.cloudflare.com/kv/api/write-key-value-pairs/)).
- Limits: Writes auf denselben Key **1 pro Sekunde**. Free: **1.000 Writes/Tag** auf verschiedene Keys ([KV limits](https://developers.cloudflare.com/kv/platform/limits/)).
- **Folge:** KV ist weder für die Rangliste noch für Single-Use-Nonces geeignet.

### D1 (Cloudflare-SQLite)

- „Each individual D1 database is inherently single-threaded, and processes queries one at a time.“ ([D1 limits](https://developers.cloudflare.com/d1/platform/limits/)) Ein einzelnes Statement ist damit serialisiert.
- `batch()`: „Batched statements are SQL transactions … If a statement in the sequence fails … it aborts or rolls back the entire sequence.“ ([D1Database](https://developers.cloudflare.com/d1/worker-api/d1-database/)) Explizites `BEGIN`/`COMMIT` lehnt D1 ab (laut db0: „Cloudflare D1 rejects `BEGIN`/`COMMIT` outright“, [db0 capabilities](https://db0.unjs.io/guide/capabilities)). Eine Cloudflare-Quelle dafür habe ich nicht gefunden: **nicht verifiziert**.
- Free: 10 DBs, 500 MB/DB, **5 Mio Rows read / 100.000 Rows written pro Tag** ([D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [limits](https://developers.cloudflare.com/d1/platform/limits/)).
- Lokal: Wrangler/Miniflare „running the same version of D1 as Cloudflare runs globally“ ([Local development](https://developers.cloudflare.com/d1/best-practices/local-development/)).
- **Von Vercel aus nicht sinnvoll:** „REST API primarily interacts with the control plane“ ([Query D1](https://developers.cloudflare.com/d1/best-practices/query-d1/)).

### Durable Objects

- „globally-unique name“, „durable, transactional, and strongly consistent storage“, „single-threaded and cooperatively multi-tasked“ ([What are Durable Objects](https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/)).
- SQLite-backed DOs gibt es im **Workers Free Plan** ([DO overview](https://developers.cloudflare.com/durable-objects/), [DO pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)). „The Durable Objects Storage API … is only accessible from within Durable Objects“ (dto.).
- **Folge:** Technisch die sauberste Lösung auf Cloudflare, aber nur dort. Vercel bräuchte eine zweite Implementierung, und das widerspricht dem Ziel „eine Codebasis“.

---

## Q5 · Turso / libSQL

- **Pakete:** Turso nennt vier TS-Pakete. Für Remote-Zugriff empfiehlt es für neue Projekte `@tursodatabase/serverless` („fetch only — zero native deps“, Vercel Functions und Cloudflare Workers). `@libsql/client` ist „production-ready, battle-tested“ für libSQL-Datenbanken. Kompatible Runtimes laut Doku: Node.js ≥ 12, Deno, **CloudFlare Workers**, Netlify & **Vercel Edge Functions** ([TS Reference](https://docs.turso.tech/sdk/ts/reference)).
- **Gleicher Client lokal und in der Cloud:** `createClient({ url: "file:path/to/db-file.db" })` für lokal. Achtung: „The `@libsql/client/web` does not support local file URLs.“ (dto.) Das Paket `@libsql/client@0.18.0` wählt per Export-Condition automatisch: `workerd`/`edge-light`/`browser` → `web.js`, `node` → `node.js` ([package.json](https://github.com/tursodatabase/libsql-client-ts/blob/main/packages/libsql-client/package.json)). Auf Cloudflare landet man also im Web-Build (HTTP), lokal in Node im File-fähigen Build. Ob der Node-Build auf Vercel mit `https:`/`libsql:`-URL ohne Probleme mit der nativen Abhängigkeit läuft, ist **nicht verifiziert**. Wer sicher gehen will, importiert in der Cloud explizit `@libsql/client/web`.
- **Vercel:** „SQL over HTTP … `@tursodatabase/serverless`, `@libsql/client` … works in any runtime“, Env `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` ([Turso + Vercel](https://docs.turso.tech/integrations/vercel)).
- **Transaktionen:** `client.batch([...], "write")` ist „an implicit transaction … any failure results in a full rollback“. Interaktive Transaktionen laufen über `client.transaction("write")` (`BEGIN IMMEDIATE`) ([TS Reference](https://docs.turso.tech/sdk/ts/reference)). Explizites `BEGIN/COMMIT/SAVEPOINT` siehe ([Transactions](https://docs.turso.tech/sql-reference/statements/transactions)). `@libsql/client` „Concurrent writes: Not supported“ (dto.), Writes werden also serialisiert. Für die geringe Last hier ist das unkritisch.
- **UNIQUE / Upsert:** Standard-SQLite-Syntax. Für `INSERT … SELECT … ON CONFLICT` braucht der SELECT ein `WHERE` („even if that WHERE clause is just "WHERE true"“, [sqlite.org/lang_upsert](https://www.sqlite.org/lang_upsert.html)). `RETURNING` gibt es seit SQLite 3.35.0 ([lang_returning](https://www.sqlite.org/lang_returning.html)). Bekannte Turso-Cloud-Einschränkungen betreffen nur einzelne Pragmas ([Limitations](https://docs.turso.tech/cloud/limitations)).
- **Lokal ohne Setup:** `file:./dev.db` reicht. Optional startet `turso dev` einen lokalen libSQL-Server unter `http://127.0.0.1:8080` ([Local Development](https://docs.turso.tech/local-development)). Das braucht aber die Turso-CLI.
- **Free Tier:** 100 Datenbanken, 5 GB, **500 Mio Rows read, 10 Mio Rows written pro Monat** ([turso.tech/pricing.md](https://turso.tech/pricing.md); liegt nicht unter docs.turso.tech, ist aber offizielle Herstellerseite). Abrechnung nach Rows read/written: „Even if a transaction is not committed, any row that was inserted or updated during the transaction incurs a row write“ ([Usage & Billing](https://docs.turso.tech/help/usage-and-billing)). Ob Free-DBs bei Inaktivität archiviert werden: **nicht verifiziert**.
- **Risiko:** Die Pricing-Seite zeigt das Banner „Turso is joining Supabase“ ([turso.tech/pricing](https://turso.tech/pricing)). Folgen für Free Tier oder API sind **nicht verifiziert**.

---

## Q6 · db0 als SQL-Analogon zu unstorage

- **Ja, db0 ist genau das:** ein API, Connectors pro Plattform. Connectors in [`src/connectors`](https://github.com/unjs/db0/tree/main/src/connectors): `better-sqlite3`, `bun-sqlite`, `node-sqlite`, `sqlite3`, **`cloudflare-d1`**, `cloudflare-hyperdrive-mysql/-postgresql`, **`libsql`** (`core`, `http`, `node`, `web`), **`neon`**, `pglite`, `planetscale`, `postgresql`, `mysql2`.
- **Turso:** Die Turso-Seite sagt „This connector is planned“ ([db0 Turso](https://db0.unjs.io/connectors/turso)). Für Turso Cloud nimmt man den `libsql`-Connector (`libsql/web` bzw. `libsql/http`) mit Turso-URL ([db0 LibSQL](https://db0.unjs.io/connectors/libsql)).
- **D1:** `cloudflareD1({ bindingName: "DB" })`, Binding über `import { env } from "cloudflare:workers"` ([db0 Cloudflare](https://db0.unjs.io/connectors/cloudflare)).
- **Vercel Postgres** → Neon-Connector ([db0 Vercel](https://db0.unjs.io/connectors/vercel)).
- **Lokal:** `node-sqlite` (Node ≥ 22.5, „requires no dependencies“) ([db0 SQLite](https://db0.unjs.io/connectors/sqlite)).
- **Transaktionen je Connector** ([Capabilities](https://db0.unjs.io/guide/capabilities)): `Tx` ✓ für `node-sqlite`, `better-sqlite3`, `libsql-node`, `neon`, `postgresql`; **✗ für `cloudflare-d1`, `libsql-http`, `libsql-web`, `planetscale`**. Begründung: „D1 rejects BEGIN/COMMIT outright; only implicit transactions via `D1Database.batch()`“, „libsql-http and libsql-web open and close a Hrana stream within a single request per query“. Eine portable `batch()`-Methode habe ich in [db0 `src/types.ts`](https://github.com/unjs/db0/blob/main/src/types.ts) nicht gefunden (nur `exec`, `prepare`/`bind`/`all`/`run`/`get`, `sql`): **nicht verifiziert**, dass es eine gibt.
- **Reife:** „DB0 development is in the early stages“ ([README](https://github.com/unjs/db0)). Aktuell `0.4.2` vom 2026-10-27 ([Releases](https://github.com/unjs/db0/releases)).
- **Folge:** db0 funktioniert, wenn jeder Claim aus **einzeln atomaren Statements** besteht (siehe Design unten). Dann ist die fehlende Transaktion egal. Der Mehrwert gegenüber `@libsql/client` allein ist, dass auf Cloudflare D1 statt Turso möglich ist.

---

## Q7 · Server-Teil aus einem Modul auf beiden Plattformen

**Gemeinsame Form:** Beide Plattformen akzeptieren ein Web-Standard-Modul `export default { fetch(request) }`:
- Cloudflare Worker: `fetch(request, env, ctx)`.
- Vercel (ohne Framework): `api/index.js` mit `export default { fetch(request) }`. „Keep shared utilities and route modules outside `api/`“, weil jede Datei in `api/` eine eigene Function wird. Routing per Rewrite ([Functions quickstart](https://vercel.com/docs/functions/quickstart), [Node.js runtime](https://vercel.com/docs/functions/runtimes/node-js)).
- Vorschlag: `server/api.js` exportiert `handleApi(request, { db, secret, now })`. Daneben gibt es dünne Adapter `worker/index.js` (CF), `api/index.js` (Vercel) und ein Vite-Plugin (lokal).

**Cloudflare** (heute nur statische Assets in `wrangler.jsonc`):
- `main` auf das Worker-Skript setzen, dazu `assets.run_worker_first: ["/api/*"]`. „The array supports glob patterns with `*` … and negative patterns with `!`“ ([Static assets binding](https://developers.cloudflare.com/workers/static-assets/binding/)).
- Wichtig, weil `not_found_handling: "single-page-application"` gesetzt ist: Ohne `run_worker_first` bekommen **Navigation**-Requests auf `/api/...` die `index.html`; `fetch()` aus dem Spiel erreicht den Worker trotzdem. Mit dem Array „disables the automatic `Sec-Fetch-Mode: navigate` detection“ ([SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)).
- Secrets: `wrangler secret put`, lokal `.dev.vars` **oder** `.env` (nicht beides), Zugriff über `env`, `import { env } from "cloudflare:workers"` oder `process.env` mit `nodejs_compat` ([Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)).
- Lokal optional: `@cloudflare/vite-plugin` lässt den Worker in `workerd` innerhalb von `vite dev` laufen ([Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/)). Alternative: `wrangler dev`.

**Vercel:**
- Vite-Static-Build + `api/index.js` + `vercel.json`-Rewrite `/api/(.*)` → `/api`. Vercel nennt für Vite ohne Framework als Alternative **Nitro** („add Nitro to your Vite project“, [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Vite with Nitro](https://vercel.com/docs/frameworks/full-stack/vite-with-nitro)). Nitro baut auch für Cloudflare und bringt unstorage/db0 mit (**nicht verifiziert**, nitro.build nicht geprüft). Für diese 2–3 Endpunkte wäre das Overkill.
- Env/Secrets im Dashboard oder per `vercel env add`, Typ Config/Secret, verschlüsselt. `vercel env pull` für lokal ([Environment variables](https://vercel.com/docs/environment-variables)).
- `vercel dev` bildet Functions lokal nach. Wenn das eigene Dev-Kommando reicht, „we do not recommend using `vercel dev`“ ([vercel dev](https://vercel.com/docs/cli/dev)).

**Lokal (`npm run dev`):** Ein Vite-Plugin mit `configureServer(server) { server.middlewares.use(...) }` ([Vite Plugin API](https://vite.dev/guide/api-plugin#configureserver)) leitet `/api/*` an `handleApi` weiter. Es wandelt Node-`req` in ein `Request` und benutzt `createClient({ url: "file:./dev.db" })`. Secret aus `.env`. Damit braucht es keinen zweiten Prozess, kein Wrangler und kein Vercel-CLI.

---

## Q8 · Empfehlung

### 1. Wahl: `@libsql/client` + Turso Cloud (je eine DB pro Deployment), lokal `file:./dev.db`

**Warum:**
- **Eine Codebasis, ein SQL, ein Client** auf CF, Vercel und lokal (Q5). Kein Adapter-Wechsel zwischen D1 und etwas anderem.
- **Zero-Setup lokal:** Eine SQLite-Datei reicht, auch zum Ansehen mit jedem SQLite-Tool.
- **Korrektheit ohne Transaktionen:** Alles läuft über einzeln atomare Statements (Design unten), Writes sind serialisiert.
- **Kosten:** Das Free Tier liegt Größenordnungen über dem Bedarf (ein paar hundert Spieler).
- Auf Vercel als Marketplace-Integration vorhanden (Q2).

**Skizze:** Die Rangliste wird beim Lesen berechnet. Alle Claims bleiben gespeichert, angezeigt wird `LIMIT 20`. Das beantwortet auch die offene Frage zu verdrängten Einträgen.

```sql
CREATE TABLE entries (
  email      TEXT PRIMARY KEY,          -- eine Adresse = ein Eintrag
  nickname   TEXT NOT NULL,
  score      INTEGER NOT NULL,
  claimed_at INTEGER NOT NULL,          -- Tie-Break: früherer Claim vorn
  run_id     TEXT NOT NULL
);
CREATE INDEX entries_rank ON entries (score DESC, claimed_at ASC);

CREATE TABLE used_runs (                -- Single-Use
  run_id     TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);
```

Claim-Ablauf:
1. Das **Run-Token** ist HMAC-signiert (Secret als Env-Var) mit `runId`, `seed`, `startedAt`, `exp`. Ablauf (15 min Lauf, 60 s Claim-Fenster) wird **stateless** über die Signatur geprüft. Eine Storage-TTL braucht es nicht.
2. `INSERT INTO used_runs (run_id, expires_at) VALUES (?, ?) ON CONFLICT DO NOTHING RETURNING run_id`. Ist das Ergebnis leer, ist es ein Replay → 409. Das Statement ist atomar und braucht kein CAS.
3. Ein einziges Statement für Schwelle + Eindeutigkeit + „nur besser ersetzt“:
   ```sql
   INSERT INTO entries (email, nickname, score, claimed_at, run_id)
   SELECT ?1, ?2, ?3, ?4, ?5
   WHERE (SELECT COUNT(*) FROM entries WHERE email <> ?1) < 20
      OR ?3 > (SELECT score FROM entries WHERE email <> ?1
               ORDER BY score DESC, claimed_at ASC LIMIT 1 OFFSET 19)
   ON CONFLICT(email) DO UPDATE SET
     nickname = excluded.nickname, score = excluded.score,
     claimed_at = excluded.claimed_at, run_id = excluded.run_id
   WHERE excluded.score > entries.score
   RETURNING email;
   ```
   (Die `WHERE`-Klausel im SELECT löst zugleich die Parsing-Ambiguität, siehe [lang_upsert](https://www.sqlite.org/lang_upsert.html).) Ein leeres Ergebnis heißt „nicht Top 20“ oder „nicht besser als der eigene alte Score“. Ob die Schwelle den eigenen alten Eintrag ausklammert (`email <> ?1`), ist eine Produktentscheidung für 024.
4. Aufräumen gelegentlich: `DELETE FROM used_runs WHERE expires_at < ?`.
5. Optional 2+3 als `client.batch([...], "write")` in einer Transaktion. Das ist für die Korrektheit nicht nötig.

Das Statement-Set läuft unverändert auch auf D1 und lokalem SQLite. Damit bleibt der Weg zu Option 2 offen.

### 2. Wahl: db0 mit `cloudflare-d1` (CF) / `libsql/web` (Vercel → Turso) / `node-sqlite` (lokal)

Wenn das Team die GitHub-Version ohne externen Account betreiben will, ist das die Variante: D1 ist im CF-Account schon verfügbar und stark konsistent (Q4). Gleiches SQL wie oben. Nachteile: db0 ist „early stages“, der D1-Connector funktioniert nur im Worker-Kontext, Transaktionssemantik unterscheidet sich je Connector (Q6), und es gibt eine Abhängigkeit mehr. Alternativ verzichtet man auf db0 und schreibt selbst einen ~20-Zeilen-Adapter (`query(sql, args)`) über `env.DB.prepare().bind().all()` bzw. `client.execute()`.

### 3. Wahl: Upstash Redis direkt (`@upstash/redis`)

Fachlich ideal: ZSET für die Rangliste, `SET NX EX`/`GETDEL` für Nonces, Lua `EVAL` für den atomaren Claim (Q3). Läuft auf CF und Vercel, auf Vercel ist es der offizielle KV-Nachfolger. Nachteile für dieses Projekt: **lokal kein Zero-Setup** (Docker + SRH), die Claim-Logik steckt in Lua, ein Tie-Break nach Claim-Zeit braucht Score-Encoding (z. B. `score * 1e10 + (MAX_TS - claimedAt)`), die E-Mail muss zusätzlich in einem Hash liegen, und 500K Commands/Monat sind knapper als die Turso-Limits, für ein paar hundert Spieler aber trotzdem genug.

### unstorage: wofür, wofür nicht

- **Nicht** für Leaderboard, Eindeutigkeit oder Nonces (Q1: kein CAS, keine Transaktion, keine Sorted Sets; CAS nur als offener PR #772).
- Höchstens später für unkritische Key/Value-Sachen (z. B. Cache der öffentlichen Top-20-Antwort). Selbst dafür reicht ein `Cache-Control`-Header. **Empfehlung: unstorage nicht einführen.** Die SQL-Schicht (`@libsql/client`, optional db0) ist hier die passende Abstraktion.

---

## Offene Risiken

- **Turso-Zukunft:** „Turso is joining Supabase“ ([turso.tech/pricing](https://turso.tech/pricing)). Free Tier und Bestand von `@libsql/client` vs. `@tursodatabase/serverless` beobachten. Turso empfiehlt für neue Remote-Projekte bereits `@tursodatabase/serverless` ([TS Reference](https://docs.turso.tech/sdk/ts/reference)). Dessen `compat`-Modul spricht die `@libsql/client`-API; ob das lokale `file:` damit geht, ist **nicht verifiziert** (eher nein, da „fetch only“).
- **`@libsql/client` Node-Build auf Vercel** (native Abhängigkeit): **nicht verifiziert**. Im Zweifel in der Cloud `@libsql/client/web` importieren.
- **Zwei externe Accounts** (Turso für CF und für Vercel, oder gemeinsam mit zwei DBs). Credentials liegen als Secret in beiden Plattformen, Zugriff hat nur das Projektteam (DSGVO-Hinweis aus 024 Q9). Turso-Region/Datenstandort (EU?) für Klartext-E-Mails: **nicht verifiziert**.
- **D1 `BEGIN/COMMIT`-Ablehnung** ist nur über db0 belegt, nicht über eine Cloudflare-Seite: **nicht verifiziert**. Das Design oben braucht es nicht.
- **Free-Tier-Inaktivität:** Upstash archiviert Free-DBs nach ≥ 30 Tagen Inaktivität. Für Turso ist das **nicht verifiziert**. Zwischen den Weihnachtsaktionen kann eine DB „einschlafen“.
- **Score-Vertrauen** bleibt Anwendungslogik (024 Q8, Runde 2): HMAC-Token, Zeit-Plausibilität, Single-Use. Der Speicher garantiert nur, dass parallele Claims das Ranking nicht kaputt machen.
- **Rate-Limiting** gegen Spam auf `/api/run/start` ist hier nicht untersucht.
