# Floor Plan Easy

A floor plan editor and viewer for Home Assistant. It provides a Lovelace card
that renders an interactive floor plan on your dashboard, and an editor for
drawing floors, placing walls, and binding tiles to entities. Floors are saved
to and loaded from a backend integration, so your layouts persist across
restarts and devices.

The project ships two frontend cards:

- **`floor-plan-easy`** — the viewer card you place on a dashboard.
- **`floor-plan-easy-editor`** — the full editor (opened via Browser Mod, or
  added manually as its own card).

---

## Requirements

- Home Assistant (tested against `2025.2`).
- Access to your Home Assistant `config` directory (to install the integration
  and frontend files).
- Optional: the [Browser Mod](https://github.com/thomasloven/hass-browser_mod)
  integration, if you want to launch the editor directly from the card's
  configuration panel.

---

## Installation

### 1. Install the backend integration

Copy the integration into your Home Assistant `custom_components` folder:

```
config/custom_components/floor_plan_easy/
```

Then enable it by adding this line to your `configuration.yaml`:

```yaml
floor_plan_easy:
```

Restart Home Assistant. The integration registers the WebSocket API used to
list, save, and load floors.

### 2. Install the frontend files

Copy the frontend folder into your Home Assistant `www` directory:

```
config/www/floor-plan-easy/
```

Files under `www` are served at the `/local/` path, so the card entry point
becomes:

```
/local/floor-plan-easy/floor-plan-easy.js
```

### 3. Register the Lovelace resource

Go to **Settings → Dashboards → ⋮ (top right) → Resources**, then add:

- **URL:** `/local/floor-plan-easy/floor-plan-easy.js`
- **Resource type:** **JavaScript Module**

> The card uses ES module imports, so it **must** be registered as a *module*,
> not a plain JavaScript file.

If the card doesn't show up after adding the resource, do a hard refresh
(`Cmd/Ctrl + Shift + R`). Home Assistant caches frontend resources
aggressively; you may need to bypass the service worker (DevTools → Application
→ Service Workers → *Bypass for network*) while developing.

---

## Adding the viewer card to a dashboard

1. Open your dashboard and enter **Edit dashboard** mode.
2. On the modern **sections** layout, create a **section** first — the card
   picker lives inside a section.
3. Choose **Add card**, scroll to the bottom (or search for `floor`), and pick
   **Floor Plan Easy**.
4. In the card's configuration panel, select a **Floor** from the dropdown.

Or add it manually as YAML:

```yaml
type: custom:floor-plan-easy
floor_id: ground
```

If no floors have been defined yet, the configuration panel shows a hint
instead of an empty dropdown — create your first floor with the editor
(see below), then come back and select it.

---

## Using the editor

The editor lets you draw the floor grid, place walls and backgrounds, and bind
tiles to entities. There are **two ways** to open it.

### Option A — Browser Mod (recommended)

If the [Browser Mod](https://github.com/thomasloven/hass-browser_mod)
integration is installed, the viewer card's configuration panel shows an
**"Open editor"** button. Clicking it opens the editor in a fullscreen popup —
no extra dashboard card required.

### Option B — Add the editor as a card manually

If you don't want to install Browser Mod, you can place the editor directly on
a dashboard as its own card. It is fully functional on its own: it starts with
an empty floor and has a toolbar for loading and saving floors.

1. Enter **Edit dashboard** mode.
2. Create a new **view (tab)** for the editor to keep it separate from your
   normal cards.
3. In that view choose **Add card → Manual** (the YAML card).
4. Paste:

   ```yaml
   type: custom:floor-plan-easy-editor
   ```

5. Save. Use the editor's toolbar to load an existing floor or save your work.

> The editor card is intentionally **not** listed in the visual card picker,
> to avoid confusing users with two similar-looking cards. Add it via the
> Manual/YAML card as shown above.

A copy of these editor instructions is also bundled with the frontend and
available offline at `/local/floor-plan-easy/docs.html`.

---

## Tap actions

Tiles bound to an entity support a tap action:

- **`toggle`** — calls `homeassistant.toggle` on the entity.
- **`more-info`** — opens the entity's more-info dialog.
- **`none`** — does nothing.

---

## Troubleshooting

- **Card missing from the picker:** the frontend JS failed to load or is
  cached. Hard refresh, and check the browser console for errors around
  `floor-plan-easy.js`.
- **Changes not showing after editing frontend files:** the service worker is
  serving a cached module. Open the changed file directly (e.g.
  `/local/floor-plan-easy/ui/config.js`) and hard refresh it, then reload the
  dashboard. During development, keeping DevTools open with *Disable cache*
  enabled avoids this.
- **No "Open editor" button:** Browser Mod is not installed. Either install it,
  or use the manual editor card (Option B).
