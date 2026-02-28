export class TileWall {
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
