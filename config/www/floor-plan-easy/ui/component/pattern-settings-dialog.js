import { patternsReady } from "../patterns.js";
import { ensureStyles } from "../styles.js";
import { localize } from "../i18n/index.js";
import { SwatchStore } from "../../storage/swatch-store.js";

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
        // Widen the dialog so the pattern grid fits 5 tiles per row
        // (5×56px + 4×10px gap = 320px grid + host/dialog padding).
        dialog.style.setProperty("--mdc-dialog-min-width", "380px");

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

        // Saved-color palette shared across every color input in the dialog.
        // Each field renders its own strip; when the palette changes (a color is
        // saved or removed) every strip re-renders so they stay in sync.
        const renderStrips = [];
        const refreshSwatches = () => {
            const colors = SwatchStore.load();
            renderStrips.forEach((fn) => fn(colors));
        };

        host.append(
            ...colorInputs.map(({ input, labelKey }) =>
                this._colorField(localize(labelKey, hass), input, hass, renderStrips, refreshSwatches)
            ),
            patternsWrap
        );
        refreshSwatches();

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

    // A color row (label + <input type=color> + "save" button) plus a strip of
    // saved-color swatches beneath it. Clicking a swatch loads that color into
    // this field's input; the save button stores the input's current value; a
    // swatch's × removes it from the shared palette. `renderStrips` collects a
    // re-render callback so a change made in one field updates every strip.
    _colorField(label, input, hass, renderStrips, refreshSwatches) {
        const field = document.createElement("div");
        field.className = "fp-color-field";

        const save = document.createElement("button");
        save.type = "button";
        save.className = "tool-btn fp-swatch-save";
        save.textContent = "＋";
        save.title = localize("common.save_color", hass);
        save.addEventListener("click", () => {
            SwatchStore.add(input.value);
            refreshSwatches();
        });

        const row = this._labeledRow(label, input);
        row.append(save);

        const strip = document.createElement("div");
        strip.className = "fp-swatch-strip";

        const renderStrip = (colors) => {
            strip.textContent = "";
            colors.forEach((color) => {
                const sw = document.createElement("button");
                sw.type = "button";
                sw.className = "fp-swatch";
                sw.style.background = color;
                sw.title = color;

                const remove = () => {
                    SwatchStore.remove(color);
                    refreshSwatches();
                };

                // Long-press removes on touch (where the hover × never shows).
                // A completed long-press suppresses the trailing click so the
                // color is not re-selected into the input on release.
                let pressTimer = null;
                let longPressed = false;
                const cancelPress = () => {
                    if (pressTimer !== null) { clearTimeout(pressTimer); pressTimer = null; }
                };
                sw.addEventListener("pointerdown", () => {
                    longPressed = false;
                    pressTimer = setTimeout(() => {
                        pressTimer = null;
                        longPressed = true;
                        remove();
                    }, 500);
                });
                sw.addEventListener("pointerup", cancelPress);
                sw.addEventListener("pointerleave", cancelPress);
                sw.addEventListener("pointercancel", cancelPress);
                sw.addEventListener("click", () => {
                    if (longPressed) { longPressed = false; return; }
                    input.value = color;
                });

                const del = document.createElement("span");
                del.className = "fp-swatch-remove";
                del.textContent = "×";
                del.title = localize("common.remove_color", hass);
                del.addEventListener("click", (e) => {
                    e.stopPropagation();
                    remove();
                });

                sw.appendChild(del);
                strip.appendChild(sw);
            });
        };
        renderStrips.push(renderStrip);

        field.append(row, strip);
        return field;
    }
}
