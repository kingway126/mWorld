import type { MapDocument } from "../model/mapDocument";

export interface TiledTilesetJson {
  firstgid: number;
  name: string;
  image: string;
  imagewidth: number;
  imageheight: number;
  tilewidth: number;
  tileheight: number;
  columns: number;
  tilecount: number;
  margin: number;
  spacing: number;
}

export interface TiledTileLayerJson {
  id: number;
  name: string;
  type: "tilelayer";
  visible: boolean;
  opacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  data: number[];
}

export interface PhaserTiledJson {
  type: "map";
  version: "1.10";
  tiledversion: "1.10.2";
  orientation: "orthogonal";
  renderorder: "right-down";
  compressionlevel: -1;
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  infinite: false;
  nextlayerid: number;
  nextobjectid: number;
  properties: Array<{ name: string; type: string; value: string | number }>;
  tilesets: TiledTilesetJson[];
  layers: TiledTileLayerJson[];
}

export function exportPhaserTiledJson(document: MapDocument): PhaserTiledJson {
  const layers = document.layers
    .filter((layer) => layer.type === "tile")
    .map<TiledTileLayerJson>((layer, index) => ({
      id: index + 1,
      name: layer.name,
      type: "tilelayer",
      visible: layer.visible,
      opacity: layer.opacity,
      x: 0,
      y: 0,
      width: document.size.columns,
      height: document.size.rows,
      data: [...layer.data],
    }));

  return {
    type: "map",
    version: "1.10",
    tiledversion: "1.10.2",
    orientation: "orthogonal",
    renderorder: "right-down",
    compressionlevel: -1,
    width: document.size.columns,
    height: document.size.rows,
    tilewidth: document.tileSize.width,
    tileheight: document.tileSize.height,
    infinite: false,
    nextlayerid: layers.length + 1,
    nextobjectid: 1,
    properties: [
      {
        name: "mworldSchemaVersion",
        type: "int",
        value: document.schemaVersion,
      },
      {
        name: "mworldDocumentId",
        type: "string",
        value: document.id,
      },
    ],
    tilesets: document.tilesets.map((tileset) => ({
      firstgid: tileset.firstGid,
      name: tileset.name,
      image: tileset.image,
      imagewidth: tileset.imageWidth,
      imageheight: tileset.imageHeight,
      tilewidth: tileset.tileWidth,
      tileheight: tileset.tileHeight,
      columns: tileset.columns,
      tilecount: tileset.tileCount,
      margin: 0,
      spacing: 0,
    })),
    layers,
  };
}

export function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = href;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(href);
}
