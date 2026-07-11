// ─────────────────────────────────────────────────────────────────────────
// Floor Plan Easy — user pattern overrides (TEMPLATE)
//
// HOW TO USE
//   1. Copy this file next to it, renamed WITHOUT the `.example` part:
//          config/www/floor-plan-easy-user-patterns.js
//   2. Edit the entries below (add your own, keep or drop the samples).
//   3. Hard-refresh your dashboard (Cmd/Ctrl + Shift + R).
//
// This file lives OUTSIDE the `floor-plan-easy/` folder on purpose: updating
// the card (replacing that folder) will never overwrite your patterns.
//
// RULES
//   • Each value is an SVG string with a `viewBox="0 0 100 100"`.
//   • Use stroke="currentColor" (and/or fill="currentColor") so the color you
//     pick in the editor is applied at render time. Hard-coded colors ignore
//     the editor's color pickers.
//   • A key that matches a built-in name OVERRIDES that built-in.
//     A new key ADDS a pattern. Anything you omit keeps its built-in value.
//   • You may export just one of the two objects if you only customize one.
// ─────────────────────────────────────────────────────────────────────────

export const BACKGROUND_PATTERNS = {
    // Adds a new background option called "dots".
    "dots": `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <circle cx="25" cy="25" r="6" fill="currentColor"/>
            <circle cx="75" cy="25" r="6" fill="currentColor"/>
            <circle cx="25" cy="75" r="6" fill="currentColor"/>
            <circle cx="75" cy="75" r="6" fill="currentColor"/>
        </svg>
        `.trim(),
};

export const WALL_PATTERNS = {
    // Overrides the built-in "corner1" with a thicker version.
    "corner1": `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <line x1="0" y1="0" x2="100" y2="0" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
            <line x1="0" y1="0" x2="0" y2="100" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        </svg>
        `.trim(),

    // Adds a full horizontal wall.
    "top": `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <line x1="0" y1="0" x2="100" y2="0" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        </svg>
        `.trim(),
};
