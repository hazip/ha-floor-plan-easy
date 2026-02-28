const LitElementBase = Object.getPrototypeOf(customElements.get("ha-panel-lovelace"));
const LitElement = LitElementBase.prototype.constructor;
const html = LitElementBase.prototype.html;

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
      this._floorsError = "Failed to load floors.";
      this._floors = [];
    } finally {
      this._loadingFloors = false;
      this.requestUpdate();
    }
  }

  _renderEditButton() {
    if (this._hasBrowserMod()) {
      return html`<ha-button @click=${this._edit}>
        Open editor
      </ha-button>`;
    }

    return html`<ha-alert alert-type="warning">
      TODO HELPER TEXT
    </ha-alert>`;
  }

  render() {
    if (!this._hass) return html`<p style="padding:16px">Loading hass…</p>`;

    const current = this._config.floor_id || "";

    const items = this._floors || [];
    
    return html`
      <div style="display:flex; flex-direction:column; gap:16px; padding:16px;">

        ${this._loadingFloors
          ? html`<div style="opacity:0.7;">Loading floors…</div>`
          : this._floorsError
            ? html`<div style="color:var(--error-color);">${this._floorsError}</div>`
            : null}

        <ha-combo-box
          id="floorCombo"
          .label=${"Floor"}
          .items=${items}
          .itemValuePath=${"id"}
          .itemLabelPath=${"name"}
          .value=${current}
          .disabled=${this._loadingFloors || !items.length}
          @value-changed=${this._onFloorValueChanged}
          @closed=${this._stopEvent}
          @closing=${this._stopEvent}
        ></ha-combo-box>

      </div>
    `;
  }

  _hasBrowserMod() {
    return Boolean(this._hass?.services?.browser_mod);
  }

  _edit() {
    this._hass.callService("browser_mod", "popup", {
      title: "Floor Plan Editor",
      content: {
        type: "custom:floor-plan-easy-editor",
        config: this.config,
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