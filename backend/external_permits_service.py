import logging
from datetime import datetime
from typing import Any, Dict

import requests

SIN_CARGO_NUEVOS_URL = "https://sin-cargo-permisos.onrender.com/api/get-analysis-data"
DISCAPACIDAD_URL = "https://discapacidad-pesca.onrender.com/api/get-analysis-data"

external_permits_data: Dict[str, Dict[str, Any]] = {
    "sin_cargo_nuevos": {
        "label": "Sin Cargo Nuevos",
        "source_url": SIN_CARGO_NUEVOS_URL,
        "total_permisos": 0,
        "total_enviados": 0,
        "total_pendientes": 0,
        "last_sync_time": None,
        "error": None,
    },
    "discapacidad": {
        "label": "Discapacidad",
        "source_url": DISCAPACIDAD_URL,
        "total_permisos": 0,
        "total_enviados": 0,
        "total_pendientes": 0,
        "last_sync_time": None,
        "error": None,
    },
}


def _fetch_analysis(url: str) -> Dict[str, int]:
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    data = response.json()
    return {
        "total_permisos": int(data.get("total_permisos", 0) or 0),
        "total_enviados": int(data.get("total_enviados", 0) or 0),
        "total_pendientes": int(data.get("total_pendientes", 0) or 0),
    }


def sync_external_permits() -> None:
    sources = {
        "sin_cargo_nuevos": SIN_CARGO_NUEVOS_URL,
        "discapacidad": DISCAPACIDAD_URL,
    }

    for key, url in sources.items():
        try:
            stats = _fetch_analysis(url)
            external_permits_data[key].update(stats)
            external_permits_data[key]["error"] = None
            external_permits_data[key]["last_sync_time"] = datetime.now()
            logging.warning(
                f"External permits sync ({key}): "
                f"enviados={stats['total_enviados']}, total={stats['total_permisos']}"
            )
        except Exception as exc:
            logging.error(f"Error syncing external permits ({key}): {exc}")
            external_permits_data[key]["error"] = str(exc)


def get_external_permits_stats() -> Dict[str, Any]:
    payload = {}
    for key, data in external_permits_data.items():
        last_sync = data.get("last_sync_time")
        payload[key] = {
            "label": data["label"],
            "source_url": data["source_url"],
            "total_permisos": data["total_permisos"],
            "total_enviados": data["total_enviados"],
            "total_pendientes": data["total_pendientes"],
            "last_sync_time": last_sync.isoformat() if last_sync else None,
            "error": data["error"],
        }
    return payload
