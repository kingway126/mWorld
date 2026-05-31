import type { GridCoordinate, ViewportState } from "../model/coordinates";
import { eraseTile } from "../commands/eraseTileCommand";
import {
  createHistoryStack,
  pushHistory,
  redoHistory,
  undoHistory,
  type HistoryStack,
} from "../commands/historyStack";
import { paintTile } from "../commands/paintTileCommand";
import {
  eraseTerrain,
  paintTerrain,
  pickTerrainMaterialAtCell,
} from "../commands/paintTerrainCommand";
import {
  createSampleMapDocument,
  type MapDocument,
} from "../model/mapDocument";
import type { EditorTool } from "../canvas/tools/editorTool";
import { isInsideMap, tileIndex } from "../model/coordinates";

export interface TileMapEditorState {
  history: HistoryStack<MapDocument>;
  selectedGid: number;
  selectedTerrainId: string;
  terrainBrushSize: number;
  activeTool: EditorTool;
  hoverCell?: GridCoordinate;
}

export type TileMapEditorAction =
  | { type: "select-tool"; tool: EditorTool }
  | { type: "select-gid"; gid: number }
  | { type: "select-terrain"; terrainId: string }
  | { type: "set-terrain-brush-size"; size: number }
  | { type: "set-active-layer"; layerId: string }
  | { type: "toggle-layer-visibility"; layerId: string }
  | { type: "toggle-layer-lock"; layerId: string }
  | { type: "paint"; cell: GridCoordinate }
  | { type: "erase"; cell: GridCoordinate }
  | { type: "pick"; cell: GridCoordinate }
  | { type: "set-hover-cell"; cell?: GridCoordinate }
  | { type: "set-viewport"; viewport: ViewportState }
  | { type: "undo" }
  | { type: "redo" };

export function createInitialTileMapEditorState(): TileMapEditorState {
  const document = createSampleMapDocument();

  return {
    history: createHistoryStack(document),
    selectedGid: 1,
    selectedTerrainId:
      document.editor.selectedTerrainId ?? document.editor.baseTerrain,
    terrainBrushSize: document.editor.terrainBrushSize,
    activeTool: "terrain",
  };
}

export function tileMapEditorReducer(
  state: TileMapEditorState,
  action: TileMapEditorAction,
): TileMapEditorState {
  const document = state.history.present;

  switch (action.type) {
    case "select-tool":
      return { ...state, activeTool: action.tool };

    case "select-gid":
      return { ...state, selectedGid: action.gid, activeTool: "brush" };

    case "select-terrain":
      return {
        ...state,
        selectedTerrainId: action.terrainId,
        activeTool: "terrain",
        history: {
          ...state.history,
          present: {
            ...document,
            editor: {
              ...document.editor,
              selectedTerrainId: action.terrainId,
            },
          },
        },
      };

    case "set-terrain-brush-size": {
      const size = Math.max(1, Math.min(8, Math.floor(action.size)));

      return {
        ...state,
        terrainBrushSize: size,
        history: {
          ...state.history,
          present: {
            ...document,
            editor: {
              ...document.editor,
              terrainBrushSize: size,
            },
          },
        },
      };
    }

    case "set-active-layer":
      return {
        ...state,
        history: pushHistory(state.history, {
          ...document,
          editor: {
            ...document.editor,
            activeLayerId: action.layerId,
          },
        }),
      };

    case "toggle-layer-visibility":
      return {
        ...state,
        history: pushHistory(state.history, {
          ...document,
          layers: document.layers.map((layer) =>
            layer.id === action.layerId
              ? { ...layer, visible: !layer.visible }
              : layer,
          ),
        }),
      };

    case "toggle-layer-lock":
      return {
        ...state,
        history: pushHistory(state.history, {
          ...document,
          layers: document.layers.map((layer) =>
            layer.id === action.layerId
              ? { ...layer, locked: !layer.locked }
              : layer,
          ),
        }),
      };

    case "paint":
      if (state.activeTool === "terrain") {
        return {
          ...state,
          history: pushHistory(
            state.history,
            paintTerrain(
              document,
              action.cell,
              state.selectedTerrainId,
              state.terrainBrushSize,
            ),
          ),
        };
      }

      return {
        ...state,
        history: pushHistory(
          state.history,
          paintTile(
            document,
            document.editor.activeLayerId,
            action.cell,
            state.selectedGid,
          ),
        ),
      };

    case "erase":
      {
        const terrainErased = eraseTerrain(
          document,
          action.cell,
          state.terrainBrushSize,
        );
        const nextDocument = eraseTile(
          terrainErased,
          terrainErased.editor.activeLayerId,
          action.cell,
        );

        return {
          ...state,
          history: pushHistory(state.history, nextDocument),
        };
      }

    case "pick": {
      if (!isInsideMap(action.cell, document.size)) {
        return state;
      }

      const terrainMaterial = pickTerrainMaterialAtCell(document, action.cell);
      if (terrainMaterial) {
        return {
          ...state,
          activeTool: "terrain",
          selectedTerrainId: terrainMaterial.id,
          history: {
            ...state.history,
            present: {
              ...document,
              editor: {
                ...document.editor,
                selectedTerrainId: terrainMaterial.id,
              },
            },
          },
        };
      }

      const layer = document.layers.find(
        (candidate) => candidate.id === document.editor.activeLayerId,
      );
      if (!layer || layer.type !== "tile") {
        return state;
      }

      const gid = layer.data[tileIndex(action.cell, document.size)];
      return gid > 0 ? { ...state, selectedGid: gid, activeTool: "brush" } : state;
    }

    case "set-hover-cell":
      return { ...state, hoverCell: action.cell };

    case "set-viewport":
      return {
        ...state,
        history: {
          ...state.history,
          present: {
            ...document,
            editor: {
              ...document.editor,
              viewport: action.viewport,
            },
          },
        },
      };

    case "undo":
      return { ...state, history: undoHistory(state.history) };

    case "redo":
      return { ...state, history: redoHistory(state.history) };

    default:
      return state;
  }
}
