import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { GridCoordinate, ViewportState } from "../model/coordinates";
import {
  clampZoom,
  isInsideMap,
  screenToWorld,
  type WorldPoint,
} from "../model/coordinates";
import type { MapDocument } from "../model/mapDocument";
import type { PaintSource, StampBrush } from "../model/brush";
import type { EditorTool } from "../canvas/tools/editorTool";
import { clientToCanvasPoint, clientToGridCell } from "../canvas/leafer/coordinateMapper";
import {
  createLeaferStage,
  type TileMapLeaferStage,
} from "../canvas/leafer/createLeaferStage";
import { disposeLeaferStage } from "../canvas/leafer/disposeLeaferStage";
import { renderGrid } from "../canvas/leafer/gridRenderer";
import {
  renderSelection,
  type SelectionPreview,
} from "../canvas/leafer/selectionRenderer";
import { renderTileLayers } from "../canvas/leafer/tileLayerRenderer";
import { applyViewportToStage } from "../canvas/leafer/viewportController";

interface TileCanvasProps {
  mapDocument: MapDocument;
  activeTool: EditorTool;
  selectedStamp?: StampBrush;
  paintSource: PaintSource;
  brushSize: number;
  selectionFill?: string;
  hoverCell?: GridCoordinate;
  onPaint: (cell: GridCoordinate) => void;
  onPaintRect: (start: GridCoordinate, end: GridCoordinate) => void;
  onPaintStamp: (anchor: GridCoordinate) => void;
  onErase: (cell: GridCoordinate) => void;
  onPick: (cell: GridCoordinate) => void;
  onHoverCell: (cell?: GridCoordinate) => void;
  onViewportChange: (viewport: ViewportState) => void;
}

type DragMode = "brush" | "terrain" | "rect-fill" | "eraser" | "pan";

interface DragState {
  mode: DragMode;
  lastCellKey?: string;
  rectStart?: GridCoordinate;
  rectEnd?: GridCoordinate;
  panStart?: {
    point: WorldPoint;
    viewport: ViewportState;
  };
}

function cellKey(cell: GridCoordinate) {
  return `${cell.column}:${cell.row}`;
}

