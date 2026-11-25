# Ticket 12: Mobile-Steuerung

**Type:** Grilling + Build (HITL)  
**Status:** ✅ Closed  

## Question

Wie duckt man sich auf dem Handy, wo es keine ↓-Taste gibt?

## Resolution

Variante **B: zwei Bildschirmhälften** (Varianten A „Wischen“ und C „zwei Buttons“ verworfen: Wischen reagiert verzögert und duckt nur kurz, Buttons muss man genau treffen und sie verdecken das Spielfeld).

| **Aspekt** | **Entscheidung** |
|---|---|
| **Linke Hälfte halten** | wie ↓: am Boden ducken, auf Plattformen durchfallen, in der Luft schneller fallen. Mehrere Finger links sind möglich, die Figur bleibt geduckt, bis alle losgelassen sind. |
| **Rechte Hälfte tippen** | springen (mit Arc-Power-Up auch Double Jump) |
| **Maus (Desktop)** | Ein Klick springt überall (wie vorher) |
| **Hinweise** | Unten links „↓ HOLD = DUCK“, unten rechts „TAP = JUMP ↑“ (halbtransparent, nicht klickbar) |
| **Pause** | Pixel-Icon-Button oben rechts unter der Highscore-Box (nur auf Touch-Geräten) |
| **Vollbild** | Icon-Button daneben + „PLAY IN FULLSCREEN“ auf dem Startscreen. Blendet die Adressleiste aus, auf Android wird das Querformat festgehalten. Auf Geräten ohne Fullscreen-API (iPhone Safari) ausgeblendet. |
| **Texte** | Auf Touch-Geräten wechseln alle Texte: „TAP HERE TO START“, „TAP TO CONTINUE“, Tutorial-Karten „Tap the right side“ / „Hold the left side“ |
| **Modus-Erkennung** | Startet im Touch-Modus auf Geräten ohne Hover mit grobem Zeiger. Eine Berührung schaltet auf Touch, ein Tastendruck zurück auf Tastatur. |
| **Hochformat** | Hinweis „PLEASE TURN YOUR PHONE TO LANDSCAPE“. Dreht man mitten im Lauf, pausiert das Spiel. |
| **Kompakt-Layout** | Bei Bildschirmhöhe unter 500 px: kleinere Panels, Power-Up-Leiste oben links im Himmel (verdeckt die Figur nicht), Versions-Badge ausgeblendet, Tutorial-Karten schmaler auf der Seite mit mehr Platz |
| **Sichtbare Höhe** | `100dvh` statt `100vh`: Auf Android lag sonst der untere Teil hinter der Adressleiste (Boden und Touch-Hinweise waren abgeschnitten) |
| **Game Over kompakt** | Punkte und Highscores nebeneinander, Restart-Button immer sichtbar; notfalls scrollbar |
| **Browser-Gesten** | `touch-action: none`, kein Zoomen, kein Kontextmenü bei Long-Press |
| **←/→ Tempo** | Gibt es auf dem Handy nicht, das Tempo bleibt dort normal |
