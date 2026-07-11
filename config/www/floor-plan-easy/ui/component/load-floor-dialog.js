import { localize } from "../i18n/index.js";

export class LoadFloorDialog {

  constructor(root) {
    this.root = root;
  }

  async open(hass) {
    let selectedFloorId = "";

    const dialog = document.createElement("ha-dialog");
    dialog.heading = localize("load_dialog.heading", hass);
    dialog.open = true;

    const host = document.createElement("div");
    host.style.display = "flex";
    host.style.flexDirection = "column";
    host.style.gap = "16px";
    host.style.padding = "0 4px";

    // loading indicator
    const status = document.createElement("div");
    status.style.opacity = "0.75";
    status.textContent = localize("load_dialog.loading", hass);

    const combo = document.createElement("ha-combo-box");
    combo.label = localize("common.floor", hass);
    combo.disabled = true;
    combo.required = true;
    combo.itemLabelPath = "label";
    combo.itemValuePath = "value";

    host.append(status, combo);

    const cancel = document.createElement("ha-button");
    cancel.slot = "secondaryAction";
    cancel.textContent = localize("common.cancel", hass);
    cancel.addEventListener("click", () => (dialog.open = false));

    const loadBtn = document.createElement("ha-button");
    loadBtn.slot = "primaryAction";
    loadBtn.textContent = localize("common.load", hass);
    loadBtn.disabled = true;

    loadBtn.addEventListener("click", async () => {
        if (!selectedFloorId) return;

        loadBtn.disabled = true;
        status.textContent = localize("load_dialog.loading_one", hass, { name: selectedFloorId });

        await this.root.loadFloor(selectedFloorId);

        dialog.open = false;
    });

    dialog.append(host, cancel, loadBtn);

    dialog.addEventListener("closed", (e) => {
        if (e.target !== dialog) return;
        dialog.remove();
    });

    document.body.appendChild(dialog);

    try {
        const floors = await this._listFloors(hass);

        if (!floors.length) {
            status.textContent = localize("load_dialog.none", hass);
            combo.disabled = true;
            loadBtn.disabled = true;
            return;
        }

        status.textContent = localize("load_dialog.select", hass);
        combo.items = floors.map((_floor) => ({ label: _floor.name, value: _floor.id }));
        combo.disabled = false;

        // Stays disabled until the user picks a floor.
        loadBtn.disabled = true;

        combo.addEventListener("value-changed", (e) => {
            e.stopPropagation();
            selectedFloorId = (e.detail.value);
            loadBtn.disabled = !selectedFloorId;
        });

    } catch (err) {
        console.error(err);
        status.textContent = localize("load_dialog.failed", hass);
        combo.disabled = true;
        loadBtn.disabled = true;
    }
  }

  async _listFloors(hass) {
    const resp = await hass.callWS({ type: "floor_plan_easy/list_floors" });
    return resp.floors || [];
  }

}