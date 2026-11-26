# Ticket 02: Pixel Art in Three.js: Laden & Rendern

**Type:** Research + Grilling (AFK + HITL)  
**Status:** ✅ Closed  
**Resolved:** Asset-Pipeline & Text-Rendering definiert  

## Question

Wie laden und rendern wir Pixelart in Three.js so, dass:
1. **Assets einfach austauschbar sind** (ein Designer kann PNGs swappen ohne Code-Changes)
2. **Performance gut bleibt** (nicht zu viele Draw-Calls)
3. **Der 8-Bit-Look erhalten bleibt** (keine unerwünschte Filterung)
4. **Business-Buzzwords auf Obstacles sichtbar sind** (Deadline, TCO, etc.)

## Resolution

### Asset-Rendering-Strategy:

| **Aspekt** | **MVP-Decision** |
|---|---|
| **Rendering-Technik** | PlaneGeometry + TextureMap (Standard Three.js) |
| **Pixel-Crispness** | `texture.magFilter = THREE.NearestFilter` (kein Smoothing) |
| **Sprite-Files** | PNG-Files in `/assets/sprites/` |
| **Asset-Config** | `spritesheet.json` mit Sprite-Referenzen (path, width, height) |
| **Text-Rendering** | Option B — TextGeometry / Canvas-Texture für dynamischen Text (später rausnehmen wenn nicht passt) |
| **Obstacles-Buzzwords** | Pool von 6 Buzzwords: Deadline, TCO, Scope, Milestone, MVP, Production |

### Folder-Struktur:
```
/assets/
  /sprites/
    player.png                 (← Code-generated für MVP, später PNG vom Designer)
    obstacle-block.png         (← Code-generated für MVP)
    collectible-logo.png       (← Code-generated für MVP)
  spritesheet.json             (← Metadaten für alle Sprites)
```

### spritesheet.json Beispiel:
```json
{
  "sprites": {
    "player": {
      "path": "assets/sprites/player.png",
      "width": 32,
      "height": 32,
      "animation": { "frames": [0, 1, 2], "fps": 10 }
    },
    "obstacle": {
      "path": "assets/sprites/obstacle-block.png",
      "width": 48,
      "height": 32
    },
    "collectible": {
      "path": "assets/sprites/collectible-logo.png",
      "width": 16,
      "height": 16
    }
  }
}
```

### Designer-Handoff (später):
1. Designer malt neue PNG-Sprites
2. Legt sie in `/assets/sprites/` ab
3. Updated `spritesheet.json` mit neuen Dimensionen
4. Spiel lädt sie automatisch → Done!

### Text-Rendering (Obstacles):
- Jedes Obstacle bekommt ein Text-Mesh (Three.js oder Canvas-basiert)
- Buzzword wird dynamisch aus Pool gewählt
- **Backlog:** Text-Styling (Font, Size, Color) noch verfeinern
- **Option:** Wenn Text-Rendering ruckelig wirkt, können wir es rausnehmen und Text direkt in PNG packen

### Nächste Schritte:
- **Ticket 03** (Scroll-Speed): Welche Geschwindigkeit fühlt sich spielbar an?
- **Ticket 04** (Obstacle-Generator): Welcher Algorithmus generiert faire Hindernisse?
- **Ticket 05** (Progression-Design): MVP-Phase vs Real Production
- **Actual Dev:** Code-generated Sprites bauen, Asset-Loader schreiben, Text-Mesh implementieren
