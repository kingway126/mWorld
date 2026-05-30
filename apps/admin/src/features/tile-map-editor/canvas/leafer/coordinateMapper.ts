import type {
  GridCoordinate,
  ViewportState,
  WorldPoint,
} from "../../model/coordinates";
import { screenToWorld, worldToGrid } from "../../model/coordinates";
import type { MapDocument } from "../../model/mapDocument";

export function clientToCanvasPoint(
  clientX: number,
  clientY: number,
  container: HTMLElement,
): WorldPoint {
  const bounds = container.getBoundingClientRect();

  return {
    x: clientX - bounds.left,
    y: clientY - bounds.top,
  };
}

export function clientToGridCell(
  clientX: number,
  clientY: number,
  container: HTMLElement,
  viewport: ViewportState,
  document: MapDocument,
): GridCoordinate {
  return worldToGrid(
    screenToWorld(clientToCanvasPoint(clientX, clientY, container), viewport),
    document.tileSize,
  );
}
