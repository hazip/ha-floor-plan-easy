from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import STORAGE_KEY, STORAGE_VERSION


class FloorPlanStorage:
    """Simple storage: { "floors": { "<floor_id>": <floor_json> } }"""

    def __init__(self, hass: HomeAssistant) -> None:
        self._hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._data: dict[str, Any] = {"floors": {}}
        self._loaded = False

    async def async_load(self) -> None:
        if self._loaded:
            return
        loaded = await self._store.async_load()
        if isinstance(loaded, dict):
            self._data = loaded
            self._data.setdefault("floors", {})
        self._loaded = True

    def _schedule_save(self) -> None:
        # Debounce-friendly: HA maga időzíti
        self._store.async_delay_save(lambda: self._data, delay=1.0)

    async def async_get_floor(self, floor_id: str) -> dict[str, Any] | None:
        await self.async_load()
        floors: dict[str, Any] = self._data["floors"]
        val = floors.get(floor_id)
        return val if isinstance(val, dict) else None

    async def async_save_floor(self, floor_id: str, data: dict[str, Any]) -> None:
        await self.async_load()
        self._data["floors"][floor_id] = data
        self._schedule_save()

    async def async_list_floors(self) -> list[str]:
        await self.async_load()
        floors: dict[str, Any] = self._data["floors"]
        return sorted(floors.keys())
    
    async def async_list_floors_with_names(self) -> list[dict]:
        await self.async_load()
        floors: dict = self._data.get("floors", {})
        out: list[dict] = []
        for floor_id, data in floors.items():
            name = floor_id
            if isinstance(data, dict):
                name = data.get("name") or floor_id
            out.append({"id": floor_id, "name": name})
        out.sort(key=lambda x: x["name"].lower())
        return out

    async def async_delete_floor(self, floor_id: str) -> bool:
        await self.async_load()
        floors: dict[str, Any] = self._data["floors"]
        existed = floor_id in floors
        floors.pop(floor_id, None)
        if existed:
            self._schedule_save()
        return existed
