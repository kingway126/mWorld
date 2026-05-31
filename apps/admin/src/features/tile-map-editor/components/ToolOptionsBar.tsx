import { Grid3X3, Magnet, Shuffle } from "lucide-react";
import type { EditorTool } from "../canvas/tools/editorTool";
import type { ViewportState } from "../model/coordinates";
import type { PaintSource, StampBrush } from "../model/brush";
import type { TerrainMaterialDefinition } from "../model/tileset";

interface ToolOptionsBarProps {
  activeTool: EditorTool;
  paintSource: PaintSource;
  terrainMaterials: TerrainMaterialDefinition[];
  selectedTerrainId: string;
  selectedGid: number;
  selectedStamp?: StampBrush;
  terrainBrushSize: number;
  randomEnabled: boolean;
  randomCandidateCount: number;
  missingTransitionCount: number;
  viewport: ViewportState;
  onTerrainBrushSizeChange: (size: number) => void;
  onToggleRandom: () => void;
}

const toolLabels: Record<EditorTool, string> = {
  brush: "Brush",
  terrain: "Terrain",
  "rect-fill": "Rect Fill",
  stamp: "Stamp",
  eraser: "Eraser",
  picker: "Picker",
  pan: "Pan",
};

export function ToolOptionsBar({
  activeTool,
  paintSource,
  terrainMaterials,
  selectedTerrainId,
  selectedGid,
  selectedStamp,
  terrainBrushSize,
  randomEnabled,
  randomCandidateCount,
  missingTransitionCount,
  viewport,
  onTerrainBrushSizeChange,
  onToggleRandom,
}: ToolOptionsBarProps) {
  const selectedTerrain = terrainMaterials.find(
    (material) => material.id === selectedTerrainId,
  );
  const canResizeTerrainBrush =
    activeTool === "terrain" || activeTool === "eraser";
  const canUseRandom =
    paintSource === "tile" &&
    (activeTool === "brush" || activeTool === "rect-fill") &&
    randomCandidateCount > 0;

  return (
    <div className="tool-options-bar">
      <div className="option-section option-section-primary">
        <span className="option-label">Mode</span>
        <strong>{toolLabels[activeTool]}</strong>
      </div>

      <div className="option-section">
        <span className="option-label">{sourceLabel(activeTool, paintSource)}</span>
        <div className="brush-size-pill" aria-label="Current brush source">
          <span>
            {sourceValue({
              activeTool,
              paintSource,
              randomCandidateCount,
              randomEnabled,
              selectedGid,
              selectedStamp,
              selectedTerrainName: selectedTerrain?.name,
              terrainBrushSize,
            })}
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
          <strong>
            {terrainBrushSize}x{terrainBrushSize}
          </strong>
        </label>
      )}

      <div className="option-section option-toggles">
        <button
          className="option-toggle-button"
          type="button"
          data-active={randomEnabled}
          disabled={!canUseRandom}
          title={
            randomCandidateCount > 0
              ? `${randomCandidateCount} random candidates`
              : "Add tiles to the random set first"
          }
          onClick={onToggleRandom}
        >
          <Shuffle aria-hidden="true" size={15} />
          Random {randomCandidateCount}
        </button>
        <span className="option-indicator" data-active="true">
          <Grid3X3 aria-hidden="true" size={15} />
          Grid
        </span>
        <span className="option-indicator" data-active="true">
          <Magnet aria-hidden="true" size={15} />
          Snap
        </span>
      </div>

      {missingTransitionCount > 0 && (
        <div className="map-warning-pill" role="status">
          Missing transitions {missingTransitionCount}
        </div>
      )}

      <div className="option-section option-section-trailing">
        <span className="option-label">Zoom</span>
        <strong>{Math.round(viewport.zoom * 100)}%</strong>
      </div>
    </div>
  );
}

function sourceLabel(activeTool: EditorTool, paintSource: PaintSource) {
  if (activeTool === "stamp") {
    return "Stamp";
  }

  if (activeTool === "rect-fill") {
    return paintSource === "terrain" ? "Terrain fill" : "Tile fill";
  }

  return activeTool === "terrain" ? "Terrain" : "Brush";
}

function sourceValue(options: {
  activeTool: EditorTool;
  paintSource: PaintSource;
  randomCandidateCount: number;
  randomEnabled: boolean;
  selectedGid: number;
  selectedStamp?: StampBrush;
  selectedTerrainName?: string;
  terrainBrushSize: number;
}) {
  if (options.activeTool === "stamp") {
    return options.selectedStamp
      ? `${options.selectedStamp.width}x${options.selectedStamp.height}`
      : "None";
  }

  if (options.paintSource === "terrain") {
    if (options.activeTool === "eraser") {
      return `${options.terrainBrushSize}x${options.terrainBrushSize}`;
    }

    return options.selectedTerrainName ?? "None";
  }

  if (options.randomEnabled && options.randomCandidateCount > 0) {
    return `Random ${options.randomCandidateCount}`;
  }

  return `GID ${options.selectedGid}`;
}
