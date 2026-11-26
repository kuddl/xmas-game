# Ticket 05: Progression-Design: MVP-Phase vs Real Production

**Type:** Grilling (HITL)  
**Status:** ✅ Closed  
**Decision:** MVP-Phase Progression definiert  

## Question

Wie und wann wechselt das Spiel von der **MVP-Phase** (sicher, keine Konsequenzen) in die **Real Production-Phase** (ernsthafte Stakes)?

## Resolution

### Progression-Design definiert:

| **Aspekt** | **MVP-Decision** |
|---|---|
| **MVP-Phase Länge** | Erste 200-300 Units (~25-40 Sekunden) |
| **Trigger für Wechsel** | Nach 200-300 Units Distanz gelaufen |
| **Visueller Marker** | Horizontale Linie im Hintergrund (siehe Ticket 06) |
| **Spieler-Sicherheit (MVP)** | Crashen ist okay, keine Konsequenzen, Warm-up |
| **Game-Over-Verhalten (Production)** | 1 Leben — erster Crash = Game Over, Spiel vorbei |
| **Score-Zählung** | Kompletter Score (MVP + Production zusammen) — Score startet bei 0 und zählt durchgängig |

### Kontext:
- MVP-Phase = Sicherer Trainings-Bereich ("MVP-Status" in der Lore)
- Real Production-Phase = Der echte Spielteil mit Stakes
- Der Übergang ist **automatisch** nach Distanz, nicht durch Player-Action

### Backlog-Ideen (später):
- **Training Mode** vs. **Highscore Mode**: Mehrere Leben im Training, 1 Leben für Official Scores
- **Difficulty-Scaling**: Nach Real Production-Start schwieriger werden (schneller, mehr Obstacles)
- **Color-Shift**: Statt nur Linie später Farbwechsel (hellblau → dunkles blau)

### Nächste Schritte:
- **Ticket 03** (Scroll-Speed): Welche Geschwindigkeit fühlt sich spielbar an?
- **Ticket 04** (Obstacle-Generator): Welcher Algorithmus generiert faire Hindernisse?
- **Actual Dev**: Game-Loop bauen, State-Management (MVP ↔ Production), Score-Tracking
