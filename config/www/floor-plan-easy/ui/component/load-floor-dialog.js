
export class LoadFloorDialog {

  constructor(root) {
    this.root = root;
  }

  async open(hass) {
    let selectedFloorId = "";

    const dialog = document.createElement("ha-dialog");
    dialog.heading = "Load floorplan";
    dialog.open = true;

    const host = document.createElement("div");
    host.style.display = "flex";
    host.style.flexDirection = "column";
    host.style.gap = "16px";
    host.style.padding = "0 4px";

    // loading state
    const status = document.createElement("div");
    status.style.opacity = "0.75";
    status.textContent = "Loading floors…";

    const combo = document.createElement("ha-combo-box");
    combo.label = "Floor";
    combo.disabled = true;
    combo.required = true;
    combo.itemLabelPath = "label";
    combo.itemValuePath = "value";

    host.append(status, combo);

    const cancel = document.createElement("ha-button");
    cancel.slot = "secondaryAction";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", () => (dialog.open = false));

    const loadBtn = document.createElement("ha-button");
    loadBtn.slot = "primaryAction";
    loadBtn.textContent = "Load";
    loadBtn.disabled = true;

    loadBtn.addEventListener("click", async () => {
        if (!selectedFloorId) return;

        loadBtn.disabled = true;
        status.textContent = `Loading "${selectedFloorId}"…`;

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
            status.textContent = "No saved floors found.";
            combo.disabled = true;
            loadBtn.disabled = true;
            return;
        }

        status.textContent = "Select a floor to load:";
        combo.items = floors.map((_floor) => ({ label: _floor.name, value: _floor.id }));
        combo.disabled = false;

        // default kiválasztás
        // combo.value = floors[0].id;

        loadBtn.disabled = false;

        combo.addEventListener("value-changed", (e) => {
            e.stopPropagation();
            selectedFloorId = (e.detail.value);
            loadBtn.disabled = !selectedFloorId;
        });

    } catch (err) {
        console.error(err);
        status.textContent = "Failed to load floors.";
        select.disabled = true;
        loadBtn.disabled = true;
    }
  }

  async _listFloors(hass) {
    const resp = await hass.callWS({ type: "floor_plan_easy/list_floors" });
    return resp.floors || [];
  }

}