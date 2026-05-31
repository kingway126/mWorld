import type { GridCoordinate, ViewportState } from "../model/coordinates";
import type { EditorTool } from "../canvas/tools/editorTool";
import type { PaintSource, StampBrush } from "../model/brush";

interface StatusBarProps {
  hoverCell?: GridCoordinate;
  viewport: ViewportState;
  selectedGid: number;
  selectedTerrainName?: string;
  selectedStamp?: StampBrush;
  paintSource: PaintSource;
  activeTool: EditorTool;
  activeLayerName: string;
}

export function StatusBar({
  activeLayerName,
  activeTool,
  hoverCell,
  paintSource,
  selectedGid,
  selectedStamp,
  selectedTerrainName,
  viewport,
}: StatusBarProps) {
  return (
    <footer className="status-bar">
      <span>
        Cell {hoverCell ? `${hoverCell.column}, ${hoverCell.row}` : "--, --"}
      </span>
      <span>
        {activeTool === "stamp"
          ? `Stamp ${selectedStamp ? `${selectedStamp.width} x ${selectedStamp.height}` : "None"}`
          : paintSource === "terrain" || activeTool === "terrain"
            ? `Terrain ${selectedTerrainName ?? "None"}`
            : `GID ${selectedGid}`}
      </span>
      <span>Layer {activeLayerName}</span>
      <span>Zoom {Math.round(viewport.zoom * 100)}%</span>
    </footer>
  );
}
