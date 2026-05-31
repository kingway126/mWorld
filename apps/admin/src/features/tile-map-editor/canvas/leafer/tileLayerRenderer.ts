import { Group, Rect } from "leafer-ui";
import type { TileLayer } from "../../model/layer";
import type { MapDocument } from "../../model/mapDocument";
import { findTileByGid, tileSourceRect, type TilesetRef } from "../../model/tileset";
import type { TileMapLeaferStage } from "./createLeaferStage";

interface RenderedTile {
  gid: number;
  spriteKey: string;
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
interface TileSpriteCacheEntry {
  url?: string;
  loading: boolean;
  callbacks: Set<(url: string) => void>;
}

const sourceImageCache = new Map<string, Promise<HTMLImageElement>>();
const tileSpriteCache = new Map<string, TileSpriteCacheEntry>();

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
      didUpdate =
        syncTileLayer(
          layerCache,
          layer,
          document,
          forceTileStyleUpdate,
          () => stage.leafer.requestRender(true),
        ) || didUpdate;
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
    syncTileLayer(layerCache, layer, document, true, () =>
      stage.leafer.requestRender(true),
    );
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
  requestRender: () => void,
) {
  const previousData = layerCache.previousData;
  let didUpdate = false;

  for (let index = 0; index < layer.data.length; index += 1) {
    const gid = layer.data[index];
    const previousGid = previousData?.[index] ?? 0;

    if (!forceTileStyleUpdate && gid === previousGid) {
      continue;
    }

    didUpdate =
      syncTileAtIndex(layerCache, document, index, gid, requestRender) ||
      didUpdate;
  }

  layerCache.previousData = layer.data;
  return didUpdate;
}

function syncTileAtIndex(
  layerCache: LayerRenderCache,
  document: MapDocument,
  index: number,
  gid: number,
  requestRender: () => void,
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

  const spriteKey = getSpriteKey(document, gid);
  const fill = getCachedTileFill(document, gid);

  if (renderedTile) {
    if (renderedTile.gid === gid && renderedTile.spriteKey === spriteKey) {
      return false;
    }

    renderedTile.node.set({
      fill,
    });
    renderedTile.gid = gid;
    renderedTile.spriteKey = spriteKey;
    ensureTileSpriteUrl(document, gid, (url) => {
      if (renderedTile.gid === gid && renderedTile.spriteKey === spriteKey) {
        renderedTile.node.set({ fill: createImageFill(url) });
        requestRender();
      }
    });
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
  ensureTileSpriteUrl(document, gid, (url) => {
    if (node.destroyed) {
      return;
    }

    const current = layerCache.tiles.get(index);
    if (current?.gid === gid && current.spriteKey === spriteKey) {
      node.set({ fill: createImageFill(url) });
      requestRender();
    }
  });

  layerCache.group.add(node);
  layerCache.tiles.set(index, {
    gid,
    spriteKey,
    node,
  });
  return true;
}

function getCachedTileFill(document: MapDocument, gid: number) {
  const tileRef = findTileByGid(document.tilesets, gid);
  if (!tileRef) {
    return "rgba(0, 0, 0, 0)";
  }

  const cached = tileSpriteCache.get(tileSpriteKey(tileRef.tileset, tileRef.tile.localId));
  return cached?.url ? createImageFill(cached.url) : "rgba(0, 0, 0, 0)";
}

function getSpriteKey(document: MapDocument, gid: number) {
  const tileRef = findTileByGid(document.tilesets, gid);
  if (!tileRef) {
    return `missing:${gid}`;
  }

  return tileSpriteKey(tileRef.tileset, tileRef.tile.localId);
}

function ensureTileSpriteUrl(
  document: MapDocument,
  gid: number,
  onReady: (url: string) => void,
) {
  const tileRef = findTileByGid(document.tilesets, gid);
  if (!tileRef) {
    return;
  }

  const key = tileSpriteKey(tileRef.tileset, tileRef.tile.localId);
  const cached = tileSpriteCache.get(key);
  if (cached?.url) {
    onReady(cached.url);
    return;
  }

  const entry =
    cached ??
    {
      loading: false,
      callbacks: new Set<(url: string) => void>(),
    };

  entry.callbacks.add(onReady);
  tileSpriteCache.set(key, entry);

  if (entry.loading) {
    return;
  }

  entry.loading = true;
  loadSourceImage(tileRef.tileset)
    .then((image) => {
      const url = createTileSpriteUrl(tileRef.tileset, tileRef.tile.localId, image);
      entry.url = url;
      for (const callback of entry.callbacks) {
        callback(url);
      }
      entry.callbacks.clear();
    })
    .catch(() => {
      entry.callbacks.clear();
    });
}

function loadSourceImage(tileset: TilesetRef) {
  const cached = sourceImageCache.get(tileset.image);
  if (cached) {
    return cached;
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load tileset ${tileset.image}`));
    image.src = tileset.image;
  });

  sourceImageCache.set(tileset.image, promise);
  return promise;
}

function createTileSpriteUrl(
  tileset: TilesetRef,
  localId: number,
  image: HTMLImageElement,
) {
  const source = tileSourceRect(tileset, localId);
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;

  const context = canvas.getContext("2d");
  if (!context) {
    return "";
  }

  context.imageSmoothingEnabled = false;
  context.drawImage(
    image,
    source.x,
    source.y,
    source.width,
    source.height,
    0,
    0,
    source.width,
    source.height,
  );

  return canvas.toDataURL("image/png");
}

function createImageFill(url: string) {
  return {
    type: "image" as const,
    url,
    mode: "stretch" as const,
  };
}

function tileSpriteKey(tileset: TilesetRef, localId: number) {
  return `${tileset.id}:${tileset.image}:${localId}`;
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
        tileset.image,
        tileset.firstGid,
        tileset.tileCount,
        tileset.tiles.map((tile) => tile.localId).join(","),
      ].join("@"),
    )
    .join("|");
}
