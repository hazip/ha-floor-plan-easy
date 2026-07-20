import { WALL_PATTERNS, WALL_PATTERN_GROUPS } from "../patterns.js";
import { PatternSettingsDialog } from "./pattern-settings-dialog.js";

export class WallSettingsDialog extends PatternSettingsDialog {
    _config() {
        return {
            patterns: WALL_PATTERNS,
            groups: WALL_PATTERN_GROUPS,
            state: this._editorState.wall,
            headingKey: "wall_dialog.heading",
            colorRows: [{ labelKey: "wall_dialog.color", prop: "fgColor", fallback: "#ffffff" }],
            includeNone: false,
        };
    }
}
