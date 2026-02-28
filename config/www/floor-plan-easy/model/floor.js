import { Tile } from "./tile.js";

export class Floor {
  constructor({
    id,
    version,
    name,
    gridWidth,
    gridHeight,
    tiles = [],
  } = {}) {
    if (!id) {
      throw new Error("Floor must have an id");
    }

    this.id = id; // eg. "ground", "first", "garage"
    this.version = version
    this.name = name || id;
    this.gridWidth = gridWidth || 0;
    this.gridHeight = gridHeight || 0;

    this.tiles = tiles.map(t => new Tile(t));
  }

  getTileAt(row, col) {
    return this.tiles.find(t => t.row === row && t.col === col) || null;
  }

  toJSON() {
    return {
      id: this.id,
      version: this.version,
      name: this.name,
      gridWidth: this.gridWidth,
      gridHeight: this.gridHeight,
      tiles: this.tiles.map(t => t.toJSON()),
    };
  }

  _shiftTiles({ dRow = 0, dCol = 0 } = {}) {
    if (!this.tiles?.length) return;
    for (const t of this.tiles) {
      if (typeof t.row === "number") t.row += dRow;
      if (typeof t.col === "number") t.col += dCol;
    }
  }

  addColumnLeft() {
    this.gridWidth = (this.gridWidth || 0) + 1;
    this._shiftTiles({ dCol: 1 });
  }

  addColumnRight() {
    this.gridWidth = (this.gridWidth || 0) + 1;
  }

  addRowTop() {
    this.gridHeight = (this.gridHeight || 0) + 1;
    this._shiftTiles({ dRow: 1 });
  }

  addRowBottom() {
    this.gridHeight = (this.gridHeight || 0) + 1;
  }

}
