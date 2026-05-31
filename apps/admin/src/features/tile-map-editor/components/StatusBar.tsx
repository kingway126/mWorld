import type { GridCoordinate, ViewportState } from "../model/coordinates";
import type { EditorTool } from "../canvas/tools/editorTool";

interface StatusBarProps {
  hoverCell?: GridCoordinate;
  viewport: ViewportState;
  selectedGid: number;
  selectedTerrainName?: string;
  activeTool: EditorTool;
  activeLayerName: string;
}

export function StatusBar({
  activeLayerName,
  activeTool,
  hoverCell,
  selectedGid,
  selectedTerrainName,
  viewport,
}: StatusBarProps) {
  return (
    <footer className="status-bar">
      <span>
        Cell {hoverCell ? `${hoverCell.column}, ${hoverCell.row}` : "--, --"}
      </span>
      <span>
        {activeTool === "terrain"
          ? `Terrain ${selectedTerrainName ?? "None"}`
          : `GID ${selectedGid}`}
      </span>
      <span>Layer {activeLayerName}</span>
      <span>Zoom {Math.round(viewport.zoom * 100)}%</span>
    </footer>
  );
}
