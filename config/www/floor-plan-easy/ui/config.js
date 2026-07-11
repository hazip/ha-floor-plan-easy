// Home Assistant does not export LitElement, so we borrow it from a built-in
// element. Guard against it not being defined yet at import time: a throw here
// would abort the whole module and take the card registration down with it.
const lovelace = customElements.get("ha-panel-lovelace");
const LitElementBase = lovelace ? Object.getPrototypeOf(lovelace) : null;
const LitElement = LitElementBase ? LitElementBase.prototype.constructor : HTMLElement;
const html = LitElementBase ? LitElementBase.prototype.html : (strings, ...values) =>
  strings.reduce((acc, s, i) => acc + s + (i < values.length ? values[i] : ""), "");

import { localize, localizeParts } from "./i18n/index.js";

export class FloorPlanEasyConfig extends LitElement {
  
  static properties = {
    hass: { type: Object },
    _config: { type: Object },
    _floors: { type: Array },
    _loadingFloors: { type: Boolean },
    _floorsError: { type: String },
  };

  constructor() {
    super();
    this._config = {};
    this._floors = [];
    this._loadingFloors = false;
    this._floorsError = "";
  }

  setConfig(config) {
    this._config = config;
    this.requestUpdate();
    this._ensureFloorsLoaded();
  }

  set hass(hass) {
    this._hass = hass;
    this.requestUpdate();
    this._ensureFloorsLoaded();
  }

  async _ensureFloorsLoaded() {
    if (!this._hass) return;
    if (this._loadingFloors) return;
    if (this._floors?.length) return;

    this._loadingFloors = true;
    this._floorsError = "";
    this.requestUpdate();

    try {
      const resp = await this._hass.callWS({ type: "floor_plan_easy/list_floors" });
      this._floors = resp?.floors || [];
    } catch (e) {
      console.error(e);
      this._floorsError = localize("config.floors_load_failed", this._hass);
      this._floors = [];
    } finally {
      this._loadingFloors = false;
      this.requestUpdate();
    }
  }

  _renderEditButton() {
    if (this._hasBrowserMod()) {
      return html`<ha-button @click=${this._edit}>
        ${localize("config.open_editor", this._hass)}
      </ha-button>`;
    }

    // The message is a single translatable string with {browserMod} and {docs}
    // placeholders so each language controls where the links land in the sentence.
    const browserMod = html`<a href="https://github.com/thomasloven/hass-browser_mod" target="_blank" rel="noopener">Browser Mod</a>`;
    const docs = html`<a href="/local/floor-plan-easy/docs.html" target="_blank" rel="noopener">${localize("common.documentation", this._hass)}</a>`;

    return html`<ha-alert alert-type="warning">
      ${localizeParts("config.browser_mod.message", this._hass, { browserMod, docs })}
    </ha-alert>`;
  }

  render() {
    if (!this._hass) return html`<p style="padding:16px">${localize("config.loading_hass", this._hass)}</p>`;

    const current = this._config.floor_id || "";

    const items = this._floors || [];
    const noFloors = !this._loadingFloors && !this._floorsError && !items.length;

    return html`
      <div style="display:flex; flex-direction:column; gap:16px; padding:16px;">

        ${this._loadingFloors
          ? html`<div style="opacity:0.7;">${localize("config.loading_floors", this._hass)}</div>`
          : this._floorsError
            ? html`<div style="color:var(--error-color);">${this._floorsError}</div>`
            : null}

        ${noFloors
          ? html`<ha-alert alert-type="info">
              ${localize("config.no_floors", this._hass)}
            </ha-alert>`
          : html`<ha-combo-box
              id="floorCombo"
              .label=${localize("common.floor", this._hass)}
              .items=${items}
              .itemValuePath=${"id"}
              .itemLabelPath=${"name"}
              .value=${current}
              .disabled=${this._loadingFloors}
              @value-changed=${this._onFloorValueChanged}
              @closed=${this._stopEvent}
              @closing=${this._stopEvent}
            ></ha-combo-box>`}

        ${this._renderEditButton()}

      </div>
    `;
  }

  _hasBrowserMod() {
    return Boolean(this._hass?.services?.browser_mod);
  }

  _edit() {
    this._hass.callService("browser_mod", "popup", {
      title: localize("config.editor_popup_title", this._hass),
      content: {
        type: "custom:floor-plan-easy-editor",
        floor_id: this._config.floor_id,
      },
      size: "fullscreen",
    });
  }

  _onFloorValueChanged(e) {
    e.stopPropagation();
    const floorId = (e.detail?.value ?? "").trim();
    this._valueChanged("floor_id", floorId);
  }

  _valueChanged(key, value) {
    const newConfig = { ...this._config, [key]: value };
    this._config = newConfig;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: newConfig },
        bubbles: true,
        composed: true,
      })
    );
  }

  _stopEvent(e) {
    e.stopPropagation();
  }

}