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
  { tool: "brush", label: "图块画笔", icon: Paintbrush },
  { tool: "terrain", label: "地形画笔", icon: Grid3X3 },
  { tool: "rect-fill", label: "矩形填充", icon: BoxSelect },
  { tool: "stamp", label: "图章", icon: Stamp },
  { tool: "eraser", label: "橡皮擦", icon: Eraser },
  { tool: "picker", label: "吸管", icon: Pipette },
  { tool: "pan", label: "平移", icon: Hand },
];

export function ToolRail({
  activeTool,
  hasStamp,
  onToolSelect,
}: ToolRailProps) {
  return (
    <nav className="tool-rail" aria-label="编辑工具">
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
                ? "在图块集中拖拽选择区域后可使用图章"
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
