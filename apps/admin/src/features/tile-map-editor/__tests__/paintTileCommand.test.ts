import { describe, expect, it } from "vitest";
import { paintTile, paintTileBatch } from "../commands/paintTileCommand";
import { createSampleMapDocument } from "../model/mapDocument";

describe("paintTile", () => {
  it("updates one tile in the active tile layer", () => {
    const document = createSampleMapDocument();
    const nextDocument = paintTile(
      document,
      document.editor.activeLayerId,
      { column: 2, row: 3 },
      4,
    );

    const activeLayer = nextDocument.layers.find(
      (layer) => layer.id === document.editor.activeLayerId,
    );
    const previousLayer = document.layers.find(
      (layer) => layer.id === document.editor.activeLayerId,
    );

    expect(activeLayer?.type).toBe("tile");
    expect(previousLayer?.type).toBe("tile");
    if (activeLayer?.type !== "tile" || previousLayer?.type !== "tile") {
      throw new Error("Expected tile layers");
    }

    expect(activeLayer.data[3 * document.size.columns + 2]).toBe(4);
    expect(previousLayer.data[3 * document.size.columns + 2]).toBe(0);
  });

  it("ignores cells outside the map", () => {
    const document = createSampleMapDocument();
    const nextDocument = paintTile(
      document,
      document.editor.activeLayerId,
      { column: -1, row: 0 },
      4,
    );

    expect(nextDocument).toBe(document);
  });

  it("updates many cells with one layer clone", () => {
    const document = createSampleMapDocument();
    const nextDocument = paintTileBatch(
      document,
      document.editor.activeLayerId,
      [
        { cell: { column: 1, row: 1 }, gid: 4 },
        { cell: { column: 2, row: 1 }, gid: 5 },
        { cell: { column: 3, row: 1 }, gid: 6 },
      ],
    );

    const layer = nextDocument.layers.find(
      (candidate) => candidate.id === document.editor.activeLayerId,
    );
    const previousLayer = document.layers.find(
      (candidate) => candidate.id === document.editor.activeLayerId,
    );

    if (!layer || layer.type !== "tile" || !previousLayer || previousLayer.type !== "tile") {
      throw new Error("Expected tile layers");
    }

    expect(layer.data[1 * document.size.columns + 1]).toBe(4);
    expect(layer.data[1 * document.size.columns + 2]).toBe(5);
    expect(layer.data[1 * document.size.columns + 3]).toBe(6);
    expect(previousLayer.data[1 * document.size.columns + 1]).toBe(0);
  });
});
