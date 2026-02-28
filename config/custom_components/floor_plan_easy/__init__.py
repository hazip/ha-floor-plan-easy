from __future__ import annotations

from homeassistant.core import HomeAssistant

from .const import DOMAIN, DATA_STORAGE
from .storage import FloorPlanStorage
from .websocket import async_register_ws


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    storage = FloorPlanStorage(hass)
    await storage.async_load()

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][DATA_STORAGE] = storage

    async_register_ws(hass)
    return True
