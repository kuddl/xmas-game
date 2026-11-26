# Wayfinder Map: Landingpage

> Zweite Map neben der [Game-Map](MAP.md). Tickets dieser Map tragen in der Kopf-Tabelle `| **Map** | Landingpage |`.

## Destination

Eine abgestimmte **Spezifikation der Landingpage** als Unterseite dieses Repos (z. B. `/welcome`): Zweck, Zielgruppe, Inhalte und Sektionen, Look, Technik und Livegang. Am Ende ist nichts mehr zu entscheiden, und die Seite kann gebaut werden.

## Notes

- **Repo & Deploy:** gleiche Codebasis wie das Spiel (Vite, `npm run build`). Deploy per Push nach `origin` → Cloudflare Workers (https://christmas.familiesailer.com).
- **Technischer Fakt:** `wrangler.jsonc` nutzt `not_found_handling: single-page-application`, unbekannte Pfade liefern also heute das Spiel aus. Eine Unterseite braucht ein eigenes HTML-Einstiegsdokument im Vite-Build (`build.rollupOptions.input`), z. B. `welcome/index.html` → `dist/welcome/index.html`.
- **Look & Assets:** Pixel-Look des Spiels („Press Start 2P“, Farben aus `src/style.css`), Sprites aus `public/assets/` und Figma ([ABX Game Assets](https://www.figma.com/design/HgKfwks85tYE0fOjVqWkTy/ABX-Game-Assets?node-id=26-2)).
- **Für HTML/CSS** den Skill `modern-web-guidance` konsultieren.
- **Sprache:** Diskussion und Tickets auf Deutsch. Die Sprache der Seitentexte ist Teil der Entscheidungen.
- **Planen, nicht bauen:** Die Map liefert Entscheidungen. Gebaut wird erst, wenn der Weg klar ist, außer ein Prototyp-Ticket verlangt es.

## Decisions so far

*(noch keine)*

## Not yet specified

- Inhalte der einzelnen Sektionen (Texte, Bilder), sobald Zweck und Sektionen feststehen
- Rechtliches (Impressum, Datenschutz, Cookies/Tracking), abhängig von Betreiber und Zielgruppe
- Verhältnis zum Backend-Leaderboard ([#4](open/004-backend-leaderboard-statt-localstorage.md)), falls die Seite Highscores zeigen soll

## Out of scope

*(noch nichts)*
