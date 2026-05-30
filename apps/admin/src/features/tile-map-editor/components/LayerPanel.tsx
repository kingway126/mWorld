import { Eye, EyeOff, Lock, Unlock } from "lucide-react";
import type { MapLayer } from "../model/layer";

interface LayerPanelProps {
  layers: MapLayer[];
  activeLayerId: string;
  onSelectLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
}

export function LayerPanel({
  layers,
  activeLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
}: LayerPanelProps) {
  return (
    <section className="side-section" aria-labelledby="layers-title">
      <div className="section-heading" id="layers-title">
        Layers
      </div>

      <div className="layer-list">
        {[...layers].reverse().map((layer) => (
          <div className="layer-row" data-active={activeLayerId === layer.id} key={layer.id}>
            <button
              className="layer-name-button"
              type="button"
              onClick={() => onSelectLayer(layer.id)}
            >
              {layer.name}
            </button>
            <button
              className="mini-icon-button"
              type="button"
              title={layer.visible ? "Hide layer" : "Show layer"}
              aria-label={layer.visible ? "Hide layer" : "Show layer"}
              onClick={() => onToggleVisibility(layer.id)}
            >
              {layer.visible ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
            <button
              className="mini-icon-button"
              type="button"
              title={layer.locked ? "Unlock layer" : "Lock layer"}
              aria-label={layer.locked ? "Unlock layer" : "Lock layer"}
              onClick={() => onToggleLock(layer.id)}
            >
              {layer.locked ? <Lock size={15} /> : <Unlock size={15} />}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
