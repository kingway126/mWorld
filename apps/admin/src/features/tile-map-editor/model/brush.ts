import type { GridCoordinate, MapSize } from "./coordinates";
import { isInsideMap } from "./coordinates";
import type { TilesetRef } from "./tileset";

export type PaintSource = "tile" | "terrain";

export interface StampBrushCell {
  dx: number;
  dy: number;
  gid: number;
}

export interface StampBrush {
  id: string;
  name: string;
  sourceTilesetId: string;
  width: number;
  height: number;
  cells: StampBrushCell[];
}

export interface RandomBrushState {
  enabled: boolean;
  candidateGids: number[];
  avoidImmediateRepeat: boolean;
}

export function createStampBrushFromSelection(
  tileset: TilesetRef,
  startLocalId: number,
  endLocalId: number,
): StampBrush {
  const startColumn = startLocalId % tileset.columns;
  const startRow = Math.floor(startLocalId / tileset.columns);
  const endColumn = endLocalId % tileset.columns;
  const endRow = Math.floor(endLocalId / tileset.columns);
  const left = Math.min(startColumn, endColumn);
  const right = Math.max(startColumn, endColumn);
  const top = Math.min(startRow, endRow);
  const bottom = Math.max(startRow, endRow);
  const cells: StampBrushCell[] = [];

  for (let row = top; row <= bottom; row += 1) {
    for (let column = left; column <= right; column += 1) {
      const localId = row * tileset.columns + column;
      if (localId >= tileset.tileCount) {
        continue;
      }

      cells.push({
        dx: column - left,
        dy: row - top,
        gid: tileset.firstGid + localId,
      });
    }
  }

  const width = right - left + 1;
  const height = bottom - top + 1;

  return {
    id: `${tileset.id}:${left},${top}:${right},${bottom}`,
    name: `${tileset.name} ${width}x${height}`,
    sourceTilesetId: tileset.id,
    width,
    height,
    cells,
  };
}

export function stampPlacementsAt(
  stamp: StampBrush,
  anchor: GridCoordinate,
  size: MapSize,
) {
  return stamp.cells
    .map((cell) => ({
      cell: {
        column: anchor.column + cell.dx,
        row: anchor.row + cell.dy,
      },
      gid: cell.gid,
    }))
    .filter((placement) => isInsideMap(placement.cell, size));
}

export function pickRandomGid(
  candidates: readonly number[],
  currentGid: number,
  random = Math.random,
): number | undefined {
  const validCandidates = candidates.filter((gid) => gid > 0);
  if (validCandidates.length === 0) {
    return undefined;
  }

  if (validCandidates.length === 1) {
    return validCandidates[0];
  }

  const pool = validCandidates.filter((gid) => gid !== currentGid);
  const source = pool.length > 0 ? pool : validCandidates;
  const index = Math.min(source.length - 1, Math.floor(random() * source.length));
  return source[index];
}
