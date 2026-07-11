# Frontend Architecture

The frontend is a set of vanilla ES modules served from
[`config/www/floor-plan-easy/`](../config/www/floor-plan-easy/) and registered as
a Lovelace resource. It ships two custom elements — a **viewer card** and an
**editor** — plus a card **config element** for the dashboard UI. There is no
build step and no framework dependency: everything is plain JavaScript with
manual DOM, except the config element, which borrows Home Assistant's bundled
LitElement.

## Entry point

[`floor-plan-easy.js`](../config/www/floor-plan-easy/floor-plan-easy.js) is the
resource loaded by Home Assistant. It:

1. Defines the three custom elements:
   - `floor-plan-easy` → `FloorPlanEasyCard` (viewer)
   - `floor-plan-easy-config` → `FloorPlanEasyConfig` (card editor UI)
   - `floor-plan-easy-editor` → `FloorPlanEasyEditor` (full editor)
2. Registers the viewer in `window.customCards` so it appears in the card
   picker. The editor is intentionally **not** listed there (added manually or
   via Browser Mod).

## File layout

```
floor-plan-easy.js          entry point / custom-element registration
model/                      plain data classes (no DOM)
  floor.js                  Floor: grid + tiles, JSON (de)serialization
  tile.js                   Tile: row/col + background/wall/content
  tile-background.js        TileBackground: color or SVG pattern
  tile-wall.js              TileWall: SVG pattern + stroke color
  tile-content.js           TileContent: entity binding, icon/badge, tap action
  editor-state.js           EditorState + EditorMode: active tool + tool settings
storage/
  draft-store.js            DraftStore: localStorage persistence of editor work
ui/
  base-app.js               BaseApp: shared card lifecycle + render loop
  card.js                   FloorPlanEasyCard: read-only viewer
  editor.js                 FloorPlanEasyEditor: interactive editor
  config.js                 FloorPlanEasyConfig: Lit-based card config panel
  floor-renderer.js         FloorRenderer: turns a Floor into grid DOM
  patterns.js               built-in + user-overridable BACKGROUND/WALL patterns
  styles.js                 ensureStyles(): injects the shared stylesheet once
  i18n/
    index.js                localize() / localizeParts(): key → localized string
    en.js                   English strings (mandatory fallback)
    hu.js                   Hungarian strings
  component/
    toolbar.js              editor toolbar (tools, file ops, grid resize)
    tile-entity-dialog.js   bind a tile to an entity (icon/badge, tap action)
    background-settings-dialog.js   pick background color + pattern
    wall-settings-dialog.js         pick wall color + pattern
    save-floor-dialog.js    name + save the current floor
    load-floor-dialog.js    list + load a saved floor
```

An optional user file **outside** this folder —
`config/www/floor-plan-easy-user-patterns.js` (served at
`/local/floor-plan-easy-user-patterns.js`) — can add or override patterns; see
[Patterns](#styles-and-patterns) below.

## Model layer

The model classes are pure data — no DOM, no Home Assistant coupling — which
makes them easy to serialize to/from the backend. Every class has a `toJSON()`
that mirrors its constructor input, so `new Floor(floor.toJSON())` round-trips.

- **`Floor`** — holds `id`, `name`, `version`, `gridWidth`, `gridHeight`, and a
  flat `tiles[]` array. `getTileAt(row, col)` looks up a tile; the
  `addRow*/addColumn*` helpers grow the grid and shift existing tiles when
  space is inserted on the top/left. Requires an `id` (throws otherwise).
- **`Tile`** — a cell at `row`/`col` with an auto-generated `id`
  (`crypto.randomUUID()`) and three optional layers: `background`, `wall`,
  `content`. The constructor rehydrates nested plain objects into their model
  classes, so a tile loaded from JSON has real `TileBackground`/`TileWall`/
  `TileContent` instances.
- **`TileBackground`** — `type: "color" | "pattern"`; a solid `color` and, for
  patterns, an inline SVG string plus `strokeColor`.
- **`TileWall`** — an inline SVG pattern + `strokeColor`.
- **`TileContent`** — an entity binding: `renderType: "icon" | "badge"`,
  optional `icon`, `entity`, and `tapAction: "none" | "toggle" | "more-info"`.
- **`EditorState`** — the editor's transient tool state: the `activeMode` (one
  of `EditorMode`), plus the current background/wall colors and pattern keys and
  a content template. Not persisted.