export function TileCanvas({
  mapDocument,
  activeTool,
  selectedStamp,
  paintSource,
  brushSize,
  selectionFill,
  hoverCell,
  onPaint,
  onPaintRect,
  onPaintStamp,
  onErase,
  onPick,
  onHoverCell,
  onViewportChange,
}: TileCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<TileMapLeaferStage | null>(null);
  const dragRef = useRef<DragState | undefined>(undefined);
  const mapDocumentRef = useRef(mapDocument);
  const activeToolRef = useRef(activeTool);
  const viewportRef = useRef(mapDocument.editor.viewport);
  const [stageReady, setStageReady] = useState(false);
  const [rectPreview, setRectPreview] = useState<
    { start: GridCoordinate; end: GridCoordinate } | undefined
  >();
  const selectionPreview = useMemo<SelectionPreview | undefined>(() => {
    if (activeTool === "rect-fill" && rectPreview) {
      return {
        kind: "rect",
        start: rectPreview.start,
        end: rectPreview.end,
        fill: paintSource === "terrain" ? selectionFill : undefined,
      };
    }

    if (activeTool === "stamp") {
      return {
        kind: "stamp",
        anchor: hoverCell,
        stamp: selectedStamp,
      };
    }

    return {
      kind: "brush",
      cell: hoverCell,
      fill: selectionFill,
      brushSize,
    };
  }, [
    activeTool,
    brushSize,
    hoverCell,
    paintSource,
    rectPreview,
    selectedStamp,
    selectionFill,
  ]);

  useEffect(() => {
    mapDocumentRef.current = mapDocument;
    viewportRef.current = mapDocument.editor.viewport;
  }, [mapDocument]);

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const stage = createLeaferStage(container);
    stageRef.current = stage;
    setStageReady(true);

    const resizeObserver = new ResizeObserver(([entry]) => {
      stage.leafer.resize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      disposeLeaferStage(stage);
      stageRef.current = null;
      setStageReady(false);
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !stageReady) {
      return;
    }

    renderGrid(stage, mapDocument);
  }, [mapDocument.size, mapDocument.tileSize, stageReady]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !stageReady) {
      return;
    }

    renderTileLayers(stage, mapDocument);
  }, [mapDocument.layers, mapDocument.size, mapDocument.tileSize, mapDocument.tilesets, stageReady]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !stageReady) {
      return;
    }

    renderSelection(
      stage,
      mapDocument,
      selectionPreview,
    );
  }, [
    mapDocument.size,
    mapDocument.tileSize,
    mapDocument.tilesets,
    mapDocument.editor.missingTransitionCells,
    selectionPreview,
    stageReady,
  ]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !stageReady) {
      return;
    }

    applyViewportToStage(stage, mapDocument.editor.viewport);
  }, [mapDocument.editor.viewport, stageReady]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const applyCellAction = (
      cell: GridCoordinate,
      mode: "brush" | "terrain" | "eraser" | "picker",
    ) => {
      const currentMap = mapDocumentRef.current;
      if (!isInsideMap(cell, currentMap.size)) {
        return;
      }

      if (mode === "brush" || mode === "terrain") {
        onPaint(cell);
      } else if (mode === "eraser") {
        onErase(cell);
      } else {
        onPick(cell);
      }
    };

    const updateHover = (event: PointerEvent) => {
      const currentMap = mapDocumentRef.current;
      const cell = clientToGridCell(
        event.clientX,
        event.clientY,
        container,
        viewportRef.current,
        currentMap,
      );

      onHoverCell(isInsideMap(cell, currentMap.size) ? cell : undefined);
      return cell;
    };

    const handlePointerDown = (event: PointerEvent) => {
      container.setPointerCapture(event.pointerId);
      const screenPoint = clientToCanvasPoint(event.clientX, event.clientY, container);
      const currentTool = activeToolRef.current;

      if (event.button === 1 || currentTool === "pan") {
        event.preventDefault();
        dragRef.current = {
          mode: "pan",
          panStart: {
            point: screenPoint,
            viewport: viewportRef.current,
          },
        };
        container.dataset.dragging = "true";
        return;
      }

      if (event.button !== 0) {
        return;
      }

      const cell = updateHover(event);
      if (currentTool === "picker") {
        applyCellAction(cell, "picker");
        return;
      }

      if (
        currentTool === "brush" ||
        currentTool === "terrain" ||
        currentTool === "rect-fill" ||
        currentTool === "eraser"
      ) {
        if (currentTool === "rect-fill") {
          if (!isInsideMap(cell, mapDocumentRef.current.size)) {
            return;
          }

          dragRef.current = {
            mode: "rect-fill",
            rectStart: cell,
            rectEnd: cell,
          };
          setRectPreview({ start: cell, end: cell });
          container.dataset.dragging = "true";
          return;
        }

        applyCellAction(cell, currentTool);
        dragRef.current = {
          mode: currentTool,
          lastCellKey: cellKey(cell),
        };
        container.dataset.dragging = "true";
        return;
      }

      if (currentTool === "stamp") {
        if (isInsideMap(cell, mapDocumentRef.current.size)) {
          onPaintStamp(cell);
        }
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;

      if (drag?.mode === "pan" && drag.panStart) {
        const point = clientToCanvasPoint(event.clientX, event.clientY, container);
        const nextViewport = {
          ...drag.panStart.viewport,
          x: drag.panStart.viewport.x + point.x - drag.panStart.point.x,
          y: drag.panStart.viewport.y + point.y - drag.panStart.point.y,
        };

        viewportRef.current = nextViewport;
        onViewportChange(nextViewport);
        return;
      }

      const cell = updateHover(event);
      if (!drag || drag.mode === "pan") {
        return;
      }

      if (drag.mode === "rect-fill") {
        drag.rectEnd = cell;
        if (drag.rectStart) {
          setRectPreview({ start: drag.rectStart, end: cell });
        }
        return;
      }

      const nextKey = cellKey(cell);
      if (drag.lastCellKey === nextKey) {
        return;
      }

      applyCellAction(cell, drag.mode);
      drag.lastCellKey = nextKey;
    };

    const handlePointerUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (drag?.mode === "rect-fill" && drag.rectStart && drag.rectEnd) {
        onPaintRect(drag.rectStart, drag.rectEnd);
      }

      container.releasePointerCapture(event.pointerId);
      dragRef.current = undefined;
      setRectPreview(undefined);
      delete container.dataset.dragging;
    };

    const handlePointerLeave = () => {
      onHoverCell(undefined);
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const screenPoint = clientToCanvasPoint(event.clientX, event.clientY, container);
      const currentViewport = viewportRef.current;
      const worldPoint = screenToWorld(screenPoint, currentViewport);
      const zoomFactor = event.deltaY < 0 ? 1.12 : 0.88;
      const nextZoom = clampZoom(currentViewport.zoom * zoomFactor);
      const nextViewport = {
        x: screenPoint.x - worldPoint.x * nextZoom,
        y: screenPoint.y - worldPoint.y * nextZoom,
        zoom: nextZoom,
      };

      viewportRef.current = nextViewport;
      onViewportChange(nextViewport);
    };

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", handlePointerUp);
    container.addEventListener("pointercancel", handlePointerUp);
    container.addEventListener("pointerleave", handlePointerLeave);
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", handlePointerUp);
      container.removeEventListener("pointercancel", handlePointerUp);
      container.removeEventListener("pointerleave", handlePointerLeave);
      container.removeEventListener("wheel", handleWheel);
    };
  }, [
    onErase,
    onHoverCell,
    onPaint,
    onPaintRect,
    onPaintStamp,
    onPick,
    onViewportChange,
  ]);

  return <div ref={containerRef} className="tile-canvas" />;
}
