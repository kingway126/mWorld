import { Plus, Search, X } from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import {
  createStampBrushFromSelection,
  type StampBrush,
} from "../model/brush";
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
  selectedStamp?: StampBrush;
  randomCandidateGids: number[];
  onSelectGid: (gid: number) => void;
  onSelectTerrain: (terrainId: string) => void;
  onSelectStamp: (stamp: StampBrush) => void;
  onAddRandomCandidate: (gid: number) => void;
  onRemoveRandomCandidate: (gid: number) => void;
  onClearRandomCandidates: () => void;
}

type AssetMode = "terrains" | "tiles";

interface StampDraft {
  tilesetId: string;
  pointerId: number;
  startLocalId: number;
  currentLocalId: number;
}

interface TileLookupEntry {
  gid: number;
  name: string;
  tile: TilesetTile;
  tileset: string;
  tilesetRef: TilesetRef;
}

export function AssetBrowserPanel({
  tilesets,
  terrainMaterials,
  selectedGid,
  selectedTerrainId,
  selectedStamp,
  randomCandidateGids,
  onSelectGid,
  onSelectTerrain,
  onSelectStamp,
  onAddRandomCandidate,
  onRemoveRandomCandidate,
  onClearRandomCandidates,
}: AssetBrowserPanelProps) {
  const [query, setQuery] = useState("");
  const [assetMode, setAssetMode] = useState<AssetMode>("terrains");
  const [stampDraft, setStampDraft] = useState<StampDraft>();
  const stampDraftRef = useRef<StampDraft | undefined>(undefined);
  const lastStampDragRef = useRef(false);
  const normalizedQuery = query.trim().toLowerCase();
  const tileLookup = useMemo(() => {
    const lookup = new Map<number, TileLookupEntry>();

    for (const tileset of tilesets) {
      for (const tile of tileset.tiles) {
        const gid = tileset.firstGid + tile.localId;
        lookup.set(gid, {
          gid,
          name: tile.name,
          tile,
          tileset: tileset.name,
          tilesetRef: tileset,
        });
      }
    }

    return lookup;
  }, [tilesets]);
  const selectedTile = tileLookup.get(selectedGid);
  const selectedTerrain = terrainMaterials.find(
    (material) => material.id === selectedTerrainId,
  );
  const randomCandidates = useMemo(
    () =>
      randomCandidateGids
        .map((gid) => tileLookup.get(gid))
        .filter((candidate): candidate is TileLookupEntry =>
          Boolean(candidate),
        ),
    [randomCandidateGids, tileLookup],
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
          visibleTilesets.map((tileset) => {
            const stampLocalIds = highlightedStampLocalIds(
              tileset,
              selectedStamp,
              stampDraft,
            );

            return (
              <section className="asset-section" key={tileset.id}>
                <div className="asset-section-title">
                  <span>{tileset.name}</span>
                  <span>{tileset.visibleTileCount}</span>
                </div>
                <div
                  className="tileset-atlas"
                  style={tilesetAtlasStyle(tileset)}
                  onPointerDown={(event) =>
                    handleAtlasPointerDown(event, tileset)
                  }
                  onPointerMove={(event) =>
                    handleAtlasPointerMove(event, tileset)
                  }
                  onPointerUp={(event) => handleAtlasPointerUp(event, tileset)}
                  onPointerCancel={(event) =>
                    handleAtlasPointerCancel(event.currentTarget)
                  }
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
                        data-in-stamp={stampLocalIds.has(tile.localId)}
                        disabled={isFilteredOut}
                        key={tile.localId}
                        type="button"
                        title={`${tile.name} - GID ${gid}`}
                        aria-label={tile.name}
                        onClick={(event) => {
                          if (lastStampDragRef.current) {
                            event.preventDefault();
                            lastStampDragRef.current = false;
                            return;
                          }

                          onSelectGid(gid);
                        }}
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
            );
          })}
      </div>

      <div className="asset-workset">
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

        {selectedStamp && (
          <section className="stamp-preview-card">
            <div className="asset-section-title">
              <span>Stamp</span>
              <span>
                {selectedStamp.width} x {selectedStamp.height}
              </span>
            </div>
            <div
              className="stamp-preview-grid"
              style={{
                gridTemplateColumns: `repeat(${selectedStamp.width}, minmax(0, 1fr))`,
              }}
            >
              {selectedStamp.cells.map((cell) => (
                <span
                  key={`${cell.dx}:${cell.dy}:${cell.gid}`}
                  style={{
                    ...gidPreviewStyle(tilesets, cell.gid),
                    gridColumn: cell.dx + 1,
                    gridRow: cell.dy + 1,
                  }}
                />
              ))}
            </div>
          </section>
        )}

        <section className="random-set-card">
          <div className="asset-section-title">
            <span>Random Set</span>
            <span>{randomCandidates.length}</span>
          </div>
          <div className="random-set-actions">
            <button
              className="mini-command-button"
              type="button"
              disabled={!selectedTile}
              onClick={() => selectedTile && onAddRandomCandidate(selectedTile.gid)}
            >
              <Plus aria-hidden="true" size={14} />
              Add
            </button>
            <button
              className="mini-icon-button"
              type="button"
              title="Clear random set"
              aria-label="Clear random set"
              disabled={randomCandidates.length === 0}
              onClick={onClearRandomCandidates}
            >
              <X aria-hidden="true" size={14} />
            </button>
          </div>
          <div className="random-chip-list">
            {randomCandidates.map((candidate) => (
              <button
                className="random-chip"
                key={candidate.gid}
                type="button"
                title={`Remove GID ${candidate.gid}`}
                onClick={() => onRemoveRandomCandidate(candidate.gid)}
              >
                <span
                  style={tilePreviewStyle(candidate.tilesetRef, candidate.tile)}
                />
                <strong>{candidate.gid}</strong>
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );

  function handleAtlasPointerDown(
    event: PointerEvent<HTMLDivElement>,
    tileset: TilesetRef,
  ) {
    if (event.button !== 0) {
      return;
    }

    const localId = localIdFromPointer(event, tileset);
    if (localId === undefined) {
      return;
    }

    const draft = {
      tilesetId: tileset.id,
      pointerId: event.pointerId,
      startLocalId: localId,
      currentLocalId: localId,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    stampDraftRef.current = draft;
    lastStampDragRef.current = false;
    setStampDraft(draft);
  }

  function handleAtlasPointerMove(
    event: PointerEvent<HTMLDivElement>,
    tileset: TilesetRef,
  ) {
    const draft = stampDraftRef.current;
    if (!draft || draft.tilesetId !== tileset.id || draft.pointerId !== event.pointerId) {
      return;
    }

    const localId = localIdFromPointer(event, tileset);
    if (localId === undefined || localId === draft.currentLocalId) {
      return;
    }

    const nextDraft = { ...draft, currentLocalId: localId };
    stampDraftRef.current = nextDraft;
    lastStampDragRef.current = localId !== draft.startLocalId;
    setStampDraft(nextDraft);
  }

  function handleAtlasPointerUp(
    event: PointerEvent<HTMLDivElement>,
    tileset: TilesetRef,
  ) {
    const draft = stampDraftRef.current;
    if (!draft || draft.tilesetId !== tileset.id || draft.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    stampDraftRef.current = undefined;
    setStampDraft(undefined);

    if (draft.startLocalId === draft.currentLocalId) {
      onSelectGid(tileset.firstGid + draft.startLocalId);
      return;
    }

    const stamp = createStampBrushFromSelection(
      tileset,
      draft.startLocalId,
      draft.currentLocalId,
    );
    if (stamp.cells.length > 1) {
      lastStampDragRef.current = true;
      onSelectStamp(stamp);
    }
  }

  function handleAtlasPointerCancel(element: HTMLDivElement) {
    const draft = stampDraftRef.current;
    if (draft && element.hasPointerCapture(draft.pointerId)) {
      element.releasePointerCapture(draft.pointerId);
    }

    stampDraftRef.current = undefined;
    setStampDraft(undefined);
  }
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

function localIdFromPointer(
  event: PointerEvent<HTMLDivElement>,
  tileset: TilesetRef,
) {
  const rect = event.currentTarget.getBoundingClientRect();
  const rows = Math.ceil(tileset.tileCount / tileset.columns);
  const column = Math.floor(
    ((event.clientX - rect.left) / rect.width) * tileset.columns,
  );
  const row = Math.floor(((event.clientY - rect.top) / rect.height) * rows);
  const localId = row * tileset.columns + column;

  if (
    column < 0 ||
    column >= tileset.columns ||
    row < 0 ||
    row >= rows ||
    localId < 0 ||
    localId >= tileset.tileCount
  ) {
    return undefined;
  }

  return localId;
}

function highlightedStampLocalIds(
  tileset: TilesetRef,
  selectedStamp?: StampBrush,
  stampDraft?: StampDraft,
) {
  if (stampDraft?.tilesetId === tileset.id) {
    const stamp = createStampBrushFromSelection(
      tileset,
      stampDraft.startLocalId,
      stampDraft.currentLocalId,
    );

    return new Set(stamp.cells.map((cell) => cell.gid - tileset.firstGid));
  }

  if (selectedStamp?.sourceTilesetId !== tileset.id) {
    return new Set<number>();
  }

  return new Set(selectedStamp.cells.map((cell) => cell.gid - tileset.firstGid));
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

function gidPreviewStyle(
  tilesets: TilesetRef[],
  gid: number,
): CSSProperties {
  const match = tilesets
    .flatMap((tileset) =>
      tileset.tiles.map((tile) => ({
        gid: tileset.firstGid + tile.localId,
        tile,
        tileset,
      })),
    )
    .find((candidate) => candidate.gid === gid);

  return match
    ? tilePreviewStyle(match.tileset, match.tile)
    : { backgroundColor: "transparent" };
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
