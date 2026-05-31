import { describe, expect, it } from "vitest";
import { createStampBrushFromSelection } from "../model/brush";
import { tinyTownTileset } from "../model/mapDocument";
import {
  createInitialTileMapEditorState,
  tileMapEditorReducer,
} from "../store/tileMapEditorStore";

describe("tileMapEditorReducer fast drawing tools", () => {
  it("fills a rectangle as one undoable history entry", () => {
    let state = createInitialTileMapEditorState();
    state = tileMapEditorReducer(state, { type: "select-gid", gid: 4 });
    state = tileMapEditorReducer(state, { type: "select-tool", tool: "rect-fill" });
    state = tileMapEditorReducer(state, {
      type: "paint-rect",
      start: { column: 1, row: 1 },
      end: { column: 3, row: 2 },
    });

    const layer = state.history.present.layers.find(
      (candidate) => candidate.id === state.history.present.editor.activeLayerId,
    );
    if (!layer || layer.type !== "tile") {
      throw new Error("Expected tile layer");
    }

    for (let row = 1; row <= 2; row += 1) {
      for (let column = 1; column <= 3; column += 1) {
        expect(layer.data[row * state.history.present.size.columns + column]).toBe(
          4,
        );
      }
    }
    expect(state.history.past).toHaveLength(1);

    state = tileMapEditorReducer(state, { type: "undo" });
    const revertedLayer = state.history.present.layers.find(
      (candidate) => candidate.id === state.history.present.editor.activeLayerId,
    );
    if (!revertedLayer || revertedLayer.type !== "tile") {
      throw new Error("Expected tile layer");
    }

    expect(revertedLayer.data.every((gid) => gid === 0)).toBe(true);
  });

  it("places a stamp as one undoable history entry", () => {
    const stamp = createStampBrushFromSelection(tinyTownTileset, 0, 13);
    let state = createInitialTileMapEditorState();
    state = tileMapEditorReducer(state, { type: "select-stamp", stamp });
    state = tileMapEditorReducer(state, {
      type: "paint-stamp",
      anchor: { column: 2, row: 2 },
    });

    const layer = state.history.present.layers.find(
      (candidate) => candidate.id === state.history.present.editor.activeLayerId,
    );
    if (!layer || layer.type !== "tile") {
      throw new Error("Expected tile layer");
    }

    const width = state.history.present.size.columns;
    expect(layer.data[2 * width + 2]).toBe(1);
    expect(layer.data[2 * width + 3]).toBe(2);
    expect(layer.data[3 * width + 2]).toBe(13);
    expect(layer.data[3 * width + 3]).toBe(14);
    expect(state.history.past).toHaveLength(1);
  });
});
