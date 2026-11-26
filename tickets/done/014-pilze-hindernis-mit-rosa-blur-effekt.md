# 014 · Pilze: Hindernis mit rosa Blur-Effekt statt Tod

| | |
|---|---|
| **Status** | ✅ Erledigt |
| **Typ** | backlog |
| **Zugewiesen** | — |
| **Erstellt** | 2026-11-26 |
| **Erledigt** | 2026-11-26 |
| **Herkunft** | GitHub [#14](https://github.com/kuddl/xmas-game/issues/14) |

## Idee
Neues Hindernis: **Pilze** auf der Strecke. Wer einen berührt, **stirbt nicht**. Stattdessen wird das Bild ein paar Sekunden lang „trippy“: **rosa Filter + etwas Blur** über dem Spielbild.

## Rahmen
- **Kein Einfluss auf die Physik oder Steuerung:** keine vertauschten Tasten, gleiches Tempo und gleicher Sprung.
- Nur ein optischer Effekt (z. B. PixiJS `ColorMatrixFilter` + `BlurFilter` auf der Spielwelt), der nach einer festen Zeit wieder abklingt.

## Offen
- Dauer des Effekts, Stärke von Blur und Tint
- Ob der Effekt auch den Score beeinflusst (vermutlich nicht)
- Wie oft Pilze vorkommen und ab welcher Distanz
- Pilz-Sprite im Spritesheet ergänzen

## Verlauf

### 2026-11-26 · kuddl

Umgesetzt in 39c1f2c:
- Pilz (`mushroom.png`, 16×16, pinke Kappe) als harmloses Objekt am Boden. Er kommt **nur in Production** vor, alle 25–40 s mittig in breiten Lücken.
- Wer ihn berührt, löst **5 s rosa Filter + leichten Blur** auf der Spielwelt aus, mit 0,4 s Ein- und Ausblenden. HUD und Buttons bleiben scharf. Ein zweiter Pilz startet die 5 s neu.
- Toast: **„CREATIVE MODE! YOU CHANGED A COLOR TOKEN IN FIGMA“**. Kein Einfluss auf den Score. Wirkt auch bei Breakthrough.
- Alles anpassbar in `GAME_CONFIG.CREATIVE_MODE` (Texte, Farbe, Dauer, Blur, Häufigkeit). Das Sprite liegt auch in Figma.