## UI layer

### `BaseApp` (shared base)

`BaseApp extends HTMLElement` implements the pieces both cards share:

- **Render loop.** `_queueRender()` coalesces work into a single
  `requestAnimationFrame` callback (`_doRender`). `_doRender` builds the DOM
  skeleton once (`_get_html_template()`), creates the `FloorRenderer`, and then
  paints via `_renderFloor()`. If the container has zero width (not laid out
  yet) it re-queues instead of drawing an empty grid.
- **`_renderFloor()`** — the single choke point for painting. It refreshes the
  renderer's `hass` (`setHass`) **before** every render so entity states stay
  live, then calls `renderer.render(floor)`.
- **Resize handling.** A `ResizeObserver` re-queues a render when the element
  resizes, keeping the square tiles crisp.
- **Floor operations.** `newFloor()` creates a blank 4×4 floor; `addTiles(dir)`
  grows the grid; `loadFloor(id)` fetches a floor over WebSocket and falls back
  to an empty floor when the id is unknown (instead of throwing).

Subclasses override `_getMode()` (`"view"` / `"editor"`), `_gridClickHandler()`,
and optionally `_get_html_template()`.

### `FloorPlanEasyCard` (viewer)

The read-only dashboard card. Key behaviour:

- **Load-once.** Both `setConfig` and the `hass` setter call
  `_maybeLoadFloor()`, which only (re)fetches when `config.floor_id` actually
  changes (tracked in `_loadedFloorId`). This matters because Home Assistant
  calls the `hass` setter on **every** state change — without the guard the card
  would hit the backend on every tick.
- **Tap actions.** Clicking a tile with bound content runs its `tapAction`:
  `toggle` calls `homeassistant.toggle`; `more-info` dispatches a
  `hass-more-info` event; `none` does nothing.
- Provides `getConfigElement()` (→ `floor-plan-easy-config`) and
  `getStubConfig()` for the visual card picker.

### `FloorPlanEasyEditor` (editor)

Extends `BaseApp` and adds the toolbar and editing interactions.

- **Startup / recovery.** The constructor calls `_restoreInitialFloor()` instead
  of starting blank. Home Assistant recreates Lovelace cards after long idle
  periods / websocket reconnects, which re-runs the constructor and would
  otherwise wipe in-memory work. Resolution order:
  1. A saved **draft** in `localStorage` (`DraftStore.loadDraft()`) — restored as
     the working floor, preserving unsaved edits. The floor id it belongs to is
     remembered in `_restoredDraftId`.
  2. Otherwise start blank (`newFloor()`) and flag `_pendingLastFloorRestore`; once
     `hass` is ready, `_maybeRestoreLastFloor()` re-fetches a clean copy of the
     last server floor loaded (`DraftStore.loadLastFloorId()`).
  A configured `floor_id` still takes precedence (`_maybeLoadConfiguredFloor`),
  except when it matches `_restoredDraftId` — then the draft is kept so its unsaved
  edits are not clobbered by the server copy.
- **Draft persistence.** `_renderFloor()` is overridden to call `_persistDraft()`
  after painting. Since every mutation funnels through `_renderFloor`, this
  captures all edits. `hass` ticks re-render constantly, so writes are skipped when
  the serialized floor is unchanged (compared against `_lastSavedDraftJSON`).
  `loadFloor()` additionally records the loaded id via `DraftStore.saveLastFloorId`
  for the fallback path. The draft is only cleared when it fails to parse on
  restore — a saved floor keeps its draft so reopening restores the same working
  state.
