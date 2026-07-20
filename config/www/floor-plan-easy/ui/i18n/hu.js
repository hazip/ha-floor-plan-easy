// Magyar fordítás. Hiányzó kulcsok az angol (en.js) értékére esnek vissza.
export default {
  // Alkalmazás / ablakcím
  "app.empty_project": "ÜRES PROJEKT",

  // Mintaválasztó csoportcímek
  "group.other": "Egyéb",
  "group.bg.indoor": "Beltér",
  "group.bg.outdoor": "Kültér",
  "group.wall.wall": "Fal",
  "group.wall.opening": "Falnyílás",
  "group.object.doors_inner": "Ajtók falon belül",
  "group.object.doors_outer": "Ajtók falon kívül",
  "group.object.windows": "Ablakok",
  "group.object.furniture": "Berendezési tárgyak",
  "group.object.stairs": "Lépcsők",

  // Több helyen közös
  "common.cancel": "Mégse",
  "common.apply": "Alkalmaz",
  "common.save": "Mentés",
  "common.load": "Betöltés",
  "common.none": "Nincs",
  "common.pattern": "Minta",
  "common.floor": "Szint",
  "common.documentation": "dokumentációt",
  "common.save_color": "Szín mentése",
  "common.remove_color": "Szín eltávolítása",

  // Konfigurációs panel (kártyaszerkesztő)
  "config.loading_hass": "hass betöltése…",
  "config.loading_floors": "Szintek betöltése…",
  "config.floors_load_failed": "Nem sikerült betölteni a szinteket.",
  "config.no_floors": "Még nincs létrehozva egyetlen szint sem. Nyisd meg lent a szerkesztőt az első szint létrehozásához és mentéséhez, majd válaszd ki itt.",
  "config.open_editor": "Szerkesztő megnyitása",
  "config.editor_popup_title": "Alaprajz-szerkesztő",
  "config.browser_mod.message": "Az alaprajz-szerkesztőhöz szükséges a {browserMod} integráció, ami jelenleg nincs telepítve. Telepítsd és állítsd be, hogy innen megnyithasd a szerkesztőt. Alternatívaként külön kártyaként is felveheted a szerkesztőt kézzel — lásd a {docs}.",

  // Eszköztár szekciók (aria-label)
  "toolbar.section.file": "Fájl",
  "toolbar.section.background": "Háttér eszközök",
  "toolbar.section.wall": "Fal eszközök",
  "toolbar.section.object": "Objektum eszközök",
  "toolbar.section.tile": "Csempe eszközök",
  "toolbar.section.resize": "Rács átméretezése",

  // Eszköztár gombok (tooltipek)
  "toolbar.file.new": "Új alaprajz",
  "toolbar.file.save": "Alaprajz mentése",
  "toolbar.file.load": "Alaprajz betöltése",
  "toolbar.file.more_save": "További mentési lehetőségek",
  "toolbar.file.more_open": "További megnyitási lehetőségek",
  "toolbar.file.download": "Letöltés JSON-ként",
  "toolbar.file.upload": "Feltöltés JSON-ból",
  "toolbar.file.upload_failed": "A fájl nem olvasható. Nem érvényes FloorPlan Easy exportfájl.",
  "toolbar.bg.set": "Háttér beállítása",
  "toolbar.bg.settings": "Háttérbeállítások",
  "toolbar.bg.clear": "Háttér törlése",
  "toolbar.wall.set": "Fal beállítása",
  "toolbar.wall.settings": "Falbeállítások",
  "toolbar.wall.clear": "Fal törlése",
  "toolbar.object.set": "Objektum beállítása",
  "toolbar.object.settings": "Objektumbeállítások",
  "toolbar.object.clear": "Objektum törlése",
  "toolbar.tile.edit": "Csempe tartalmának szerkesztése",
  "toolbar.tile.clear": "Csempe tartalmának törlése",
  "toolbar.resize.add_col_left": "Oszlop hozzáadása balra",
  "toolbar.resize.add_col_right": "Oszlop hozzáadása jobbra",
  "toolbar.resize.add_row_top": "Sor hozzáadása felülre",
  "toolbar.resize.add_row_bottom": "Sor hozzáadása alulra",

  // Háttérbeállítások párbeszédablak
  "bg_dialog.heading": "Háttérbeállítások",
  "bg_dialog.fg_color": "Előtérszín",
  "bg_dialog.bg_color": "Háttérszín",

  // Falbeállítások párbeszédablak
  "wall_dialog.heading": "Falbeállítások",
  "wall_dialog.color": "Fal színe",

  // Falminták nevei (csempe tooltip). A nyílásokat csak a szélességük nevezi
  // meg — nincs ajtó/ablak szöveg.
  "pattern.opening-narrow-top": "Szűk nyílás (fent)",
  "pattern.opening-narrow-right": "Szűk nyílás (jobb)",
  "pattern.opening-narrow-bottom": "Szűk nyílás (lent)",
  "pattern.opening-narrow-left": "Szűk nyílás (bal)",
  "pattern.opening-wide-top": "Széles nyílás (fent)",
  "pattern.opening-wide-right": "Széles nyílás (jobb)",
  "pattern.opening-wide-bottom": "Széles nyílás (lent)",
  "pattern.opening-wide-left": "Széles nyílás (bal)",

  // Objektumbeállítások párbeszédablak
  "object_dialog.heading": "Objektumbeállítások",
  "object_dialog.color": "Objektum színe",

  // Alaprajz mentése párbeszédablak
  "save_dialog.heading": "Alaprajz mentése",
  "save_dialog.name": "Név",
  "save_dialog.save_as": "Mentés másként",
  "save_dialog.save_failed": "A mentés nem sikerült. Próbáld újra.",

  // Alaprajz betöltése párbeszédablak
  "load_dialog.heading": "Alaprajz betöltése",
  "load_dialog.loading": "Szintek betöltése…",
  "load_dialog.loading_one": '„{name}” betöltése…',
  "load_dialog.none": "Nincs mentett szint.",
  "load_dialog.select": "Válassz egy betöltendő szintet:",
  "load_dialog.failed": "Nem sikerült betölteni a szinteket.",

  // Csempe tartalma párbeszédablak
  "tile_dialog.heading": "Csempe tartalmának szerkesztése ({col}, {row})",
  "tile_dialog.entity": "Entitás",
  "tile_dialog.tap_action": "Koppintási művelet",
  "tile_dialog.action.none": "Ne csináljon semmit",
  "tile_dialog.action.toggle": "Kapcsolás",
  "tile_dialog.action.more_info": "További információ",
  "tile_dialog.icon": "Ikon",
  "tile_dialog.render_as": "Megjelenítés",
  "tile_dialog.render.icon": "Ikon",
  "tile_dialog.render.badge": "Jelvény",
};
