import type { MapDocument } from "../model/mapDocument";
import { findTileByGid } from "../model/tileset";
import { validateMapDocument } from "../validation/validateMapDocument";

interface InspectorPanelProps {
  mapDocument: MapDocument;
  selectedGid: number;
}

export function InspectorPanel({ mapDocument, selectedGid }: InspectorPanelProps) {
  const selectedTile = findTileByGid(mapDocument.tilesets, selectedGid);
  const activeLayer = mapDocument.layers.find(
    (layer) => layer.id === mapDocument.editor.activeLayerId,
  );
  const issues = validateMapDocument(mapDocument);

  return (
    <section className="side-section" aria-labelledby="inspector-title">
      <div className="section-heading" id="inspector-title">
        Inspector
      </div>

      <dl className="inspector-list">
        <div>
          <dt>Map</dt>
          <dd>{mapDocument.name}</dd>
        </div>
        <div>
          <dt>Size</dt>
          <dd>
            {mapDocument.size.columns} x {mapDocument.size.rows}
          </dd>
        </div>
        <div>
          <dt>Tile</dt>
          <dd>{selectedTile?.tile.name ?? "Empty"}</dd>
        </div>
        <div>
          <dt>Layer</dt>
          <dd>{activeLayer?.name ?? "None"}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{issues.length === 0 ? "Valid" : `${issues.length} issue(s)`}</dd>
        </div>
      </dl>
    </section>
  );
}
