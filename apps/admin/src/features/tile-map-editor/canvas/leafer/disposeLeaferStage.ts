import type { TileMapLeaferStage } from "./createLeaferStage";

export function disposeLeaferStage(stage: TileMapLeaferStage) {
  stage.leafer.destroy(true);
}
