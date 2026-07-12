// Persists a small palette of user-saved colors to localStorage so a color the
// user liked can be re-used later instead of being hunted down again. The list
// is shared across every color picker (background FG/BG, wall, object) and
// survives reloads and element recreation.
//
// Colors are stored as lowercase `#rrggbb` strings (what <input type="color">
// emits), most-recent first, deduplicated, and capped so the strip stays tidy.

const SWATCHES_KEY = "floor_plan_easy:saved_colors";
const MAX_SWATCHES = 24;

function normalize(color) {
  return typeof color === "string" ? color.trim().toLowerCase() : "";
}

export const SwatchStore = {
  load() {
    try {
      const raw = localStorage.getItem(SWATCHES_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter((c) => typeof c === "string") : [];
    } catch (e) {
      return [];
    }
  },

  _save(list) {
    try {
      localStorage.setItem(SWATCHES_KEY, JSON.stringify(list));
    } catch (e) {
      // Storage may be unavailable (private mode) or over quota — non-fatal.
    }
  },

  // Adds `color` to the front of the palette (most-recent first), removing any
  // existing copy so it is not duplicated. Returns the updated list.
  add(color) {
    const c = normalize(color);
    if (!c) return this.load();
    const list = [c, ...this.load().filter((x) => normalize(x) !== c)].slice(0, MAX_SWATCHES);
    this._save(list);
    return list;
  },

  // Removes `color` from the palette. Returns the updated list.
  remove(color) {
    const c = normalize(color);
    const list = this.load().filter((x) => normalize(x) !== c);
    this._save(list);
    return list;
  },
};
