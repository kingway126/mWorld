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
  createSampleMapDocument,
  type MapDocument,
} from "../model/mapDocument";
import type { EditorTool } from "../canvas/tools/editorTool";
import { isInsideMap, tileIndex } from "../model/coordinates";

export interface TileMapEditorState {
  history: HistoryStack<MapDocument>;
  selectedGid: number;
  activeTool: EditorTool;
  hoverCell?: GridCoordinate;
}

export type TileMapEditorAction =
  | { type: "select-tool"; tool: EditorTool }
  | { type: "select-gid"; gid: number }
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
  return {
    history: createHistoryStack(createSampleMapDocument()),
    selectedGid: 1,
    activeTool: "brush",
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
      return {
        ...state,
        history: pushHistory(
          state.history,
          eraseTile(document, document.editor.activeLayerId, action.cell),
        ),
      };

    case "pick": {
      const layer = document.layers.find(
        (candidate) => candidate.id === document.editor.activeLayerId,
      );
      if (!layer || layer.type !== "tile" || !isInsideMap(action.cell, document.size)) {
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
