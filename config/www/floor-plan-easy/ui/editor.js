import { BaseApp } from "./base-app.js";
import { Tile } from "../model/tile.js";
import { TileBackground } from "../model/tile-background.js";
import { TileWall } from "../model/tile-wall.js";
import { BACKGROUND_PATTERNS, WALL_PATTERNS } from "./patterns.js";
import { Toolbar } from "./component/toolbar.js";
import { TileEntityDialog } from "./component/tile-entity-dialog.js";

export class FloorPlanEasyEditor extends BaseApp {

  constructor() {
    super();
    this._toolbarInitialized = false;
    this._toolbar = new Toolbar(this)
    this._tileEntityDialog = new TileEntityDialog();

    // Start from an empty floor; if a floor_id is configured (e.g. opened from
    // the viewer card's "Open editor" button) it is loaded once hass is ready.
    this.newFloor();
  }

  setConfig(config) {
    super.setConfig(config);
    this._maybeLoadConfiguredFloor();
  }

  set hass(hass) {
    this._hass = hass;
    this._maybeLoadConfiguredFloor();
    this._queueRender();
  }

  _maybeLoadConfiguredFloor() {
    const floorId = this.config?.floor_id;
    if (!this._hass || !floorId) return;
    if (floorId === this._loadedFloorId) return;

    this._loadedFloorId = floorId;
    this.loadFloor(floorId);
  }

  _getMode() {
    return "editor";
  }

  _get_html_template() {
    return `
    <ha-card>
        <div style="padding:16px; text-align:center; opacity:0.6;" class="window-title"></div>
        ${this._toolbar.get_html_template()}
        <div class="floor-grid"></div>
    </ha-card>
    `;
  }

  _ensureTile(row, col) {
    let t = this.floor.getTileAt(row, col);
    if (!t) {
      t = new Tile({ row, col });
      this.floor.tiles.push(t);
    }
    return t;
  }

  async _gridClickHandler(row, col, tile) {
    const mode = this._toolbar.editorState.activeMode;

    if (mode === "background_set") {
      if (!tile) {
        tile = this._ensureTile(row, col);
      }
      this._applyBackgroundToTile(tile);
      this._renderFloor();
      return;
    }

    if (mode === "background_clear") {
      if (tile) {
        tile.background = null;
      }
      this._renderFloor();
      return;
    }

    if (mode === "wall_set") {
      if (!tile) {
        tile = this._ensureTile(row, col);
      }
      this._applyWallToTile(tile);
      this._renderFloor();
      return;
    }

    if (mode === "wall_clear") {
      if (tile) {
        tile.wall = null;
      }
      this._renderFloor();
      return;
    }

    if (mode === "content_edit") {
      if (!tile) {
        tile = this._ensureTile(row, col);
      }
      const dialog = await this._tileEntityDialog.open(tile, this._hass);
      dialog.addEventListener("closed", (e) => {
        if (e.target !== dialog) return;
        this._renderFloor();
      });
      return;
    }

    if (mode === "content_clear") {
      if (tile) {
        tile.content = null;
        this._renderFloor();
      }
      return;
    }
  }

  _applyBackgroundToTile(tile) {
    const bgType = this._toolbar.editorState.bg.patternKey ? "pattern" : "color";
    tile.background = new TileBackground({
      type: bgType,
      color: this._toolbar.editorState.bg.bgColor,
      svg: bgType === "pattern" ? BACKGROUND_PATTERNS[this._toolbar.editorState.bg.patternKey] : "",
      strokeColor: this._toolbar.editorState.bg.fgColor
    });
  }

  _applyWallToTile(tile) {
    tile.wall = new TileWall({
      svg: WALL_PATTERNS[this._toolbar.editorState.wall.patternKey],
      strokeColor: this._toolbar.editorState.wall.fgColor
    });
  }

  getCardSize() {
    return 1;
  }

  _doRender() {
    super._doRender();

    if (!this.isConnected) return;

    if (!this._toolbarInitialized) {
      this._toolbar.setupToolbar();
      this._toolbarInitialized = true;
    }

    this._toolbar.updateToolbarActiveState();
  }

}
