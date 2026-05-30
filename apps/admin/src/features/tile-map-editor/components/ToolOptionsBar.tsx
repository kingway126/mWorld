import { Grid3X3, Magnet } from "lucide-react";
import type { EditorTool } from "../canvas/tools/editorTool";
import type { ViewportState } from "../model/coordinates";

interface ToolOptionsBarProps {
  activeTool: EditorTool;
  viewport: ViewportState;
}

const toolLabels: Record<EditorTool, string> = {
  brush: "Brush",
  eraser: "Eraser",
  picker: "Picker",
  pan: "Pan",
};

export function ToolOptionsBar({ activeTool, viewport }: ToolOptionsBarProps) {
  return (
    <div className="tool-options-bar">
      <div className="option-section option-section-primary">
        <span className="option-label">Mode</span>
        <strong>{toolLabels[activeTool]}</strong>
      </div>

      <div className="option-section">
        <span className="option-label">Brush</span>
        <div className="brush-size-pill" aria-label="Brush size">
          <span>1 tile</span>
        </div>
      </div>

      <div className="option-section option-toggles">
        <span className="option-indicator" data-active="true">
          <Grid3X3 aria-hidden="true" size={15} />
          Grid
        </span>
        <span className="option-indicator" data-active="true">
          <Magnet aria-hidden="true" size={15} />
          Snap
        </span>
      </div>

      <div className="option-section option-section-trailing">
        <span className="option-label">Zoom</span>
        <strong>{Math.round(viewport.zoom * 100)}%</strong>
      </div>
    </div>
  );
}
