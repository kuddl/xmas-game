# 018 · Landingpage: Was braucht die Seite?

| | |
|---|---|
| **Status** | 🟡 Offen |
| **Typ** | wayfinder:grilling |
| **Map** | [Landingpage](../MAP-landingpage.md) |
| **Zugewiesen** | tsailer |
| **Erstellt** | 2026-11-26 |
| **Erledigt** | — |

## Frage

Was muss die Landingpage leisten, und was gehört alles drauf? Gemeinsam im Gespräch klären:

- **Zweck & Zielgruppe:** Wer landet dort, woher kommt er (z. B. per Weihnachtsmail oder Link), und was soll er danach tun?
- **URL & Verhältnis zum Spiel:** `/welcome` oder `/landingpage`? Bleibt das Spiel auf `/`, oder wird die Landingpage zur Startseite?
- **Sektionen:** z. B. Hero, Weihnachtsgruß, „So wird gespielt“, Leaderboard, Über uns / Absender, Footer
- **Call-to-Action:** Hauptaktion (z. B. „Play now“) und Nebenaktionen
- **Look:** Pixel-Stil des Spiels übernehmen oder eher Corporate-Design (Merkle/Arc)?
- **Sprache(n):** Englisch wie das Spiel, Deutsch oder beides?
- **Technik:** einfache statische Seite im Vite-Build oder mehr (Framework, CMS)?
- **Rechtliches & Tracking:** Impressum, Datenschutz, Analytics?

Ergebnis: eine Liste der Entscheidungen. Was sich daraus als eigene Frage abspaltet, wird als Folge-Ticket an die Map gehängt.

## Verlauf

### 2026-11-26 · Runde 1 (Grilling)

- **Zweck & Zielgruppe:** **intern**, nicht für Kunden. Ein Weihnachtsgruß **vom ARC-Team an alle Merkle-Mitarbeiter** (ARC ist ein Projekt bei Merkle). Das Geschenk ist das Spiel.
- **Absender:** das ARC-Team. Empfänger: Merkle-Mitarbeiter (inkl. ARC-Team).
- **URL:** `/welcome` ist der aufrufbare Einstieg.
- **Sprache:** Englisch.
- **Look:** Pixelgrafik wie im Spiel.
- **Technik:** Vite mit einfachem HTML, CSS und etwas JavaScript.
- **Noch offen:** die Mechanik der Seite (erklärt Tobias als Nächstes), danach Sektionen, Call-to-Action, ob das Spiel auf `/` bleibt, Zugriffsschutz und Tracking.

### 2026-11-26 · Mechanik (Tobias' Vorstellung)

- **Horizontales Scrolling wie im Spiel:** Beim Scrollen bewegt sich die Seite von rechts nach links, mit Parallax im Hintergrund. Länge etwa 1–2 Bildschirmbreiten, nicht zu lang.
- **Blöcke im Weg:** Unterwegs stehen Hindernis-Blöcke. Klickt man drauf, **explodiert der Block**, und der Text kommt heraus. Die Boxen dürfen sich leicht bewegen.
- **Texte:**
  - ein Gruß: „Das ARC-Team bedankt sich bei Merkle, grüßt das ganze Merkle-Team und wünscht frohe Weihnachten.“
  - **satirische Texte** über den Agenturalltag: Budget einhalten, Capacity auf Kundenprojekten, Ressourcen, Timesheets, Story Points, Deadlines. Darf spitz sein, weil es intern ist.
- **Cursor:** Die Spielfigur wird eventuell zum Mauszeiger.
- **Finale:** ein großes Banner „Play the Christmas Project Game now“, das ins Spiel führt.
- **Assets:** die vorhandenen aus dem Spiel.
- **Qualität:** Die Animation muss **extrem flüssig** sein und „High-End wie von Google“ aussehen. Offen ist, ob GSAP, PixiJS oder Three.js dabei helfen. Den Skill `modern-web-guidance` dabei nutzen.
