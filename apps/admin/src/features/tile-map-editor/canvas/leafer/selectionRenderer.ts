import { Rect } from "leafer-ui";
import type { GridCoordinate } from "../../model/coordinates";
import { isInsideMap } from "../../model/coordinates";
import type { MapDocument } from "../../model/mapDocument";
import { findTileByGid } from "../../model/tileset";
import type { TileMapLeaferStage } from "./createLeaferStage";

export function renderSelection(
  stage: TileMapLeaferStage,
  document: MapDocument,
  hoverCell: GridCoordinate | undefined,
  selectedGid: number,
) {
  stage.overlayLayer.removeAll(true);

  if (!hoverCell || !isInsideMap(hoverCell, document.size)) {
    stage.leafer.requestRender(true);
    return;
  }

  const tileRef = findTileByGid(document.tilesets, selectedGid);
  const x = hoverCell.column * document.tileSize.width;
  const y = hoverCell.row * document.tileSize.height;

  if (tileRef) {
    stage.overlayLayer.add(
      new Rect({
        x,
        y,
        width: document.tileSize.width,
        height: document.tileSize.height,
        fill: tileRef.tile.color,
        opacity: 0.38,
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
      strokeWidth: 2,
      hittable: false,
    }),
  );

  stage.leafer.requestRender(true);
}
