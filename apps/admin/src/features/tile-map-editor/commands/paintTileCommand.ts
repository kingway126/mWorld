import type { GridCoordinate } from "../model/coordinates";
import { isInsideMap, tileIndex } from "../model/coordinates";
import type { MapDocument } from "../model/mapDocument";

export interface TilePaintPlacement {
  cell: GridCoordinate;
  gid: number;
}

export function paintTile(
  document: MapDocument,
  layerId: string,
  cell: GridCoordinate,
  gid: number,
): MapDocument {
  return paintTileBatch(document, layerId, [{ cell, gid }]);
}

export function paintTileBatch(
  document: MapDocument,
  layerId: string,
  placements: TilePaintPlacement[],
): MapDocument {
  const layerIndex = document.layers.findIndex((layer) => layer.id === layerId);
  const layer = document.layers[layerIndex];

  if (!layer || layer.type !== "tile" || layer.locked) {
    return document;
  }

  let nextData: number[] | undefined;

  for (const placement of placements) {
    if (!isInsideMap(placement.cell, document.size)) {
      continue;
    }

    const dataIndex = tileIndex(placement.cell, document.size);
    if ((nextData ?? layer.data)[dataIndex] === placement.gid) {
      continue;
    }

    nextData ??= [...layer.data];
    nextData[dataIndex] = placement.gid;
  }

  if (!nextData) {
    return document;
  }

  const nextLayers = [...document.layers];
  nextLayers[layerIndex] = {
    ...layer,
    data: nextData,
  };

  return {
    ...document,
    layers: nextLayers,
  };
}
