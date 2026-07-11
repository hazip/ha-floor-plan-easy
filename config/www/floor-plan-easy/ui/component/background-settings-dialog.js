import { BACKGROUND_PATTERNS, patternsReady } from "../patterns.js";
import { ensureStyles } from "../styles.js";
import { localize } from "../i18n/index.js";

function svgToDataUrl(svg) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export class BackgroundSettingsDialog {

    constructor(editorState) {
        this._editorState = editorState;
    }

    async open(hass) {
        // Ensure optional user patterns have been merged before building the grid.
        await patternsReady;

        const dialog = document.createElement("ha-dialog");
        dialog.heading = localize("bg_dialog.heading", hass);
        dialog.open = true;

        ensureStyles(dialog);

        const host = document.createElement("div");
        host.style.display = "flex";
        host.style.flexDirection = "column";
        host.style.gap = "16px";
        host.style.padding = "0 4px";

        const fg = document.createElement("input");
        fg.type = "color";
        fg.value = this._editorState.bg.fgColor || "#ffffff";

        const bg = document.createElement("input");
        bg.type = "color";
        bg.value = this._editorState.bg.bgColor || "#ff0000";

        const patternsWrap = document.createElement("div");
        patternsWrap.style.display = "flex";
        patternsWrap.style.flexDirection = "column";
        patternsWrap.style.gap = "8px";

        const patternsLabel = document.createElement("div");
        patternsLabel.textContent = localize("common.pattern", hass);
        patternsLabel.style.opacity = "0.8";
        patternsLabel.style.fontSize = "12px";

        const grid = document.createElement("div");
        grid.className = "fp-pattern-grid";

        const setActive = (key) => {
            this._editorState.bg.patternKey = key;
            grid.querySelectorAll(".fp-pattern-tile").forEach((t) => {
                t.classList.toggle("active", t.dataset.key === key);
            });
        };

        // "None" tile
        {
            const tile = document.createElement("div");
            tile.className = "fp-pattern-tile fp-pattern-tile-none";
            tile.dataset.key = "";
            tile.title = localize("common.none", hass);

            const preview = document.createElement("div");
            preview.className = "fp-pattern-preview";
            preview.textContent = "—";
            preview.style.fontWeight = "700";
            preview.style.opacity = "0.6";

            tile.appendChild(preview);
            tile.addEventListener("click", () => setActive(""));
            grid.appendChild(tile);
        }

        // Pattern tiles
        Object.entries(BACKGROUND_PATTERNS).forEach(([key, svg]) => {
            const tile = document.createElement("div");
            tile.className = "fp-pattern-tile";
            tile.dataset.key = key;
            tile.title = key;

            const preview = document.createElement("div");
            preview.className = "fp-pattern-preview";
            preview.style.backgroundImage = svgToDataUrl(svg);

            tile.appendChild(preview);
            tile.addEventListener("click", () => setActive(key));
            grid.appendChild(tile);
        });

        // init active
        setActive(this._editorState.bg.patternKey || "");

        patternsWrap.append(patternsLabel, grid);

        host.append(
            this._labeledRow(localize("bg_dialog.fg_color", hass), fg),
            this._labeledRow(localize("bg_dialog.bg_color", hass), bg),
            patternsWrap
        );

        const cancel = document.createElement("ha-button");
        cancel.slot = "secondaryAction";
        cancel.textContent = localize("common.cancel", hass);
        cancel.addEventListener("click", () => (dialog.open = false));

        const save = document.createElement("ha-button");
        save.slot = "primaryAction";
        save.textContent = localize("common.apply", hass);
        save.addEventListener("click", () => {
            this._editorState.bg.fgColor = fg.value;
            this._editorState.bg.bgColor = bg.value;
            dialog.open = false;
        });

        dialog.append(host, cancel, save);

        dialog.addEventListener("closed", (e) => {
            if (e.target !== dialog) return;
            dialog.remove();
        });

        document.body.appendChild(dialog);
    }

    _labeledRow(label, el) {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.gap = "12px";

        const l = document.createElement("div");
        l.textContent = label;
        l.style.minWidth = "110px";
        l.style.opacity = "0.8";

        row.append(l, el);
        return row;
    }
}
