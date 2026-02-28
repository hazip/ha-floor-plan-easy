from __future__ import annotations

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant

from .const import DOMAIN, DATA_STORAGE


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/get_floor",
        vol.Required("floor_id"): str,
    }
)
@websocket_api.async_response
async def ws_get_floor(hass: HomeAssistant, connection, msg) -> None:
    storage = hass.data[DOMAIN][DATA_STORAGE]
    floor_id: str = msg["floor_id"]
    data = await storage.async_get_floor(floor_id)
    connection.send_result(msg["id"], {"floor_id": floor_id, "data": data})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/save_floor",
        vol.Required("floor_id"): str,
        vol.Required("data"): dict,
    }
)
@websocket_api.async_response
async def ws_save_floor(hass: HomeAssistant, connection, msg) -> None:
    storage = hass.data[DOMAIN][DATA_STORAGE]
    await storage.async_save_floor(msg["floor_id"], msg["data"])
    connection.send_result(msg["id"], {"ok": True})


# @websocket_api.websocket_command(
#     {
#         vol.Required("type"): f"{DOMAIN}/list_floors",
#     }
# )
# @websocket_api.async_response
# async def ws_list_floors(hass: HomeAssistant, connection, msg) -> None:
#     storage = hass.data[DOMAIN][DATA_STORAGE]
#     floors = await storage.async_list_floors()
#     connection.send_result(msg["id"], {"floors": floors})

@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/list_floors"})
@websocket_api.async_response
async def ws_list_floors(hass, connection, msg):
    storage = hass.data[DOMAIN][DATA_STORAGE]
    floors = await storage.async_list_floors_with_names()
    connection.send_result(msg["id"], {"floors": floors})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/delete_floor",
        vol.Required("floor_id"): str,
    }
)
@websocket_api.async_response
async def ws_delete_floor(hass: HomeAssistant, connection, msg) -> None:
    storage = hass.data[DOMAIN][DATA_STORAGE]
    ok = await storage.async_delete_floor(msg["floor_id"])
    connection.send_result(msg["id"], {"ok": ok})


def async_register_ws(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_get_floor)
    websocket_api.async_register_command(hass, ws_save_floor)
    websocket_api.async_register_command(hass, ws_list_floors)
    websocket_api.async_register_command(hass, ws_delete_floor)
