
import { TileContent } from "../../model/tile-content.js";
import { localize } from "../i18n/index.js";

async function ensureHaEntityPicker() {
  if (customElements.get("ha-entity-picker")) return;

  const glance = customElements.get("hui-glance-card");
  if (glance?.getConfigElement) {
    try {
      await glance.getConfigElement();
    } catch (_) {
      ;
    }
  }

  await customElements.whenDefined("ha-entity-picker");
}

export class TileEntityDialog {

  async open(tile, hass) {

    await ensureHaEntityPicker();

    const buffer = {
      entity: tile?.content?.entity || "",
      icon: tile?.content?.icon || "",
      tapAction: tile?.content?.tapAction || "none",
      renderType: tile?.content?.renderType || "badge"
    }

    const dialog = document.createElement("ha-dialog");
    dialog.heading = localize("tile_dialog.heading", hass, { col: tile.col, row: tile.row });
    dialog.open = true;
    dialog.scrimClickAction = "";
    dialog.escapeKeyAction = "";

    const content = document.createElement("div");
    content.style.display = "flex";
    content.style.flexDirection = "column";
    content.style.gap = "16px";
    content.style.padding = "0 4px";

    const entityPicker = document.createElement("ha-entity-picker");
    entityPicker.hass = hass;
    entityPicker.value = buffer.entity;
    entityPicker.label = localize("tile_dialog.entity", hass);
    entityPicker.allowCustomEntity = true;
    entityPicker.required = true;

    const actionSelect = document.createElement("ha-select");
    actionSelect.label = localize("tile_dialog.tap_action", hass);
    actionSelect.value = buffer.tapAction;
    actionSelect.fixedMenuPosition = true;
    // actionSelect.setAttribute("fixedMenuPosition", "");
    actionSelect.innerHTML = `
      <ha-list-item value="none">${localize("tile_dialog.action.none", hass)}</ha-list-item>
      <ha-list-item value="toggle">${localize("tile_dialog.action.toggle", hass)}</ha-list-item>
      <ha-list-item value="more-info">${localize("tile_dialog.action.more_info", hass)}</ha-list-item>
    `;

    const iconPicker = document.createElement("ha-icon-picker");
    iconPicker.hass = hass;
    iconPicker.value = buffer.icon;
    iconPicker.label = localize("tile_dialog.icon", hass);

    const typeRow = document.createElement("div");
    typeRow.style.display = "flex";
    typeRow.style.alignItems = "center";
    typeRow.style.gap = "12px";

    const typeLabel = document.createElement("div");
    typeLabel.textContent = localize("tile_dialog.render_as", hass);
    typeLabel.style.minWidth = "110px";
    typeLabel.style.opacity = "0.8";

    const radios = document.createElement("div");
    radios.style.display = "flex";
    radios.style.gap = "14px";

    const mkRadio = (value, text) => {
      const wrap = document.createElement("label");
      wrap.style.display = "inline-flex";
      wrap.style.alignItems = "center";
      wrap.style.gap = "6px";
      wrap.style.cursor = "pointer";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "fp-render-type";
      input.value = value;
      input.checked = (buffer.renderType === value);

      const span = document.createElement("span");
      span.textContent = text;

      wrap.append(input, span);
      return { wrap, input };
    };

    const rIcon = mkRadio("icon", localize("tile_dialog.render.icon", hass));
    const rBadge = mkRadio("badge", localize("tile_dialog.render.badge", hass));
    radios.append(rBadge.wrap, rIcon.wrap);

    typeRow.append(typeLabel, radios);

    const applyRenderTypeRules = () => {
      const isBadge = buffer.renderType === "badge";

      iconPicker.disabled = isBadge;
      if (isBadge) {
        buffer.icon = "";
        iconPicker.value = "";
      }
    };

    const onTypeChange = (value) => {
      buffer.renderType = value;
      applyRenderTypeRules();
    };

    rIcon.input.addEventListener("change", () => onTypeChange("icon"));
    rBadge.input.addEventListener("change", () => onTypeChange("badge"));

    applyRenderTypeRules();

    entityPicker.addEventListener("value-changed", (e) => {
      buffer.entity = e.detail.value;
      updateValidity();
    });
    iconPicker.addEventListener("value-changed", (e) => (buffer.icon = e.detail.value));
    actionSelect.addEventListener("selected", (e) => (buffer.tapAction = e.target.value));

    content.append(entityPicker, actionSelect, typeRow, iconPicker);

    const save = document.createElement("ha-button");
    save.slot = "primaryAction";
    save.textContent = localize("common.apply", hass);

    const cancel = document.createElement("ha-button");
    cancel.slot = "secondaryAction";
    cancel.textContent = localize("common.cancel", hass);
    cancel.addEventListener("click", () => (dialog.open = false));

    dialog.append(content, save, cancel);

    const updateValidity = () => {
      const ok = Boolean((buffer.entity || "").trim());
      save.disabled = !ok;
    };

    updateValidity();

    save.addEventListener("click", () => {
      if (!((buffer.entity || "").trim())) {
        updateValidity();
        return;
      }
      tile.content = new TileContent(buffer);
      dialog.open = false;
    });

    dialog.addEventListener("closed", (e) => {
      if (e.target !== dialog) return;
      dialog.remove();
    });

    document.body.appendChild(dialog);

    return dialog;
  }

}