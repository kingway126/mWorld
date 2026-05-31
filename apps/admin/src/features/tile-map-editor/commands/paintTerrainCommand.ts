import type { GridCoordinate, MapSize } from "../model/coordinates";
import { isInsideMap, tileIndex } from "../model/coordinates";
import type { TileLayer } from "../model/layer";
import type { MapDocument } from "../model/mapDocument";
import {
  findTilesetById,
  findTerrainTransitionForPair,
  resolveTerrainGid,
  resolveTerrainUpperGid,
  terrainPairKey,
  type TerrainMaterialDefinition,
  type TerrainTransitionDefinition,
  type WangCornerMaterials,
} from "../model/tileset";

interface VertexCoordinate {
  column: number;
  row: number;
}

interface CellRenderPlan {
  fillMaterial?: string;
  transition?: TerrainTransitionDefinition;
  corners?: WangCornerMaterials;
  missingKey?: string;
}

export function paintTerrain(
  document: MapDocument,
  cell: GridCoordinate,
  terrainId: string,
  brushSize = 1,
): MapDocument {
  if (!isInsideMap(cell, document.size)) {
    return document;
  }

  if (!document.terrainMaterials.some((terrain) => terrain.id === terrainId)) {
    return document;
  }

  return updateTerrainCells(
    document,
    terrainBrushCells(cell, brushSize, document.size),
    terrainId,
  );
}

export function eraseTerrain(
  document: MapDocument,
  cell: GridCoordinate,
  brushSize = 1,
): MapDocument {
  if (!isInsideMap(cell, document.size)) {
    return document;
  }

  return updateTerrainCells(
    document,
    terrainBrushCells(cell, brushSize, document.size),
    document.editor.baseTerrain,
  );
}

export function pickTerrainMaterialAtCell(
  document: MapDocument,
  cell: GridCoordinate,
): TerrainMaterialDefinition | undefined {
  if (!isInsideMap(cell, document.size)) {
    return undefined;
  }

  const materialId = terrainCellAt(document, cell);

  return document.terrainMaterials.find((material) => material.id === materialId);
}

export function terrainBrushCells(
  center: GridCoordinate,
  brushSize: number,
  size: MapSize,
) {
  const normalizedSize = Math.max(1, Math.floor(brushSize));
  const half = Math.floor((normalizedSize - 1) / 2);
  const cells: GridCoordinate[] = [];

  for (let rowOffset = -half; rowOffset < normalizedSize - half; rowOffset += 1) {
    for (
      let columnOffset = -half;
      columnOffset < normalizedSize - half;
      columnOffset += 1
    ) {
      const cell = {
        column: center.column + columnOffset,
        row: center.row + rowOffset,
      };

      if (isInsideMap(cell, size)) {
        cells.push(cell);
      }
    }
  }

  return cells;
}

function updateTerrainCells(
  document: MapDocument,
  cells: GridCoordinate[],
  material: string,
) {
  const terrainCells = [...document.editor.terrainCells];
  const terrainVertices = [...document.editor.terrainVertices];
  const changedCells: GridCoordinate[] = [];
  const changedVertices: VertexCoordinate[] = [];

  for (const cell of cells) {
    const index = tileIndex(cell, document.size);
    if (terrainCells[index] !== material) {
      terrainCells[index] = material;
      changedCells.push(cell);
    }

    for (const vertex of cellVertices(cell, document.size)) {
      const index = vertexIndex(vertex, document.size);
      if (terrainVertices[index] === material) {
        continue;
      }

      terrainVertices[index] = material;
      changedVertices.push(vertex);
    }
  }

  const ownedLayerIds = terrainOwnedLayerIds(document);
  const refreshCells =
    changedVertices.length > 0
      ? cellsAffectedByVertices(changedVertices, document.size)
      : changedCells.length > 0
        ? cellsAffectedByCells(changedCells, document.size)
      : cells.filter((cell) =>
          shouldRefreshUnchangedTerrainCell(document, cell, ownedLayerIds),
        );

  if (
    refreshCells.length === 0 &&
    changedCells.length === 0 &&
    changedVertices.length === 0
  ) {
    return document;
  }

  const layers = document.layers.map((layer) =>
    layer.type === "tile" && ownedLayerIds.has(layer.id)
      ? { ...layer, data: [...layer.data] }
      : layer,
  );
  const nextDocument: MapDocument = {
    ...document,
    layers,
    editor: {
      ...document.editor,
      terrainCells,
      terrainVertices,
      missingTransitionCells: [...document.editor.missingTransitionCells],
    },
  };

  for (const affectedCell of refreshCells) {
    refreshTerrainCell(nextDocument, affectedCell, ownedLayerIds);
  }

  return nextDocument;
}

