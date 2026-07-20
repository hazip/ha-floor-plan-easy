import { BACKGROUND_PATTERNS, BACKGROUND_PATTERN_GROUPS } from "../patterns.js";
import { PatternSettingsDialog } from "./pattern-settings-dialog.js";

export class BackgroundSettingsDialog extends PatternSettingsDialog {
    _config() {
        return {
            patterns: BACKGROUND_PATTERNS,
            groups: BACKGROUND_PATTERN_GROUPS,
            state: this._editorState.bg,
            headingKey: "bg_dialog.heading",
            colorRows: [
                { labelKey: "bg_dialog.fg_color", prop: "fgColor", fallback: "#ffffff" },
                { labelKey: "bg_dialog.bg_color", prop: "bgColor", fallback: "#ff0000" },
            ],
            includeNone: true,
        };
    }
}
