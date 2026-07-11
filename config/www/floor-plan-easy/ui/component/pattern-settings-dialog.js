import { patternsReady } from "../patterns.js";
import { ensureStyles } from "../styles.js";
import { localize } from "../i18n/index.js";

function svgToDataUrl(svg) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// Shared "pick a color + a pattern" settings dialog. Subclasses provide a
// `_config(hass)` describing the registry, the editor-state slice they edit,
// the heading and the color row(s). The background variant additionally uses two
// color rows and a "None" pattern tile — everything else is identical.
export class PatternSettingsDialog {

    constructor(editorState) {
        this._editorState = editorState;
    }

    // Override in subclasses. Returns:
    //   patterns    — pattern registry (key → svg string)
    //   state       — editor-state slice to edit ({ fgColor, patternKey, … })
    //   headingKey  — i18n key for the dialog heading
    //   colorRows   — [{ labelKey, prop, fallback }] color inputs, in order
    //   includeNone — prepend an empty "None" pattern tile (background only)
    _config(hass) {
        throw new Error("PatternSettingsDialog._config not implemented");
    }

    async open(hass, onApply) {
        // Ensure optional user patterns have been merged before building the grid.
        await patternsReady;

        const { patterns, state, headingKey, colorRows, includeNone } = this._config(hass);

        const dialog = document.createElement("ha-dialog");
        dialog.heading = localize(headingKey, hass);
        dialog.open = true;
        // Keep the backdrop transparent so the color-picker eyedropper can
        // sample colors from the floor plan behind the dialog.
        dialog.style.setProperty("--mdc-dialog-scrim-color", "transparent");

        ensureStyles(dialog);

        const host = document.createElement("div");
        host.style.display = "flex";
        host.style.flexDirection = "column";
        host.style.gap = "16px";
        host.style.padding = "0 4px";

        const colorInputs = colorRows.map(({ labelKey, prop, fallback }) => {
            const input = document.createElement("input");
            input.type = "color";
            input.value = state[prop] || fallback;
            return { input, prop, labelKey };
        });

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
            state.patternKey = key;
            grid.querySelectorAll(".fp-pattern-tile").forEach((t) => {
                t.classList.toggle("active", t.dataset.key === key);
            });
        };

        // "None" tile (background only).
        if (includeNone) {
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
        Object.entries(patterns).forEach(([key, svg]) => {
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
        setActive(includeNone ? (state.patternKey || "") : state.patternKey);

        patternsWrap.append(patternsLabel, grid);

        host.append(
            ...colorInputs.map(({ input, labelKey }) => this._labeledRow(localize(labelKey, hass), input)),
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
            colorInputs.forEach(({ input, prop }) => { state[prop] = input.value; });
            onApply?.();
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
