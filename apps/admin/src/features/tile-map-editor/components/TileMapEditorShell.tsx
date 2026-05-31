import { useReducer } from "react";
import {
  downloadJson,
  exportPhaserTiledJson,
} from "../exporters/phaserTiledJsonExporter";
import {
  createInitialTileMapEditorState,
  tileMapEditorReducer,
} from "../store/tileMapEditorStore";
import { AssetBrowserPanel } from "./AssetBrowserPanel";
import { InspectorTabs } from "./InspectorTabs";
import { StatusBar } from "./StatusBar";
import { TileCanvas } from "./TileCanvas";
import { ToolOptionsBar } from "./ToolOptionsBar";
import { ToolRail } from "./ToolRail";
import { TopAppBar } from "./TopAppBar";

export function TileMapEditorShell() {
  const [state, dispatch] = useReducer(
    tileMapEditorReducer,
    undefined,
    createInitialTileMapEditorState,
  );
  const mapDocument = state.history.present;
  const activeLayerName =
    mapDocument.layers.find(
      (layer) => layer.id === mapDocument.editor.activeLayerId,
    )?.name ?? "None";
  const selectedTerrain = mapDocument.terrainMaterials.find(
    (material) => material.id === state.selectedTerrainId,
  );
  const terrainSelectionFill =
    state.activeTool === "terrain" ||
    (state.activeTool === "rect-fill" && state.paintSource === "terrain")
      ? selectedTerrain?.color
      : undefined;
  const missingTransitionCount = mapDocument.editor.missingTransitionCells.filter(
    Boolean,
  ).length;

  const handleExport = () => {
    downloadJson(
      `${mapDocument.id}.phaser-tiled.json`,
      exportPhaserTiledJson(mapDocument),
    );
  };

  return (
    <main className="editor-shell">
      <TopAppBar
        canRedo={state.history.future.length > 0}
        canUndo={state.history.past.length > 0}
        mapDocument={mapDocument}
        onExport={handleExport}
        onRedo={() => dispatch({ type: "redo" })}
        onUndo={() => dispatch({ type: "undo" })}
      />

      <div className="editor-workbench">
        <ToolRail
          activeTool={state.activeTool}
          hasStamp={Boolean(state.selectedStamp)}
          onToolSelect={(tool) => dispatch({ type: "select-tool", tool })}
        />

        <AssetBrowserPanel
          randomCandidateGids={state.randomBrush.candidateGids}
          selectedGid={state.selectedGid}
          selectedStamp={state.selectedStamp}
          selectedTerrainId={state.selectedTerrainId}
          terrainMaterials={mapDocument.terrainMaterials}
          tilesets={mapDocument.tilesets}
          onAddRandomCandidate={(gid) =>
            dispatch({ type: "add-random-candidate", gid })
          }
          onClearRandomCandidates={() =>
            dispatch({ type: "clear-random-candidates" })
          }
          onRemoveRandomCandidate={(gid) =>
            dispatch({ type: "remove-random-candidate", gid })
          }
          onSelectGid={(gid) => dispatch({ type: "select-gid", gid })}
          onSelectStamp={(stamp) => dispatch({ type: "select-stamp", stamp })}
          onSelectTerrain={(terrainId) =>
            dispatch({ type: "select-terrain", terrainId })
          }
        />

        <section className="canvas-region">
          <ToolOptionsBar
            activeTool={state.activeTool}
            missingTransitionCount={missingTransitionCount}
            paintSource={state.paintSource}
            randomCandidateCount={state.randomBrush.candidateGids.length}
            randomEnabled={state.randomBrush.enabled}
            selectedGid={state.selectedGid}
            selectedStamp={state.selectedStamp}
            selectedTerrainId={state.selectedTerrainId}
            terrainBrushSize={state.terrainBrushSize}
            terrainMaterials={mapDocument.terrainMaterials}
            viewport={mapDocument.editor.viewport}
            onTerrainBrushSizeChange={(size) =>
              dispatch({ type: "set-terrain-brush-size", size })
            }
            onToggleRandom={() => dispatch({ type: "toggle-random-brush" })}
          />
          <div className="canvas-stage-shell">
            <TileCanvas
              activeTool={state.activeTool}
              hoverCell={state.hoverCell}
              brushSize={
                state.activeTool === "terrain" || state.activeTool === "eraser"
                  ? state.terrainBrushSize
                  : 1
              }
              mapDocument={mapDocument}
              paintSource={state.paintSource}
              selectedStamp={state.selectedStamp}
              selectionFill={terrainSelectionFill}
              onErase={(cell) => dispatch({ type: "erase", cell })}
              onHoverCell={(cell) => dispatch({ type: "set-hover-cell", cell })}
              onPaint={(cell) => dispatch({ type: "paint", cell })}
              onPaintRect={(start, end) =>
                dispatch({ type: "paint-rect", start, end })
              }
              onPaintStamp={(anchor) =>
                dispatch({ type: "paint-stamp", anchor })
              }
              onPick={(cell) => dispatch({ type: "pick", cell })}
              onViewportChange={(viewport) =>
                dispatch({ type: "set-viewport", viewport })
              }
            />
          </div>
          <StatusBar
            activeTool={state.activeTool}
            activeLayerName={activeLayerName}
            hoverCell={state.hoverCell}
            paintSource={state.paintSource}
            selectedGid={state.selectedGid}
            selectedStamp={state.selectedStamp}
            selectedTerrainName={selectedTerrain?.name}
            viewport={mapDocument.editor.viewport}
          />
        </section>

        <InspectorTabs
          mapDocument={mapDocument}
          selectedGid={state.selectedGid}
          onSelectLayer={(layerId) =>
            dispatch({ type: "set-active-layer", layerId })
          }
          onToggleLock={(layerId) =>
            dispatch({ type: "toggle-layer-lock", layerId })
          }
          onToggleVisibility={(layerId) =>
            dispatch({ type: "toggle-layer-visibility", layerId })
          }
        />
      </div>
    </main>
  );
}
