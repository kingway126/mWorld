import { Rect } from "leafer-ui";
import type { GridCoordinate } from "../../model/coordinates";
import {
  gridRectCells,
  isInsideMap,
  normalizeGridRect,
} from "../../model/coordinates";
import type { MapDocument } from "../../model/mapDocument";
import type { StampBrush } from "../../model/brush";
import { terrainBrushCells } from "../../commands/paintTerrainCommand";
import type { TileMapLeaferStage } from "./createLeaferStage";

export type SelectionPreview =
  | {
      kind: "brush";
      cell?: GridCoordinate;
      fill?: string;
      brushSize: number;
    }
  | {
      kind: "rect";
      start: GridCoordinate;
      end: GridCoordinate;
      fill?: string;
    }
  | {
      kind: "stamp";
      anchor?: GridCoordinate;
      stamp?: StampBrush;
    };

export function renderSelection(
  stage: TileMapLeaferStage,
  document: MapDocument,
  preview?: SelectionPreview,
) {
  stage.overlayLayer.removeAll(true);
  renderMissingTransitions(stage, document);

  if (!preview) {
    stage.leafer.requestRender(true);
    return;
  }

  if (preview.kind === "rect") {
    renderRectPreview(stage, document, preview);
    stage.leafer.requestRender(true);
    return;
  }

  if (preview.kind === "stamp") {
    renderStampPreview(stage, document, preview);
    stage.leafer.requestRender(true);
    return;
  }

  renderBrushPreview(stage, document, preview);
  stage.leafer.requestRender(true);
}

function renderBrushPreview(
  stage: TileMapLeaferStage,
  document: MapDocument,
  preview: Extract<SelectionPreview, { kind: "brush" }>,
) {
  if (!preview.cell || !isInsideMap(preview.cell, document.size)) {
    return;
  }

  const cells = terrainBrushCells(preview.cell, preview.brushSize, document.size);
  const columns = cells.map((cell) => cell.column);
  const rows = cells.map((cell) => cell.row);

  for (const cell of cells) {
    const x = cell.column * document.tileSize.width;
    const y = cell.row * document.tileSize.height;

    if (preview.fill) {
      stage.overlayLayer.add(
        new Rect({
          x,
          y,
          width: document.tileSize.width,
          height: document.tileSize.height,
          fill: preview.fill,
          opacity: 0.3,
          hittable: false,
        }),
      );
    }

    stage.overlayLayer.add(
      new Rect({
        x,
        y,
        width: document.tileSize.width,
        height: document.tileSize.height,
        fill: "rgba(255,255,255,0)",
        stroke: "#f8fbff",
        strokeWidth: 1.6,
        hittable: false,
      }),
    );
  }

  stage.overlayLayer.add(
    new Rect({
      x: Math.min(...columns) * document.tileSize.width,
      y: Math.min(...rows) * document.tileSize.height,
      width:
        (Math.max(...columns) - Math.min(...columns) + 1) *
        document.tileSize.width,
      height:
        (Math.max(...rows) - Math.min(...rows) + 1) *
        document.tileSize.height,
      fill: "rgba(255,255,255,0)",
      stroke: "#ffffff",
      strokeWidth: 2.2,
      hittable: false,
    }),
  );
}

function renderRectPreview(
  stage: TileMapLeaferStage,
  document: MapDocument,
  preview: Extract<SelectionPreview, { kind: "rect" }>,
) {
  const cells = gridRectCells(
    normalizeGridRect(preview.start, preview.end),
    document.size,
  );
  if (cells.length === 0) {
    return;
  }

  const columns = cells.map((cell) => cell.column);
  const rows = cells.map((cell) => cell.row);
  const left = Math.min(...columns);
  const top = Math.min(...rows);
  const width = Math.max(...columns) - left + 1;
  const height = Math.max(...rows) - top + 1;

  stage.overlayLayer.add(
    new Rect({
      x: left * document.tileSize.width,
      y: top * document.tileSize.height,
      width: width * document.tileSize.width,
      height: height * document.tileSize.height,
      fill: preview.fill ?? "rgba(129, 140, 248, 0.22)",
      opacity: preview.fill ? 0.32 : 1,
      stroke: "#ffffff",
      strokeWidth: 2.2,
      hittable: false,
    }),
  );
}

function renderStampPreview(
  stage: TileMapLeaferStage,
  document: MapDocument,
  preview: Extract<SelectionPreview, { kind: "stamp" }>,
) {
  if (!preview.anchor || !preview.stamp) {
    return;
  }

  for (const stampCell of preview.stamp.cells) {
    const cell = {
      column: preview.anchor.column + stampCell.dx,
      row: preview.anchor.row + stampCell.dy,
    };
    if (!isInsideMap(cell, document.size)) {
      continue;
    }

    stage.overlayLayer.add(
      new Rect({
        x: cell.column * document.tileSize.width,
        y: cell.row * document.tileSize.height,
        width: document.tileSize.width,
        height: document.tileSize.height,
        fill: "rgba(56, 189, 248, 0.2)",
        stroke: "#bae6fd",
        strokeWidth: 1.2,
        hittable: false,
      }),
    );
  }

  stage.overlayLayer.add(
    new Rect({
      x: preview.anchor.column * document.tileSize.width,
      y: preview.anchor.row * document.tileSize.height,
      width: preview.stamp.width * document.tileSize.width,
      height: preview.stamp.height * document.tileSize.height,
      fill: "rgba(255,255,255,0)",
      stroke: "#38bdf8",
      strokeWidth: 2.2,
      hittable: false,
    }),
  );
}

function renderMissingTransitions(stage: TileMapLeaferStage, document: MapDocument) {
  document.editor.missingTransitionCells.forEach((missingKey, index) => {
    if (!missingKey) {
      return;
    }

    const column = index % document.size.columns;
    const row = Math.floor(index / document.size.columns);
    const x = column * document.tileSize.width;
    const y = row * document.tileSize.height;

    stage.overlayLayer.add(
      new Rect({
        x,
        y,
        width: document.tileSize.width,
        height: document.tileSize.height,
        fill: "rgba(220, 38, 38, 0.18)",
        stroke: "#ef4444",
        strokeWidth: 1.3,
        hittable: false,
      }),
    );

    stage.overlayLayer.add(
      new Rect({
        x: x + 2,
        y: y + 2,
        width: Math.max(3, document.tileSize.width * 0.18),
        height: Math.max(3, document.tileSize.height * 0.18),
        fill: "#ef4444",
        hittable: false,
      }),
    );
  });
}
