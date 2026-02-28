
class FloorPlanEasyCard extends HTMLElement {
  setConfig(config) {
    this.config = config;
    this.render();
  }

  set hass(hass) {
    this.hassInstance = hass;
    this.render();
  }

  render() {

    // PREVIEW
    if (!this.hassInstance) {
      this.innerHTML = `
        <ha-card>
          <div style="padding:16px; text-align:center; opacity:0.6;">
            Floor Plan Easy<br/>
            <small>Preview</small>
          </div>
        </ha-card>
      `;
      return;
    }

    // NORMAL MODE
    if (!this.config || !this.config.entity) {
      this.innerHTML = `
        <ha-card>
          <div style="padding:16px; text-align:center; opacity:0.6;">
            Select an entity
          </div>
        </ha-card>
      `;
      return;
    }

    const stateObj = this.hassInstance.states[this.config.entity];
    const state = stateObj ? stateObj.state : "N/A";

    this.innerHTML = `
      <ha-card>
        <div style="padding:16px;text-align:center;opacity:0.6">
          <ha-icon icon="mdi:floor-plan"></ha-icon><br/>
          Floor Plan Easy
        </div>
        <div class="badge-content" style="padding: 16px; text-align: center;">
          <strong>${this.config.label}</strong><br />
          <span>${state}</span>
        </div>
      </ha-card>
    `;
  }

  static getConfigElement() {
    return document.createElement("floor-plan-easy-editor");
  }

  static getStubConfig() {
    return {
      entity: "sun.sun",
      label: "Example Label",
    };
  }

  getCardSize() {
    return 1;
  }
}

customElements.define("floor-plan-easy", FloorPlanEasyCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "floor-plan-easy",
  name: "Floor Plan Easy",
  description: "Floor plan card"
});

const LitElementBase = Object.getPrototypeOf(customElements.get("ha-panel-lovelace"));
const LitElement = LitElementBase.prototype.constructor;
const html = LitElementBase.prototype.html;

class FloorPlanEasyEditor extends LitElement {
  
  static properties = {
    hass: { type: Object },
    _config: { type: Object },
    _pickerReady: { type: Boolean },
  };

  constructor() {
    super();
    this._config = {};
    this._pickerReady = false;
  }

  setConfig(config) {
    this._config = { ...config };
    this.requestUpdate();
  }

  // Fontos: itt kényszerítjük ki a HA internal komponensek betöltését
  async connectedCallback() {
    super.connectedCallback();

    if (this._pickerReady) return;

    // 1) Ha már létezik, kész vagyunk
    if (customElements.get("ha-entity-picker")) {
      this._pickerReady = true;
      return;
    }

    // 2) Workaround: kérjük le egy core kártya editorát, ami betölti a szükséges modulokat
    const glance = customElements.get("hui-glance-card");
    if (glance?.getConfigElement) {
      try {
        await glance.getConfigElement(); // ez felhúzza a hui-glance-card-editor-t és vele a ha-entity-picker-t
      } catch (e) {
        // ignore, majd whenDefined eldönti
      }
    }

    // 3) Várjuk, hogy tényleg regisztrálódjon
    try {
      await customElements.whenDefined("ha-entity-picker");
      this._pickerReady = true;
      this.requestUpdate();
    } catch (e) {
      // ha ide jutna, renderben adunk hibát
      this._pickerReady = false;
      this.requestUpdate();
    }
  }

  _hasBrowserMod() {
    return Boolean(this.hass?.services?.browser_mod);
  }

  _hasEditorView() {
    const lovelace = this.hass?.lovelace;
    if (!lovelace?.config?.views) return false;

    return lovelace.config.views.some((view, index) => {
      const path = view.path ?? String(index);
      return path === "floorplan-editor";
    });
  }

  render() {
    if (!this.hass) return html`<p style="padding:16px">Loading hass…</p>`;
    if (!this._pickerReady) {
      return html`<p style="padding:16px">Loading entity picker…</p>`;
    }

    return html`
      <div style="display:flex; flex-direction:column; gap:16px; padding:16px;">
        <ha-entity-picker
          .hass=${this.hass}
          .value=${this._config.entity || ""}
          .label=${"Entity"}
          .required=${true}
          allow-custom-entity
          @value-changed=${(e) => this._valueChanged("entity", e.detail.value)}
        ></ha-entity-picker>

        <ha-textfield
          .label=${"Label"}
          .value=${this._config.label || ""}
          @input=${(e) => this._valueChanged("label", e.target.value)}
        ></ha-textfield>
      </div>
    `;
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

}

customElements.define("floor-plan-easy-editor", FloorPlanEasyEditor);