import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { TilesetRef } from "../model/tileset";

interface AssetBrowserPanelProps {
  tilesets: TilesetRef[];
  selectedGid: number;
  onSelectGid: (gid: number) => void;
}

export function AssetBrowserPanel({
  tilesets,
  selectedGid,
  onSelectGid,
}: AssetBrowserPanelProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const selectedTile = tilesets
    .flatMap((tileset) =>
      tileset.tiles.map((tile) => ({
        gid: tileset.firstGid + tile.localId,
        name: tile.name,
        color: tile.color,
        tileset: tileset.name,
      })),
    )
    .find((tile) => tile.gid === selectedGid);
  const visibleTilesets = useMemo(
    () =>
      tilesets.map((tileset) => ({
        ...tileset,
        tiles: tileset.tiles.filter((tile) => {
          const gid = tileset.firstGid + tile.localId;
          if (!normalizedQuery) {
            return true;
          }

          return (
            tile.name.toLowerCase().includes(normalizedQuery) ||
            String(gid).includes(normalizedQuery)
          );
        }),
      })),
    [normalizedQuery, tilesets],
  );

  return (
    <aside className="asset-browser">
      <div className="panel-header">
        <div>
          <h2>Assets</h2>
          <span>Tileset library / {tilesets[0]?.tileCount ?? 0} tiles</span>
        </div>
      </div>

      <label className="asset-search">
        <Search aria-hidden="true" size={15} />
        <input
          type="search"
          placeholder="Search tiles"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      {visibleTilesets.map((tileset) => (
        <section className="asset-section" key={tileset.id}>
          <div className="asset-section-title">
            <span>{tileset.name}</span>
            <span>{tileset.tiles.length}</span>
          </div>
          <div className="asset-grid">
            {tileset.tiles.map((tile) => {
              const gid = tileset.firstGid + tile.localId;

              return (
                <button
                  className="asset-tile"
                  data-active={selectedGid === gid}
                  key={tile.localId}
                  type="button"
                  title={`${tile.name} - GID ${gid}`}
                  aria-label={tile.name}
                  onClick={() => onSelectGid(gid)}
                >
                  <span
                    className="asset-tile-preview"
                    style={{ backgroundColor: tile.color }}
                  />
                  <span className="asset-tile-id">{gid}</span>
                </button>
              );
            })}
          </div>
          {tileset.tiles.length === 0 && (
            <div className="asset-empty-state">No tiles found</div>
          )}
        </section>
      ))}

      <div className="selected-asset">
        <span
          className="selected-asset-preview"
          style={{ backgroundColor: selectedTile?.color ?? "transparent" }}
        />
        <div>
          <span className="selected-asset-label">Selected tile</span>
          <strong>{selectedTile?.name ?? "Empty"}</strong>
          <span>
            {selectedTile ? `${selectedTile.tileset} / GID ${selectedTile.gid}` : "No tile"}
          </span>
        </div>
      </div>
    </aside>
  );
}
