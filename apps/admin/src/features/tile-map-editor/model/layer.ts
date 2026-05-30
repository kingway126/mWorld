export type LayerId = string;

export interface BaseLayer {
  id: LayerId;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
}

export interface TileLayer extends BaseLayer {
  type: "tile";
  data: number[];
}

export type MapLayer = TileLayer;

export function isTileLayer(layer: MapLayer): layer is TileLayer {
  return layer.type === "tile";
}
