import { EditorState } from "../../model/editor-state.js";
import { BackgroundSettingsDialog } from "./background-settings-dialog.js"
import { WallSettingsDialog } from "./wall-settings-dialog.js"
import { SaveFloorDialog } from "./save-floor-dialog.js"
import { LoadFloorDialog } from "./load-floor-dialog.js"

export class Toolbar {

  constructor(root) {
    this.root = root;
    this.editorState = new EditorState();
    this._backgroundSettingsDialog = new BackgroundSettingsDialog(this.editorState);
    this._wallSettingsDialog = new WallSettingsDialog(this.editorState);
    this._saveFloorDialog = new SaveFloorDialog();
    this._loadFloorDialog = new LoadFloorDialog(root);
  }

  get_html_template() {
    return `
      <div class="editor-toolbar">
      
        <!-- FILE -->
        <div class="tool-section" aria-label="File">
          <button class="tool-btn" data-action="file-new" title="New floorplan">
            <ha-icon icon="mdi:file-outline"></ha-icon>
          </button>

          <button class="tool-btn" data-action="file-save" title="Save floorplan">
            <ha-icon icon="mdi:content-save-outline"></ha-icon>
          </button>

          <button class="tool-btn" data-action="file-load" title="Load floorplan">
            <ha-icon icon="mdi:folder-open-outline"></ha-icon>
          </button>
        </div>

        <div class="tool-separator"></div>

        <!-- BACKGROUND -->
        <div class="tool-section" aria-label="Background tools">
          <div class="tool-group split">
            <button class="tool-btn tool-toggle" data-mode="background_set" title="Set background">
              <ha-icon icon="mdi:format-color-fill"></ha-icon>
            </button>
            <button class="tool-btn tool-menu" data-action="bg-settings" title="Background settings">
              <ha-icon icon="mdi:chevron-down"></ha-icon>
            </button>
          </div>

          <button class="tool-btn tool-toggle danger" data-mode="background_clear" title="Clear background">
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>

        <div class="tool-separator"></div>

        <!-- WALL -->
        <div class="tool-section" aria-label="Wall tools">
          <div class="tool-group split">
            <button class="tool-btn tool-toggle" data-mode="wall_set" title="Set wall">
              <ha-icon icon="mdi:floor-plan"></ha-icon>
            </button>
            <button class="tool-btn tool-menu" data-action="wall-settings" title="Wall settings">
              <ha-icon icon="mdi:chevron-down"></ha-icon>
            </button>
          </div>

          <button class="tool-btn tool-toggle danger" data-mode="wall_clear" title="Clear wall">
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>

        <div class="tool-separator"></div>

        <!-- CONTENT -->
        <div class="tool-section" aria-label="Tile tools">
          <button class="tool-btn tool-toggle" data-mode="content_edit" title="Edit tile content">
            <ha-icon icon="mdi:tools"></ha-icon>
          </button>

          <button class="tool-btn tool-toggle danger" data-mode="content_clear" title="Clear tile content">
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>

        <div class="tool-separator"></div>

        <!-- RESIZE -->
        <div class="tool-section" aria-label="Grid resize">
          <button class="tool-btn tool-plain" data-action="grid-add-col-left" title="Add column left">
            <ha-icon icon="mdi:arrow-left-bold-box-outline"></ha-icon>
          </button>

          <button class="tool-btn tool-plain" data-action="grid-add-col-right" title="Add column right">
            <ha-icon icon="mdi:arrow-right-bold-box-outline"></ha-icon>
          </button>

          <button class="tool-btn tool-plain" data-action="grid-add-row-top" title="Add row top">
            <ha-icon icon="mdi:arrow-up-bold-box-outline"></ha-icon>
          </button>

          <button class="tool-btn tool-plain" data-action="grid-add-row-bottom" title="Add row bottom">
            <ha-icon icon="mdi:arrow-down-bold-box-outline"></ha-icon>
          </button>
        </div>


      </div>
    `;
  }

  setupToolbar() {
    this.root.querySelectorAll(".tool-toggle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.editorState.activeMode = btn.dataset.mode;
        this.updateToolbarActiveState();
      });
    });

    const bgSettings = this.root.querySelector('.tool-menu[data-action="bg-settings"]');
    bgSettings?.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this._backgroundSettingsDialog.open();
    });

    const wallSettings = this.root.querySelector('.tool-menu[data-action="wall-settings"]');
    wallSettings?.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this._wallSettingsDialog.open();
    });

    this.root.querySelector('[data-action="file-new"]')
      ?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.root.newFloor();
      });

    this.root.querySelector('[data-action="file-save"]')
      ?.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await this._saveFloorDialog.open(this.root.floor, this.root._hass);
      });

    this.root.querySelector('[data-action="file-load"]')
      ?.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await this._loadFloorDialog.open();
      });

    const on = (sel, fn) => this.root.querySelector(sel)?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      fn();
    });

    on('[data-action="grid-add-col-left"]',  () => this.root.addTiles("LEFT"));
    on('[data-action="grid-add-col-right"]', () => this.root.addTiles("RIGHT"));
    on('[data-action="grid-add-row-top"]',   () => this.root.addTiles("TOP"));
    on('[data-action="grid-add-row-bottom"]',() => this.root.addTiles("BOTTOM"));

    this.updateToolbarActiveState();
  }

  updateToolbarActiveState() {
    this.root.querySelectorAll(".tool-toggle").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === this.editorState.activeMode);
    });
  }

}