export interface TilesetTile {
  localId: number;
  name: string;
  semantic?: string;
  tags?: string[];
  wangCorners?: WangCornerMaterials;
}

export type TilesetKind = "regular" | "wang";

export interface WangCornerMaterials {
  nw: string;
  ne: string;
  sw: string;
  se: string;
}

export interface TilesetRef {
  id: string;
  name: string;
  kind: TilesetKind;
  firstGid: number;
  image: string;
  imageWidth: number;
  imageHeight: number;
  tileWidth: number;
  tileHeight: number;
  columns: number;
  tileCount: number;
  tiles: TilesetTile[];
  lowerTerrain?: string;
  upperTerrain?: string;
}

export type TerrainEndpointRole = "lower" | "upper";

export interface TerrainMaterialDefinition {
  id: string;
  name: string;
  description: string;
  color: string;
  previewTilesetId: string;
  previewLocalId: number;
  previewMode?: "tile" | "atlas";
  sourceTilesetId: string;
  sourceRole: TerrainEndpointRole;
  sourceLocalId: number;
  linkedTilesetIds: string[];
  fillLayerId?: string;
  fillTilesetId?: string;
  fillLocalId?: number;
  tags: string[];
}

export interface TerrainTransitionDefinition {
  id: string;
  name: string;
  description: string;
  color: string;
  targetLayerId: string;
  tilesetId: string;
  lowerTerrain: string;
  upperTerrain: string;
  upperLayerId?: string;
  upperTilesetId?: string;
  tags: string[];
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

export function findTilesetById(tilesets: TilesetRef[], id: string) {
  return tilesets.find((tileset) => tileset.id === id);
}

export function terrainPairKey(a: string, b: string) {
  return a <= b ? `${a}|${b}` : `${b}|${a}`;
}

export function findTerrainTransitionForPair(
  transitions: TerrainTransitionDefinition[],
  a: string,
  b: string,
) {
  const key = terrainPairKey(a, b);
  return transitions.find(
    (transition) =>
      terrainPairKey(transition.lowerTerrain, transition.upperTerrain) === key,
  );
}

export function createAtlasTiles(options: {
  columns: number;
  rows: number;
  names?: Record<number, string>;
  semantics?: Record<number, string>;
  tags?: Record<number, string[]>;
}): TilesetTile[] {
  const tileCount = options.columns * options.rows;

  return Array.from({ length: tileCount }, (_, localId) => ({
    localId,
    name: options.names?.[localId] ?? `图块 ${localId + 1}`,
    semantic: options.semantics?.[localId],
    tags: options.tags?.[localId] ?? [],
  }));
}

export function createWangTiles(options: {
  lowerTerrain: string;
  upperTerrain: string;
  layout?: WangCornerRoles[];
  names?: Record<number, string>;
  tags?: Record<number, string[]>;
}): TilesetTile[] {
  const layout = options.layout ?? defaultWangCornerLayout;

  return layout.map((roles, localId) => ({
    localId,
    name: options.names?.[localId] ?? `自动地形 ${localId + 1}`,
    tags: options.tags?.[localId] ?? [],
    wangCorners: materializeWangCorners(roles, options),
  }));
}

export function tileSourceRect(tileset: TilesetRef, localId: number) {
  const column = localId % tileset.columns;
  const row = Math.floor(localId / tileset.columns);

  return {
    x: column * tileset.tileWidth,
    y: row * tileset.tileHeight,
    width: tileset.tileWidth,
    height: tileset.tileHeight,
  };
}

export function resolveTerrainGid(
  tilesets: TilesetRef[],
  brush: Pick<
    TerrainTransitionDefinition,
    "tilesetId" | "lowerTerrain" | "upperTerrain"
  >,
  corners: WangCornerMaterials,
  options: { transparentLower?: boolean } = {},
) {
  const tileset = findTilesetById(tilesets, brush.tilesetId);
  if (!tileset) {
    return 0;
  }

  if (options.transparentLower !== false && allCornersAre(corners, brush.lowerTerrain)) {
    return 0;
  }

  const localId = resolveTerrainLocalId(tileset, brush, corners);
  return localId === undefined ? 0 : tileset.firstGid + localId;
}

export function resolveTerrainUpperGid(
  tilesets: TilesetRef[],
  brush: Pick<
    TerrainTransitionDefinition,
    "upperTilesetId" | "lowerTerrain" | "upperTerrain"
  >,
  corners: WangCornerMaterials,
) {
  if (!brush.upperTilesetId) {
    return 0;
  }

  const tileset = findTilesetById(tilesets, brush.upperTilesetId);
  if (!tileset) {
    return 0;
  }

  if (
    allCornersAre(corners, brush.lowerTerrain) ||
    allCornersAre(corners, brush.upperTerrain)
  ) {
    return 0;
  }

  const localId = resolveTerrainLocalId(tileset, brush, corners);
  return localId === undefined ? 0 : tileset.firstGid + localId;
}

function resolveTerrainLocalId(
  tileset: TilesetRef,
  brush: Pick<TerrainTransitionDefinition, "lowerTerrain" | "upperTerrain">,
  corners: WangCornerMaterials,
) {
  const key = wangCornerKey({
    nw: normalizeWangCorner(corners.nw, brush),
    ne: normalizeWangCorner(corners.ne, brush),
    sw: normalizeWangCorner(corners.sw, brush),
    se: normalizeWangCorner(corners.se, brush),
  });
  const tile = tileset.tiles.find(
    (candidate) =>
      candidate.wangCorners && wangCornerKey(candidate.wangCorners) === key,
  );

  return tile?.localId;
}

function normalizeWangCorner(
  material: string,
  brush: Pick<TerrainTransitionDefinition, "lowerTerrain" | "upperTerrain">,
) {
  return material === brush.upperTerrain ? brush.upperTerrain : brush.lowerTerrain;
}

function wangCornerKey(corners: WangCornerMaterials) {
  return `${corners.nw},${corners.ne},${corners.sw},${corners.se}`;
}

type WangCornerRole = "lower" | "upper";

interface WangCornerRoles {
  nw: WangCornerRole;
  ne: WangCornerRole;
  sw: WangCornerRole;
  se: WangCornerRole;
}

const defaultWangCornerLayout: WangCornerRoles[] = [
  { nw: "upper", ne: "upper", sw: "lower", se: "upper" },
  { nw: "upper", ne: "lower", sw: "upper", se: "lower" },
  { nw: "lower", ne: "upper", sw: "lower", se: "lower" },
  { nw: "upper", ne: "upper", sw: "lower", se: "lower" },
  { nw: "lower", ne: "upper", sw: "upper", se: "lower" },
  { nw: "upper", ne: "lower", sw: "lower", se: "lower" },
  { nw: "lower", ne: "lower", sw: "lower", se: "lower" },
  { nw: "lower", ne: "lower", sw: "lower", se: "upper" },
  { nw: "upper", ne: "lower", sw: "upper", se: "upper" },
  { nw: "lower", ne: "lower", sw: "upper", se: "upper" },
  { nw: "lower", ne: "lower", sw: "upper", se: "lower" },
  { nw: "lower", ne: "upper", sw: "lower", se: "upper" },
  { nw: "upper", ne: "upper", sw: "upper", se: "upper" },
  { nw: "upper", ne: "upper", sw: "upper", se: "lower" },
  { nw: "upper", ne: "lower", sw: "lower", se: "upper" },
  { nw: "lower", ne: "upper", sw: "upper", se: "upper" },
];

function materializeWangCorners(
  roles: WangCornerRoles,
  options: Pick<
    TerrainTransitionDefinition,
    "lowerTerrain" | "upperTerrain"
  >,
): WangCornerMaterials {
  return {
    nw: roles.nw === "upper" ? options.upperTerrain : options.lowerTerrain,
    ne: roles.ne === "upper" ? options.upperTerrain : options.lowerTerrain,
    sw: roles.sw === "upper" ? options.upperTerrain : options.lowerTerrain,
    se: roles.se === "upper" ? options.upperTerrain : options.lowerTerrain,
  };
}

function allCornersAre(corners: WangCornerMaterials, material: string) {
  return (
    corners.nw === material &&
    corners.ne === material &&
    corners.sw === material &&
    corners.se === material
  );
}
