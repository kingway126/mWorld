import { CheckCircle2, Download, Redo2, Undo2 } from "lucide-react";
import type { MapDocument } from "../model/mapDocument";

interface TopAppBarProps {
  mapDocument: MapDocument;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
}

export function TopAppBar({
  mapDocument,
  canUndo,
  canRedo,
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
            <span>Orthogonal</span>
            <span>
              {mapDocument.size.columns} x {mapDocument.size.rows}
            </span>
            <span>Phaser/Tiled JSON</span>
          </div>
        </div>
      </div>

      <div className="top-app-actions">
        <span className="save-state">
          <CheckCircle2 aria-hidden="true" size={15} />
          Valid
        </span>
        <div className="action-cluster" aria-label="History actions">
          <button
            className="chrome-icon-button"
            type="button"
            aria-label="Undo"
            title="Undo"
            disabled={!canUndo}
            onClick={onUndo}
          >
            <Undo2 aria-hidden="true" size={17} />
          </button>
          <button
            className="chrome-icon-button"
            type="button"
            aria-label="Redo"
            title="Redo"
            disabled={!canRedo}
            onClick={onRedo}
          >
            <Redo2 aria-hidden="true" size={17} />
          </button>
        </div>
        <button className="export-button" type="button" onClick={onExport}>
          <Download aria-hidden="true" size={16} />
          Export JSON
        </button>
      </div>
    </header>
  );
}
