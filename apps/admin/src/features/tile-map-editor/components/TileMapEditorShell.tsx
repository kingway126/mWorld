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
          onToolSelect={(tool) => dispatch({ type: "select-tool", tool })}
        />

        <AssetBrowserPanel
          selectedGid={state.selectedGid}
          tilesets={mapDocument.tilesets}
          onSelectGid={(gid) => dispatch({ type: "select-gid", gid })}
        />

        <section className="canvas-region">
          <ToolOptionsBar
            activeTool={state.activeTool}
            viewport={mapDocument.editor.viewport}
          />
          <div className="canvas-stage-shell">
            <TileCanvas
              activeTool={state.activeTool}
              hoverCell={state.hoverCell}
              mapDocument={mapDocument}
              selectedGid={state.selectedGid}
              onErase={(cell) => dispatch({ type: "erase", cell })}
              onHoverCell={(cell) => dispatch({ type: "set-hover-cell", cell })}
              onPaint={(cell) => dispatch({ type: "paint", cell })}
              onPick={(cell) => dispatch({ type: "pick", cell })}
              onViewportChange={(viewport) =>
                dispatch({ type: "set-viewport", viewport })
              }
            />
          </div>
          <StatusBar
            activeLayerName={activeLayerName}
            hoverCell={state.hoverCell}
            selectedGid={state.selectedGid}
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
