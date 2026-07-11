// Shared base for single-SVG overlay layers (walls, objects): an inline SVG
// string plus an optional stroke color, round-tripped through toJSON. Subclasses
// (TileWall, TileObject) exist only to name the layer; the shape is identical.
export class TileSvgLayer {
  constructor({
    svg = null,
    strokeColor = null
  } = {}) {
    this.svg = svg;
    this.strokeColor = strokeColor;
  }

  toJSON() {
    return {
      svg: this.svg,
      strokeColor: this.strokeColor
    };
  }
}
