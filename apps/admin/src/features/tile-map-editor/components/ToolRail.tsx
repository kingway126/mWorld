import {
  BoxSelect,
  Eraser,
  Grid3X3,
  Hand,
  Paintbrush,
  Pipette,
  Stamp,
} from "lucide-react";
import type { EditorTool } from "../canvas/tools/editorTool";

interface ToolRailProps {
  activeTool: EditorTool;
  hasStamp: boolean;
  onToolSelect: (tool: EditorTool) => void;
}

const tools: Array<{
  tool: EditorTool;
  label: string;
  icon: typeof Paintbrush;
}> = [
  { tool: "brush", label: "Brush", icon: Paintbrush },
  { tool: "terrain", label: "Terrain", icon: Grid3X3 },
  { tool: "rect-fill", label: "Rect Fill", icon: BoxSelect },
  { tool: "stamp", label: "Stamp", icon: Stamp },
  { tool: "eraser", label: "Eraser", icon: Eraser },
  { tool: "picker", label: "Picker", icon: Pipette },
  { tool: "pan", label: "Pan", icon: Hand },
];

export function ToolRail({
  activeTool,
  hasStamp,
  onToolSelect,
}: ToolRailProps) {
  return (
    <nav className="tool-rail" aria-label="Editor tools">
      {tools.map(({ tool, label, icon: Icon }) => {
        const disabled = tool === "stamp" && !hasStamp;

        return (
          <button
            key={tool}
            className="rail-tool-button"
            type="button"
            data-active={activeTool === tool}
            aria-label={label}
            title={
              disabled
                ? "Drag over tiles in the atlas to create a stamp"
                : label
            }
            disabled={disabled}
            onClick={() => onToolSelect(tool)}
          >
            <Icon aria-hidden="true" size={19} />
          </button>
        );
      })}
    </nav>
  );
}
