# AGENTS.md

Hinweise für Coding-Agents (und Menschen), die an diesem Repo arbeiten.

## ⚠️ Git: Agents stagen nur, committen und pushen NIE

Mehrere Entwickler arbeiten direkt auf `main`. Damit nichts durcheinanderkommt:

- **Agents führen weder `git commit` noch `git push` aus.** Auch nicht nach einem gelungenen Abschnitt.
- Nach jedem abgeschlossenen Abschnitt stagt der Agent **nur die eigenen Dateien** (`git add <dateien>`, kein `git add -A` / `git add .`). Dann fordert er den Nutzer auf, **selbst zu committen und zu pushen**, und schlägt eine Commit-Message vor.
- Vor dem Stagen `git status` prüfen. Fremde Änderungen, etwa von einem anderen Agent oder Entwickler, nicht mit stagen.

## Ticket-Tracker: lokal im Repo (`tickets/`)

- **Jede neue Aufgabe, jeder Bug und jede offene Entscheidung wird ein Ticket als Markdown-Datei** unter `tickets/`. Den Fortschritt tracken wir über Git (GitLab), einen separaten Issue-Tracker gibt es nicht.
- **Keine GitHub Issues mehr anlegen oder bearbeiten.** `kuddl/xmas-game` Issues #1–#17 sind Archiv, ihr Inhalt steht vollständig in `tickets/`.
- Arbeitsweise, Vorlage und Statusübersicht stehen in **[`tickets/README.md`](tickets/README.md)**.

### Struktur
| Pfad | Inhalt |
|---|---|
| `tickets/MAP.md`, `tickets/MAP-landingpage.md` | Wayfinder-Maps (Game, Landingpage): Ziel, Notizen, „Decisions so far“, Backlog. Ein Index: pro entschiedenem Ticket eine Zeile mit Link, das Detail steht im Ticket. |
| `tickets/README.md` | Statusübersicht (Offen / Erledigt) und Arbeitsweise |
| `tickets/open/NNN-slug.md` | offene Tickets |
| `tickets/done/NNN-slug.md` | erledigte Tickets |
| `tickets/archive/` | Entscheidungen von vor den GitHub Issues |

### Wayfinder-Operationen
- **Ticket anlegen:** nächste freie Nummer, Datei in `tickets/open/` nach der Vorlage, Zeile in `tickets/README.md` unter „Offen“
- **Blockieren:** Zeile `| **Blockiert durch** | [0NN](…) |` in der Kopf-Tabelle des Tickets
- **Claimen:** bei „Zugewiesen“ den eigenen Namen eintragen, bevor die Arbeit beginnt. Der Nutzer committet und pusht die Änderung.
- **Frontier:** Tickets in `open/` ohne Zuweisung und ohne offenen Blocker
- **Auflösen:** Ergebnis unter `## Verlauf` (Commit-Hash ergänzt der Nutzer bzw. beim nächsten Mal), Status `✅ Erledigt` + Datum, `git mv` nach `tickets/done/`, Zeile im README verschieben, bei Entscheidungen eine Zeile unter „Decisions so far“ in `tickets/MAP.md`

### Typen
| Typ | Bedeutung |
|---|---|
| `wayfinder:grilling` | Entscheidung im Gespräch (HITL) |
| `wayfinder:prototype` | Entscheidung über einen Prototyp oder Playtest (HITL) |
| `wayfinder:research` | Fakten recherchieren (AFK) |
| `wayfinder:task` | Arbeit, die eine Entscheidung freischaltet |
| `backlog` | späteres Feature, noch nicht eingeplant |
| `chore` | Tooling, CI, Wartung |
| `bug`, `enhancement` | wie üblich |

## Repository & Hosting
- **Repository:** GitLab `tsailer/xmas-merkle-game` (Remote `merkle`, SSH-Port 2222), Branch `main`.
- **Hosting:** Vercel, gebaut aus dem GitLab-Repo (`vercel.json`: Vite-Build nach `dist/`, Functions in `api/`).
- Committen und pushen macht ausschließlich der Nutzer (siehe oben).

## Projekt-Kurzinfo
- **Seiten:** `/` = Landingpage (`index.html`, Quellen in `welcome/`, Texte in `welcome/content.js`), `/game/` = Spiel (`game/index.html`, Quellen in `src/`), Info-Seite unter `/game/?info`. Beide Seiten baut Vite (`vite.config.js` → `build.rollupOptions.input`).
- **Online-Leaderboard (Ticket 024):**
  - `server/api.js` ist die API, angebunden über `api/index.js` + `vercel.json` (Vercel) und das Vite-Plugin in `vite.config.js` (lokal, `.data/dev.db`).
  - Gemeinsame Regeln für Spiel und Server stehen in `src/online/protocol.js`, die Werte in `GAME_CONFIG.ONLINE`.
  - Test: `npm run test:leaderboard`. Setup und Löschen: `docs/leaderboard-setup.md`.
  - Spielrelevanter Zufall läuft über `src/rng.js` (Seed pro Lauf), **nicht** über `Math.random()`.
- **Engine:** PixiJS v8. Vor jedem PixiJS-Code den Skill `.agents/skills/pixijs/SKILL.md` lesen.
- **Dev:** `npm run dev`, **Build:** `npm run build`, **Assets neu erzeugen:** `npm run generate-assets`
- **Tuning-Werte:** `src/config.js`. **Assets:** `public/assets/spritesheet.json` (Designer-Austausch ohne Code-Änderung)
- **Figma:** [ABX Game Assets](https://www.figma.com/design/HgKfwks85tYE0fOjVqWkTy/ABX-Game-Assets?node-id=26-2) mit allen Sprites. Zugriff über den Figma MCP (`.pi/mcp.json`), siehe Ticket 006.
- **Deploy:** Vercel aus dem GitLab-Repo (siehe „Repository & Hosting“)
- **Sprache:** Spieltexte Englisch, Diskussion und Tickets Deutsch
