import type { LayerId, MapLayer, TileLayer } from "./layer";
import type { MapSize, TileSize, ViewportState } from "./coordinates";
import {
  createAtlasTiles,
  createWangTiles,
  type TerrainEndpointRole,
  type TerrainMaterialDefinition,
  type TerrainTransitionDefinition,
  type TilesetRef,
} from "./tileset";

export const MAP_DOCUMENT_SCHEMA_VERSION = 1;

export interface MapDocument {
  schemaVersion: typeof MAP_DOCUMENT_SCHEMA_VERSION;
  id: string;
  name: string;
  orientation: "orthogonal";
  tileSize: TileSize;
  size: MapSize;
  tilesets: TilesetRef[];
  terrainMaterials: TerrainMaterialDefinition[];
  terrainTransitions: TerrainTransitionDefinition[];
  layers: MapLayer[];
  editor: {
    activeLayerId: LayerId;
    selectedTerrainId?: string;
    terrainBrushSize: number;
    baseTerrain: string;
    terrainCells: string[];
    terrainVertices: string[];
    missingTransitionCells: Array<string | undefined>;
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

const commonTerrainNames: Record<number, string> = {
  0: "草地",
  1: "花草地",
  3: "泥地",
  27: "水面",
  35: "内侧水面",
  64: "水井",
  65: "干草堆",
  66: "木桶",
  67: "木箱",
};

const commonTags: Record<number, string[]> = {
  0: ["regular", "terrain", "grass", "walkable"],
  1: ["regular", "terrain", "grass", "walkable"],
  3: ["regular", "terrain", "dirt", "walkable"],
  27: ["regular", "terrain", "water", "blocked"],
  35: ["regular", "terrain", "water", "blocked"],
  64: ["regular", "object", "well"],
  65: ["regular", "object", "farm"],
  66: ["regular", "object", "container"],
  67: ["regular", "object", "container"],
};

export const tinyTownTileset: TilesetRef = {
  id: "kenney-tiny-town",
  name: "Kenney Tiny Town",
  kind: "regular",
  firstGid: 1,
  image: "/assets/tiles/common/kenney_tiny_town/tilemap_packed.png",
  imageWidth: 192,
  imageHeight: 176,
  tileWidth: 16,
  tileHeight: 16,
  columns: 12,
  tileCount: 132,
  tiles: createAtlasTiles({
    columns: 12,
    rows: 11,
    names: commonTerrainNames,
    tags: commonTags,
  }),
};

export const tinyDungeonTileset: TilesetRef = {
  id: "kenney-tiny-pack",
  name: "Kenney Tiny Dungeon",
  kind: "regular",
  firstGid: 133,
  image: "/assets/tiles/common/kenney_tiny_pack/tilemap_packed.png",
  imageWidth: 192,
  imageHeight: 176,
  tileWidth: 16,
  tileHeight: 16,
  columns: 12,
  tileCount: 132,
  tiles: createAtlasTiles({
    columns: 12,
    rows: 11,
    names: {
      38: "石地板",
      39: "裂纹石地板",
      66: "木桶",
      67: "书架",
    },
    tags: {
      38: ["regular", "floor", "stone", "walkable"],
      39: ["regular", "floor", "stone", "walkable"],
      66: ["regular", "object", "container"],
      67: ["regular", "object", "furniture"],
    },
  }),
};

const wangMaskNames = [
  "孤立",
  "北侧连接",
  "东侧连接",
  "东北弯角",
  "南侧连接",
  "纵向连接",
  "东南弯角",
  "西侧开口",
  "西侧连接",
  "西北弯角",
  "横向连接",
  "南侧开口",
  "西南弯角",
  "东侧开口",
  "北侧开口",
  "填满",
];

function createWangTileset(
  id: string,
  name: string,
  firstGid: number,
  image: string,
  lowerTerrain: string,
  upperTerrain: string,
): TilesetRef {
  return {
    id,
    name,
    kind: "wang",
    firstGid,
    image,
    imageWidth: 64,
    imageHeight: 64,
    tileWidth: 16,
    tileHeight: 16,
    columns: 4,
    tileCount: 16,
    lowerTerrain,
    upperTerrain,
    tiles: createWangTiles({
      lowerTerrain,
      upperTerrain,
      names: Object.fromEntries(
        wangMaskNames.map((name, index) => [
          index,
          `${name}${index === 15 ? "中心" : "边缘"}`,
        ]),
      ),
      tags: Object.fromEntries(
        wangMaskNames.map((_, index) => [index, ["wang", "terrain", index === 15 ? "center" : "edge"]]),
      ),
    }),
  };
}

export const wangSandTileset = createWangTileset(
  "wang-sand",
  "Wang Sand Path",
  265,
  "/assets/tiles/wang/1.png",
  "grass",
  "sand",
);

export const wangWaterTileset = createWangTileset(
  "wang-water",
  "Wang Water Bank",
  281,
  "/assets/tiles/wang/2.png",
  "grass",
  "water",
);

export const wangUpperRimTileset = createWangTileset(
  "wang-upper-rim",
  "Wang Upper Rim",
  297,
  "/assets/tiles/wang/3.png",
  "grass",
  "rim",
);

export const wangFieldTileset = createWangTileset(
  "wang-field",
  "Wang Field Patch",
  313,
  "/assets/tiles/wang/4.png",
  "grass",
  "field",
);

export const wangSandWaterTileset = createWangTileset(
  "wang-sand-water",
  "Wang Sand Water Bank",
  329,
  "/assets/tiles/wang/5.png",
  "sand",
  "water",
);

export const sampleTilesets: TilesetRef[] = [
  tinyTownTileset,
  tinyDungeonTileset,
  wangSandTileset,
  wangWaterTileset,
  wangUpperRimTileset,
  wangFieldTileset,
  wangSandWaterTileset,
];

export const sampleTerrainTransitions: TerrainTransitionDefinition[] = [
  {
    id: "sand-path",
    name: "沙地小路",
    description: "用于道路和可行走空地的 Wang 地形。",
    color: "#d7a263",
    targetLayerId: "ground",
    tilesetId: "wang-sand",
    lowerTerrain: "grass",
    upperTerrain: "sand",
    tags: ["path", "walkable", "wang"],
  },
  {
    id: "water-bank",
    name: "水岸",
    description: "自动补齐岸线和转角的水域地形。",
    color: "#4ea8dd",
    targetLayerId: "ground",
    tilesetId: "wang-water",
    lowerTerrain: "grass",
    upperTerrain: "water",
    tags: ["water", "blocked", "wang"],
  },
  {
    id: "upper-rim",
    name: "高地边缘",
    description: "绘制在细节图层上的高地边缘。",
    color: "#76617b",
    targetLayerId: "details",
    tilesetId: "wang-upper-rim",
    lowerTerrain: "grass",
    upperTerrain: "rim",
    tags: ["rim", "details", "wang"],
  },
  {
    id: "raised-field",
    name: "田地",
    description: "绘制在地表图层上的田地底面。",
    color: "#aacd6f",
    targetLayerId: "ground",
    tilesetId: "wang-field",
    lowerTerrain: "grass",
    upperTerrain: "field",
    tags: ["field", "farm", "wang"],
  },
  {
    id: "sand-water-bank",
    name: "沙地水岸",
    description: "用于沙地和水面之间过渡的岸线地形。",
    color: "#e0a56f",
    targetLayerId: "ground",
    tilesetId: "wang-sand-water",
    lowerTerrain: "sand",
    upperTerrain: "water",
    tags: ["bank", "sand", "water", "wang"],
  },
];

const terrainEndpointLocalIds: Record<TerrainEndpointRole, number> = {
  lower: 6,
  upper: 12,
};

const terrainMaterialDetails: Record<
  string,
  Pick<TerrainMaterialDefinition, "name" | "description" | "color" | "tags">
> = {
  grass: {
    name: "草地",
    description: "基础地形素材。",
    color: "#7fce58",
    tags: ["grass", "base", "walkable"],
  },
  sand: {
    name: "沙地",
    description: "可行走的小路和沙地素材。",
    color: "#d7a263",
    tags: ["sand", "path", "walkable"],
  },
  water: {
    name: "水面",
    description: "不可通行的水域素材。",
    color: "#4ea8dd",
    tags: ["water", "blocked"],
  },
  rim: {
    name: "高地边缘",
    description: "叠加在细节图层上的边缘素材。",
    color: "#76617b",
    tags: ["rim", "details", "upper"],
  },
  field: {
    name: "田地",
    description: "农田和隆起地面的地形素材。",
    color: "#aacd6f",
    tags: ["field", "farm", "multi-layer"],
  },
};

export function createTerrainMaterialsFromWangTransitions(
  transitions: TerrainTransitionDefinition[],
): TerrainMaterialDefinition[] {
  const materials = new Map<string, TerrainMaterialDefinition>();

  for (const transition of transitions) {
    addTerrainEndpointMaterial(materials, transition, "lower");
    addTerrainEndpointMaterial(materials, transition, "upper");
  }

  return [...materials.values()];
}

function addTerrainEndpointMaterial(
  materials: Map<string, TerrainMaterialDefinition>,
  transition: TerrainTransitionDefinition,
  role: TerrainEndpointRole,
) {
  const materialId =
    role === "lower" ? transition.lowerTerrain : transition.upperTerrain;
  const sourceLocalId = terrainEndpointLocalIds[role];
  const linkedTilesetIds = terrainEndpointTilesetIds(transition, role);
  const existing = materials.get(materialId);

  if (existing) {
    for (const tilesetId of linkedTilesetIds) {
      if (!existing.linkedTilesetIds.includes(tilesetId)) {
        existing.linkedTilesetIds.push(tilesetId);
      }
    }
    return;
  }

  const details = terrainMaterialDetails[materialId] ?? {
    name: formatTerrainMaterialName(materialId),
    description: `${formatTerrainMaterialName(materialId)} 地形素材。`,
    color: transition.color,
    tags: [materialId, "terrain"],
  };

  materials.set(materialId, {
    id: materialId,
    ...details,
    previewTilesetId: transition.tilesetId,
    previewLocalId: sourceLocalId,
    previewMode: "tile",
    sourceTilesetId: transition.tilesetId,
    sourceRole: role,
    sourceLocalId,
    linkedTilesetIds,
    fillLayerId: transition.targetLayerId,
    fillTilesetId: transition.tilesetId,
    fillLocalId: sourceLocalId,
    tags: [...new Set([...details.tags, role, "wang"])],
  });
}

function terrainEndpointTilesetIds(
  transition: TerrainTransitionDefinition,
  role: TerrainEndpointRole,
) {
  const tilesetIds = [transition.tilesetId];

  if (role === "upper" && transition.upperTilesetId) {
    tilesetIds.push(transition.upperTilesetId);
  }

  return tilesetIds;
}

function formatTerrainMaterialName(materialId: string) {
  return materialId
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

export const sampleTerrainMaterials = createTerrainMaterialsFromWangTransitions(
  sampleTerrainTransitions,
);

export function createSampleMapDocument(): MapDocument {
  const size = { columns: 56, rows: 32 };

  return {
    schemaVersion: MAP_DOCUMENT_SCHEMA_VERSION,
    id: "demo-map",
    name: "正交地图 Demo",
    orientation: "orthogonal",
    tileSize: { width: 16, height: 16 },
    size,
    tilesets: sampleTilesets,
    terrainMaterials: sampleTerrainMaterials,
    terrainTransitions: sampleTerrainTransitions,
    layers: [
      createEmptyTileLayer("ground", "地表", size),
      createEmptyTileLayer("details", "细节", size),
      createEmptyTileLayer("objects", "对象", size),
    ],
    editor: {
      activeLayerId: "ground",
      selectedTerrainId: "sand",
      terrainBrushSize: 1,
      baseTerrain: "",
      terrainCells: Array.from({ length: size.columns * size.rows }, () => ""),
      terrainVertices: Array.from(
        { length: (size.columns + 1) * (size.rows + 1) },
        () => "",
      ),
      missingTransitionCells: Array.from({ length: size.columns * size.rows }),
      viewport: { x: 48, y: 48, zoom: 1.45 },
    },
  };
}

export function getActiveTileLayer(document: MapDocument): TileLayer | undefined {
  const activeLayer = document.layers.find(
    (layer) => layer.id === document.editor.activeLayerId,
  );

  return activeLayer?.type === "tile" ? activeLayer : undefined;
}
