import { localize } from "../i18n/index.js";

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
    dialog.heading = localize("save_dialog.heading", hass);
    dialog.open = true;

    const host = document.createElement("div");
    host.style.display = "flex";
    host.style.flexDirection = "column";
    host.style.gap = "16px";
    host.style.padding = "0 4px";

    const nameField = document.createElement("ha-textfield");
    nameField.label = localize("save_dialog.name", hass);
    nameField.value = floor.name || floor.id;

    host.append(nameField);

    const cancel = document.createElement("ha-button");
    cancel.slot = "secondaryAction";
    cancel.textContent = localize("common.cancel", hass);
    cancel.addEventListener("click", () => (dialog.open = false));

    const save = document.createElement("ha-button");
    save.slot = "primaryAction";
    save.textContent = localize("common.save", hass);

    nameField.addEventListener("input", (e) => {
      const name = e.target.value;
      save.textContent = (name !== floor.name) ? localize("save_dialog.save_as", hass) : localize("common.save", hass);
      save.disabled = name.length === 0;
    });

    save.addEventListener("click", async () => {
      const name = (nameField.value || "").trim();
      // Plain "Save" (name unchanged) keeps the floor's existing id so an
      // already-stored floor is overwritten in place — even when its id does not
      // match slug(name) (e.g. an id set outside the editor). Only a rename
      // ("Save as") derives a fresh id from the new name.
      const id = (name === floor.name && floor.id) ? floor.id : toFloorId(name);
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
        nameField.helper = localize("save_dialog.save_failed", hass);
        nameField.persistentHelper = true;
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