import { describe, expect, it } from "vitest";
import {
  createStampBrushFromSelection,
  pickRandomGid,
  stampPlacementsAt,
} from "../model/brush";
import { tinyTownTileset } from "../model/mapDocument";

describe("brush helpers", () => {
  it("creates a rectangular stamp from an atlas selection", () => {
    const stamp = createStampBrushFromSelection(tinyTownTileset, 0, 13);

    expect(stamp).toMatchObject({
      sourceTilesetId: "kenney-tiny-town",
      width: 2,
      height: 2,
    });
    expect(stamp.cells).toEqual([
      { dx: 0, dy: 0, gid: 1 },
      { dx: 1, dy: 0, gid: 2 },
      { dx: 0, dy: 1, gid: 13 },
      { dx: 1, dy: 1, gid: 14 },
    ]);
  });

  it("clips stamp placement at map edges", () => {
    const stamp = createStampBrushFromSelection(tinyTownTileset, 0, 13);
    const placements = stampPlacementsAt(
      stamp,
      { column: 55, row: 31 },
      { columns: 56, rows: 32 },
    );

    expect(placements).toEqual([
      { cell: { column: 55, row: 31 }, gid: 1 },
    ]);
  });

  it("avoids the current gid when another random candidate is available", () => {
    expect(pickRandomGid([4, 5, 6], 5, () => 0)).toBe(4);
    expect(pickRandomGid([4, 5, 6], 5, () => 0.99)).toBe(6);
  });
});
