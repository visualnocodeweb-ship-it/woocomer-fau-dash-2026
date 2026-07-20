import os
import certifi
import json
import base64
import logging
import urllib3
from typing import List, Dict, Any

# Windows: Python often lacks CA bundle for Google OAuth (oauth2.googleapis.com)
os.environ.setdefault("SSL_CERT_FILE", certifi.where())
os.environ.setdefault("REQUESTS_CA_BUNDLE", certifi.where())

import gspread
from gspread.auth import authorize, DEFAULT_SCOPES
from google.oauth2.service_account import Credentials
from google.auth.transport.requests import AuthorizedSession

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GOOGLE_SHEET_ID = "1dn9W-1hxSxPmnUUHDbF_ZG_yzaYlOYFoIO3LqDMGgQw"
SHEET_NAME_UPDATED = "permisos"
SHEET_NAME_STATIC = "permiso-de-pesca-jubilados-65-2025-12-26"
SHEET_NAME_DISCAPACIDAD = "discapacidad"
SHEET_NAME_MALVINAS = "malvinas"


def _needs_ssl_workaround() -> bool:
    if os.getenv("GOOGLE_SHEETS_SSL_INSECURE", "").lower() in ("1", "true", "yes"):
        return True
    try:
        import requests
        requests.get("https://oauth2.googleapis.com", timeout=5, verify=certifi.where())
        return False
    except Exception:
        return True


def _create_gspread_client(credentials_path: str):
    """Authenticate gspread; fallback to verify=False when local SSL CA bundle fails."""
    creds = Credentials.from_service_account_file(credentials_path, scopes=DEFAULT_SCOPES)
    if _needs_ssl_workaround():
        logger.warning("Using SSL workaround for Google Sheets API (verify=False).")
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        session = AuthorizedSession(creds)
        session.verify = False
        return authorize(creds, session=session)
    return gspread.service_account(filename=credentials_path)


def _create_gspread_client_from_dict(credentials_data: dict):
    import tempfile
    corrected_json_str = json.dumps(credentials_data)
    with tempfile.NamedTemporaryFile(mode='w+', delete=False, encoding='utf-8') as temp_file:
        temp_file.write(corrected_json_str)
        temp_credentials_path = temp_file.name
    try:
        return _create_gspread_client(temp_credentials_path)
    finally:
        os.remove(temp_credentials_path)


