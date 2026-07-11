# Backend Architecture

The backend is a small Home Assistant custom integration living in
[`config/custom_components/floor_plan_easy/`](../config/custom_components/floor_plan_easy/).
Its only job is to **persist floor plans** and expose them to the frontend cards
over Home Assistant's WebSocket API. It has no entities, no config flow, and no
device or cloud interaction — it is a pure storage service.

## File layout

| File | Responsibility |
| --- | --- |
| `__init__.py` | Integration setup: create the storage, stash it in `hass.data`, register the WebSocket commands. |
| `const.py` | Shared constants (domain, storage key/version, `hass.data` keys). |
| `storage.py` | `FloorPlanStorage` — a thin wrapper over HA's `Store` helper that reads/writes floors. |
| `websocket.py` | The four WebSocket command handlers and their registration. |
| `manifest.json` | Integration metadata (domain, dependencies, `integration_type: service`). |

## Startup flow

The integration is loaded via YAML — the user adds `floor_plan_easy:` to
`configuration.yaml`. Because it accepts no options, it declares
`CONFIG_SCHEMA = cv.empty_config_schema(DOMAIN)` so Home Assistant does not emit
a configuration-schema deprecation warning.

On startup `async_setup` runs:

1. Constructs a `FloorPlanStorage` and awaits `async_load()` so existing data is
   in memory before any request arrives.
2. Stores the instance under `hass.data[DOMAIN][DATA_STORAGE]`, the canonical HA
   place for per-integration runtime objects.
3. Calls `register_ws(hass)` to register the WebSocket commands.

`register_ws` is a `@callback` (it does no `await`), and the integration lists
`websocket_api` in its manifest `dependencies` to guarantee that component is
loaded first.

```
configuration.yaml (floor_plan_easy:)
        │
        ▼
async_setup ──► FloorPlanStorage.async_load()  ──► hass.data[DOMAIN][DATA_STORAGE]
        │
        └──────► register_ws()  ──► 4 websocket commands
```

## Storage layer (`storage.py`)

`FloorPlanStorage` wraps `homeassistant.helpers.storage.Store`, which handles
the JSON file on disk (`.storage/floor_plan_easy.storage`), versioning, and
atomic writes. The in-memory shape is:

```json
{ "floors": { "<floor_id>": { "name": "...", ... } } }
```

Key points:

- **Lazy, one-shot load with a lock.** `async_load()` is guarded by an
  `asyncio.Lock` with a double `_loaded` check, so concurrent callers (e.g. two
  WebSocket commands firing at startup) never trigger a redundant disk read.
- **Debounced saves.** Mutations call `_schedule_save()`, which uses
  `Store.async_delay_save(..., delay=1.0)`. Home Assistant coalesces rapid saves
  within the delay window and flushes on shutdown, so a burst of edits results
  in a single write.
- **Defensive reads.** `async_get_floor` returns the stored dict or `None` if the
  id is unknown or the value is not a dict. `async_list_floors_with_names`
  coerces the display `name` to `str` and falls back to the floor id, so a
  malformed stored value cannot crash the listing/sort.

### Public methods

| Method | Description |
| --- | --- |
| `async_load()` | Load data from disk once; safe to call repeatedly. |
| `async_get_floor(floor_id)` | Return a floor's data dict, or `None`. |
| `async_save_floor(floor_id, data)` | Store/overwrite a floor and schedule a save. |
| `async_list_floors()` | Sorted list of floor ids. |
| `async_list_floors_with_names()` | Sorted list of `{"id", "name"}`, ordered by name (case-insensitive). |
| `async_delete_floor(floor_id)` | Remove a floor; returns whether it existed. |

## WebSocket API (`websocket.py`)

All commands are namespaced under the domain and validated with `voluptuous`
schemas. Each handler is an `@websocket_api.async_response` coroutine that reads
the storage from `hass.data` and replies via `connection.send_result`.

### `floor_plan_easy/get_floor`

Fetch a single floor.

- **Request:** `{ "type": "floor_plan_easy/get_floor", "floor_id": str }`
- **Result:** `{ "floor_id": str, "data": <floor|null> }` — `data` is `null` when
  the floor does not exist (the frontend treats this as "empty/new floor").

### `floor_plan_easy/save_floor`

Create or overwrite a floor.

- **Request:** `{ "type": "floor_plan_easy/save_floor", "floor_id": str, "data": dict }`
- **Result:** `{ "ok": true }`

### `floor_plan_easy/list_floors`

List all floors for pickers/dropdowns.

- **Request:** `{ "type": "floor_plan_easy/list_floors" }`
- **Result:** `{ "floors": [ { "id": str, "name": str }, ... ] }` — sorted by name.

### `floor_plan_easy/delete_floor`

Delete a floor. Idempotent — deleting a missing floor is not an error.

- **Request:** `{ "type": "floor_plan_easy/delete_floor", "floor_id": str }`
- **Result:** `{ "ok": true, "deleted": <bool> }` — `deleted` reports whether a
  floor actually existed and was removed.

## Design notes

- **No config flow / no entities.** The integration is a storage service, hence
  `integration_type: "service"` in the manifest. It is intentionally minimal.
- **The `data` blob is opaque to the backend.** The floor JSON structure (grid,
  walls, tiles, entity bindings) is owned by the frontend model layer under
  `config/www/floor-plan-easy/model/`. The backend only enforces that it is a
  dict and stores it verbatim, so the schema can evolve on the frontend without
  backend changes.
- **Single event loop.** All access happens on Home Assistant's event loop, so
  the in-memory `_data` needs no locking beyond the load guard.

## Extending the backend

To add a new WebSocket command:

1. Add a storage method on `FloorPlanStorage` if new persistence is needed.
2. Write an `@websocket_api.websocket_command({...})` +
   `@websocket_api.async_response` handler in `websocket.py`, with full type
   hints (`HomeAssistant`, `websocket_api.ActiveConnection`, `dict[str, Any]`).
3. Register it inside `register_ws`.
4. Bump `STORAGE_VERSION` in `const.py` (and add a migration in
   `Store`) only if the on-disk schema changes incompatibly.
