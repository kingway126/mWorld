import type { GridCoordinate } from "../model/coordinates";
import { isInsideMap, tileIndex } from "../model/coordinates";
import type { MapDocument } from "../model/mapDocument";

export function paintTile(
  document: MapDocument,
  layerId: string,
  cell: GridCoordinate,
  gid: number,
): MapDocument {
  if (!isInsideMap(cell, document.size)) {
    return document;
  }

  const layerIndex = document.layers.findIndex((layer) => layer.id === layerId);
  const layer = document.layers[layerIndex];

  if (!layer || layer.type !== "tile" || layer.locked) {
    return document;
  }

  const dataIndex = tileIndex(cell, document.size);
  if (layer.data[dataIndex] === gid) {
    return document;
  }

  const nextData = [...layer.data];
  nextData[dataIndex] = gid;

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
