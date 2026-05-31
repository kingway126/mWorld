import type { GridCoordinate, ViewportState } from "../model/coordinates";

interface StatusBarProps {
  hoverCell?: GridCoordinate;
  viewport: ViewportState;
  activeLayerName: string;
}

export function StatusBar({
  activeLayerName,
  hoverCell,
  viewport,
}: StatusBarProps) {
  return (
    <footer className="status-bar">
      <span>
        单元格：{hoverCell ? `${hoverCell.column}, ${hoverCell.row}` : "--, --"}
      </span>
      <span>图层：{activeLayerName}</span>
      <span>缩放：{Math.round(viewport.zoom * 100)}%</span>
    </footer>
  );
}
