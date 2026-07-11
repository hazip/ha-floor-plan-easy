// Persists the editor's in-progress work to localStorage so it survives the
// element being recreated (e.g. Home Assistant rebuilds the Lovelace view after
// a long idle period / websocket reconnect). Without this the working floor
// lives only in memory and is silently reset to an empty floor.
//
// Two independent pieces are stored:
//   - the full working floor ("draft"), which also captures unsaved edits;
//   - the id of the last floor loaded from the server, used as a fallback to
//     re-fetch a clean copy when the draft is missing or unreadable.

const DRAFT_KEY = "floor_plan_easy:editor_draft";
const LAST_FLOOR_KEY = "floor_plan_easy:editor_last_floor_id";

export const DraftStore = {
  // `jsonString` is an already-serialized Floor.toJSON() payload.
  saveDraft(jsonString) {
    try {
      localStorage.setItem(DRAFT_KEY, jsonString);
    } catch (e) {
      // Storage may be unavailable (private mode) or over quota — non-fatal.
    }
  },

  loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      // ignore
    }
  },

  saveLastFloorId(id) {
    try {
      if (id) localStorage.setItem(LAST_FLOOR_KEY, id);
    } catch (e) {
      // ignore
    }
  },

  loadLastFloorId() {
    try {
      return localStorage.getItem(LAST_FLOOR_KEY) || null;
    } catch (e) {
      return null;
    }
  },
};
