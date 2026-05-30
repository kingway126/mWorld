import { Group, Rect } from "leafer-ui";
import type { TileLayer } from "../../model/layer";
import type { MapDocument } from "../../model/mapDocument";
import { findTileByGid } from "../../model/tileset";
import type { TileMapLeaferStage } from "./createLeaferStage";

interface RenderedTile {
  gid: number;
  fill: string;
  node: Rect;
}

interface LayerRenderCache {
  group: Group;
  tiles: Map<number, RenderedTile>;
  previousData?: readonly number[];
  visible: boolean;
  opacity: number;
}

interface TileLayerRenderCache {
  layoutKey: string;
  layerOrderKey: string;
  tilesetKey: string;
  layers: Map<string, LayerRenderCache>;
}

const stageCaches = new WeakMap<TileMapLeaferStage, TileLayerRenderCache>();

export function renderTileLayers(stage: TileMapLeaferStage, document: MapDocument) {
  const layoutKey = createLayoutKey(document);
  const layerOrderKey = createLayerOrderKey(document);
  const tilesetKey = createTilesetKey(document);
  const cache = stageCaches.get(stage);

  if (!cache || cache.layoutKey !== layoutKey || cache.layerOrderKey !== layerOrderKey) {
    stageCaches.set(
      stage,
      rebuildTileLayers(stage, document, layoutKey, layerOrderKey, tilesetKey),
    );
    stage.leafer.requestRender(true);
    return;
  }

  const forceTileStyleUpdate = cache.tilesetKey !== tilesetKey;
  let didUpdate = false;

  for (const layer of document.layers) {
    if (layer.type !== "tile") {
      continue;
    }

    const layerCache = cache.layers.get(layer.id);
    if (!layerCache) {
      continue;
    }

    if (layerCache.visible !== layer.visible || layerCache.opacity !== layer.opacity) {
      layerCache.group.set({
        opacity: layer.opacity,
        visible: layer.visible,
      });
      layerCache.visible = layer.visible;
      layerCache.opacity = layer.opacity;
      didUpdate = true;
    }

    const previousData = layerCache.previousData;
    if (
      !previousData ||
      previousData !== layer.data ||
      forceTileStyleUpdate ||
      previousData.length !== layer.data.length
    ) {
      didUpdate = syncTileLayer(layerCache, layer, document, forceTileStyleUpdate) || didUpdate;
    }
  }

  cache.tilesetKey = tilesetKey;

  if (didUpdate) {
    stage.leafer.requestRender(true);
  }
}

function rebuildTileLayers(
  stage: TileMapLeaferStage,
  document: MapDocument,
  layoutKey: string,
  layerOrderKey: string,
  tilesetKey: string,
): TileLayerRenderCache {
  stage.tileLayerGroup.removeAll(true);

  const layers = new Map<string, LayerRenderCache>();

  for (const layer of document.layers) {
    if (layer.type !== "tile") {
      continue;
    }

    const layerGroup = new Group({
      opacity: layer.opacity,
      visible: layer.visible,
      hittable: false,
    });
    const layerCache: LayerRenderCache = {
      group: layerGroup,
      tiles: new Map(),
      visible: layer.visible,
      opacity: layer.opacity,
    };

    stage.tileLayerGroup.add(layerGroup);
    syncTileLayer(layerCache, layer, document, true);
    layers.set(layer.id, layerCache);
  }

  return {
    layoutKey,
    layerOrderKey,
    tilesetKey,
    layers,
  };
}

function syncTileLayer(
  layerCache: LayerRenderCache,
  layer: TileLayer,
  document: MapDocument,
  forceTileStyleUpdate: boolean,
) {
  const previousData = layerCache.previousData;
  let didUpdate = false;

  for (let index = 0; index < layer.data.length; index += 1) {
    const gid = layer.data[index];
    const previousGid = previousData?.[index] ?? 0;

    if (!forceTileStyleUpdate && gid === previousGid) {
      continue;
    }

    didUpdate = syncTileAtIndex(layerCache, document, index, gid) || didUpdate;
  }

  layerCache.previousData = layer.data;
  return didUpdate;
}

function syncTileAtIndex(
  layerCache: LayerRenderCache,
  document: MapDocument,
  index: number,
  gid: number,
) {
  const renderedTile = layerCache.tiles.get(index);

  if (gid <= 0) {
    if (renderedTile) {
      layerCache.group.remove(renderedTile.node, true);
      layerCache.tiles.delete(index);
      return true;
    }

    return false;
  }

  const fill = getTileFill(document, gid);

  if (renderedTile) {
    if (renderedTile.gid === gid && renderedTile.fill === fill) {
      return false;
    }

    renderedTile.node.set({ fill });
    renderedTile.gid = gid;
    renderedTile.fill = fill;
    return true;
  }

  const column = index % document.size.columns;
  const row = Math.floor(index / document.size.columns);
  const node = new Rect({
    x: column * document.tileSize.width,
    y: row * document.tileSize.height,
    width: document.tileSize.width,
    height: document.tileSize.height,
    fill,
    stroke: "rgba(0, 0, 0, 0.18)",
    strokeWidth: 1,
    hittable: false,
  });

  layerCache.group.add(node);
  layerCache.tiles.set(index, {
    gid,
    fill,
    node,
  });
  return true;
}

function getTileFill(document: MapDocument, gid: number) {
  return findTileByGid(document.tilesets, gid)?.tile.color ?? "#ff4d7d";
}

function createLayoutKey(document: MapDocument) {
  return [
    document.size.columns,
    document.size.rows,
    document.tileSize.width,
    document.tileSize.height,
  ].join(":");
}

function createLayerOrderKey(document: MapDocument) {
  return document.layers
    .filter((layer) => layer.type === "tile")
    .map((layer) => layer.id)
    .join(":");
}

function createTilesetKey(document: MapDocument) {
  return document.tilesets
    .map((tileset) =>
      [
        tileset.id,
        tileset.firstGid,
        tileset.tileCount,
        tileset.tiles.map((tile) => `${tile.localId}:${tile.color}`).join(","),
      ].join("@"),
    )
    .join("|");
}
