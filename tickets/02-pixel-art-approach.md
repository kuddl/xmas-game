# Ticket 02: Pixel Art in Three.js: Laden & Rendern

**Type:** Research + Grilling (AFK + HITL)  
**Status:** Open, Unclaimed  
**Blocks:** Prototype-Build, Asset-Austausch-Strategie  

## Question

Wie laden und rendern wir Pixelart in Three.js so, dass:
1. **Assets einfach austauschbar sind** (ein Designer kann PNGs swappen ohne Code-Changes)
2. **Performance gut bleibt** (nicht zu viele Draw-Calls)
3. **Der 8-Bit-Look erhalten bleibt** (keine unerwünschte Filterung/Smoothing)

Konkret:
- Welche Strategie: PNG-Sprites mit Texture-Atlas? Einzelne PNG-Files? SVG? Voxel-Modelle?
- Wie organisieren wir den Assets-Ordner?
- Welche Three.js Features/Libraries nutzen wir? (PlaneGeometry + Texture? Canvas Texture? Custom Shader?)
- Wie vermeiden wir, dass Asset-Pfade im Game-Code verhärtet sind? (Config-Datei? Asset-Registry?)

## Notes

Das hängt mit der **Asset-Austausch-Strategie** zusammen — die Antwort formt, wie wir Assets strukturieren. Kann parallel zur MVP-Scope-Klärung bearbeitet werden, braucht aber ihre Ergebnisse (Spieler-Modell, Obstacle-Arten).
