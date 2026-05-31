import { Grid3X3, Magnet } from "lucide-react";
import type { EditorTool } from "../canvas/tools/editorTool";
import type { ViewportState } from "../model/coordinates";
import type { TerrainMaterialDefinition } from "../model/tileset";

interface ToolOptionsBarProps {
  activeTool: EditorTool;
  terrainMaterials: TerrainMaterialDefinition[];
  selectedTerrainId: string;
  terrainBrushSize: number;
  missingTransitionCount: number;
  viewport: ViewportState;
  onTerrainBrushSizeChange: (size: number) => void;
}

const toolLabels: Record<EditorTool, string> = {
  brush: "Brush",
  terrain: "Terrain",
  eraser: "Eraser",
  picker: "Picker",
  pan: "Pan",
};

export function ToolOptionsBar({
  activeTool,
  terrainMaterials,
  selectedTerrainId,
  terrainBrushSize,
  missingTransitionCount,
  viewport,
  onTerrainBrushSizeChange,
}: ToolOptionsBarProps) {
  const selectedTerrain = terrainMaterials.find(
    (material) => material.id === selectedTerrainId,
  );
  const canResizeTerrainBrush =
    activeTool === "terrain" || activeTool === "eraser";

  return (
    <div className="tool-options-bar">
      <div className="option-section option-section-primary">
        <span className="option-label">Mode</span>
        <strong>{toolLabels[activeTool]}</strong>
      </div>

      <div className="option-section">
        <span className="option-label">
          {activeTool === "terrain" ? "Terrain" : "Brush"}
        </span>
        <div className="brush-size-pill" aria-label="Brush size">
          <span>
            {activeTool === "terrain"
              ? selectedTerrain?.name ?? "None"
              : canResizeTerrainBrush
                ? `${terrainBrushSize}x${terrainBrushSize}`
                : "1 tile"}
          </span>
        </div>
      </div>

      {canResizeTerrainBrush && (
        <label className="option-section terrain-size-control">
          <span className="option-label">Size</span>
          <input
            aria-label="Terrain brush size"
            max={8}
            min={1}
            type="range"
            value={terrainBrushSize}
            onChange={(event) =>
              onTerrainBrushSizeChange(Number(event.currentTarget.value))
            }
          />
          <strong>{terrainBrushSize}x{terrainBrushSize}</strong>
        </label>
      )}

      {missingTransitionCount > 0 && (
        <div className="map-warning-pill" role="status">
          Missing transitions {missingTransitionCount}
        </div>
      )}

      <div className="option-section option-toggles">
        <span className="option-indicator" data-active="true">
          <Grid3X3 aria-hidden="true" size={15} />
          Grid
        </span>
        <span className="option-indicator" data-active="true">
          <Magnet aria-hidden="true" size={15} />
          Snap
        </span>
      </div>

      <div className="option-section option-section-trailing">
        <span className="option-label">Zoom</span>
        <strong>{Math.round(viewport.zoom * 100)}%</strong>
      </div>
    </div>
  );
}
