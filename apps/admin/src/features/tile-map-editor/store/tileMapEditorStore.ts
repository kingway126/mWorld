import type { GridCoordinate, ViewportState } from "../model/coordinates";
import {
  gridRectCells,
  isInsideMap,
  normalizeGridRect,
  tileIndex,
} from "../model/coordinates";
import type { EditorTool } from "../canvas/tools/editorTool";
import { eraseTile } from "../commands/eraseTileCommand";
import {
  createHistoryStack,
  pushHistory,
  redoHistory,
  undoHistory,
  type HistoryStack,
} from "../commands/historyStack";
import {
  paintTileBatch,
  type TilePaintPlacement,
} from "../commands/paintTileCommand";
import {
  eraseTerrain,
  paintTerrain,
  paintTerrainCells,
  pickTerrainMaterialAtCell,
} from "../commands/paintTerrainCommand";
import {
  pickRandomGid,
  stampPlacementsAt,
  type PaintSource,
  type RandomBrushState,
  type StampBrush,
} from "../model/brush";
import {
  createSampleMapDocument,
  type MapDocument,
} from "../model/mapDocument";
import { findTileByGid } from "../model/tileset";

export interface TileMapEditorState {
  history: HistoryStack<MapDocument>;
  selectedGid: number;
  selectedTerrainId: string;
  selectedStamp?: StampBrush;
  paintSource: PaintSource;
  randomBrush: RandomBrushState;
  terrainBrushSize: number;
  activeTool: EditorTool;
  hoverCell?: GridCoordinate;
}

export type TileMapEditorAction =
  | { type: "select-tool"; tool: EditorTool }
  | { type: "select-gid"; gid: number }
  | { type: "select-terrain"; terrainId: string }
  | { type: "select-stamp"; stamp: StampBrush }
  | { type: "set-terrain-brush-size"; size: number }
  | { type: "toggle-random-brush" }
  | { type: "add-random-candidate"; gid: number }
  | { type: "remove-random-candidate"; gid: number }
  | { type: "clear-random-candidates" }
  | { type: "set-active-layer"; layerId: string }
  | { type: "toggle-layer-visibility"; layerId: string }
  | { type: "toggle-layer-lock"; layerId: string }
  | { type: "paint"; cell: GridCoordinate }
  | { type: "paint-rect"; start: GridCoordinate; end: GridCoordinate }
  | { type: "paint-stamp"; anchor: GridCoordinate }
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
    paintSource: "terrain",
    randomBrush: {
      enabled: false,
      candidateGids: [],
      avoidImmediateRepeat: true,
    },
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
      return {
        ...state,
        selectedGid: action.gid,
        paintSource: "tile",
        activeTool: tilePaintToolAfterAssetSelection(state.activeTool),
      };

    case "select-terrain":
      return {
        ...state,
        selectedTerrainId: action.terrainId,
        paintSource: "terrain",
        activeTool: state.activeTool === "rect-fill" ? "rect-fill" : "terrain",
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

    case "select-stamp":
      return {
        ...state,
        selectedStamp: action.stamp,
        paintSource: "tile",
        activeTool: "stamp",
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

    case "toggle-random-brush":
      return {
        ...state,
        randomBrush: {
          ...state.randomBrush,
          enabled:
            state.randomBrush.candidateGids.length > 0
              ? !state.randomBrush.enabled
              : false,
        },
      };

    case "add-random-candidate":
      if (
        !findTileByGid(document.tilesets, action.gid) ||
        state.randomBrush.candidateGids.includes(action.gid)
      ) {
        return state;
      }

      return {
        ...state,
        randomBrush: {
          ...state.randomBrush,
          candidateGids: [...state.randomBrush.candidateGids, action.gid],
        },
      };

    case "remove-random-candidate": {
      const candidateGids = state.randomBrush.candidateGids.filter(
        (gid) => gid !== action.gid,
      );

      return {
        ...state,
        randomBrush: {
          ...state.randomBrush,
          enabled: candidateGids.length > 0 && state.randomBrush.enabled,
          candidateGids,
        },
      };
    }

    case "clear-random-candidates":
      return {
        ...state,
        randomBrush: {
          ...state.randomBrush,
          enabled: false,
          candidateGids: [],
        },
      };

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
          paintTileBatch(
            document,
            document.editor.activeLayerId,
            createTilePaintPlacements(document, state, [action.cell]),
          ),
        ),
      };

    case "paint-rect": {
      const cells = gridRectCells(
        normalizeGridRect(action.start, action.end),
        document.size,
      );

      if (state.paintSource === "terrain") {
        return {
          ...state,
          history: pushHistory(
            state.history,
            paintTerrainCells(document, cells, state.selectedTerrainId),
          ),
        };
      }

      return {
        ...state,
        history: pushHistory(
          state.history,
          paintTileBatch(
            document,
            document.editor.activeLayerId,
            createTilePaintPlacements(document, state, cells),
          ),
        ),
      };
    }

    case "paint-stamp":
      if (!state.selectedStamp) {
        return state;
      }

      return {
        ...state,
        history: pushHistory(
          state.history,
          paintTileBatch(
            document,
            document.editor.activeLayerId,
            stampPlacementsAt(state.selectedStamp, action.anchor, document.size),
          ),
        ),
      };

    case "erase": {
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
          paintSource: "terrain",
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
      return gid > 0
        ? {
            ...state,
            selectedGid: gid,
            paintSource: "tile",
            activeTool: "brush",
          }
        : state;
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

function tilePaintToolAfterAssetSelection(activeTool: EditorTool): EditorTool {
  return activeTool === "rect-fill" ? "rect-fill" : "brush";
}

function createTilePaintPlacements(
  document: MapDocument,
  state: TileMapEditorState,
  cells: GridCoordinate[],
): TilePaintPlacement[] {
  return cells
    .filter((cell) => isInsideMap(cell, document.size))
    .map((cell) => ({
      cell,
      gid: resolveTilePaintGid(document, state, cell),
    }));
}

function resolveTilePaintGid(
  document: MapDocument,
  state: TileMapEditorState,
  cell: GridCoordinate,
) {
  if (!state.randomBrush.enabled || state.randomBrush.candidateGids.length === 0) {
    return state.selectedGid;
  }

  const activeLayer = document.layers.find(
    (layer) => layer.id === document.editor.activeLayerId,
  );
  const currentGid =
    activeLayer?.type === "tile"
      ? activeLayer.data[tileIndex(cell, document.size)]
      : 0;

  if (!state.randomBrush.avoidImmediateRepeat) {
    return (
      state.randomBrush.candidateGids[
        Math.floor(Math.random() * state.randomBrush.candidateGids.length)
      ] ?? state.selectedGid
    );
  }

  return (
    pickRandomGid(state.randomBrush.candidateGids, currentGid) ??
    state.selectedGid
  );
}
