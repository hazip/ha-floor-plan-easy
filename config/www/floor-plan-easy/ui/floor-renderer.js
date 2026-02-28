export class FloorRenderer {
  constructor({ container, mode = "view", onTileClick, hass } = {}) {
    this.container = container;
    this.mode = mode;
    this.onTileClick = onTileClick;
    this.hass = hass;
  }

  render(floor) {
    if (!floor) return
    this._renderGrid(floor);
  }

  setHass(hass) {
    this.hass = hass;
  }

  _renderGrid(floor) {

    this.container.innerHTML = "";
    this.container.classList.add("floor-grid");
    this.container.style.gridTemplateColumns = `repeat(${floor.gridWidth}, 1fr)`;

    for (let r = 0; r < floor.gridHeight; r++) {
      for (let c = 0; c < floor.gridWidth; c++) {
        const tile = floor.getTileAt(r, c);
        this.container.appendChild(this._renderTile(tile, r, c));
      }
    }
  }

  _renderTile(tile, row, col) {
    const el = document.createElement("div");
    el.className = "tile "  + this.mode;
    el.dataset.row = row;
    el.dataset.col = col;

    if (tile?.background) {
      this._applyBackground(el, tile.background);
    }

    this._renderTileWall(el, tile);

    el.addEventListener("click", () => {
      this.onTileClick?.({ row, col, tile });
    });

    this._renderTileContent(el, tile);

    return el;
  }

  _applyBackground(el, bg) {
    if (bg.type === "color") {
      el.style.backgroundColor = bg.color;
    }

    if (bg.type === "pattern") {
      let _svg = bg.svg
      if (bg.strokeColor) {
        _svg = _svg.replace(/currentColor/g, bg.strokeColor);
      }

      const svg = encodeURIComponent(_svg);
      el.style.backgroundImage = `url("data:image/svg+xml,${svg}")`;
      el.style.backgroundSize = "contain";
      el.style.backgroundRepeat = "no-repeat";
      el.style.backgroundPosition = "center";

      if (bg.color) {
        el.style.backgroundColor = bg.color;
      }
    }
  }

  _renderTileWall(tileEl, tile) {

    tileEl.querySelector(".tile-wall")?.remove();

    const wall = tile?.wall;
    if (!wall) return;

    const layer = document.createElement("div");
    layer.className = "tile-wall";

    let _svg = wall.svg;

    if (wall.strokeColor) {
      _svg = _svg.replace(/currentColor/g, wall.strokeColor);
    }

    const svg = encodeURIComponent(_svg);
    layer.style.backgroundImage = `url("data:image/svg+xml,${svg}")`;

    tileEl.appendChild(layer);
  }

  _renderTileContent(tileEl, tile) {

    const old = tileEl.querySelector(".tile-content");
    if (old) old.remove();

    const content = tile?.content;

    if (!content) return;

    const wrap = document.createElement("div");
    wrap.className = "tile-content";

    const type = content.renderType;

    if (type === "icon") {

      const btn = document.createElement("button");
      btn.className = "tile-icon-btn";
      btn.type = "button";

      if (content.icon) {
        const ic = document.createElement("ha-icon");
        ic.setAttribute("icon", content.icon);
        btn.appendChild(ic);
      } else if (content.entity && this.hass) {
        const sic = document.createElement("ha-state-icon");
        sic.hass = this.hass;
        sic.stateObj = this.hass.states[content.entity];
        btn.appendChild(sic);
      } else {
        const ic = document.createElement("ha-icon");
        ic.setAttribute("icon", "mdi:help-circle-outline");
        btn.appendChild(ic);
      }

      wrap.appendChild(btn);
    }

    if (type === "badge") {
      const badge = document.createElement("div");
      badge.className = "tile-badge";

      const entityId = content.entity;
      const stateObj = entityId && this.hass ? this.hass.states[entityId] : null;
      const state = stateObj ? stateObj.state : "—";
      const unit = stateObj?.attributes?.unit_of_measurement || "";

      badge.textContent = unit ? `${state} ${unit}` : `${state}`;
      wrap.appendChild(badge);
    }

    tileEl.appendChild(wrap);
  }
}
