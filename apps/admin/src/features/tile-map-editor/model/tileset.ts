export interface TilesetTile {
  localId: number;
  name: string;
  color: string;
}

export interface TilesetRef {
  id: string;
  name: string;
  firstGid: number;
  image: string;
  imageWidth: number;
  imageHeight: number;
  tileWidth: number;
  tileHeight: number;
  columns: number;
  tileCount: number;
  tiles: TilesetTile[];
}

export function findTileByGid(tilesets: TilesetRef[], gid: number) {
  for (const tileset of tilesets) {
    const first = tileset.firstGid;
    const last = first + tileset.tileCount - 1;
    if (gid >= first && gid <= last) {
      return {
        tileset,
        tile: tileset.tiles[gid - first],
      };
    }
  }

  return undefined;
}
