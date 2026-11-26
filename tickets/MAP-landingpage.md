# Wayfinder Map: Landingpage

> Zweite Map neben der [Game-Map](MAP.md). Tickets dieser Map tragen in der Kopf-Tabelle `| **Map** | Landingpage |`.

## Destination

Eine abgestimmte **Spezifikation der Landingpage** dieses Repos (seit 020: auf `/`, das Spiel auf `/game/`): Zweck, Zielgruppe, Inhalte und Sektionen, Look, Technik und Livegang. Am Ende ist nichts mehr zu entscheiden, und die Seite kann gebaut werden.

## Notes

- **Repo & Deploy:** gleiche Codebasis wie das Spiel (Vite, `npm run build`). Deploy per Push nach `origin` → Cloudflare Workers (https://christmas.familiesailer.com).
- **Technischer Fakt:** Vite baut zwei Seiten (`build.rollupOptions.input`): `index.html` (Landingpage, Quellen in `welcome/`) und `game/index.html` (Spiel). `wrangler.jsonc` nutzt `not_found_handling: single-page-application`, unbekannte Pfade liefern also die Landingpage aus.
- **Look & Assets:** Pixel-Look des Spiels („Press Start 2P“, Farben aus `src/style.css`), Sprites aus `public/assets/` und Figma ([ABX Game Assets](https://www.figma.com/design/HgKfwks85tYE0fOjVqWkTy/ABX-Game-Assets?node-id=26-2)).
- **Für HTML/CSS** den Skill `modern-web-guidance` konsultieren.
- **Sprache:** Diskussion und Tickets auf Deutsch. Die Sprache der Seitentexte ist Teil der Entscheidungen.
- **Planen, nicht bauen:** Die Map liefert Entscheidungen. Gebaut wird erst, wenn der Weg klar ist, außer ein Prototyp-Ticket verlangt es.

## Decisions so far

- [Landingpage: Was braucht die Seite?](done/018-landingpage-was-braucht-die-seite.md): interner Weihnachtsgruß vom ARC-Team an Merkle unter `/welcome`, auf Englisch, im Pixel-Look. Vertikal scrollen bewegt die Seite horizontal (native CSS Scroll-Driven Animations), dazu Parallax. Buzzword-Blöcke explodieren per Klick und geben die Texte frei (JS-Config). Die Spielfigur ist der Cursor. Finale-Banner führt ins Spiel. Vite mit HTML, CSS und etwas JS, PixiJS nur für Partikel, kein GSAP.
- [Landingpage: Scroll-Prototyp](done/020-landingpage-scroll-prototyp.md): Mechanik passt, kein GSAP nötig. Scrollrichtung umgedreht (Start unten, hochscrollen = vorwärts), das Geschenk öffnet sich erst nach allen Kisten. **Landingpage auf `/`, Spiel auf `/game/`.**

## Not yet specified

- Zugriffsschutz: Die Seite ist intern, liegt aber öffentlich auf christmas.familiesailer.com. Reicht „wer den Link hat“, oder braucht es einen Schutz? Dazu Tracking und Analytics.
- Verhältnis zum Backend-Leaderboard ([#4](open/004-backend-leaderboard-statt-localstorage.md)), falls die Seite Highscores zeigen soll

## Out of scope

*(noch nichts)*
