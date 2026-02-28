import { TileBackground } from "./tile-background.js";
import { TileContent } from "./tile-content.js";
import { TileWall } from "./tile-wall.js";

export class Tile {
  constructor({
    id,
    row,
    col,
    background = null,
    wall = null,
    content = null
  } = {}) {
    this.id = id || crypto.randomUUID();
    this.row = row;
    this.col = col;

    this.background = background
      ? new TileBackground(background)
      : null;

    this.wall = wall
      ? new TileWall(wall)
      : null;

    this.content = content
      ? new TileContent(content)
      : null;
  }

  toJSON() {
    return {
      id: this.id,
      row: this.row,
      col: this.col,
      background: this.background?.toJSON() || null,
      wall: this.wall?.toJSON() || null,
      content: this.content?.toJSON() || null,
    };
  }
}
