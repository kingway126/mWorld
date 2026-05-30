import { Line, Rect } from "leafer-ui";
import type { MapDocument } from "../../model/mapDocument";
import type { TileMapLeaferStage } from "./createLeaferStage";

export function renderGrid(stage: TileMapLeaferStage, document: MapDocument) {
  const { tileSize, size } = document;
  const width = size.columns * tileSize.width;
  const height = size.rows * tileSize.height;

  stage.gridLayer.removeAll(true);

  stage.gridLayer.add(
    new Rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: "rgba(255,255,255,0)",
      stroke: "rgba(211, 228, 255, 0.42)",
      strokeWidth: 2,
      hittable: false,
    }),
  );

  for (let column = 1; column < size.columns; column += 1) {
    const x = column * tileSize.width;
    stage.gridLayer.add(
      new Line({
        points: [x, 0, x, height],
        stroke: "rgba(211, 228, 255, 0.13)",
        strokeWidth: 1,
        hittable: false,
      }),
    );
  }

  for (let row = 1; row < size.rows; row += 1) {
    const y = row * tileSize.height;
    stage.gridLayer.add(
      new Line({
        points: [0, y, width, y],
        stroke: "rgba(211, 228, 255, 0.13)",
        strokeWidth: 1,
        hittable: false,
      }),
    );
  }

  stage.leafer.requestRender(true);
}
