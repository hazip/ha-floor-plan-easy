import { OBJECT_PATTERNS, OBJECT_PATTERN_GROUPS } from "../patterns.js";
import { PatternSettingsDialog } from "./pattern-settings-dialog.js";

export class ObjectSettingsDialog extends PatternSettingsDialog {
    _config() {
        return {
            patterns: OBJECT_PATTERNS,
            groups: OBJECT_PATTERN_GROUPS,
            state: this._editorState.object,
            headingKey: "object_dialog.heading",
            colorRows: [{ labelKey: "object_dialog.color", prop: "fgColor", fallback: "#ffffff" }],
            includeNone: false,
        };
    }
}
