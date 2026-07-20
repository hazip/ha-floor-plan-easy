import { EditorState, EditorMode } from "../../model/editor-state.js";
import { BackgroundSettingsDialog } from "./background-settings-dialog.js"
import { WallSettingsDialog } from "./wall-settings-dialog.js"
import { ObjectSettingsDialog } from "./object-settings-dialog.js"
import { SaveFloorDialog } from "./save-floor-dialog.js"
import { LoadFloorDialog } from "./load-floor-dialog.js"
import { serializeFloorExport, parseFloorExport } from "../../storage/floor-file.js";
import { localize } from "../i18n/index.js";

export class Toolbar {

  constructor(root) {
    this.root = root;
    this.editorState = new EditorState();
    this._backgroundSettingsDialog = new BackgroundSettingsDialog(this.editorState);
    this._wallSettingsDialog = new WallSettingsDialog(this.editorState);
    this._objectSettingsDialog = new ObjectSettingsDialog(this.editorState);
    this._saveFloorDialog = new SaveFloorDialog(root);
    this._loadFloorDialog = new LoadFloorDialog(root);
  }

  get_html_template(hass) {
    const t = (key) => localize(key, hass);
    return `
      <div class="editor-toolbar">

        <!-- FILE -->
        <div class="tool-section" aria-label="${t("toolbar.section.file")}">
          <button class="tool-btn" data-action="file-new" title="${t("toolbar.file.new")}">
            <ha-icon icon="mdi:file-outline"></ha-icon>
          </button>

          <!-- Save: primary saves to Home Assistant; chevron reveals JSON download. -->
          <div class="tool-dropdown">
            <div class="tool-group split">
              <button class="tool-btn" data-action="file-save" title="${t("toolbar.file.save")}">
                <ha-icon icon="mdi:content-save-outline"></ha-icon>
              </button>
              <button class="tool-btn tool-menu" data-action="file-save-menu" title="${t("toolbar.file.more_save")}" aria-haspopup="true" aria-expanded="false">
                <ha-icon icon="mdi:chevron-down"></ha-icon>
              </button>
            </div>

            <div class="tool-dropdown-menu align-left" hidden>
              <button class="tool-dropdown-item" data-action="file-download">
                <ha-icon icon="mdi:download-outline"></ha-icon>
                <span>${t("toolbar.file.download")}</span>
              </button>
            </div>
          </div>

          <!-- Open: primary loads from Home Assistant; chevron reveals JSON upload. -->
          <div class="tool-dropdown">
            <div class="tool-group split">
              <button class="tool-btn" data-action="file-load" title="${t("toolbar.file.load")}">
                <ha-icon icon="mdi:folder-open-outline"></ha-icon>
              </button>
              <button class="tool-btn tool-menu" data-action="file-load-menu" title="${t("toolbar.file.more_open")}" aria-haspopup="true" aria-expanded="false">
                <ha-icon icon="mdi:chevron-down"></ha-icon>
              </button>
            </div>

            <div class="tool-dropdown-menu align-left" hidden>
              <button class="tool-dropdown-item" data-action="file-upload">
                <ha-icon icon="mdi:upload-outline"></ha-icon>
                <span>${t("toolbar.file.upload")}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="tool-separator"></div>

        <!-- BACKGROUND -->
        <div class="tool-section" aria-label="${t("toolbar.section.background")}">
          <div class="tool-group split">
            <button class="tool-btn tool-toggle" data-mode="background_set" title="${t("toolbar.bg.set")}">
              <ha-icon icon="mdi:format-color-fill"></ha-icon>
            </button>
            <button class="tool-btn tool-menu" data-action="bg-settings" title="${t("toolbar.bg.settings")}">
              <ha-icon icon="mdi:chevron-down"></ha-icon>
            </button>
          </div>

          <button class="tool-btn tool-toggle danger" data-mode="background_clear" title="${t("toolbar.bg.clear")}">
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>

        <div class="tool-separator"></div>

        <!-- WALL -->
        <div class="tool-section" aria-label="${t("toolbar.section.wall")}">
          <div class="tool-group split">
            <button class="tool-btn tool-toggle" data-mode="wall_set" title="${t("toolbar.wall.set")}">
              <ha-icon icon="mdi:floor-plan"></ha-icon>
            </button>
            <button class="tool-btn tool-menu" data-action="wall-settings" title="${t("toolbar.wall.settings")}">
              <ha-icon icon="mdi:chevron-down"></ha-icon>
            </button>
          </div>

          <button class="tool-btn tool-toggle danger" data-mode="wall_clear" title="${t("toolbar.wall.clear")}">
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>

        <div class="tool-separator"></div>

        <!-- OBJECT -->
        <div class="tool-section" aria-label="${t("toolbar.section.object")}">
          <div class="tool-group split">
            <button class="tool-btn tool-toggle" data-mode="object_set" title="${t("toolbar.object.set")}">
              <ha-icon icon="mdi:sofa-outline"></ha-icon>
            </button>
            <button class="tool-btn tool-menu" data-action="object-settings" title="${t("toolbar.object.settings")}">
              <ha-icon icon="mdi:chevron-down"></ha-icon>
            </button>
          </div>

          <button class="tool-btn tool-toggle danger" data-mode="object_clear" title="${t("toolbar.object.clear")}">
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>

        <div class="tool-separator"></div>

        <!-- CONTENT -->
        <div class="tool-section" aria-label="${t("toolbar.section.tile")}">
          <button class="tool-btn tool-toggle" data-mode="content_edit" title="${t("toolbar.tile.edit")}">
            <ha-icon icon="mdi:tools"></ha-icon>
          </button>

          <button class="tool-btn tool-toggle danger" data-mode="content_clear" title="${t("toolbar.tile.clear")}">
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>

        <div class="tool-separator"></div>

        <!-- RESIZE -->
        <div class="tool-section" aria-label="${t("toolbar.section.resize")}">
          <div class="tool-dropdown">
            <button class="tool-btn" data-action="grid-add-menu" title="${t("toolbar.section.resize")}" aria-haspopup="true" aria-expanded="false">
              <ha-icon icon="mdi:plus"></ha-icon>
            </button>

            <div class="tool-dropdown-menu" hidden>
              <button class="tool-dropdown-item" data-action="grid-add-col-left">
                <ha-icon icon="mdi:arrow-left-bold-box-outline"></ha-icon>
                <span>${t("toolbar.resize.add_col_left")}</span>
              </button>

              <button class="tool-dropdown-item" data-action="grid-add-col-right">
                <ha-icon icon="mdi:arrow-right-bold-box-outline"></ha-icon>
                <span>${t("toolbar.resize.add_col_right")}</span>
              </button>

              <button class="tool-dropdown-item" data-action="grid-add-row-top">
                <ha-icon icon="mdi:arrow-up-bold-box-outline"></ha-icon>
                <span>${t("toolbar.resize.add_row_top")}</span>
              </button>

              <button class="tool-dropdown-item" data-action="grid-add-row-bottom">
                <ha-icon icon="mdi:arrow-down-bold-box-outline"></ha-icon>
                <span>${t("toolbar.resize.add_row_bottom")}</span>
              </button>
            </div>
          </div>
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

    // Applying settings from a dialog also switches to that feature's "set"
    // mode, so the user can immediately paint with the settings they just chose.
    const activateMode = (mode) => {
      this.editorState.activeMode = mode;
      this.updateToolbarActiveState();
    };

    const bgSettings = this.root.querySelector('.tool-menu[data-action="bg-settings"]');
    bgSettings?.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this._backgroundSettingsDialog.open(this.root._hass, () => activateMode(EditorMode.BACKGROUND_SET));
    });

    const wallSettings = this.root.querySelector('.tool-menu[data-action="wall-settings"]');
    wallSettings?.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this._wallSettingsDialog.open(this.root._hass, () => activateMode(EditorMode.WALL_SET));
    });

    const objectSettings = this.root.querySelector('.tool-menu[data-action="object-settings"]');
    objectSettings?.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this._objectSettingsDialog.open(this.root._hass, () => activateMode(EditorMode.OBJECT_SET));
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
        this._closeDropdowns();
        await this._saveFloorDialog.open(this.root.floor, this.root._hass);
      });

    this.root.querySelector('[data-action="file-load"]')
      ?.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._closeDropdowns();
        await this._loadFloorDialog.open(this.root._hass);
      });

    this.root.querySelector('[data-action="file-download"]')
      ?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._closeDropdowns();
        this._downloadFloor(this.root.floor);
      });

    this.root.querySelector('[data-action="file-upload"]')
      ?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._closeDropdowns();
        this._uploadFloor(this.root._hass);
      });

    this.setupDropdowns();

    const on = (sel, fn) => this.root.querySelector(sel)?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      fn();
      this._closeDropdowns();
    });

    on('[data-action="grid-add-col-left"]',  () => this.root.addTiles("LEFT"));
    on('[data-action="grid-add-col-right"]', () => this.root.addTiles("RIGHT"));
    on('[data-action="grid-add-row-top"]',   () => this.root.addTiles("TOP"));
    on('[data-action="grid-add-row-bottom"]',() => this.root.addTiles("BOTTOM"));

    this.updateToolbarActiveState();
  }

  // Wire every `.tool-dropdown` (grid-resize "+", save, open) to a single
  // controller so at most one menu is open at a time. The outside-click
  // listener is attached only while a menu is open and removed on close, so it
  // never outlives the toolbar — attaching it permanently to `document` would
  // leak one stale listener per card re-creation (HA rebuilds cards on
  // reconnect).
  setupDropdowns() {
    let openEntry = null;

    const onOutsideClick = (e) => {
      if (!openEntry) return;
      if (e.composedPath().includes(openEntry.dropdown)) return;
      closeOpen();
    };

    const closeOpen = () => {
      if (!openEntry) return;
      openEntry.menu.hidden = true;
      openEntry.trigger.setAttribute("aria-expanded", "false");
      openEntry = null;
      document.removeEventListener("click", onOutsideClick);
    };

    const open = (entry) => {
      closeOpen();
      entry.menu.hidden = false;
      entry.trigger.setAttribute("aria-expanded", "true");
      openEntry = entry;
      document.addEventListener("click", onOutsideClick);
    };

    // Expose the closer so item handlers can dismiss the active menu.
    this._closeDropdowns = closeOpen;

    this.root.querySelectorAll(".tool-dropdown").forEach((dropdown) => {
      const trigger = dropdown.querySelector('[aria-haspopup="true"]');
      const menu = dropdown.querySelector(".tool-dropdown-menu");
      if (!trigger || !menu) return;

      const entry = { dropdown, trigger, menu };
      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        menu.hidden ? open(entry) : closeOpen();
      });
    });
  }

  _downloadFloor(floor) {
    if (!floor) return;

    const text = serializeFloorExport(floor.toJSON(), { exportedAt: new Date().toISOString() });
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${floor.id || "floorplan"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  _uploadFloor(hass) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.style.display = "none";

    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) return;

      try {
        const data = parseFloorExport(await file.text());
        this.root.importFloor(data);
      } catch (err) {
        console.error("floor_plan_easy: import failed", err);
        alert(localize("toolbar.file.upload_failed", hass));
      }
    });

    document.body.appendChild(input);
    input.click();
  }

  updateToolbarActiveState() {
    this.root.querySelectorAll(".tool-toggle").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === this.editorState.activeMode);
    });
  }

}