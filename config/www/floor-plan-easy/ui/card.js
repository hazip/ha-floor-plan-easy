import { BaseApp } from "./base-app.js";

export class FloorPlanEasyCard extends BaseApp {

  async setConfig(config) {
    this.config = config;
    this._loadFloor();
    this._queueRender();
  }

  set hass(hass) {
    this._hass = hass;
    this._loadFloor();
    this._queueRender();
  }

  async _loadFloor() {
    if (!this._hass || !this.config?.floor_id) return;

    await this.loadFloor(this.config.floor_id);
  }

  _get_html_template() {
    return `
    <ha-card>
        <div style="padding:16px; text-align:center; opacity:0.6;"class="window-title"></div>
        <div class="floor-grid"></div>
    </ha-card>
    `;
  }

  _gridClickHandler(row, col, tile) {
    console.log("VIEWER", row, col, tile);

    if (tile?.content) {
      this._performTapAction(tile.content);
    }
  }

  _performTapAction(content) {

    const entityId = content.entity;
    const action = content.tapAction;
    if (!entityId || !this._hass) return;

    if (action === "none") return;

    if (action === "toggle") {
      this._hass.callService("homeassistant", "toggle", { entity_id: entityId });
      return;
    }

    if (action === "more-info") {
      const ev = new CustomEvent("hass-more-info", {
        detail: { entityId },
        bubbles: true,
        composed: true,
      });
      this._container.dispatchEvent(ev);
      return;
    }
  }

  static getConfigElement() {
    return document.createElement("floor-plan-easy-config");
  }

  static getStubConfig() {
    return {
      floor_id: "ground"
    };
  }

  getCardSize() {
    return 1;
  }
}
