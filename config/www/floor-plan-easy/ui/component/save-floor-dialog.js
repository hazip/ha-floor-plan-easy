
function toFloorId(name) {
  const raw = (name || "").toLowerCase().trim();

  // Strip accents when supported.
  const deaccented = typeof raw.normalize === "function"
    ? raw.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    : raw;

  return deaccented
    // whitespace runs -> hyphen
    .replace(/\s+/g, "-")
    // any other non-alphanumeric -> hyphen
    .replace(/[^a-z0-9-]+/g, "-")
    // collapse repeated hyphens
    .replace(/-+/g, "-")
    // trim leading/trailing hyphens
    .replace(/^-|-$/g, "");
}

export class SaveFloorDialog {

  constructor(root) {
    this.root = root;
  }

  async open(floor, hass) {
    const dialog = document.createElement("ha-dialog");
    dialog.heading = "Save floorplan";
    dialog.open = true;

    const host = document.createElement("div");
    host.style.display = "flex";
    host.style.flexDirection = "column";
    host.style.gap = "16px";
    host.style.padding = "0 4px";

    const idField = document.createElement("ha-textfield");
    idField.label = "Id";
    idField.value = floor.id || "unnamed";
    idField.readOnly = true; 
    idField.helper = "Generated from Name";
    idField.persistentHelper = true;

    const nameField = document.createElement("ha-textfield");
    nameField.label = "Name";
    nameField.value = floor.name || floor.id;

    host.append(nameField, idField);

    const cancel = document.createElement("ha-button");
    cancel.slot = "secondaryAction";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", () => (dialog.open = false));

    const save = document.createElement("ha-button");
    save.slot = "primaryAction";
    save.textContent = "Save";

    nameField.addEventListener("input", (e) => {
      const name = e.target.value;
      const slug = toFloorId(name);
      idField.value = slug;
      save.textContent = (name !== floor.name) ? "Save as" : "Save";
      save.disabled = name.length === 0;
    });

    save.addEventListener("click", async () => {
      const id = (idField.value || "").trim();
      const name = (nameField.value || "").trim();
      if (!id) return;

      // Update the floor model before serializing.
      floor.id = id;
      floor.name = name;

      const floorJson = floor.toJSON();

      save.disabled = true;
      try {
        const resp = await hass.callWS({
          type: "floor_plan_easy/save_floor",
          floor_id: floorJson.id,
          data: floorJson,
        });

        if (!resp?.ok) {
          throw new Error("Save was not acknowledged by the backend.");
        }

        this.root.updateWindowTitle();
        dialog.open = false;
      } catch (err) {
        console.error(err);
        idField.helper = "Failed to save. Please try again.";
        save.disabled = false;
      }
    });

    dialog.append(host, cancel, save);

    // Only react to the dialog's own "closed" event (not menus/pickers inside it).
    dialog.addEventListener("closed", (e) => {
      if (e.target !== dialog) return;
      dialog.remove();
    });

    document.body.appendChild(dialog);
  }

}