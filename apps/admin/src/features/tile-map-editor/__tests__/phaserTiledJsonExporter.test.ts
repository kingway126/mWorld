import { describe, expect, it } from "vitest";
import { paintTile } from "../commands/paintTileCommand";
import { exportPhaserTiledJson } from "../exporters/phaserTiledJsonExporter";
import { createSampleMapDocument } from "../model/mapDocument";

describe("exportPhaserTiledJson", () => {
  it("exports an orthogonal Tiled-compatible tilemap", () => {
    const document = createSampleMapDocument();
    const painted = paintTile(
      document,
      document.editor.activeLayerId,
      { column: 1, row: 1 },
      5,
    );

    const exported = exportPhaserTiledJson(painted);

    expect(exported.orientation).toBe("orthogonal");
    expect(exported.width).toBe(document.size.columns);
    expect(exported.height).toBe(document.size.rows);
    expect(exported.tilewidth).toBe(document.tileSize.width);
    expect(exported.tilesets[0]).toMatchObject({
      firstgid: 1,
      name: "Studio Basic",
      tilewidth: 32,
      tileheight: 32,
    });
    expect(exported.layers[0].type).toBe("tilelayer");
    expect(exported.layers[0].data[1 * document.size.columns + 1]).toBe(5);
  });
});