- `_gridClickHandler` dispatches on the toolbar's `activeMode`: set/clear
  background, set/clear wall, edit/clear content. "Set" modes create a tile if
  the clicked cell is empty (`_ensureTile`) and apply the current tool settings
  via `_applyBackgroundToTile` / `_applyWallToTile`.
- `_doRender` calls `super._doRender()`, then wires the toolbar once and refreshes
  its active-tool highlight.

### `FloorPlanEasyConfig` (card config panel)

The element shown in the dashboard card editor. This is the **only** Lit-based
component; Home Assistant does not export LitElement, so it is borrowed from the
built-in `ha-panel-lovelace` element. The lookup is guarded — if that element is
not defined yet at import time it falls back gracefully instead of throwing and
taking the whole module (and card registration) down with it.

- Loads the floor list once via `list_floors` (`_ensureFloorsLoaded`) and renders
  an `ha-combo-box` to pick `floor_id`, emitting `config-changed`.
- If no floors exist yet, shows an info hint instead of an empty dropdown.
- Renders an **Open editor** button when Browser Mod is available (opens the
  editor in a fullscreen popup, passing the selected `floor_id`); otherwise shows
  a warning with a link to the manual-setup docs.

### `FloorRenderer`

Stateless-ish renderer that converts a `Floor` into grid DOM:

- `_renderGrid` clears the container, sets `grid-template-columns` to the floor
  width, and appends one `.tile` per cell (row-major).
- Each tile paints its layers in z-order: background (solid color or an SVG
  data-URI with `currentColor` swapped for `strokeColor`), then a `.tile-wall`
  overlay, then `.tile-content`.
- Content renders either as an icon button (`ha-icon`, or `ha-state-icon` when
  bound to an entity) or as a badge showing the entity state + unit.
- `setHass(hass)` updates the reference used for live entity state.

### Styles and patterns

- `ensureStyles(hostEl)` injects a single `<style id="floor-plan-easy-styles">`
  into the correct root (the element's `ShadowRoot` if present, else
  `document.head`) and no-ops if it already exists — so styles are added once per
  root regardless of how many dialogs/cards mount.
- `patterns.js` holds the inline SVG templates for backgrounds and walls. They
  use `stroke="currentColor"`, which the renderer replaces with the chosen color
  before encoding as a data URI.
- **User-overridable patterns.** The exported `BACKGROUND_PATTERNS` /
  `WALL_PATTERNS` start as copies of the built-ins and are **mutated in place**
  (`Object.assign`) so every module that imported them keeps seeing the merged
  result — the object references stay stable, no re-import needed. At module load,
  `patterns.js` looks for an optional user file at
  `/local/floor-plan-easy-user-patterns.js` (kept **outside** the package folder so
  a card update never overwrites it) and merges its exports on top: a matching key
  overrides a built-in, a new key adds one. The `patternsReady` promise resolves
  once that merge is done (or the file is absent); the pattern-picker dialogs
  `await patternsReady` before building their grids. Absence is probed with a
  `HEAD` request and logged at `info`; a file that exists but fails to
  load/parse is logged at `warn` so a user syntax error is visible instead of
  silently dropped.

### Internationalization (i18n)

User-facing strings are localized through `ui/i18n/`. There is no framework — just
flat, dot-namespaced string dictionaries and a lookup helper.

- **`localize(key, hass, params?)`** resolves `key` for the client's language and
  optionally substitutes `{token}` placeholders from `params`. The language comes
  from `hass.locale.language` (falling back to `hass.language` for older cores);
  when `hass` is missing (e.g. first paint) it falls back to English.
- **Fallback chain.** The resolved value is looked up in the client's language,
  then its base language (`pt-br` → `pt`), then English, then the raw key. English
  (`en.js`) is the mandatory fallback and **must define every key**; other language
  files may omit keys.
- **`localizeParts(key, hass, tokens)`** is for strings that embed rich content
  (e.g. links). It splits the localized string on `{token}` placeholders and
  interleaves caller-provided values (typically lit templates), returning an array
  the template renders. This keeps a full sentence in one translatable key so each
  language controls word order and where each link lands — preferred over stitching
  several partial keys together. Used for the Browser-Mod warning in `config.js`.
