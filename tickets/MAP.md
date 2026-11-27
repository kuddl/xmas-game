# Wayfinder Map: Christmas Game

> Index aller Entscheidungen. Ehemals GitHub [#12](https://github.com/kuddl/xmas-game/issues/12), seit 2026-11-26 lokal gepflegt. Pro erledigtem Ticket eine Zeile unter „Decisions so far“, das Detail steht im Ticket.

## Destination

Ein spielbares, witziges **Corporate-Satire-Run-Game** als interner Weihnachtsgruß des ARC-Teams an alle Merkle-Mitarbeiter: Die Figur läuft automatisch durch eine winterliche 8-Bit-Projektwelt (Band-Scrolling links → rechts), springt und duckt sich unter Business-Buzzwords, sammelt Story Points und Firmenlogos als Power-Ups. Zuerst die sichere **MVP-Phase** (175 m), danach **Real Production** mit 1 Leben. Leaderboard nach Score. Spielbar im Browser auf Desktop und Handy, live auf https://christmas.familiesailer.com/game/ (die Landingpage liegt auf `/`).

## Notes

- **Ticket-Tracker:** lokal im Repo unter `tickets/` (offen: `tickets/open/`, erledigt: `tickets/done/`). Jede neue Aufgabe oder Entscheidung wird ein Ticket. Arbeitsweise in [`tickets/README.md`](README.md) und `AGENTS.md`. Die GitHub Issues sind nur noch Archiv.
- **Engine:** PixiJS v8. Vor PixiJS-Code den Skill `.agents/skills/pixijs` lesen.
- **Assets** sind über `public/assets/spritesheet.json` austauschbar (Designer-Handoff), Entwürfe kommen aus `scripts/generate-assets.mjs`.
- **Werte zum Tunen** stehen zentral in `src/config.js`.
- **Sprache:** Spieltexte auf Englisch, Diskussion und Tickets auf Deutsch.
- **Deploy:** Jeder Push auf `main` nach `origin` (GitHub) deployt per GitHub Actions auf Cloudflare Workers. Ein Push nach `merkle` (GitLab) deployt nicht.
- **Testen:** Lokal mit `npm run dev`. Im Dev-Modus gibt es `window.__game` für Tests. Nicht im ferngesteuerten Test-Chrome spielen.

## Decisions so far

- [MVP-Scope klarifizieren](archive/01-mvp-scope.md): 2D-Pixel-Sprite mit Laufanimation, Blau-Weiß mit roten Akzenten, Playing → Game Over mit HUD
- [Pixel Art: Laden & Rendern](archive/02-pixel-art-approach.md): PNG-Sprites + `spritesheet.json`, scharfe Pixel (nearest), Buzzwords als dynamischer Text. *Engine seither Three.js → PixiJS v8.*
- [Progression: MVP-Phase vs. Real Production](archive/05-progression-design.md): 250 m sichere MVP-Phase, danach 1 Leben, der Score zählt durchgehend
- [Start- & Game-Over-Screen](archive/06-ui-screens-design.md): unscharfe Szenerie + Pixel-Titel, Game Over im 80er-Konsolenstil
- [Power-Ups mit Firmenlogos](archive/07-powerups.md): Merkle = Breakthrough, Arc = Double Jump, je 5 s, Aura + Funken, HUD-Balken
- [Ducken & fliegende Hindernisse](archive/08-ducking.md): ↓ = ducken / durchfallen / schneller fallen; Meeting-Invites mit Banner
- [Ebenen (Plattformen)](archive/09-platform-levels.md): One-Way-Eisplattformen auf Ebene 2 und 3; keine Hindernisse darunter, 1,2 s Auslauf danach
- [Pause & Story Points](archive/10-pause-story-points.md): ESC/P pausiert (Auto-Pause bei Tab-Wechsel); Goldmünzen in Bögen und Reihen
- [MVP-Tutorial (Spotlight-Momente)](archive/11-mvp-tutorial.md): feste MVP-Strecke mit 7 Karten + Power-Up-Karten, Checkbox auf dem Startscreen
- [Mobile-Steuerung](archive/12-mobile-controls.md): links halten = ducken, rechts tippen = springen; Pause- und Vollbild-Button, `100dvh`, Kompakt-Layout
- [Tempo & Sprunggefühl kalibrieren](done/001-tempo-sprunggefuehl-schwierigkeitskurve-kalibrieren.md): BASE_SCROLL_SPEED (225 px/s), Sprunggefühl und Schwierigkeitskurve passen so
- [Hindernis-Generator](done/002-hindernis-generator-regeln-bestaetigen-oder-muster.md): bleibt zufällig mit Regeln, kein fester Seed. MVP kürzen und optisch abheben, siehe [#13](done/013-mvp-phase-kuerzen-und-optisch-von.md)
- [Highscore-Formel](done/003-highscore-formel-mit-story-points.md): `SCORE = Meter + SP × 10` (PTS), SP aus der MVP-Phase zählen mit, Breakthrough-Block = +5 SP; Leaderboard nach SCORE. Umsetzung siehe [#15](done/015-score-formel-meter-sp-10-und.md)
- [MVP kürzen & optisch abheben](done/013-mvp-phase-kuerzen-und-optisch-von.md): MVP 175 m, Staging-Look (kühl, entsättigt, leichter Blur auf Himmel und Parallax), 1 s Überblendung zu Production
- [Score-Formel & Breakthrough-SP umgesetzt](done/015-score-formel-meter-sp-10-und.md): SCORE als Hauptzahl im HUD, „+5 SP“-Animation, Leaderboard in PTS
- [Game Over & Leaderboard-Screen](done/016-game-over-kein-neustart-per-space.md): kein Neustart per SPACE, Buttons VIEW LEADERBOARD / PLAY AGAIN (600 ms Sperre), lokale Top 20
- [Coin-Wolke](done/017-coin-wolke-in-der-luft-waehrend.md) & [Pilze](done/014-pilze-hindernis-mit-rosa-blur-effekt.md): 18 Münzen nur per Doppelsprung nach dem Arc-Logo; Pilze nur in Production, 5 s „CREATIVE MODE“ (rosa + Blur), keine Punkte
- [Leaderboard-Claim Top 20](open/024-leaderboard-top-20-claim-statt-mail.md): kein Mailversand und keine UUID-Links (ersetzt [Spiel-Modi](done/022-spiel-modi-freies-und-getracktes-spiel.md) und [Training- vs. Highscore-Modus](done/008-training-modus-vs-highscore-modus.md)). Top-20-Läufe claimen mit Merkle- oder Dentsu-Adresse und Nickname, einmalig und binnen 60 s. libSQL/Turso auf Cloudflare und Vercel, lokal SQLite. Server-Uhr + Checkpoints + HMAC gegen Schummeln. Adressen werden bis 31. Januar manuell gelöscht.

## Not yet specified

*(Im Moment nichts. Alles, was sich scharf formulieren lässt, ist als Ticket angelegt.)*

## Backlog

Spätere Features, als Tickets in `open/` (Typ `backlog`): [#4](open/004-backend-leaderboard-statt-localstorage.md) Backend-Leaderboard · [#5](open/005-audio-musik-soundeffekte.md) Audio · [#6](open/006-designer-assets-ueber-figma-austauschen-pixelart.md) Designer-Assets (über Figma) · [#7](open/007-hintergrund-welten-mvp-vs-production-look.md) Hintergrund-Welten · [#9](open/009-hindernisse-auch-auf-plattformen.md) Hindernisse auf Plattformen · [#10](open/010-arc-logo-als-hintergrund-element.md) Arc-Logo im Hintergrund · [#11](open/011-ci-github-actions-auf-node-24.md) CI auf Node 24 · [#24](open/024-leaderboard-top-20-claim-statt-mail.md) Leaderboard-Claim Top 20

## Out of scope

*(Noch nichts bewusst ausgeschlossen.)*
