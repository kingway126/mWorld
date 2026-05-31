import { Search } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import type {
  TerrainMaterialDefinition,
  TilesetRef,
  TilesetTile,
} from "../model/tileset";

interface AssetBrowserPanelProps {
  tilesets: TilesetRef[];
  terrainMaterials: TerrainMaterialDefinition[];
  selectedGid: number;
  selectedTerrainId: string;
  onSelectGid: (gid: number) => void;
  onSelectTerrain: (terrainId: string) => void;
}

type AssetMode = "terrains" | "tiles";

export function AssetBrowserPanel({
  tilesets,
  terrainMaterials,
  selectedGid,
  selectedTerrainId,
  onSelectGid,
  onSelectTerrain,
}: AssetBrowserPanelProps) {
  const [query, setQuery] = useState("");
  const [assetMode, setAssetMode] = useState<AssetMode>("terrains");
  const normalizedQuery = query.trim().toLowerCase();
  const selectedTile = tilesets
    .flatMap((tileset) =>
      tileset.tiles.map((tile) => ({
        gid: tileset.firstGid + tile.localId,
        name: tile.name,
        tile,
        tilesetRef: tileset,
        tileset: tileset.name,
      })),
    )
    .find((tile) => tile.gid === selectedGid);
  const selectedTerrain = terrainMaterials.find(
    (material) => material.id === selectedTerrainId,
  );
  const visibleTilesets = useMemo(
    () =>
      tilesets
        .map((tileset) => {
          const visibleTileIds = new Set(
            tileset.tiles
              .filter((tile) => tileMatchesQuery(tileset, tile, normalizedQuery))
              .map((tile) => tile.localId),
          );

          return {
            ...tileset,
            visibleTileIds,
            visibleTileCount: visibleTileIds.size,
          };
        })
        .filter(
          (tileset) => !normalizedQuery || tileset.visibleTileCount > 0,
        ),
    [normalizedQuery, tilesets],
  );
  const visibleTerrainMaterials = useMemo(
    () =>
      terrainMaterials.filter((material) => {
        if (!normalizedQuery) {
          return true;
        }

        return (
          material.id.toLowerCase().includes(normalizedQuery) ||
          material.name.toLowerCase().includes(normalizedQuery) ||
          material.description.toLowerCase().includes(normalizedQuery) ||
          material.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
        );
      }),
    [normalizedQuery, terrainMaterials],
  );

  return (
    <aside className="asset-browser">
      <div className="panel-header">
        <div>
          <h2>Assets</h2>
          <span>
            {tilesets.length} tilesets / {terrainMaterials.length} terrains
          </span>
        </div>
      </div>

      <div className="asset-mode-tabs" aria-label="Asset browser modes">
        {assetModes.map((mode) => (
          <button
            key={mode.id}
            type="button"
            data-active={assetMode === mode.id}
            onClick={() => setAssetMode(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <label className="asset-search">
        <Search aria-hidden="true" size={15} />
        <input
          type="search"
          placeholder="Search assets"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <div className="asset-scroll-region">
        {assetMode === "terrains" && (
          <section className="asset-section">
            <div className="asset-section-title">
              <span>Terrain Materials</span>
              <span>{visibleTerrainMaterials.length}</span>
            </div>
            <div className="asset-grid terrain-grid">
              {visibleTerrainMaterials.map((material) => (
                <button
                  className="asset-tile terrain-tile"
                  data-active={material.id === selectedTerrainId}
                  data-material-id={material.id}
                  data-source-role={material.sourceRole}
                  data-source-tileset={material.sourceTilesetId}
                  key={material.id}
                  type="button"
                  title={terrainTitle(tilesets, material)}
                  aria-label={material.name}
                  onClick={() => onSelectTerrain(material.id)}
                >
                  <span
                    className="asset-tile-preview"
                    style={terrainPreviewStyle(tilesets, material)}
                  />
                  <span className="terrain-tile-label">{material.name}</span>
                </button>
              ))}
            </div>
            {visibleTerrainMaterials.length === 0 && (
              <div className="asset-empty-state">No terrains found</div>
            )}
          </section>
        )}

        {assetMode === "tiles" &&
          visibleTilesets.map((tileset) => (
            <section className="asset-section" key={tileset.id}>
              <div className="asset-section-title">
                <span>{tileset.name}</span>
                <span>{tileset.visibleTileCount}</span>
              </div>
              <div
                className="tileset-atlas"
                style={tilesetAtlasStyle(tileset)}
              >
                {tileset.tiles.map((tile) => {
                  const gid = tileset.firstGid + tile.localId;
                  const isFilteredOut =
                    Boolean(normalizedQuery) &&
                    !tileset.visibleTileIds.has(tile.localId);

                  return (
                    <button
                      className="atlas-tile"
                      data-active={selectedGid === gid}
                      data-filtered-out={isFilteredOut}
                      disabled={isFilteredOut}
                      key={tile.localId}
                      type="button"
                      title={`${tile.name} - GID ${gid}`}
                      aria-label={tile.name}
                      onClick={() => onSelectGid(gid)}
                    >
                      <span className="atlas-tile-id">{gid}</span>
                    </button>
                  );
                })}
              </div>
              {tileset.visibleTileCount === 0 && (
                <div className="asset-empty-state">No tiles found</div>
              )}
            </section>
          ))}

      </div>

      <div className="selected-asset">
        <span
          className="selected-asset-preview"
          style={
            assetMode === "terrains" && selectedTerrain
              ? terrainPreviewStyle(tilesets, selectedTerrain)
              : selectedTile
                ? tilePreviewStyle(selectedTile.tilesetRef, selectedTile.tile)
                : { backgroundColor: "transparent" }
          }
        />
        <div>
          <span className="selected-asset-label">
            {assetMode === "terrains" ? "Selected terrain" : "Selected tile"}
          </span>
          <strong>
            {assetMode === "terrains"
              ? selectedTerrain?.name ?? "None"
              : selectedTile?.name ?? "Empty"}
          </strong>
          <span>
            {assetMode === "terrains"
              ? selectedTerrain
                ? `${selectedTerrain.sourceTilesetId} / ${selectedTerrain.sourceRole} #${selectedTerrain.sourceLocalId}`
                : "No terrain"
              : selectedTile
                ? `${selectedTile.tileset} / GID ${selectedTile.gid}`
                : "No tile"}
          </span>
        </div>
      </div>
    </aside>
  );
}

const assetModes: Array<{ id: AssetMode; label: string }> = [
  { id: "terrains", label: "Terrains" },
  { id: "tiles", label: "Tiles" },
];

function tileMatchesQuery(
  tileset: TilesetRef,
  tile: TilesetTile,
  normalizedQuery: string,
) {
  if (!normalizedQuery) {
    return true;
  }

  const gid = tileset.firstGid + tile.localId;
  return (
    tile.name.toLowerCase().includes(normalizedQuery) ||
    tile.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery)) ||
    String(gid).includes(normalizedQuery)
  );
}

function tilesetAtlasStyle(tileset: TilesetRef): CSSProperties {
  return {
    aspectRatio: `${tileset.imageWidth} / ${tileset.imageHeight}`,
    backgroundImage: `url(${tileset.image})`,
    gridTemplateColumns: `repeat(${tileset.columns}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${Math.ceil(tileset.tileCount / tileset.columns)}, minmax(0, 1fr))`,
    imageRendering: "pixelated",
  };
}

function tilePreviewStyle(
  tileset: TilesetRef,
  tile: TilesetTile,
): CSSProperties {
  const column = tile.localId % tileset.columns;
  const row = Math.floor(tile.localId / tileset.columns);
  const rows = Math.ceil(tileset.tileCount / tileset.columns);

  return {
    backgroundImage: `url(${tileset.image})`,
    backgroundPosition: `${backgroundPositionPercent(column, tileset.columns)}% ${backgroundPositionPercent(row, rows)}%`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${tileset.columns * 100}% ${rows * 100}%`,
    imageRendering: "pixelated",
  };
}

function terrainPreviewStyle(
  tilesets: TilesetRef[],
  material: TerrainMaterialDefinition,
): CSSProperties {
  const tileset = tilesets.find(
    (candidate) => candidate.id === material.previewTilesetId,
  );
  const tile = tileset?.tiles.find(
    (candidate) => candidate.localId === material.previewLocalId,
  );

  if (!tileset || !tile) {
    return { backgroundImage: "none" };
  }

  const previewMode =
    material.previewMode ?? (tileset.kind === "wang" ? "atlas" : "tile");

  if (previewMode === "atlas") {
    return tilesetAtlasPreviewStyle(tileset);
  }

  return tilePreviewStyle(tileset, tile);
}

function terrainTitle(
  tilesets: TilesetRef[],
  material: TerrainMaterialDefinition,
) {
  const sourceTileset = tilesets.find(
    (tileset) => tileset.id === material.sourceTilesetId,
  );
  const linkedTilesetNames = material.linkedTilesetIds
    .map(
      (tilesetId) =>
        tilesets.find((tileset) => tileset.id === tilesetId)?.name ?? tilesetId,
    )
    .join(", ");

  return [
    `${material.name} - ${material.description}`,
    `Source: ${sourceTileset?.name ?? material.sourceTilesetId} ${material.sourceRole} tile #${material.sourceLocalId}`,
    `Transitions: ${linkedTilesetNames}`,
  ].join("\n");
}

function tilesetAtlasPreviewStyle(tileset: TilesetRef): CSSProperties {
  return {
    backgroundImage: `url(${tileset.image})`,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% 100%",
    imageRendering: "pixelated",
  };
}

function backgroundPositionPercent(index: number, count: number) {
  return count <= 1 ? 0 : (index / (count - 1)) * 100;
}