function refreshTerrainCell(
  document: MapDocument,
  cell: GridCoordinate,
  ownedLayerIds: Set<string>,
) {
  const index = tileIndex(cell, document.size);
  const plan = resolveCellRenderPlan(document, cell);

  clearTerrainOwnedLayers(document, index, ownedLayerIds);
  document.editor.missingTransitionCells[index] = undefined;

  if (plan.missingKey) {
    document.editor.missingTransitionCells[index] = plan.missingKey;
    return;
  }

  if (!plan.transition || !plan.corners) {
    const fill = plan.fillMaterial
      ? resolveTerrainMaterialFill(document, plan.fillMaterial)
      : undefined;
    if (fill) {
      fill.layer.data[index] = fill.gid;
    }
    return;
  }

  const lowerFill = resolveTerrainMaterialFill(
    document,
    plan.transition.lowerTerrain,
  );
  if (lowerFill && lowerFill.layer.id !== plan.transition.targetLayerId) {
    lowerFill.layer.data[index] = lowerFill.gid;
  }

  const baseLayer = findMutableTileLayer(document, plan.transition.targetLayerId);
  if (baseLayer) {
    baseLayer.data[index] = resolveTerrainGid(
      document.tilesets,
      plan.transition,
      plan.corners,
      { transparentLower: false },
    );
  }

  if (plan.transition.upperLayerId && plan.transition.upperTilesetId) {
    const upperLayer = findMutableTileLayer(document, plan.transition.upperLayerId);
    if (upperLayer) {
      upperLayer.data[index] = resolveTerrainUpperGid(
        document.tilesets,
        plan.transition,
        plan.corners,
      );
    }
  }
}

function shouldRefreshUnchangedTerrainCell(
  document: MapDocument,
  cell: GridCoordinate,
  ownedLayerIds: Set<string>,
) {
  const index = tileIndex(cell, document.size);

  if (document.editor.missingTransitionCells[index]) {
    return true;
  }

  const plan = resolveCellRenderPlan(document, cell);
  if (plan.missingKey) {
    return true;
  }

  if (plan.transition && plan.corners) {
    const baseLayer = findMutableTileLayer(document, plan.transition.targetLayerId);
    if (!baseLayer) {
      return false;
    }

    const expectedBaseGid = resolveTerrainGid(
      document.tilesets,
      plan.transition,
      plan.corners,
      { transparentLower: false },
    );
    if (baseLayer.data[index] !== expectedBaseGid) {
      return true;
    }

    if (plan.transition.upperLayerId && plan.transition.upperTilesetId) {
      const upperLayer = findMutableTileLayer(
        document,
        plan.transition.upperLayerId,
      );
      const expectedUpperGid = resolveTerrainUpperGid(
        document.tilesets,
        plan.transition,
        plan.corners,
      );

      return Boolean(upperLayer && upperLayer.data[index] !== expectedUpperGid);
    }

    return false;
  }

  if (plan.fillMaterial) {
    const fill = resolveTerrainMaterialFill(document, plan.fillMaterial);
    return Boolean(fill && fill.layer.data[index] !== fill.gid);
  }

  return hasTerrainOwnedLayerData(document, index, ownedLayerIds);
}

function resolveCellRenderPlan(
  document: MapDocument,
  cell: GridCoordinate,
): CellRenderPlan {
  const corners = terrainCorners(document, cell);
  const cornerMaterials = [corners.nw, corners.ne, corners.sw, corners.se];

  if (cornerMaterials.some((corner) => isEmptyTerrain(document, corner))) {
    const uniqueNonEmptyMaterials = [
      ...new Set(
        cornerMaterials.filter((corner) => !isEmptyTerrain(document, corner)),
      ),
    ];

    if (
      uniqueNonEmptyMaterials.length === 1 &&
      allCornersAre(corners, uniqueNonEmptyMaterials[0])
    ) {
      return { fillMaterial: uniqueNonEmptyMaterials[0] };
    }

    return {};
  }

  const uniqueMaterials = [...new Set(cornerMaterials)];

  if (uniqueMaterials.length === 1) {
    return { fillMaterial: uniqueMaterials[0] };
  }

  if (uniqueMaterials.length > 2) {
    return { missingKey: uniqueMaterials.sort().join("|") };
  }

  const transition = findTerrainTransitionForPair(
    document.terrainTransitions,
    uniqueMaterials[0],
    uniqueMaterials[1],
  );
  if (!transition) {
    return { missingKey: terrainPairKey(uniqueMaterials[0], uniqueMaterials[1]) };
  }

  return { transition, corners };
}

function clearTerrainOwnedLayers(
  document: MapDocument,
  index: number,
  ownedLayerIds: Set<string>,
) {
  for (const layerId of ownedLayerIds) {
    const layer = findMutableTileLayer(document, layerId);
    if (layer) {
      layer.data[index] = 0;
    }
  }
}

function hasTerrainOwnedLayerData(
  document: MapDocument,
  index: number,
  ownedLayerIds: Set<string>,
) {
  for (const layerId of ownedLayerIds) {
    const layer = findMutableTileLayer(document, layerId);
    if (layer?.data[index]) {
      return true;
    }
  }

  return false;
}

