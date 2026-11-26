# 019 · Konami-Code: Power-up (doppelte Größe & Durchlaufen)

| | |
|---|---|
| **Status** | 🟡 Offen |
| **Typ** | enhancement, backlog |
| **Zugewiesen** | — |
| **Erstellt** | 2026-12-19 |
| **Erledigt** | — |

## Ziel / Frage
Implementiere den klassischen **Konami-Code** (↑ ↑ ↓ ↓ ← → ← → B A) als Easter Egg im Spiel. Bei korrekter Eingabe aktiviert sich ein 10-sekündiges Power-up mit zwei Effekten:
1. **Größe verdoppeln:** Der Spieler wird 2× größer dargestellt
2. **Hindernisse durchlaufen:** Alle Hindernisse können vollständig durchlaufen werden (kein Collision Fail)

Nach 10 Sekunden normalisiert sich alles (Größe zurück, normale Collision-Regeln). Der Code ist nur **einmalig** pro Session aktivierbar.

## MVP-Status
- **Nicht aktiv im MVP** (Phase 1–3), nur für "Real Life"- oder Post-Launch-Version
- Kann später aktiviert werden, indem ein Config-Flag gesetzt wird

## Spezifikation

### Input
- **Tastenkombination:** Konami-Code `↑ ↑ ↓ ↓ ← → ← → B A`
- **Tracking:** State tracken, dass Code korrekt eingegeben wurde (z. B. bei jedem Tastendruck)
- **Validierung:** Nur volle Sequenz zählt; falsche Taste = Reset auf Position 0

### Visuelle & Gameplay-Effekte
- **Größe:** 2× Scale für Player-Sprite (z. B. in `config.js` ein Wert, nicht hardcodiert)
- **Hindernisse:** Collision-Box oder `collides`-Flag wird `false` für 10 Sekunden
- **Feedback:** Optional: kurze visuelle Bestätigung bei erfolgreicher Aktivierung (Blinken, Farb-Overlay, Sound)
- **Timer:** Nach 10 Sekunden: Size zurück, Collision wieder `true`

### Implementierung
1. **Input-Listener:** `keydown` oder bestehender Input-Handler (`pointer` oder ähnlich) erweitern
2. **State-Manager:** Konami-State (Sequence-Index) + Power-up-Timer im Game-State speichern
3. **Player-Update:** `player.scale` und `player.collides` je nach Power-up-Status setzen
4. **Config:** `config.js` → `konami.scaleMultiplier: 2`, `konami.durationSeconds: 10`, `konami.enabled: false` (default)

### Offen
- Sollen andere Parameter (Speed, Jump Height) auch verändert werden, oder nur Größe + Collision?
- Braucht es eine On-Screen-Anzeige, dass das Power-up aktiv ist (z. B. HUD-Text oder Countdown)?
- Soll es Sounds/Animationen geben, oder rein visuell?

## Verlauf
