import type { GridCoordinate } from "../model/coordinates";
import type { MapDocument } from "../model/mapDocument";
import { paintTile } from "./paintTileCommand";

export function eraseTile(
  document: MapDocument,
  layerId: string,
  cell: GridCoordinate,
): MapDocument {
  return paintTile(document, layerId, cell, 0);
}
