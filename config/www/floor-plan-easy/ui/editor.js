import { BaseApp } from "./base-app.js";
import { Floor } from "../model/floor.js";
import { Tile } from "../model/tile.js";
import { TileBackground } from "../model/tile-background.js";
import { TileWall } from "../model/tile-wall.js";
import { BACKGROUND_PATTERNS, WALL_PATTERNS } from "./patterns.js";
import { Toolbar } from "./component/toolbar.js";
import { TileEntityDialog } from "./component/tile-entity-dialog.js";
import { DraftStore } from "../storage/draft-store.js";

export class FloorPlanEasyEditor extends BaseApp {

  constructor() {
    super();
    this._toolbarInitialized = false;
    this._toolbar = new Toolbar(this)
    this._tileEntityDialog = new TileEntityDialog();

    // Serialized form of the last draft written to storage; used to skip
    // redundant writes on passive re-renders (e.g. every hass state tick).
    this._lastSavedDraftJSON = null;

    this._restoreInitialFloor();
  }

  // Recover the working floor after the element is (re)created. Home Assistant
  // rebuilds Lovelace cards after long idle periods / websocket reconnects,
  // which re-runs this constructor and would otherwise wipe the in-memory floor.
  _restoreInitialFloor() {
    const draft = DraftStore.loadDraft();
    if (draft) {
      try {
        this.floor = new Floor(draft);
        this._lastSavedDraftJSON = JSON.stringify(this.floor.toJSON());
        // Remember which floor the draft belongs to so a configured floor_id
        // for the same id does not clobber unsaved edits (see below).
        this._restoredDraftId = this.floor.id;
        this.updateWindowTitle();
        this._renderFloor();
        return;
      } catch (e) {
        console.warn("floor_plan_easy: could not restore draft, discarding", e);
        DraftStore.clearDraft();
      }
    }

    // No usable draft: start empty, but once hass is ready try to re-fetch the
    // last floor that was loaded from the server (fallback recovery).
    this._pendingLastFloorRestore = true;
    this.newFloor();
  }

  setConfig(config) {
    super.setConfig(config);
    this._maybeLoadConfiguredFloor();
  }

  set hass(hass) {
    this._hass = hass;
    this._maybeLoadConfiguredFloor();
    this._maybeRestoreLastFloor();
    this._queueRender();
  }

  _maybeLoadConfiguredFloor() {
    const floorId = this.config?.floor_id;
    if (!this._hass || !floorId) return;
    if (floorId === this._loadedFloorId) return;

    // A restored draft for this same floor may hold unsaved edits — keep it
    // instead of overwriting with the server copy.
    if (floorId === this._restoredDraftId) {
      this._loadedFloorId = floorId;
      this._restoredDraftId = null;
      this._pendingLastFloorRestore = false;
      return;
    }

    this._loadedFloorId = floorId;
    this.loadFloor(floorId);
  }

  // Fallback used only when no draft could be restored and no floor_id is
  // configured: re-fetch a clean copy of the last floor loaded from the server.
  _maybeRestoreLastFloor() {
    if (!this._pendingLastFloorRestore || !this._hass) return;
    this._pendingLastFloorRestore = false;

    if (this.config?.floor_id) return; // configured floor takes precedence

    const lastId = DraftStore.loadLastFloorId();
    if (lastId) this.loadFloor(lastId);
  }

  // Every mutation funnels through _renderFloor(), so persist the working floor
  // here. Redundant writes on passive renders are skipped via a content compare.
  _renderFloor() {
    super._renderFloor();
    this._persistDraft();
  }

  _persistDraft() {
    if (!this.floor) return;

    let json;
    try {
      json = JSON.stringify(this.floor.toJSON());
    } catch (e) {
      return;
    }

    if (json === this._lastSavedDraftJSON) return;
    this._lastSavedDraftJSON = json;
    DraftStore.saveDraft(json);
  }

  async loadFloor(floor_id) {
    await super.loadFloor(floor_id);
    // A real floor is now loaded, so no fallback restore is needed and the
    // draft (persisted via _renderFloor) reflects this floor.
    this._pendingLastFloorRestore = false;
    this._restoredDraftId = null;
    DraftStore.saveLastFloorId(floor_id);
  }

  _getMode() {
    return "editor";
  }

  _get_html_template() {
    return `
    <ha-card>
        <div style="padding:16px; text-align:center; opacity:0.6;" class="window-title"></div>
        ${this._toolbar.get_html_template(this._hass)}
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
