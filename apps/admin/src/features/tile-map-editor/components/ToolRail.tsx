import { Eraser, Grid3X3, Hand, Paintbrush, Pipette } from "lucide-react";
import type { EditorTool } from "../canvas/tools/editorTool";

interface ToolRailProps {
  activeTool: EditorTool;
  onToolSelect: (tool: EditorTool) => void;
}

const tools: Array<{
  tool: EditorTool;
  label: string;
  icon: typeof Paintbrush;
}> = [
  { tool: "brush", label: "Brush", icon: Paintbrush },
  { tool: "terrain", label: "Terrain", icon: Grid3X3 },
  { tool: "eraser", label: "Eraser", icon: Eraser },
  { tool: "picker", label: "Picker", icon: Pipette },
  { tool: "pan", label: "Pan", icon: Hand },
];

export function ToolRail({ activeTool, onToolSelect }: ToolRailProps) {
  return (
    <nav className="tool-rail" aria-label="Editor tools">
      {tools.map(({ tool, label, icon: Icon }) => (
        <button
          key={tool}
          className="rail-tool-button"
          type="button"
          data-active={activeTool === tool}
          aria-label={label}
          title={label}
          onClick={() => onToolSelect(tool)}
        >
          <Icon aria-hidden="true" size={19} />
        </button>
      ))}
    </nav>
  );
}
