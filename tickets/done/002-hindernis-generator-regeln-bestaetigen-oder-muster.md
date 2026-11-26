# 002 · Hindernis-Generator: Regeln bestätigen oder Muster ergänzen

| | |
|---|---|
| **Status** | ✅ Erledigt |
| **Typ** | wayfinder:prototype |
| **Zugewiesen** | kuddl |
| **Erstellt** | 2026-11-25 |
| **Erledigt** | 2026-11-26 |
| **Herkunft** | GitHub [#2](https://github.com/kuddl/xmas-game/issues/2) |

## Question

Sind die Regeln, nach denen Hindernisse, Flieger und Plattformen erscheinen, **fair und abwechslungsreich genug**? Oder brauchen wir zusätzlich feste Muster bzw. Pattern-Pools je Schwierigkeit?

## Aktueller Stand (prozedural mit Regeln)
- Abstand zwischen Hindernissen: zufällig 1,15–2,35 s, in Production enger (bis 75 %)
- Wörter per Shuffle-Bag, d. h. jedes Buzzword kommt einmal, bevor sich eines wiederholt
- Flieger ab 60 m, 35 % Chance, nie zwei hintereinander, danach +0,35 s Abstand
- Plattformen alle 6–11 s. Keine Hindernisse darunter, 70 px frei davor, 1,2 s Auslauf danach.
- Power-Ups alle 7–12 s in breiten Lücken bzw. als Belohnung auf Ebene 3

## Zu entscheiden
- Fühlt sich das beim Spielen fair an, oder gibt es Situationen, die unschaffbar oder langweilig sind?
- Bleibt es bei „zufällig mit Regeln“ (Option *Procedural mit Constraints*), oder kommen feste Muster bzw. Pattern-Pools je Distanz dazu?
- Soll der Ablauf für alle Spieler gleich sein (fester Seed, fairer für eine gemeinsame Rangliste)?

Übernommen aus `tickets/04-obstacle-gen.md`.

## Verlauf

### 2026-11-26 · kuddl

Entscheidung nach Playtest:
- Der Generator bleibt prozedural mit Regeln. Er fühlt sich fair und abwechslungsreich an, feste Muster brauchen wir nicht.
- Kein fester Seed.
- Folgearbeit: [#13](013-mvp-phase-kuerzen-und-optisch-von.md) (MVP-Phase kürzen und optisch abheben)
- Neue Hindernis-Idee: [#14](014-pilze-hindernis-mit-rosa-blur-effekt.md) (Pilze mit rosa Blur-Effekt)