function terrainOwnedLayerIds(document: MapDocument) {
  const layerIds = new Set<string>();

  for (const material of document.terrainMaterials) {
    if (material.fillLayerId) {
      layerIds.add(material.fillLayerId);
    }
  }

  for (const transition of document.terrainTransitions) {
    layerIds.add(transition.targetLayerId);
    if (transition.upperLayerId) {
      layerIds.add(transition.upperLayerId);
    }
  }

  return layerIds;
}

function resolveTerrainMaterialFill(document: MapDocument, materialId: string) {
  const material = document.terrainMaterials.find(
    (candidate) => candidate.id === materialId,
  );
  if (
    !material?.fillLayerId ||
    !material.fillTilesetId ||
    material.fillLocalId === undefined
  ) {
    return undefined;
  }

  const tileset = findTilesetById(document.tilesets, material.fillTilesetId);
  const layer = findMutableTileLayer(document, material.fillLayerId);
  if (
    !tileset ||
    !layer ||
    material.fillLocalId < 0 ||
    material.fillLocalId >= tileset.tileCount
  ) {
    return undefined;
  }

  return {
    layer,
    gid: tileset.firstGid + material.fillLocalId,
  };
}

function isEmptyTerrain(document: MapDocument, material: string) {
  return material === document.editor.baseTerrain;
}

function terrainCellAt(document: MapDocument, cell: GridCoordinate) {
  return (
    document.editor.terrainCells[tileIndex(cell, document.size)] ??
    document.editor.baseTerrain
  );
}

function terrainCorners(
  document: MapDocument,
  cell: GridCoordinate,
): WangCornerMaterials {
  return {
    nw: terrainAtVertex(document, { column: cell.column, row: cell.row }),
    ne: terrainAtVertex(document, { column: cell.column + 1, row: cell.row }),
    sw: terrainAtVertex(document, { column: cell.column, row: cell.row + 1 }),
    se: terrainAtVertex(document, {
      column: cell.column + 1,
      row: cell.row + 1,
    }),
  };
}

function terrainAtVertex(document: MapDocument, vertex: VertexCoordinate) {
  return (
    document.editor.terrainVertices[vertexIndex(vertex, document.size)] ??
    document.editor.baseTerrain
  );
}

function cellVertices(cell: GridCoordinate, size: MapSize) {
  return [
    { column: cell.column, row: cell.row },
    { column: cell.column + 1, row: cell.row },
    { column: cell.column, row: cell.row + 1 },
    { column: cell.column + 1, row: cell.row + 1 },
  ].filter((vertex) => isInsideVertex(vertex, size));
}

function cellsAffectedByVertices(vertices: VertexCoordinate[], size: MapSize) {
  const cells: GridCoordinate[] = [];
  const seen = new Set<number>();

  for (const vertex of vertices) {
    const affected = [
      { column: vertex.column - 1, row: vertex.row - 1 },
      { column: vertex.column, row: vertex.row - 1 },
      { column: vertex.column - 1, row: vertex.row },
      { column: vertex.column, row: vertex.row },
    ];

    for (const cell of affected) {
      if (!isInsideMap(cell, size)) {
        continue;
      }

      const index = tileIndex(cell, size);
      if (seen.has(index)) {
        continue;
      }

      seen.add(index);
      cells.push(cell);
    }
  }

  return cells;
}

function cellsAffectedByCells(cells: GridCoordinate[], size: MapSize) {
  const affectedCells: GridCoordinate[] = [];
  const seen = new Set<number>();

  for (const cell of cells) {
    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
        const affectedCell = {
          column: cell.column + columnOffset,
          row: cell.row + rowOffset,
        };

        if (!isInsideMap(affectedCell, size)) {
          continue;
        }

        const index = tileIndex(affectedCell, size);
        if (seen.has(index)) {
          continue;
        }

        seen.add(index);
        affectedCells.push(affectedCell);
      }
    }
  }

  return affectedCells;
}

function isInsideVertex(vertex: VertexCoordinate, size: MapSize) {
  return (
    vertex.column >= 0 &&
    vertex.row >= 0 &&
    vertex.column <= size.columns &&
    vertex.row <= size.rows
  );
}

function vertexIndex(vertex: VertexCoordinate, size: MapSize) {
  return vertex.row * (size.columns + 1) + vertex.column;
}

function findMutableTileLayer(
  document: MapDocument,
  layerId: string,
): TileLayer | undefined {
  const layer = document.layers.find((candidate) => candidate.id === layerId);
  return layer?.type === "tile" ? layer : undefined;
}

function allCornersAre(corners: WangCornerMaterials, material: string) {
  return (
    corners.nw === material &&
    corners.ne === material &&
    corners.sw === material &&
    corners.se === material
  );
}

export function describeTerrainTransition(transition: TerrainTransitionDefinition) {
  if (transition.upperLayerId && transition.upperTilesetId) {
    return `${transition.targetLayerId} + ${transition.upperLayerId}`;
  }

  return transition.targetLayerId;
}