- Dialogs and the toolbar receive `hass` from the editor and pass it into
  `localize`; the config panel uses its own `this._hass`.
- **Adding a language:** create `ui/i18n/<code>.js` exporting a default dict and
  register it in `index.js`'s `TRANSLATIONS` map. Missing keys fall back to English.

## Operational flows

### Viewer render flow

```
HA sets config ──► setConfig ──► _maybeLoadFloor ─(floor_id changed?)─► loadFloor(WS get_floor)
HA sets hass  ──► set hass  ──► _maybeLoadFloor (no-op if unchanged)
                              └► _queueRender ──► rAF ──► _doRender ──► _renderFloor
                                                                         └► renderer.setHass + render
```

On every state change the card re-renders (cheap, rAF-debounced) so entity
badges/icons stay current, but it only re-fetches the floor when `floor_id`
changes.

### Editor edit flow

```
toolbar button ──► EditorState.activeMode = <mode>
tile click     ──► _gridClickHandler(mode)
                     ├─ set:   _ensureTile ─► _applyBackground/Wall/Content ─► _renderFloor
                     └─ clear: tile.<layer> = null ─────────────────────────► _renderFloor
```

Content editing opens `TileEntityDialog`; on its `closed` event the floor is
re-rendered so the new binding shows. Every `_renderFloor` also persists the
working floor to `localStorage` (`_persistDraft`, skipped when unchanged).

### Editor startup / draft recovery flow

```
constructor ──► _restoreInitialFloor
                  ├─ draft in localStorage? ─► new Floor(draft) ─► render (unsaved edits kept)
                  └─ else ─► newFloor() + flag _pendingLastFloorRestore
set hass    ──► _maybeLoadConfiguredFloor  (config.floor_id wins, unless == restored draft)
            └─► _maybeRestoreLastFloor      (no draft & no floor_id: re-fetch last loaded floor)
```

### Save / load flow

```
Save: SaveFloorDialog ─► slugify name → id ─► floor.toJSON() ─► WS save_floor ─► update title
Load: LoadFloorDialog ─► WS list_floors ─► pick ─► root.loadFloor(id) ─► WS get_floor ─► render
```

Both dialogs are created as `ha-dialog` elements appended to `document.body`, and
each cleans itself up on its own `closed` event (guarding against bubbled events
from inner menus/pickers).

## Conventions & gotchas

- **Single render path.** Always paint through `BaseApp._renderFloor()` so the
  renderer's `hass` is refreshed first — calling `renderer.render()` directly
  reintroduces stale entity state.
- **`hass` setter fires constantly.** Any work in a `hass` setter must be cheap
  or guarded; expensive/network work belongs behind a change check (see
  `_maybeLoadFloor`).
- **Model instances, not plain objects.** When mutating a tile layer in the
  editor, assign a model instance (`new TileWall(...)`), not a bare object —
  `Tile.toJSON()` calls `.toJSON()` on each layer.
- **Load-time fragility.** Avoid `customElements.get(...)` at module top level
  without a guard; a throw there aborts the module and can break card
  registration (see `config.js`).
- **Dialogs live on `document.body`**, so `ensureStyles` targets the right root
  and dialogs listen only to their own `closed` event.
- **Localize user-facing strings.** Do not hard-code display text; add a key to
  `i18n/en.js` (and translations) and call `localize(key, hass)`. Pass `hass`
  through to dialogs/toolbar so they can resolve the language. Keep whole sentences
  in one key and use `localizeParts` for embedded links rather than concatenating
  fragments.
- **Persist through `_renderFloor`.** The editor's draft is only saved because
  every mutation renders. New mutation paths must go through `_renderFloor` (not
  `renderer.render` directly) or the change won't be persisted.
- **Stable pattern references.** Never reassign `BACKGROUND_PATTERNS` /
  `WALL_PATTERNS`; mutate in place. Other modules hold the imported reference, and
  the user-pattern loader merges into it asynchronously. Read them only after
  `await patternsReady` when completeness matters.
