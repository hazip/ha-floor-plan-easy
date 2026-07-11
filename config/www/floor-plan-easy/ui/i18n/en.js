// English strings — the mandatory fallback. Every other language file may omit
// keys; missing keys fall back to the value here. Keys are flat and
// dot-namespaced by area (see index.js → localize).
export default {
  // App / window title
  "app.empty_project": "EMPTY PROJECT",

  // Shared across multiple places
  "common.cancel": "Cancel",
  "common.apply": "Apply",
  "common.save": "Save",
  "common.load": "Load",
  "common.none": "None",
  "common.pattern": "Pattern",
  "common.floor": "Floor",
  "common.documentation": "documentation",

  // Config panel (card editor)
  "config.loading_hass": "Loading hass…",
  "config.loading_floors": "Loading floors…",
  "config.floors_load_failed": "Failed to load floors.",
  "config.no_floors": "No floors have been defined yet. Open the editor below to create and save your first floor, then select it here.",
  "config.open_editor": "Open editor",
  "config.editor_popup_title": "Floor Plan Editor",
  "config.browser_mod.message": "The floor plan editor requires the {browserMod} integration, which is not installed. Install and set it up to open the editor from here. Alternatively, you can add the editor as a separate card manually — see the {docs}.",

  // Toolbar sections (aria-labels)
  "toolbar.section.file": "File",
  "toolbar.section.background": "Background tools",
  "toolbar.section.wall": "Wall tools",
  "toolbar.section.tile": "Tile tools",
  "toolbar.section.resize": "Grid resize",

  // Toolbar buttons (tooltips)
  "toolbar.file.new": "New floorplan",
  "toolbar.file.save": "Save floorplan",
  "toolbar.file.load": "Load floorplan",
  "toolbar.bg.set": "Set background",
  "toolbar.bg.settings": "Background settings",
  "toolbar.bg.clear": "Clear background",
  "toolbar.wall.set": "Set wall",
  "toolbar.wall.settings": "Wall settings",
  "toolbar.wall.clear": "Clear wall",
  "toolbar.tile.edit": "Edit tile content",
  "toolbar.tile.clear": "Clear tile content",
  "toolbar.resize.add_col_left": "Add column left",
  "toolbar.resize.add_col_right": "Add column right",
  "toolbar.resize.add_row_top": "Add row top",
  "toolbar.resize.add_row_bottom": "Add row bottom",

  // Background settings dialog
  "bg_dialog.heading": "Background settings",
  "bg_dialog.fg_color": "FG color",
  "bg_dialog.bg_color": "BG color",

  // Wall settings dialog
  "wall_dialog.heading": "Wall settings",
  "wall_dialog.color": "Wall color",

  // Save floorplan dialog
  "save_dialog.heading": "Save floorplan",
  "save_dialog.id": "Id",
  "save_dialog.id_helper": "Generated from Name",
  "save_dialog.name": "Name",
  "save_dialog.save_as": "Save as",
  "save_dialog.save_failed": "Failed to save. Please try again.",

  // Load floorplan dialog
  "load_dialog.heading": "Load floorplan",
  "load_dialog.loading": "Loading floors…",
  "load_dialog.loading_one": 'Loading "{name}"…',
  "load_dialog.none": "No saved floors found.",
  "load_dialog.select": "Select a floor to load:",
  "load_dialog.failed": "Failed to load floors.",

  // Tile content dialog
  "tile_dialog.heading": "Edit tile content ({col}, {row})",
  "tile_dialog.entity": "Entity",
  "tile_dialog.tap_action": "Tap action",
  "tile_dialog.action.none": "Do nothing",
  "tile_dialog.action.toggle": "Toggle",
  "tile_dialog.action.more_info": "More info",
  "tile_dialog.icon": "Icon",
  "tile_dialog.render_as": "Render as",
  "tile_dialog.render.icon": "Icon",
  "tile_dialog.render.badge": "Badge",
};
