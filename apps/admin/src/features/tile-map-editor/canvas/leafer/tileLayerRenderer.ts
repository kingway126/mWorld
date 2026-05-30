import { Group, Rect } from "leafer-ui";
import type { MapDocument } from "../../model/mapDocument";
import { findTileByGid } from "../../model/tileset";
import type { TileMapLeaferStage } from "./createLeaferStage";

export function renderTileLayers(stage: TileMapLeaferStage, document: MapDocument) {
  stage.tileLayerGroup.removeAll(true);

  for (const layer of document.layers) {
    if (layer.type !== "tile" || !layer.visible) {
      continue;
    }

    const layerGroup = new Group({
      opacity: layer.opacity,
      hittable: false,
    });

    for (let row = 0; row < document.size.rows; row += 1) {
      for (let column = 0; column < document.size.columns; column += 1) {
        const index = row * document.size.columns + column;
        const gid = layer.data[index];

        if (gid <= 0) {
          continue;
        }

        const tileRef = findTileByGid(document.tilesets, gid);
        const fill = tileRef?.tile.color ?? "#ff4d7d";

        layerGroup.add(
          new Rect({
            x: column * document.tileSize.width,
            y: row * document.tileSize.height,
            width: document.tileSize.width,
            height: document.tileSize.height,
            fill,
            stroke: "rgba(0, 0, 0, 0.18)",
            strokeWidth: 1,
            hittable: false,
          }),
        );
      }
    }

    stage.tileLayerGroup.add(layerGroup);
  }

  stage.leafer.requestRender(true);
}
