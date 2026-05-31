import { AlertTriangle, Download, Redo2, Undo2 } from "lucide-react";
import type { MapDocument } from "../model/mapDocument";

interface TopAppBarProps {
  mapDocument: MapDocument;
  canUndo: boolean;
  canRedo: boolean;
  issueCount: number;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
}

export function TopAppBar({
  mapDocument,
  canUndo,
  canRedo,
  issueCount,
  onUndo,
  onRedo,
  onExport,
}: TopAppBarProps) {
  return (
    <header className="top-app-bar">
      <div className="top-app-identity">
        <div className="product-mark" aria-hidden="true">
          mw
        </div>
        <div className="document-title-block">
          <span className="workspace-label">mWorld Studio</span>
          <h1>{mapDocument.name}</h1>
          <div className="document-meta">
            <span>正交地图</span>
            <span>
              {mapDocument.size.columns} × {mapDocument.size.rows}
            </span>
            <span>Tiled / Phaser JSON</span>
          </div>
        </div>
      </div>

      <div className="top-app-actions">
        {issueCount > 0 && (
          <span className="top-app-warning" role="status">
            <AlertTriangle aria-hidden="true" size={15} />
            {issueCount} 个问题
          </span>
        )}
        <div className="action-cluster" aria-label="历史操作">
          <button
            className="chrome-icon-button"
            type="button"
            aria-label="撤销"
            title="撤销"
            disabled={!canUndo}
            onClick={onUndo}
          >
            <Undo2 aria-hidden="true" size={17} />
          </button>
          <button
            className="chrome-icon-button"
            type="button"
            aria-label="重做"
            title="重做"
            disabled={!canRedo}
            onClick={onRedo}
          >
            <Redo2 aria-hidden="true" size={17} />
          </button>
        </div>
        <button className="export-button" type="button" onClick={onExport}>
          <Download aria-hidden="true" size={16} />
          导出地图
        </button>
      </div>
    </header>
  );
}
