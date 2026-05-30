import type { LayerId, MapLayer, TileLayer } from "./layer";
import type { MapSize, TileSize, ViewportState } from "./coordinates";
import type { TilesetRef } from "./tileset";

export const MAP_DOCUMENT_SCHEMA_VERSION = 1;

export interface MapDocument {
  schemaVersion: typeof MAP_DOCUMENT_SCHEMA_VERSION;
  id: string;
  name: string;
  orientation: "orthogonal";
  tileSize: TileSize;
  size: MapSize;
  tilesets: TilesetRef[];
  layers: MapLayer[];
  editor: {
    activeLayerId: LayerId;
    viewport: ViewportState;
  };
}

export function createEmptyTileLayer(
  id: LayerId,
  name: string,
  size: MapSize,
): TileLayer {
  return {
    id,
    name,
    type: "tile",
    visible: true,
    locked: false,
    opacity: 1,
    data: Array.from({ length: size.columns * size.rows }, () => 0),
  };
}

export const sampleTileset: TilesetRef = {
  id: "studio-basic",
  name: "Studio Basic",
  firstGid: 1,
  image: "tilesets/studio-basic.png",
  imageWidth: 128,
  imageHeight: 64,
  tileWidth: 32,
  tileHeight: 32,
  columns: 4,
  tileCount: 8,
  tiles: [
    { localId: 0, name: "Grass", color: "#70b865" },
    { localId: 1, name: "Dark Grass", color: "#4f9651" },
    { localId: 2, name: "Dirt", color: "#b98a55" },
    { localId: 3, name: "Stone", color: "#8a97a5" },
    { localId: 4, name: "Water", color: "#3c8fd8" },
    { localId: 5, name: "Deep Water", color: "#2368b0" },
    { localId: 6, name: "Sand", color: "#d9bd72" },
    { localId: 7, name: "Road", color: "#655f57" },
  ],
};

export function createSampleMapDocument(): MapDocument {
  const size = { columns: 40, rows: 24 };

  return {
    schemaVersion: MAP_DOCUMENT_SCHEMA_VERSION,
    id: "demo-map",
    name: "Demo Orthogonal Map",
    orientation: "orthogonal",
    tileSize: { width: 32, height: 32 },
    size,
    tilesets: [sampleTileset],
    layers: [
      createEmptyTileLayer("ground", "Ground", size),
      createEmptyTileLayer("details", "Details", size),
    ],
    editor: {
      activeLayerId: "ground",
      viewport: { x: 64, y: 64, zoom: 1 },
    },
  };
}

export function getActiveTileLayer(document: MapDocument): TileLayer | undefined {
  const activeLayer = document.layers.find(
    (layer) => layer.id === document.editor.activeLayerId,
  );

  return activeLayer?.type === "tile" ? activeLayer : undefined;
}
