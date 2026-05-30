# Admin Tile Map Editor POC

Date: 2026-05-30

## Decision

Build the first tile map editor POC inside `apps/admin` with Leafer.js as the canvas interaction and rendering layer.

The editor output must remain independent from Leafer node structures. The long-term runtime target is Phaser 4, so the first export target is Tiled-compatible JSON that Phaser can load as a tilemap.

## Scope

- Initialize `apps/admin` as a React + TypeScript application.
- Add a tile map editor feature under `apps/admin/src/features/tile-map-editor`.
- Support orthogonal tile maps only.
- Implement a front-end-only editor state for the first iteration.
- Render the editor canvas with Leafer.js.
- Export a Phaser/Tiled-compatible JSON payload.

## Non-goals

- No Portal runtime implementation yet.
- No backend persistence yet.
- No concrete backend bounded context yet.
- No object layer, collision editor, terrain auto-tiling, or infinite map chunks in the first POC.
- No reuse of old project business code.

## Architectural Notes

- `apps/admin` may depend on Leafer.js.
- `apps/portal` must not depend on Admin editor modules or Leafer editor structures.
- Map data is represented by an internal `MapDocument` model.
- Leafer nodes are render artifacts and must be recreated from the document state when needed.
- Exporters convert `MapDocument` into runtime-facing formats.
