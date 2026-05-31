import { Grid3X3, Magnet, Shuffle } from "lucide-react";
import type { EditorTool } from "../canvas/tools/editorTool";
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
  onTerrainBrushSizeChange: (size: number) => void;
  onToggleRandom: () => void;
}

const toolLabels: Record<EditorTool, string> = {
  brush: "图块画笔",
  terrain: "地形画笔",
  "rect-fill": "矩形填充",
  stamp: "图章",
  eraser: "橡皮擦",
  picker: "吸管",
  pan: "平移",
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
        <span className="option-label">模式</span>
        <strong>{toolLabels[activeTool]}</strong>
      </div>

      <div className="option-section">
        <span className="option-label">{sourceLabel(activeTool, paintSource)}</span>
        <div className="brush-size-pill" aria-label="当前画笔素材">
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
          <span className="option-label">笔刷</span>
          <input
            aria-label="地形笔刷尺寸"
            max={8}
            min={1}
            type="range"
            value={terrainBrushSize}
            onChange={(event) =>
              onTerrainBrushSizeChange(Number(event.currentTarget.value))
            }
          />
          <strong>
            {terrainBrushSize} × {terrainBrushSize}
          </strong>
        </label>
      )}

      <div className="option-section option-toggles">
        {randomCandidateCount > 0 && (
          <button
            className="option-toggle-button"
            type="button"
            data-active={randomEnabled}
            disabled={!canUseRandom}
            title={
              canUseRandom
                ? `${randomCandidateCount} 个随机候选`
                : "切换到图块画笔或矩形填充后可用"
            }
            onClick={onToggleRandom}
          >
            <Shuffle aria-hidden="true" size={15} />
            随机 {randomCandidateCount}
          </button>
        )}
        <span className="option-indicator" data-active="true">
          <Grid3X3 aria-hidden="true" size={15} />
          网格
        </span>
        <span className="option-indicator" data-active="true">
          <Magnet aria-hidden="true" size={15} />
          吸附
        </span>
      </div>

      {missingTransitionCount > 0 && (
        <div className="map-warning-pill" role="status">
          缺少过渡 {missingTransitionCount}
        </div>
      )}
    </div>
  );
}

function sourceLabel(activeTool: EditorTool, paintSource: PaintSource) {
  if (activeTool === "stamp") {
    return "图章";
  }

  if (activeTool === "rect-fill") {
    return paintSource === "terrain" ? "地形填充" : "图块填充";
  }

  return activeTool === "terrain" ? "地形" : "图块";
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
      ? `${options.selectedStamp.width} × ${options.selectedStamp.height}`
      : "未创建";
  }

  if (options.paintSource === "terrain") {
    if (options.activeTool === "eraser") {
      return `${options.terrainBrushSize} × ${options.terrainBrushSize}`;
    }

    return options.selectedTerrainName ?? "未选择";
  }

  if (options.randomEnabled && options.randomCandidateCount > 0) {
    return `随机 ${options.randomCandidateCount}`;
  }

  return `图块 ${options.selectedGid}`;
}
