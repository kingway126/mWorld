import type { TileMapLeaferStage } from "./createLeaferStage";
import type { ViewportState } from "../../model/coordinates";

export function applyViewportToStage(
  stage: TileMapLeaferStage,
  viewport: ViewportState,
) {
  stage.worldGroup.set({
    x: viewport.x,
    y: viewport.y,
    scaleX: viewport.zoom,
    scaleY: viewport.zoom,
  });

  stage.leafer.requestRender(true);
}
