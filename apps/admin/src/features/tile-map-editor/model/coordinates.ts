export interface TileSize {
  width: number;
  height: number;
}

export interface MapSize {
  columns: number;
  rows: number;
}

export interface GridCoordinate {
  column: number;
  row: number;
}

export interface GridRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface WorldPoint {
  x: number;
  y: number;
}

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

export function isInsideMap(cell: GridCoordinate, size: MapSize): boolean {
  return (
    cell.column >= 0 &&
    cell.row >= 0 &&
    cell.column < size.columns &&
    cell.row < size.rows
  );
}

export function tileIndex(cell: GridCoordinate, size: MapSize): number {
  return cell.row * size.columns + cell.column;
}

export function normalizeGridRect(
  start: GridCoordinate,
  end: GridCoordinate,
): GridRect {
  return {
    left: Math.min(start.column, end.column),
    top: Math.min(start.row, end.row),
    right: Math.max(start.column, end.column),
    bottom: Math.max(start.row, end.row),
  };
}

export function gridRectDimensions(rect: GridRect) {
  return {
    columns: rect.right - rect.left + 1,
    rows: rect.bottom - rect.top + 1,
  };
}

export function gridRectCells(rect: GridRect, size: MapSize): GridCoordinate[] {
  const left = Math.max(0, rect.left);
  const top = Math.max(0, rect.top);
  const right = Math.min(size.columns - 1, rect.right);
  const bottom = Math.min(size.rows - 1, rect.bottom);

  if (left > right || top > bottom) {
    return [];
  }

  const cells: GridCoordinate[] = [];
  for (let row = top; row <= bottom; row += 1) {
    for (let column = left; column <= right; column += 1) {
      cells.push({ column, row });
    }
  }

  return cells;
}

export function worldToGrid(point: WorldPoint, tileSize: TileSize): GridCoordinate {
  return {
    column: Math.floor(point.x / tileSize.width),
    row: Math.floor(point.y / tileSize.height),
  };
}

export function gridToWorld(cell: GridCoordinate, tileSize: TileSize): WorldPoint {
  return {
    x: cell.column * tileSize.width,
    y: cell.row * tileSize.height,
  };
}

export function screenToWorld(
  screen: WorldPoint,
  viewport: ViewportState,
): WorldPoint {
  return {
    x: (screen.x - viewport.x) / viewport.zoom,
    y: (screen.y - viewport.y) / viewport.zoom,
  };
}

export function clampZoom(zoom: number): number {
  return Math.min(4, Math.max(0.25, zoom));
}
