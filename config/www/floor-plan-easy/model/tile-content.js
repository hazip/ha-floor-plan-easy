export class TileContent {
  constructor({
    renderType = "badge",
    icon = null,
    entity = null,
    tapAction = "none"
  } = {}) {
    this.renderType = renderType; // icon, badge
    this.icon = icon;
    this.entity = entity;
    this.tapAction = tapAction; // none, toggle, more-info
  }

  toJSON() {
    return {
      renderType: this.renderType,
      icon: this.icon,
      entity: this.entity,
      tapAction: this.tapAction
    };
  }
}