class GoogleSheetsService:
    def __init__(self):
        self.gc = self._authenticate_gspread()
        self.spreadsheet = self.gc.open_by_key(GOOGLE_SHEET_ID)

    def _authenticate_gspread(self):
        credentials_env = os.getenv("GOOGLE_SHEETS_CREDENTIALS_BASE64")

        logger.info(f"GOOGLE_SHEETS_CREDENTIALS_BASE64 is {'set' if credentials_env else 'NOT SET'}")
        
        if credentials_env:
            try:
                credentials_str = credentials_env.strip()
                credentials_json_str = None
                
                if credentials_str.startswith('{'):
                    try:
                        json.loads(credentials_str, strict=False)
                        credentials_json_str = credentials_str
                        logger.info("GOOGLE_SHEETS_CREDENTIALS_BASE64 was parsed directly as raw JSON.")
                    except json.JSONDecodeError as je:
                        logger.error(f"GOOGLE_SHEETS_CREDENTIALS_BASE64 starts with {{ but is invalid JSON: {je}")
                        logger.error(f"Invalid JSON content: {credentials_str[:500]}")
                        raise
                else:
                    logger.info("Does not start with '{'. Attempting base64 decode.")
                    import re
                    clean_b64_str = re.sub(r'[^A-Za-z0-9+/=]', '', credentials_str)
                    logger.info(f"Cleaned base64 (first 50 chars): {clean_b64_str[:50]}")
                    clean_b64_str += "=" * ((4 - len(clean_b64_str) % 4) % 4)
                    
                    try:
                        decoded_bytes = base64.b64decode(clean_b64_str)
                        credentials_json_str = decoded_bytes.decode('utf-8')
                        logger.info(f"Base64 decoded successfully, length: {len(credentials_json_str)}")
                    except Exception as e:
                        logger.error(f"Error decoding base64: {e}")
                        credentials_json_str = decoded_bytes.decode('utf-8', errors='ignore') if 'decoded_bytes' in locals() else None

                if not credentials_json_str:
                    raise ValueError("Could not obtain valid JSON credentials string.")

                logger.info(f"Credentials string to parse (first 300 chars): {repr(credentials_json_str[:300])}")
                
                credentials_data = json.loads(credentials_json_str, strict=False)
                gc = _create_gspread_client_from_dict(credentials_data)
                logger.info("Successfully authenticated with Google Sheets API using GOOGLE_SHEETS_CREDENTIALS_BASE64 via temporary file.")
                return gc
            except Exception as e:
                logger.error(f"Error with GOOGLE_SHEETS_CREDENTIALS_BASE64: {e}. Falling back to file.")
        
        try:
            script_dir = os.path.dirname(__file__)
            credentials_path = os.path.join(script_dir, "credentials.json")

            if not os.path.exists(credentials_path):
                raise FileNotFoundError(f"credentials.json not found at {credentials_path}")

            gc = _create_gspread_client(credentials_path)
            logger.info("Successfully authenticated with Google Sheets API using credentials.json.")
            return gc
        except Exception as e:
            logger.error(f"Error authenticating with Google Sheets API: {e}")
            raise

    def _get_all_records_from_sheet(self, worksheet_name: str) -> List[List[str]]:
        try:
            worksheet = self.spreadsheet.worksheet(worksheet_name)
            all_value = worksheet.get_all_values()
            
            if not all_value:
                return []
            
            data_rows = all_value[1:]
            completed_records = [row for row in data_rows if row and row[0].strip()]
            
            logger.info(f"Fetched {len(completed_records)} completed records from '{worksheet_name}'.")
            return completed_records
        except gspread.exceptions.WorksheetNotFound:
            logger.error(f"Worksheet '{worksheet_name}' not found in spreadsheet with ID '{GOOGLE_SHEET_ID}'. Please ensure the sheet name is correct and the service account has access.")
            return []
        except Exception as e:
            logger.error(f"Error fetching records from worksheet '{worksheet_name}': {e}")
            return []

    def get_categorized_sheets_data(self) -> Dict[str, Any]:
        categorized_counts: Dict[str, int] = {
            "Residentes mayores de 65 años": 0,
            "jubilados": 0,
            "menores hasta 12 años": 0,
            "personas con discapacidad": 0,
            "Otros Permisos Google Sheets": 0,
            "Jubilados Google Sheets": 0,
            "Permisos Discapacidad": 0
        }

        updated_records = self._get_all_records_from_sheet(SHEET_NAME_UPDATED)
        for record in updated_records:
            if not record: continue
            
            is_enviado = len(record) > 12 and record[12].strip().lower() == "enviado"
            has_no_jubilado_carnet = len(record) <= 11 or not record[11].strip()
            
            if is_enviado and has_no_jubilado_carnet:
                categorized_counts["Otros Permisos Google Sheets"] += 1
            elif is_enviado:
                categorized_counts["jubilados"] += 1
        
        static_records = self._get_all_records_from_sheet(SHEET_NAME_STATIC)
        categorized_counts["Jubilados Google Sheets"] += len(static_records)

        discapacidad_records = self._get_all_records_from_sheet(SHEET_NAME_DISCAPACIDAD)
        logger.warning(f"DEBUG: Fetched {len(discapacidad_records)} records from 'discapacidad' sheet.")
        categorized_counts["Permisos Discapacidad"] += len(discapacidad_records)

        malvinas_records = self._get_all_records_from_sheet(SHEET_NAME_MALVINAS)
        logger.warning(f"DEBUG: Fetched {len(malvinas_records)} records from 'malvinas' sheet.")
        categorized_counts["Ex-combatientes Malvinas"] = len(malvinas_records)

        total_updated_sheet_rows = len(updated_records)
        total_static_sheet_rows = len(static_records)

        consolidated_permits_count = (
            categorized_counts["Residentes mayores de 65 años"] +
            categorized_counts["jubilados"] +
            categorized_counts["menores hasta 12 años"] +
            categorized_counts["personas con discapacidad"] +
            categorized_counts["Jubilados Google Sheets"] +
            categorized_counts["Permisos Discapacidad"] +
            categorized_counts.get("Ex-combatientes Malvinas", 0)
        )
        categorized_counts["Residentes mayores de 65 años, jubilados, menores hasta 12 años y personas con discapacidad"] = consolidated_permits_count
        
        # Collect the last 5 registrations from the sheet (which represent the latest ones)
        latest_free_regs = []
        for record in reversed(updated_records):
            if len(latest_free_regs) >= 5:
                break
            if not record:
                continue
            is_enviado = len(record) > 12 and record[12].strip().lower() == "enviado"
            if is_enviado:
                first_name = record[0] if len(record) > 0 else ""
                last_name = record[1] if len(record) > 1 else ""
                full_name = f"{first_name} {last_name}".strip() or "Sin Nombre"
                timestamp = record[14] if len(record) > 14 else ""
                has_no_jubilado_carnet = len(record) <= 11 or not record[11].strip()
                type_str = "Menor/Otros" if has_no_jubilado_carnet else "Jubilado"
                
                latest_free_regs.append({
                    "name": full_name,
                    "timestamp": timestamp,
                    "type": type_str
                })

        # Calculate live sheet stats for the user's dashboard (Total, Enviados, Pendientes)
        live_total = len(updated_records)
        live_enviados = 0
        for record in updated_records:
            if not record: continue
            is_enviado = len(record) > 12 and record[12].strip().lower() == "enviado"
            if is_enviado:
                live_enviados += 1
        live_pendientes = live_total - live_enviados

        logger.warning(f"DEBUG: Final categorized_counts before return: {categorized_counts}")

        return {
            "updated_sheet_total_count": total_updated_sheet_rows,
            "static_sheet_total_count": total_static_sheet_rows,
            "categorized_sheets_counts": categorized_counts,
            "latest_free_registrations": latest_free_regs,
            "live_free_total": live_total,
            "live_free_enviados": live_enviados,
            "live_free_pendientes": live_pendientes
        }