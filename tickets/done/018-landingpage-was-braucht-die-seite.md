# 018 · Landingpage: Was braucht die Seite?

| | |
|---|---|
| **Status** | ✅ Erledigt |
| **Typ** | wayfinder:grilling |
| **Map** | [Landingpage](../MAP-landingpage.md) |
| **Zugewiesen** | tsailer |
| **Erstellt** | 2026-11-26 |
| **Erledigt** | 2026-11-26 |

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

### 2026-11-26 · Runde 2 (Grilling): Entscheidungen

Alle Empfehlungen angenommen:

- **Scroll-Mechanik:** normal vertikal scrollen (Mausrad, Trackpad, Wischen, Tastatur). Eine fixierte Bühne bewegt den Inhalt von rechts nach links, über native **CSS Scroll-Driven Animations**. Für Browser ohne Support eine schlanke JS-Ersatzlösung, kein Polyfill (laut `modern-web-guidance`: parallax-scroll-effects, scrollytelling, motion).
- **Bibliotheken:** kein GSAP, kein Three.js. Scroll und Parallax in nativem CSS. Eine **PixiJS-Ebene als Canvas** nur für Explosionen, Partikel und Schnee, mit den Effekten aus dem Spiel. GSAP nur, falls der Prototyp mehr Choreografie verlangt.
- **Texte:** echtes HTML im Pixel-Look (Press Start 2P, Pixelrahmen). Die Texte stehen in einer **JS-Config**, damit das Team sie leicht ändern kann. Weitere Blöcke sollen ohne Code-Änderung hinzukommen können.
- **Blöcke:** 4 Buzzword-Blöcke im Weg: zuerst der Weihnachtsgruß, dann 3 satirische. Ein Klick, Tap oder Enter lässt den Block explodieren (Trümmer, Wackeln, „+5 SP“), dahinter erscheint die Textbox. Das Scrollen wird nicht blockiert. Über ungeklickten Blöcken steht „CLICK TO SMASH“. Bei „Bewegung reduzieren“ blendet der Text nur ein.
- **Länge:** etwa 3 Bildschirmbreiten. Den genauen Wert legen wir im Prototyp fest.
- **Cursor:** Am Desktop folgt die animierte Spielfigur dem Mauszeiger, leicht verzögert, mit Laufanimation und in Bewegungsrichtung gedreht. Auf Touch-Geräten läuft sie unten auf dem Boden mit.
- **Finale:** großes Banner „PLAY THE CHRISTMAS PROJECT GAME“ mit Button „PRESS START“, der auf `/` führt. Das Spiel bleibt auf `/`, die Landingpage liegt unter `/welcome`.
- **Texte schreibt der Agent**, Tobias bespricht sie mit dem Team (eventuell kommen ein dritter oder vierter Block dazu). → [019 · Landingpage: Texte für Gruß und Satire-Blöcke](../open/019-landingpage-texte-fuer-gruss-und-satire.md)
- **Erst ein super einfacher Prototyp**, um die Mechanik kennenzulernen, dann die richtige Seite. → [020 · Landingpage: Scroll-Prototyp](../open/020-landingpage-scroll-prototyp.md)
