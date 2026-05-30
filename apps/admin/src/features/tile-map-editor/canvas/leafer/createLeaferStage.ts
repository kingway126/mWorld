import "@leafer-in/viewport";
import { Group, Leafer } from "leafer-ui";

export interface TileMapLeaferStage {
  leafer: Leafer;
  worldGroup: Group;
  tileLayerGroup: Group;
  gridLayer: Group;
  overlayLayer: Group;
}

export function createLeaferStage(view: HTMLElement): TileMapLeaferStage {
  const leafer = new Leafer({
    view,
    fill: "#111820",
    smooth: false,
    pixelRatio: window.devicePixelRatio,
  });

  const worldGroup = new Group({ hittable: false });
  const tileLayerGroup = new Group({ hittable: false });
  const gridLayer = new Group({ hittable: false });
  const overlayLayer = new Group({ hittable: false });

  worldGroup.add(tileLayerGroup);
  worldGroup.add(gridLayer);
  worldGroup.add(overlayLayer);
  leafer.add(worldGroup);

  return {
    leafer,
    worldGroup,
    tileLayerGroup,
    gridLayer,
    overlayLayer,
  };
}
