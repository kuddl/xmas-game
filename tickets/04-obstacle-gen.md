# Ticket 04: Hindernisse-Generator: Semi-Random-Algorithmus

**Type:** Prototype (HITL)  
**Status:** Open, Unclaimed  
**Blocked by:** MVP-Scope  

## Question

Wie generieren wir Hindernisse **fair und spielbar**, ohne zu viel Zufall?

Konkret: Welcher Algorithmus stellt sicher, dass:
- Nicht zu viele Hindernisse auf einmal kommen (Spieler hat Zeit zu reagieren)
- Nicht zu lange leere Strecken entstehen (Spiel wird langweilig)
- Alles immer noch "zufällig" genug anfühlt (nicht vorhersehbar)

Du hast erwähnt: "seeded oder semi-random, nicht komplett zufällig". Das ist die Antwort auf diese Frage.

Optionen:
- **Feste Sequenzen mit Variation**: Bestimmte Muster (z.B. "Hindernis, Gap, Hindernis, Hindernis, Gap") werden in Reihenfolge gespielt, aber mit etwas Randomness
- **Procedural mit Constraints**: Random-Generator mit Regeln (z.B. "Min 2 Sekunden nach letztem Hindernis, Max 5 Sekunden Lücke")
- **Difficulty-Curves**: Verschiedene "Pools" von Obstacle-Patterns, die sich mit Distanz/Zeit ändern

## Notes

Das ist nicht "Build die Funktion", sondern "Decide auf einen Algorithmus". Implementation kommt später. Die Antwort sollte beschreiben, wie wir Hindernisse generieren, damit der Prototype gespielt werden kann.
