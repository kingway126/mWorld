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
