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
        当前属性
      </div>

      <dl className="inspector-list">
        <div>
          <dt>地图</dt>
          <dd>{mapDocument.name}</dd>
        </div>
        <div>
          <dt>尺寸</dt>
          <dd>
            {mapDocument.size.columns} × {mapDocument.size.rows}
          </dd>
        </div>
        <div>
          <dt>图块</dt>
          <dd>{selectedTile?.tile.name ?? "空"}</dd>
        </div>
        <div>
          <dt>图层</dt>
          <dd>{activeLayer?.name ?? "未选择"}</dd>
        </div>
        <div>
          <dt>状态</dt>
          <dd>{issues.length === 0 ? "正常" : `${issues.length} 个问题`}</dd>
        </div>
      </dl>
    </section>
  );
}
