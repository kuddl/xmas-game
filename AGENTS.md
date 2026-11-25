# AGENTS.md

Hinweise für Coding-Agents (und Menschen), die an diesem Repo arbeiten.

## Issue-Tracker: GitHub Issues

- Repo: **`kuddl/xmas-game`**, Zugriff per `gh` CLI
- **Jede neue Aufgabe, jeder Bug und jede offene Entscheidung wird ein GitHub Issue.** Keine lokalen Ticket-Dateien mehr (`tickets/` ist nur noch Archiv).
- **Wayfinder-Map:** [#12](https://github.com/kuddl/xmas-game/issues/12), Label `wayfinder:map`. Sie ist ein Index: pro entschiedenem Ticket eine Zeile mit Link, das Detail steht im Ticket.

### Labels
| Label | Bedeutung |
|---|---|
| `wayfinder:grilling` | Entscheidung im Gespräch (HITL) |
| `wayfinder:prototype` | Entscheidung über einen Prototyp oder Playtest (HITL) |
| `wayfinder:research` | Fakten recherchieren (AFK) |
| `wayfinder:task` | Arbeit, die eine Entscheidung freischaltet |
| `backlog` | späteres Feature, noch nicht eingeplant |
| `chore` | Tooling, CI, Wartung |
| `bug`, `enhancement` | wie üblich |

### Wayfinder-Operationen auf GitHub
- **Ticket anlegen:** `gh issue create --label "wayfinder:<typ>"`, danach als **Sub-Issue** an die Map hängen:
  `gh api -X POST repos/kuddl/xmas-game/issues/12/sub_issues -F sub_issue_id=<ID>`
  (`<ID>` ist die interne Issue-ID: `gh api repos/kuddl/xmas-game/issues/<NR> --jq .id`)
- **Blockieren** (native Abhängigkeit):
  `gh api -X POST repos/kuddl/xmas-game/issues/<NR>/dependencies/blocked_by -F issue_id=<ID des Blockers>`
- **Claimen:** sich selbst zuweisen, bevor die Arbeit beginnt (`gh issue edit <NR> --add-assignee @me`)
- **Frontier:** offene, nicht zugewiesene Sub-Issues der Map ohne offene Blocker
- **Auflösen:** Antwort als Kommentar posten, Issue schließen, eine Zeile unter „Decisions so far“ im Map-Issue ergänzen

## Projekt-Kurzinfo
- **Engine:** PixiJS v8. Vor jedem PixiJS-Code den Skill `.agents/skills/pixijs/SKILL.md` lesen.
- **Dev:** `npm run dev`, **Build:** `npm run build`, **Assets neu erzeugen:** `npm run generate-assets`
- **Tuning-Werte:** `src/config.js`. **Assets:** `public/assets/spritesheet.json` (Designer-Austausch ohne Code-Änderung)
- **Deploy:** Push auf `main` → GitHub Actions → Cloudflare Workers (https://christmas.familiesailer.com)
- **Sprache:** Spieltexte Englisch, Diskussion und Tickets Deutsch
