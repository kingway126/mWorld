import type { GridCoordinate, ViewportState } from "../model/coordinates";

interface StatusBarProps {
  hoverCell?: GridCoordinate;
  viewport: ViewportState;
  selectedGid: number;
  activeLayerName: string;
}

export function StatusBar({
  activeLayerName,
  hoverCell,
  selectedGid,
  viewport,
}: StatusBarProps) {
  return (
    <footer className="status-bar">
      <span>
        Cell {hoverCell ? `${hoverCell.column}, ${hoverCell.row}` : "--, --"}
      </span>
      <span>GID {selectedGid}</span>
      <span>Layer {activeLayerName}</span>
      <span>Zoom {Math.round(viewport.zoom * 100)}%</span>
    </footer>
  );
}
