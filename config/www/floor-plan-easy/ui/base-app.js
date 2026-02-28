import { Floor } from "../model/floor.js";
import { FloorRenderer } from "./floor-renderer.js";
import { ensureStyles } from "./styles.js";

export class BaseApp extends HTMLElement {

  constructor() {
    super();
    this._renderQueued = false;
    this._container = null;
    this._renderer = null;
    this._resizeObserver = null;
    this.floor = null;
  }

  connectedCallback() {
    ensureStyles(this);

    this._resizeObserver = new ResizeObserver(() => this._queueRender());
    this._resizeObserver.observe(this);

    this._queueRender();
  }

  disconnectedCallback() {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
  }

  setConfig(config) {
    this.config = config;
    this._queueRender();
  }

  set hass(hass) {
    this._hass = hass;
    this._queueRender();
  }
  
  _queueRender() {
    if (this._renderQueued) return;
    this._renderQueued = true;

    requestAnimationFrame(() => {
      this._renderQueued = false;
      this._doRender();
    });
  }

  _get_html_template() {
    return `
    <ha-card>
        <div style="padding:16px; text-align:center; opacity:0.6;" class="window-title">WINDOW TITLE</div>
        <div class="floor-grid"></div>
    </ha-card>
    `;
  }

  _gridClickHandler(row, col, tile) {
    console.log("Tile clicked: ", row, col, tile);
  }

  _getMode() {
    return "view";
  }

  async _doRender() {
    
    if (!this.isConnected) return;

    if (!this._container) {
      this.innerHTML = this._get_html_template();

      this._container = this.querySelector(".floor-grid");

      this._renderer = new FloorRenderer({
        container: this._container,
        mode: this._getMode(),
        onTileClick: ({ row, col, tile }) => {
          this._gridClickHandler(row, col, tile)
        },
        hass: this._hass
      });
    }

    if (this._container.clientWidth === 0) {
      this._queueRender();
      return;
    }

    this.updateWindowTitle();

    this._renderer?.render?.(this.floor);
  }

  updateWindowTitle() {
    const title = this.querySelector(".window-title");

    if (title) {
      title.innerHTML = (this.floor?.name ?? "EMPTY PROJECT") + " - FloorPlan Easy";
    }
  }

  newFloor() {
    this.floor = new Floor({
      id: "unnamed",
      version: 1,
      name: "unnamed",
      gridWidth: 4,
      gridHeight: 4,
      tiles: [],
    });

    this.updateWindowTitle();

    this._renderer?.render?.(this.floor);
  }

  addTiles(direction) {
    switch (direction) {
      case "TOP":
        this.floor.addRowTop();
        break;
      case "BOTTOM":
        this.floor.addRowBottom();
        break;
      case "LEFT":
        this.floor.addColumnLeft();
        break;
      case "RIGHT":
        this.floor.addColumnRight();
        break;
    }

    this._renderer?.render?.(this.floor);
  }

  async loadFloor(floor_id) {
    const resp = await this._hass.callWS({
      type: "floor_plan_easy/get_floor",
      floor_id: floor_id,
    });
    
    this.floor = new Floor(resp.data);

    this.updateWindowTitle();

    this._renderer?.render?.(this.floor);
  }
}
