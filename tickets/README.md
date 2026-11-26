# Tickets

Unser Ticket-Tracker liegt **im Repo**. Er gilt für GitHub (`origin`) und GitLab (`merkle`) gleichermaßen, den Fortschritt sieht man in der Git-History. Die GitHub Issues von `kuddl/xmas-game` sind nur noch Archiv. Jedes Ticket verlinkt sein Original unter „Herkunft“.

- **[MAP.md](MAP.md):** Wayfinder-Map für das Spiel mit Ziel, Notizen, „Decisions so far“ und Backlog
- **[MAP-landingpage.md](MAP-landingpage.md):** Wayfinder-Map für die Landingpage
- **`open/`:** offene Tickets
- **`done/`:** erledigte Tickets
- **`archive/`:** Entscheidungen aus der Zeit vor den GitHub Issues (Nachschlagewerk)

## Status

### 🟡 Offen

| # | Ticket | Typ | Zugewiesen |
|---|---|---|---|
| 004 | [Backend-Leaderboard statt localStorage](open/004-backend-leaderboard-statt-localstorage.md) | enhancement, backlog | — |
| 005 | [Audio: Musik & Soundeffekte](open/005-audio-musik-soundeffekte.md) | enhancement, backlog | — |
| 006 | [Designer-Assets über Figma austauschen](open/006-designer-assets-ueber-figma-austauschen-pixelart.md) | enhancement, backlog | — |
| 007 | [Hintergrund-Welten: MVP- vs. Production-Look](open/007-hintergrund-welten-mvp-vs-production-look.md) | enhancement, backlog | — |
| 008 | [Training-Modus vs. Highscore-Modus](open/008-training-modus-vs-highscore-modus.md) | enhancement, backlog | — |
| 009 | [Hindernisse auch auf Plattformen](open/009-hindernisse-auch-auf-plattformen.md) | enhancement, backlog | — |
| 010 | [Arc-Logo als Hintergrund-Element](open/010-arc-logo-als-hintergrund-element.md) | enhancement, backlog | — |
| 011 | [CI: GitHub Actions auf Node 24 aktualisieren](open/011-ci-github-actions-auf-node-24.md) | chore | — |
| 019 | [Landingpage: Texte für Gruß und Satire-Blöcke](open/019-landingpage-texte-fuer-gruss-und-satire.md) · Map Landingpage | wayfinder:grilling | — |
| 020 | [Landingpage: Scroll-Prototyp](open/020-landingpage-scroll-prototyp.md) · Map Landingpage | wayfinder:prototype | tsailer |
| 021 | [Konami-Code: Power-up (doppelte Größe & Durchlaufen)](open/021-konami-code-power-up.md) | enhancement, backlog | — |

> Hinweis zu 007: Den unterschiedlichen Look für MVP und Production gibt es seit [013](done/013-mvp-phase-kuerzen-und-optisch-von.md). Zu klären ist, ob 007 damit erledigt ist oder ob eigene Welten (andere Motive) gemeint sind.

### ✅ Erledigt

| # | Ticket | Typ | Erledigt |
|---|---|---|---|
| 001 | [Tempo, Sprunggefühl & Schwierigkeitskurve kalibrieren](done/001-tempo-sprunggefuehl-schwierigkeitskurve-kalibrieren.md) | wayfinder:prototype | 2026-11-26 |
| 002 | [Hindernis-Generator: Regeln bestätigen oder Muster ergänzen](done/002-hindernis-generator-regeln-bestaetigen-oder-muster.md) | wayfinder:prototype | 2026-11-26 |
| 003 | [Highscore-Formel mit Story Points](done/003-highscore-formel-mit-story-points.md) | wayfinder:grilling | 2026-11-26 |
| 013 | [MVP-Phase kürzen und optisch von Production abheben](done/013-mvp-phase-kuerzen-und-optisch-von.md) | enhancement | 2026-11-26 |
| 014 | [Pilze: Hindernis mit rosa Blur-Effekt statt Tod](done/014-pilze-hindernis-mit-rosa-blur-effekt.md) | backlog | 2026-11-26 |
| 015 | [Score-Formel (Meter + SP × 10) und +5 SP pro Breakthrough-Block](done/015-score-formel-meter-sp-10-und.md) | enhancement | 2026-11-26 |
| 016 | [Game Over: kein Neustart per SPACE, Buttons für Leaderboard und Neustart](done/016-game-over-kein-neustart-per-space.md) | bug, enhancement | 2026-11-26 |
| 017 | [Coin-Wolke in der Luft während Arc Double Jump](done/017-coin-wolke-in-der-luft-waehrend.md) | backlog | 2026-11-26 |
| 018 | [Landingpage: Was braucht die Seite?](done/018-landingpage-was-braucht-die-seite.md) · Map Landingpage | wayfinder:grilling | 2026-11-26 |

## Arbeitsweise

**Neues Ticket anlegen**
1. Die nächste freie Nummer nehmen (höchste Nummer in `open/` und `done/` + 1, aktuell **022**).
2. Datei `open/<NNN>-<kurzer-slug>.md` nach der Vorlage unten anlegen.
3. Eine Zeile in die Tabelle „Offen“ oben eintragen. Committen, z. B. `tickets: add 018 …`

**Claimen**
- Bei „Zugewiesen“ den eigenen Namen eintragen (Datei und Tabelle), committen und pushen, **bevor** die Arbeit beginnt. So sieht der andere sofort, wer woran sitzt.

**Erledigen**
1. Unter `## Verlauf` notieren, was entschieden bzw. umgesetzt wurde, mit Commit-Hash.
2. Status auf `✅ Erledigt` setzen und „Erledigt“ mit Datum füllen.
3. Die Datei verschieben: `git mv tickets/open/<datei> tickets/done/`
4. Die Zeile in diesem README von „Offen“ nach „Erledigt“ verschieben.
5. Bei Entscheidungen eine Zeile unter „Decisions so far“ in der zugehörigen Map ergänzen ([MAP.md](MAP.md) oder [MAP-landingpage.md](MAP-landingpage.md)). Gehört ein Ticket zu einer anderen Map als der Game-Map, bekommt es die Kopf-Zeile `| **Map** | … |`.
6. Am besten im selben Commit wie die Umsetzung. In der Commit-Message `Closes 0NN` erwähnen.

**Typen** (ersetzen die GitHub-Labels)

| Typ | Bedeutung |
|---|---|
| `wayfinder:grilling` | Entscheidung im Gespräch |
| `wayfinder:prototype` | Entscheidung über Prototyp oder Playtest |
| `wayfinder:research` | Fakten recherchieren |
| `wayfinder:task` | Arbeit, die eine Entscheidung freischaltet |
| `backlog` | späteres Feature, noch nicht eingeplant |
| `chore` | Tooling, CI, Wartung |
| `bug`, `enhancement` | wie üblich |

**Blocker:** Eine Zeile `| **Blockiert durch** | [0NN](../open/0NN-….md) |` in die Kopf-Tabelle schreiben. Ist der Blocker erledigt, die Zeile entfernen.

**Verweise:** Im Text stehen Verweise als `[#NN](relativer/pfad.md)`. Die Nummern sind dieselben wie bei den alten GitHub Issues.

### Vorlage

```markdown
# 018 · Titel des Tickets

| | |
|---|---|
| **Status** | 🟡 Offen |
| **Typ** | enhancement |
| **Zugewiesen** | — |
| **Erstellt** | JJJJ-MM-TT |
| **Erledigt** | — |

## Ziel / Frage
…

## Offen
- …

## Verlauf
```
