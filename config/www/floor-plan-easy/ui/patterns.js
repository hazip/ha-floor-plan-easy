// Built-in pattern libraries. Each value is an SVG string that uses
// `currentColor` so the stroke color can be themed at render time.
const BUILT_IN_BACKGROUND_PATTERNS = {
    "diagonals": `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
            <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
        </svg>
        `.trim()
};

const BUILT_IN_WALL_PATTERNS = {
    "corner1": `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <line x1="0" y1="0" x2="100" y2="0" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
            <line x1="0" y1="0" x2="0" y2="100" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
        </svg>
        `.trim()
};

// Live pattern registries consumed across the UI. They start as copies of the
// built-ins and may be extended (or individual keys overridden) by an optional
// user file — see patternsReady below. These object references are STABLE: the
// loader mutates them in place via Object.assign, so every module that imported
// them keeps seeing the merged result without re-importing.
export const BACKGROUND_PATTERNS = { ...BUILT_IN_BACKGROUND_PATTERNS };
export const WALL_PATTERNS = { ...BUILT_IN_WALL_PATTERNS };

// Optional user overrides live OUTSIDE this package folder so that replacing
// the whole `floor-plan-easy/` directory on update never touches them. Home
// Assistant serves `config/www/` at `/local/`, so the file the user creates is
// `config/www/floor-plan-easy-user-patterns.js` (see README → Custom patterns).
const USER_PATTERNS_URL = "/local/floor-plan-easy-user-patterns.js";

// Resolves once the optional user pattern file has been merged in (or has been
// determined to be absent). Await this before READING the registries when the
// merged result must be complete — e.g. before building a pattern picker. It
// never rejects: a missing user file is the normal case.
export const patternsReady = (async () => {
    let mod;
    try {
        mod = await import(USER_PATTERNS_URL);
    } catch (e) {
        // No user file present (404) is expected — stay silent.
        return;
    }
    try {
        if (mod.BACKGROUND_PATTERNS) Object.assign(BACKGROUND_PATTERNS, mod.BACKGROUND_PATTERNS);
        if (mod.WALL_PATTERNS) Object.assign(WALL_PATTERNS, mod.WALL_PATTERNS);
    } catch (e) {
        console.warn("floor_plan_easy: failed to merge user patterns", e);
    }
})();
