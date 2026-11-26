# 001 · Tempo, Sprunggefühl & Schwierigkeitskurve kalibrieren

| | |
|---|---|
| **Status** | ✅ Erledigt |
| **Typ** | wayfinder:prototype |
| **Zugewiesen** | — |
| **Erstellt** | 2026-11-25 |
| **Erledigt** | 2026-11-26 |
| **Herkunft** | GitHub [#1](https://github.com/kuddl/xmas-game/issues/1) |

## Question

Welches Tempo, welche Sprunghöhe und welche Schwierigkeitskurve fühlen sich **spielbar und spaßig** an, für eine Session von 20 Sekunden bis 2 Minuten?

Das lässt sich nur durch Spielen beantworten. Grundlage ist der aktuelle Stand auf https://christmas.familiesailer.com.

## Aktueller Stand (`src/config.js`)

| Wert | Aktuell |
|---|---|
| Grundtempo `BASE_SCROLL_SPEED` | 225 px/s (≈ 7,5 m/s) |
| ←/→ Tempo-Faktor | 0,72× / 1,32× |
| Tempo-Anstieg in Production `PROD_SPEED_RAMP_PER_100M` | +12 px/s je 100 m |
| Höchsttempo `MAX_SCROLL_SPEED` | 410 px/s |
| Sprung `JUMP_VELOCITY` / `GRAVITY` | -450 / 1180 → ca. 86 px hoch, ca. 0,76 s in der Luft |
| Lücken zwischen Hindernissen | 1,15–2,35 s, in Production schrumpfend bis 75 % |

## Zu entscheiden
- Grundtempo und Sprunggefühl (Höhe, Luftzeit) passen so? Oder schneller/langsamer?
- Wie steil soll es nach 250 m schwerer werden (Tempo, Dichte), damit ein guter Lauf etwa 1–2 Minuten dauert?
- Kommen ab einer bestimmten Distanz neue Elemente dazu (z. B. mehr Flieger, häufigere Plattformen)?

Übernommen aus `tickets/03-scroll-speed.md` und der Fog-Notiz „Schwierigkeits-Progression“.

## Verlauf

### 2026-11-26 · kuddl

✅ Spieltested: Tempo fühlt sich richtig an. BASE_SCROLL_SPEED (225 px/s), Sprunggefühl und Schwierigkeitskurve passen so.
