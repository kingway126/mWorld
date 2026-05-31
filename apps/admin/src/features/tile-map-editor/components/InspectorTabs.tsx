import { Layers3, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import type { MapDocument } from "../model/mapDocument";
import { InspectorPanel } from "./InspectorPanel";
import { LayerPanel } from "./LayerPanel";

type InspectorTab = "layers" | "properties";

interface InspectorTabsProps {
  mapDocument: MapDocument;
  selectedGid: number;
  onSelectLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
}

const tabs: Array<{
  id: InspectorTab;
  label: string;
  icon: typeof Layers3;
}> = [
  { id: "layers", label: "图层", icon: Layers3 },
  { id: "properties", label: "属性", icon: SlidersHorizontal },
];

export function InspectorTabs({
  mapDocument,
  selectedGid,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
}: InspectorTabsProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>("layers");

  return (
    <aside className="inspector-panel">
      <div className="panel-header">
        <div>
          <h2>属性</h2>
          <span>图层与当前选择</span>
        </div>
      </div>

      <div className="inspector-tabs" role="tablist" aria-label="右侧面板">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            data-active={activeTab === id}
            onClick={() => setActiveTab(id)}
          >
            <Icon aria-hidden="true" size={15} />
            {label}
          </button>
        ))}
      </div>

      <div className="inspector-tab-body">
        {activeTab === "layers" && (
          <LayerPanel
            activeLayerId={mapDocument.editor.activeLayerId}
            layers={mapDocument.layers}
            onSelectLayer={onSelectLayer}
            onToggleLock={onToggleLock}
            onToggleVisibility={onToggleVisibility}
          />
        )}

        {activeTab === "properties" && (
          <InspectorPanel mapDocument={mapDocument} selectedGid={selectedGid} />
        )}
      </div>
    </aside>
  );
}
