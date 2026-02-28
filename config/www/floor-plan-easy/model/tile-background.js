export class TileBackground {
  constructor({
    type = "color",
    color = null,
    svg = null,
    strokeColor = null
  } = {}) {
    this.type = type; // color, pattern

    if (type === "color") {
      this.color = color;
    }

    if (type === "pattern") {
      this.svg = svg;
      this.color = color;
      this.strokeColor = strokeColor;
    }
  }

  toJSON() {
    return {
      type: this.type,
      color: this.color,
      strokeColor: this.strokeColor,
      svg: this.svg,
    };
  }
}
