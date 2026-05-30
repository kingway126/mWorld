import type { MapDocument } from "../model/mapDocument";

export interface ValidationIssue {
  path: string;
  message: string;
}

export function validateMapDocument(document: MapDocument): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const expectedLayerSize = document.size.columns * document.size.rows;

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
