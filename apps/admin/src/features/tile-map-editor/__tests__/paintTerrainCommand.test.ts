import { describe, expect, it } from "vitest";
import {
  eraseTerrain,
  paintTerrain,
  terrainBrushCells,
} from "../commands/paintTerrainCommand";
import { createSampleMapDocument } from "../model/mapDocument";
import { tileIndex } from "../model/coordinates";

describe("paintTerrain", () => {
  it("derives unique terrain materials from Wang transition endpoints", () => {
    const document = createSampleMapDocument();
    const grass = document.terrainMaterials.find(
      (material) => material.id === "grass",
    );
    const field = document.terrainMaterials.find(
      (material) => material.id === "field",
    );

    expect(document.terrainMaterials.map((material) => material.id)).toEqual([
      "grass",
      "sand",
      "water",
      "rim",
      "field",
    ]);
    expect(
      document.terrainMaterials.every((material) =>
        document.tilesets.find(
          (tileset) =>
            tileset.id === material.sourceTilesetId && tileset.kind === "wang",
        ),
      ),
    ).toBe(true);
    expect(grass).toMatchObject({
      sourceTilesetId: "wang-sand",
      sourceRole: "lower",
      sourceLocalId: 6,
      fillTilesetId: "wang-sand",
      fillLocalId: 6,
    });
    expect(grass?.linkedTilesetIds).toEqual([
      "wang-sand",
      "wang-water",
      "wang-upper-rim",
      "wang-field",
    ]);

    expect(
      document.terrainMaterials.find((material) => material.id === "sand")
        ?.linkedTilesetIds,
    ).toEqual(["wang-sand", "wang-sand-water"]);
    expect(
      document.terrainMaterials.find((material) => material.id === "water")
        ?.linkedTilesetIds,
    ).toEqual(["wang-water", "wang-sand-water"]);
    expect(
      document.terrainMaterials.find((material) => material.id === "rim")
        ?.linkedTilesetIds,
    ).toEqual(["wang-upper-rim"]);
    expect(field?.linkedTilesetIds).toEqual(["wang-field"]);
  });

  it("paints a single Wang material endpoint without edging against empty space", () => {
    const document = createSampleMapDocument();
    const painted = paintTerrain(document, { column: 4, row: 4 }, "water");

    const ground = painted.layers.find((layer) => layer.id === "ground");
    if (!ground || ground.type !== "tile") {
      throw new Error("Expected ground tile layer");
    }

    expect(ground.data[tileIndex({ column: 4, row: 4 }, painted.size)]).toBe(293);
    expect(ground.data[tileIndex({ column: 4, row: 3 }, painted.size)]).toBe(0);
    expect(ground.data[tileIndex({ column: 3, row: 4 }, painted.size)]).toBe(0);
    expect(ground.data[tileIndex({ column: 3, row: 3 }, painted.size)]).toBe(0);
  });

  it("uses Wang autotile only where two painted materials meet", () => {
    const document = createSampleMapDocument();
    const grass = paintTerrain(document, { column: 4, row: 4 }, "grass");
    const painted = paintTerrain(grass, { column: 5, row: 4 }, "water");

    const ground = painted.layers.find((layer) => layer.id === "ground");
    if (!ground || ground.type !== "tile") {
      throw new Error("Expected ground tile layer");
    }

    expect(ground.data[tileIndex({ column: 4, row: 4 }, painted.size)]).toBe(292);
    expect(ground.data[tileIndex({ column: 5, row: 4 }, painted.size)]).toBe(293);
  });

  it("writes details-layer edge tiles for rim terrain", () => {
    const document = createSampleMapDocument();
    const grass = paintTerrain(document, { column: 8, row: 8 }, "grass");
    const painted = paintTerrain(grass, { column: 9, row: 8 }, "rim");

    const ground = painted.layers.find((layer) => layer.id === "ground");
    const details = painted.layers.find((layer) => layer.id === "details");
    if (!ground || ground.type !== "tile" || !details || details.type !== "tile") {
      throw new Error("Expected ground and details tile layers");
    }

    const grassIndex = tileIndex({ column: 8, row: 8 }, painted.size);
    const rimIndex = tileIndex({ column: 9, row: 8 }, painted.size);
    expect(ground.data[grassIndex]).toBe(271);
    expect(details.data[grassIndex]).toBe(308);
    expect(ground.data[rimIndex]).toBe(0);
    expect(details.data[rimIndex]).toBe(309);
  });

  it("paints field base without implicitly drawing the rim terrain", () => {
    const document = createSampleMapDocument();
    const grass = paintTerrain(document, { column: 8, row: 8 }, "grass");
    const painted = paintTerrain(grass, { column: 9, row: 8 }, "field");

    const ground = painted.layers.find((layer) => layer.id === "ground");
    const details = painted.layers.find((layer) => layer.id === "details");
    if (!ground || ground.type !== "tile" || !details || details.type !== "tile") {
      throw new Error("Expected ground and details tile layers");
    }

    const grassIndex = tileIndex({ column: 8, row: 8 }, painted.size);
    const fieldIndex = tileIndex({ column: 9, row: 8 }, painted.size);
    expect(ground.data[grassIndex]).toBe(324);
    expect(ground.data[fieldIndex]).toBe(325);
    expect(details.data[fieldIndex]).toBe(0);
  });

  it("erases terrain ownership and clears affected tile layers", () => {
    const document = createSampleMapDocument();
    const painted = paintTerrain(document, { column: 8, row: 8 }, "field");
    const erased = eraseTerrain(painted, { column: 8, row: 8 });

    const ground = erased.layers.find((layer) => layer.id === "ground");
    const details = erased.layers.find((layer) => layer.id === "details");
    if (!ground || ground.type !== "tile" || !details || details.type !== "tile") {
      throw new Error("Expected ground and details tile layers");
    }

    const index = tileIndex({ column: 8, row: 8 }, erased.size);
    expect(
      erased.editor.terrainCells.every(
        (material) => material === erased.editor.baseTerrain,
      ),
    ).toBe(true);
    expect(ground.data[index]).toBe(0);
    expect(details.data[index]).toBe(0);
  });

  it("paints base grass from a Wang lower endpoint even when vertices already match", () => {
    const document = createSampleMapDocument();
    const painted = paintTerrain(document, { column: 6, row: 6 }, "grass");

    const ground = painted.layers.find((layer) => layer.id === "ground");
    if (!ground || ground.type !== "tile") {
      throw new Error("Expected ground tile layer");
    }

    expect(painted).not.toBe(document);
    expect(ground.data[tileIndex({ column: 6, row: 6 }, painted.size)]).toBe(
      271,
    );
  });

  it("does not repaint visible grass when the fill is already correct", () => {
    const document = createSampleMapDocument();
    const firstPaint = paintTerrain(document, { column: 6, row: 6 }, "grass");
    const secondPaint = paintTerrain(firstPaint, { column: 6, row: 6 }, "grass");

    expect(secondPaint).toBe(firstPaint);
  });

  it("paints every cell in a large grass brush with the Wang lower endpoint", () => {
    const document = createSampleMapDocument();
    const painted = paintTerrain(document, { column: 10, row: 10 }, "grass", 4);

    const ground = painted.layers.find((layer) => layer.id === "ground");
    if (!ground || ground.type !== "tile") {
      throw new Error("Expected ground tile layer");
    }

    for (const cell of terrainBrushCells({ column: 10, row: 10 }, 4, painted.size)) {
      expect(ground.data[tileIndex(cell, painted.size)]).toBe(271);
    }
  });

  it("is idempotent when painting the same material repeatedly", () => {
    const document = createSampleMapDocument();
    const firstPaint = paintTerrain(document, { column: 8, row: 8 }, "sand", 3);
    const secondPaint = paintTerrain(firstPaint, { column: 8, row: 8 }, "sand", 3);

    expect(secondPaint).toBe(firstPaint);
  });

  it("uses the sand-water Wang pair when sand and water meet", () => {
    const document = createSampleMapDocument();
    const sand = paintTerrain(document, { column: 4, row: 4 }, "sand");
    const water = paintTerrain(sand, { column: 5, row: 4 }, "water");

    const ground = water.layers.find((layer) => layer.id === "ground");
    if (!ground || ground.type !== "tile") {
      throw new Error("Expected ground tile layer");
    }

    const sandIndex = tileIndex({ column: 4, row: 4 }, water.size);
    const waterIndex = tileIndex({ column: 5, row: 4 }, water.size);
    expect(water.editor.missingTransitionCells[sandIndex]).toBeUndefined();
    expect(water.editor.missingTransitionCells[waterIndex]).toBeUndefined();
    expect(ground.data[sandIndex]).toBe(340);
    expect(ground.data[waterIndex]).toBe(293);
  });

  it("marks cells with no available transition tileset", () => {
    const document = createSampleMapDocument();
    const water = paintTerrain(document, { column: 4, row: 4 }, "water");
    const field = paintTerrain(water, { column: 5, row: 4 }, "field");

    const ground = field.layers.find((layer) => layer.id === "ground");
    if (!ground || ground.type !== "tile") {
      throw new Error("Expected ground tile layer");
    }

    const waterIndex = tileIndex({ column: 4, row: 4 }, field.size);
    const fieldIndex = tileIndex({ column: 5, row: 4 }, field.size);
    expect(field.editor.missingTransitionCells[waterIndex]).toBe("field|water");
    expect(field.editor.missingTransitionCells[fieldIndex]).toBeUndefined();
    expect(ground.data[waterIndex]).toBe(0);
    expect(ground.data[fieldIndex]).toBe(325);
  });

  it("keeps a last-painted grass strip clean when different upper materials are painted beside it", () => {
    let document = createSampleMapDocument();

    for (let row = 6; row <= 10; row += 1) {
      document = paintTerrain(document, { column: 7, row }, "sand");
      document = paintTerrain(document, { column: 9, row }, "water");
      document = paintTerrain(document, { column: 8, row }, "grass");
    }

    const ground = document.layers.find((layer) => layer.id === "ground");
    if (!ground || ground.type !== "tile") {
      throw new Error("Expected ground tile layer");
    }

    for (let row = 6; row <= 10; row += 1) {
      expect(ground.data[tileIndex({ column: 8, row }, document.size)]).toBe(
        271,
      );
      expect(ground.data[tileIndex({ column: 7, row }, document.size)]).not.toBe(
        271,
      );
      expect(ground.data[tileIndex({ column: 9, row }, document.size)]).not.toBe(
        271,
      );
    }
  });

  it("resolves stepped water corners from terrain vertices", () => {
    let document = createSampleMapDocument();

    for (let row = 4; row <= 10; row += 1) {
      for (let column = 4; column <= 12; column += 1) {
        document = paintTerrain(document, { column, row }, "grass");
      }
    }

    for (const cell of [
      { column: 6, row: 5 },
      { column: 7, row: 5 },
      { column: 8, row: 5 },
      { column: 5, row: 6 },
      { column: 6, row: 6 },
      { column: 7, row: 6 },
      { column: 8, row: 6 },
      { column: 9, row: 6 },
      { column: 5, row: 7 },
      { column: 6, row: 7 },
    ]) {
      document = paintTerrain(document, cell, "water");
    }

    const ground = document.layers.find((layer) => layer.id === "ground");
    if (!ground || ground.type !== "tile") {
      throw new Error("Expected ground tile layer");
    }

    expect(ground.data[tileIndex({ column: 7, row: 6 }, document.size)]).toBe(
      293,
    );
    expect(ground.data[tileIndex({ column: 8, row: 7 }, document.size)]).toBe(
      284,
    );
    expect(ground.data[tileIndex({ column: 4, row: 5 }, document.size)]).toBe(
      288,
    );
  });

  it("paints a visible square brush area and clips it at map edges", () => {
    const document = createSampleMapDocument();
    const cells = terrainBrushCells({ column: 0, row: 0 }, 4, document.size);
    const painted = paintTerrain(document, { column: 0, row: 0 }, "sand", 4);

    const ground = painted.layers.find((layer) => layer.id === "ground");
    if (!ground || ground.type !== "tile") {
      throw new Error("Expected ground tile layer");
    }

    expect(cells).toEqual([
      { column: 0, row: 0 },
      { column: 1, row: 0 },
      { column: 2, row: 0 },
      { column: 0, row: 1 },
      { column: 1, row: 1 },
      { column: 2, row: 1 },
      { column: 0, row: 2 },
      { column: 1, row: 2 },
      { column: 2, row: 2 },
    ]);
    expect(ground.data[tileIndex({ column: 1, row: 1 }, painted.size)]).toBe(
      277,
    );
  });
});
