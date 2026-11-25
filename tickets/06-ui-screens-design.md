# Ticket 06: Start & Game Over Screen Design

**Type:** Grilling (HITL)  
**Status:** ✅ Closed  
**Decision:** UI-Screens definiert  

## Question

Wie sehen Start-Screen und Game Over-Screen aus? Welche UI-Elemente, welche Visuellen?

## Resolution

### Start-Screen:
- **Hintergrund**: Szenerie im Hintergrund (Spielwelt), aber **blurred/ausgeblurt** (Fokus auf Text)
- **Titel**: Großer, blockiger Text "Christmas Game" oben — Pixel-Art-Style
- **Input-Prompt**: "Press Space to Start" (oder ähnlich)
- **Farben**: Blau-weiße Palette (winterlich)

### Game Over-Screen:
- **Titel**: Großes "GAME OVER" in der Mitte
- **Score-Anzeige**: Klassischer 80er-Konsolen-Style, Pixel-Art
  - "Current Score: [Distanz]"
  - "High Score: [Best]"
- **Farben**: Blau-weiße Palette
- **Input-Prompt**: "Press Space to Restart"

### MVP → Real Production Übergang:
- **Visual**: Einfach eine **horizontale Linie** im Hintergrund, die den Übergang markiert
- **Später (Backlog)**: Farbfilter-Wechsel (z.B. hellblau → dunkles blau, oder hellgrün → hellblau)
- **MVP**: Nur die Linie, kein Color-Shift noch

### Design-Prinzipien:
- Alles im **80er-Konsolen-Pixel-Art-Style**
- Minimalistisch, klar leserlich
- Text ist zentral, nicht gequetscht
- Blau-Weiße Farben durchgängig

