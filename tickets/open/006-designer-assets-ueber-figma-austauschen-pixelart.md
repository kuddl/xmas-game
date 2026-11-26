# 006 · Designer-Assets über Figma austauschen (Pixelart & Animationen)

| | |
|---|---|
| **Status** | 🟡 Offen |
| **Typ** | enhancement, backlog |
| **Zugewiesen** | — |
| **Erstellt** | 2026-11-25 |
| **Erledigt** | — |
| **Herkunft** | GitHub [#6](https://github.com/kuddl/xmas-game/issues/6) |

## Ziel
Die finalen Pixelart-Assets kommen vom Designer. Der Austausch läuft über **Figma**: Die aktuellen Sprites liegen dort als Vorlage, der Designer ersetzt sie und liefert PNGs zurück, die über `public/assets/spritesheet.json` eingebunden werden, ohne Code-Änderung.

**Figma:** [ABX Game Assets](https://www.figma.com/design/HgKfwks85tYE0fOjVqWkTy/ABX-Game-Assets?node-id=26-2), Seite „Assets“, Frame „xmas-game · Game Assets“

## Stand
- [x] Alle 12 Sprites aus `public/assets/sprites` per Figma MCP (`upload_assets` + `use_figma`) hochgeladen
- [x] Asset-Seite mit 5 Gruppen: Character, Obstacles, World, Pickups & Effects, Backgrounds
- [x] Pro Asset eine Karte mit Key aus `spritesheet.json`, Dateiname, Pixelgröße und Frames/Animationen. Dazu eine **`<key> @1x`-Ebene** (exakte Größe, Export PNG 1x) und eine vergrößerte Vorschau.

## Ablauf für den Designer
1. Das Bild im `@1x`-Frame ersetzen. Die **Pixelgröße bleibt gleich** (bzw. bei Animationen das Frame-Raster, z. B. Player 5 × 16×16).
2. Als PNG 1x unter dem angegebenen Dateinamen exportieren.
3. Die PNGs kommen nach `public/assets/sprites/`. Wenn sich Größe oder Frames ändern, passen wir `spritesheet.json` an.

## Offen
- Wer ist der Designer, und bis wann?
- Das Arc-Logo ist bisher nur eine Annäherung. Hier braucht es das offizielle Logo.
- Größere Sprites (z. B. 32×32 Player) wären möglich, erfordern aber Anpassungen in `src/config.js` (Größen und Hitboxen).
- Rückweg automatisieren? Über den Figma MCP (`download_assets`) könnten wir die fertigen PNGs auch direkt aus Figma ziehen.

## Verlauf

### 2026-11-26 · kuddl

Die Assets sind nach Figma gepusht: https://www.figma.com/design/HgKfwks85tYE0fOjVqWkTy/ABX-Game-Assets?node-id=26-2. Der Ablauf ist jetzt umgekehrt: Die Assets gehen aus dem Repo nach Figma, der Designer arbeitet dort und liefert PNGs zurück. Details stehen in der Beschreibung.

### 2026-11-26 · kuddl

Zwei neue Sprites sind dazugekommen und auch in Figma angelegt: `mushroom` ([#14](../done/014-pilze-hindernis-mit-rosa-blur-effekt.md)) und `coinCloud` ([#17](../done/017-coin-wolke-in-der-luft-waehrend.md)). Damit sind es jetzt 14 Assets.
