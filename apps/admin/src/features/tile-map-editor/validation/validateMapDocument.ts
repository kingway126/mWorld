import type { MapDocument } from "../model/mapDocument";

export interface ValidationIssue {
  path: string;
  message: string;
}

export function validateMapDocument(document: MapDocument): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const expectedLayerSize = document.size.columns * document.size.rows;
  const expectedVertexSize = (document.size.columns + 1) * (document.size.rows + 1);

  if (document.orientation !== "orthogonal") {
    issues.push({
      path: "orientation",
      message: "Only orthogonal tile maps are supported in the first POC.",
    });
  }

  if (document.tileSize.width <= 0 || document.tileSize.height <= 0) {
    issues.push({
      path: "tileSize",
      message: "Tile width and height must be positive.",
    });
  }

  if (document.editor.terrainVertices.length !== expectedVertexSize) {
    issues.push({
      path: "editor.terrainVertices",
      message: "Terrain vertex data length does not match map dimensions.",
    });
  }

  if (document.editor.terrainCells.length !== expectedLayerSize) {
    issues.push({
      path: "editor.terrainCells",
      message: "Terrain cell data length does not match map dimensions.",
    });
  }

  if (document.editor.missingTransitionCells.length !== expectedLayerSize) {
    issues.push({
      path: "editor.missingTransitionCells",
      message: "Missing transition cell data length does not match map dimensions.",
    });
  }

  const layerIds = new Set(document.layers.map((layer) => layer.id));
  const tilesetIds = new Set(document.tilesets.map((tileset) => tileset.id));
  const materialIds = new Set(
    document.terrainMaterials.map((material) => material.id),
  );

  if (
    document.editor.selectedTerrainId &&
    !materialIds.has(document.editor.selectedTerrainId)
  ) {
    issues.push({
      path: "editor.selectedTerrainId",
      message: "Selected terrain material does not exist.",
    });
  }

  if (
    document.editor.baseTerrain &&
    !materialIds.has(document.editor.baseTerrain)
  ) {
    issues.push({
      path: "editor.baseTerrain",
      message: "Base terrain material does not exist.",
    });
  }

  for (const material of document.terrainMaterials) {
    const previewTileset = document.tilesets.find(
      (tileset) => tileset.id === material.previewTilesetId,
    );

    if (!previewTileset) {
      issues.push({
        path: `terrainMaterials.${material.id}.previewTilesetId`,
        message: "Terrain material preview tileset does not exist.",
      });
    } else if (
      material.previewLocalId < 0 ||
      material.previewLocalId >= previewTileset.tileCount
    ) {
      issues.push({
        path: `terrainMaterials.${material.id}.previewLocalId`,
        message: "Terrain material preview tile is outside its tileset.",
      });
    }

    const sourceTileset = document.tilesets.find(
      (tileset) => tileset.id === material.sourceTilesetId,
    );
    if (!sourceTileset) {
      issues.push({
        path: `terrainMaterials.${material.id}.sourceTilesetId`,
        message: "Terrain material source tileset does not exist.",
      });
    } else if (
      sourceTileset.kind !== "wang" ||
      material.sourceLocalId < 0 ||
      material.sourceLocalId >= sourceTileset.tileCount
    ) {
      issues.push({
        path: `terrainMaterials.${material.id}.sourceLocalId`,
        message: "Terrain material source must point at a Wang endpoint tile.",
      });
    }

    for (const linkedTilesetId of material.linkedTilesetIds) {
      if (!tilesetIds.has(linkedTilesetId)) {
        issues.push({
          path: `terrainMaterials.${material.id}.linkedTilesetIds`,
          message: "Terrain material linked tileset does not exist.",
        });
      }
    }

    if (material.fillLayerId && !layerIds.has(material.fillLayerId)) {
      issues.push({
        path: `terrainMaterials.${material.id}.fillLayerId`,
        message: "Terrain material fill layer does not exist.",
      });
    }

    if (material.fillTilesetId && !tilesetIds.has(material.fillTilesetId)) {
      issues.push({
        path: `terrainMaterials.${material.id}.fillTilesetId`,
        message: "Terrain material fill tileset does not exist.",
      });
    }

    if (
      (material.fillLayerId || material.fillTilesetId || material.fillLocalId !== undefined) &&
      (!material.fillLayerId ||
        !material.fillTilesetId ||
        material.fillLocalId === undefined)
    ) {
      issues.push({
        path: `terrainMaterials.${material.id}.fill`,
        message: "Terrain material fill must declare layer, tileset, and local tile.",
      });
    }

    const fillTileset = document.tilesets.find(
      (tileset) => tileset.id === material.fillTilesetId,
    );
    if (
      fillTileset &&
      material.fillLocalId !== undefined &&
      (material.fillLocalId < 0 || material.fillLocalId >= fillTileset.tileCount)
    ) {
      issues.push({
        path: `terrainMaterials.${material.id}.fillLocalId`,
        message: "Terrain material fill tile is outside its tileset.",
      });
    }
  }

  for (const transition of document.terrainTransitions) {
    if (!layerIds.has(transition.targetLayerId)) {
      issues.push({
        path: `terrainTransitions.${transition.id}.targetLayerId`,
        message: "Terrain transition target layer does not exist.",
      });
    }

    if (!tilesetIds.has(transition.tilesetId)) {
      issues.push({
        path: `terrainTransitions.${transition.id}.tilesetId`,
        message: "Terrain transition tileset does not exist.",
      });
    }

    if (
      !materialIds.has(transition.lowerTerrain) ||
      !materialIds.has(transition.upperTerrain)
    ) {
      issues.push({
        path: `terrainTransitions.${transition.id}.terrainPair`,
        message: "Terrain transition must reference existing terrain materials.",
      });
    }

    if (transition.upperLayerId && !layerIds.has(transition.upperLayerId)) {
      issues.push({
        path: `terrainTransitions.${transition.id}.upperLayerId`,
        message: "Terrain transition upper layer does not exist.",
      });
    }

    if (transition.upperTilesetId && !tilesetIds.has(transition.upperTilesetId)) {
      issues.push({
        path: `terrainTransitions.${transition.id}.upperTilesetId`,
        message: "Terrain transition upper tileset does not exist.",
      });
    }
  }

  for (const layer of document.layers) {
    if (layer.type === "tile" && layer.data.length !== expectedLayerSize) {
      issues.push({
        path: `layers.${layer.id}.data`,
        message: "Tile layer data length does not match map dimensions.",
      });
    }
  }

  return issues;
}
