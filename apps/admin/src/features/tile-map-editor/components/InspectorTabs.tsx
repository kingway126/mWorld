import { Box, Layers3, Map, Settings2 } from "lucide-react";
import { useState } from "react";
import type { MapDocument } from "../model/mapDocument";
import { InspectorPanel } from "./InspectorPanel";
import { LayerPanel } from "./LayerPanel";

type InspectorTab = "layers" | "tile" | "map" | "export";

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
  { id: "layers", label: "Layers", icon: Layers3 },
  { id: "tile", label: "Tile", icon: Box },
  { id: "map", label: "Map", icon: Map },
  { id: "export", label: "Export", icon: Settings2 },
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
          <h2>Inspector</h2>
          <span>Document properties</span>
        </div>
      </div>

      <div className="inspector-tabs" role="tablist" aria-label="Inspector tabs">
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

        {activeTab !== "layers" && (
          <InspectorPanel mapDocument={mapDocument} selectedGid={selectedGid} />
        )}
      </div>
    </aside>
  );
}
