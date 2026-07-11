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
//   • Each value is an SVG string with a `viewBox="0 0 100 100"` (setting
//     `width="100" height="100"` too is good practice). Patterns are stretched to
//     fill the square tile, so draw across the full 0..100 box to reach the edges.
//   • Use stroke="currentColor" (and/or fill="currentColor") so the color you
//     pick in the editor is applied at render time. Hard-coded colors ignore
//     the editor's color pickers.
//   • A key that matches a built-in name OVERRIDES that built-in.
//     A new key ADDS a pattern. Anything you omit keeps its built-in value.
//   • You may export just one of the objects if you only customize one.
//     `OBJECT_PATTERNS` (furniture / door leaves) is also supported.
// ─────────────────────────────────────────────────────────────────────────

export const BACKGROUND_PATTERNS = {
    // Adds a new background option called "dots".
    "dots": `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
            <circle cx="25" cy="25" r="6" fill="currentColor"/>
            <circle cx="75" cy="25" r="6" fill="currentColor"/>
            <circle cx="25" cy="75" r="6" fill="currentColor"/>
            <circle cx="75" cy="75" r="6" fill="currentColor"/>
        </svg>
        `.trim(),
};

export const WALL_PATTERNS = {
    // Overrides the built-in "wall-top" with a thinner version.
    "wall-top": `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
            <rect x="0" y="0" width="100" height="6" fill="currentColor"/>
        </svg>
        `.trim(),

    // Adds a new custom option called "corner-thick".
    "corner-thick": `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
            <line x1="0" y1="0" x2="100" y2="0" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
            <line x1="0" y1="0" x2="0" y2="100" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        </svg>
        `.trim(),
};
