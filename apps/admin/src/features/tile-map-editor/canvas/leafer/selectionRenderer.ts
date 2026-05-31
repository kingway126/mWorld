import { Rect } from "leafer-ui";
import type { GridCoordinate } from "../../model/coordinates";
import { isInsideMap } from "../../model/coordinates";
import type { MapDocument } from "../../model/mapDocument";
import { terrainBrushCells } from "../../commands/paintTerrainCommand";
import type { TileMapLeaferStage } from "./createLeaferStage";

export function renderSelection(
  stage: TileMapLeaferStage,
  document: MapDocument,
  hoverCell: GridCoordinate | undefined,
  selectedGid: number,
  selectionFill?: string,
  brushSize = 1,
) {
  stage.overlayLayer.removeAll(true);
  renderMissingTransitions(stage, document);

  if (!hoverCell || !isInsideMap(hoverCell, document.size)) {
    stage.leafer.requestRender(true);
    return;
  }

  const fill = selectionFill;
  const cells = terrainBrushCells(hoverCell, brushSize, document.size);

  for (const cell of cells) {
    const x = cell.column * document.tileSize.width;
    const y = cell.row * document.tileSize.height;

    if (fill) {
      stage.overlayLayer.add(
        new Rect({
          x,
          y,
          width: document.tileSize.width,
          height: document.tileSize.height,
          fill,
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
      x: Math.min(...cells.map((cell) => cell.column)) * document.tileSize.width,
      y: Math.min(...cells.map((cell) => cell.row)) * document.tileSize.height,
      width:
        (Math.max(...cells.map((cell) => cell.column)) -
          Math.min(...cells.map((cell) => cell.column)) +
          1) *
        document.tileSize.width,
      height:
        (Math.max(...cells.map((cell) => cell.row)) -
          Math.min(...cells.map((cell) => cell.row)) +
          1) *
        document.tileSize.height,
      fill: "rgba(255,255,255,0)",
      stroke: "#ffffff",
      strokeWidth: 2.2,
      hittable: false,
    }),
  );

  stage.leafer.requestRender(true);
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
