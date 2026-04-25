import os
import json
import base64
import gspread
import logging
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Google Sheet ID and worksheet names
GOOGLE_SHEET_ID = "1dn9W-1hxSxPmnUUHDbF_ZG_yzaYlOYFoIO3LqDMGgQw"
SHEET_NAME_UPDATED = "permisos"
SHEET_NAME_STATIC = "permiso-de-pesca-jubilados-65-2025-12-26"
SHEET_NAME_DISCAPACIDAD = "discapacidad"
SHEET_NAME_MALVINAS = "malvinas"

class GoogleSheetsService:
    def __init__(self):
        self.gc = self._authenticate_gspread()
        self.spreadsheet = self.gc.open_by_key(GOOGLE_SHEET_ID)

    def _authenticate_gspread(self):
        """Authenticates with Google Sheets API using service account credentials from environment variable or file."""
        credentials_env = os.getenv("GOOGLE_SHEETS_CREDENTIALS_BASE64")

        if credentials_env:
            logger.info(f"Raw GOOGLE_SHEETS_CREDENTIALS_BASE64 from env: {credentials_env[:50]}...") # Log first 50 chars for brevity
            temp_credentials_path = None
            try:
                credentials_str = credentials_env.strip()
                
                # Comprobar si el usuario pegó el JSON en crudo en lugar de base64
                if credentials_str.startswith('{'):
                    logger.info("Environment variable appears to be raw JSON. Parsing directly without base64 decode.")
                    credentials_json_str = credentials_str
                else:
                    logger.info("Attempting base64 decode.")
                    # Limpiar espacios o saltos de línea accidentales
                    import re
                    clean_b64_str = re.sub(r'\s+', '', credentials_str)
                    
                    # Corregir el padding (relleno)
                    clean_b64_str += "=" * ((4 - len(clean_b64_str) % 4) % 4)
                    
                    credentials_json_str = base64.b64decode(clean_b64_str).decode('utf-8')
                logger.info(f"Full credentials_json_str after base64 decode: {credentials_json_str}") # Log full string
                
                # Parse the string into a JSON object and then dump it back
                # This ensures proper escaping of special characters like backslashes.
                credentials_data = json.loads(credentials_json_str)
                corrected_json_str = json.dumps(credentials_data)

                # Create a temporary file to store the credentials
                import tempfile
                with tempfile.NamedTemporaryFile(mode='w+', delete=False, encoding='utf-8') as temp_file:
                    temp_file.write(corrected_json_str)
                    temp_credentials_path = temp_file.name
                
                gc = gspread.service_account(filename=temp_credentials_path)
                logger.info("Successfully authenticated with Google Sheets API using GOOGLE_SHEETS_CREDENTIALS_BASE64 via temporary file.")
                return gc
            except Exception as e:
                logger.error(f"Error authenticating with Google Sheets API using GOOGLE_SHEETS_CREDENTIALS_BASE64: {e}")
                raise
            finally:
                if temp_credentials_path and os.path.exists(temp_credentials_path):
                    os.remove(temp_credentials_path) # Clean up the temporary file
        else:
            # Fallback to file-based authentication if environment variable is not set
            try:
                script_dir = os.path.dirname(__file__)
                credentials_path = os.path.join(script_dir, "credentials.json")

                if not os.path.exists(credentials_path):
                    raise FileNotFoundError(f"credentials.json not found at {credentials_path}")

                gc = gspread.service_account(filename=credentials_path)
                logger.info("Successfully authenticated with Google Sheets API using credentials.json.")
                return gc
            except Exception as e:
                logger.error(f"Error authenticating with Google Sheets API: {e}")
                raise

    def _get_all_records_from_sheet(self, worksheet_name: str) -> List[List[str]]:
        """Fetches all non-empty rows from a worksheet, excluding the header."""
        try:
            worksheet = self.spreadsheet.worksheet(worksheet_name)
            # Get all values
            all_values = worksheet.get_all_values()
            
            if not all_values:
                return []
            
            # Assuming the first row is a header, so start from the second row
            data_rows = all_values[1:]
            
            # Filter out rows where the first column is empty (considering it a completed row)
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
        """
        Fetches data from both sheets, categorizes them, and returns counts.
        Categorization for 'permisos actualizados' is based on keywords in the first column.
        """
        categorized_counts: Dict[str, int] = {
            "Residentes mayores de 65 años": 0,
            "jubilados": 0,
            "menores hasta 12 años": 0,
            "personas con discapacidad": 0,
            "Otros Permisos Google Sheets": 0, # Catch-all for updated sheet
            "Jubilados Google Sheets": 0, # For the static sheet
            "Permisos Discapacidad": 0 # New category for the discapacidad sheet
        }

        # Process 'permisos' sheet (formerly 'permisos actualizados')
        updated_records = self._get_all_records_from_sheet(SHEET_NAME_UPDATED)
        for record in updated_records:
            if not record: continue
            
            # Match the criteria for 'Sin cargo' from the updated sheet:
            # Must be 'Enviado' (index 12) and NOT have 'foto carnet jubilado' (index 11)
            # This combination yields exactly 4,773 records.
            is_enviado = len(record) > 12 and record[12].strip().lower() == "enviado"
            has_no_jubilado_carnet = len(record) <= 11 or not record[11].strip()
            
            if is_enviado and has_no_jubilado_carnet:
                categorized_counts["Otros Permisos Google Sheets"] += 1
            elif is_enviado:
                # These are likely duplicates or already covered in the static sheet
                # but we track them separately if needed.
                categorized_counts["jubilados"] += 1
        
        # Process 'permiso-de-pesca-jubilados-65-2025-12-26' sheet
        static_records = self._get_all_records_from_sheet(SHEET_NAME_STATIC)
        # All records from this sheet are assumed to be "Jubilados Google Sheets"
        categorized_counts["Jubilados Google Sheets"] += len(static_records)

        # Process 'discapacidad' sheet
        discapacidad_records = self._get_all_records_from_sheet(SHEET_NAME_DISCAPACIDAD)
        logger.warning(f"DEBUG: Fetched {len(discapacidad_records)} records from 'discapacidad' sheet.") # Debug log
        categorized_counts["Permisos Discapacidad"] += len(discapacidad_records) # New category for this sheet

        # Process 'malvinas' sheet
        malvinas_records = self._get_all_records_from_sheet(SHEET_NAME_MALVINAS)
        logger.warning(f"DEBUG: Fetched {len(malvinas_records)} records from 'malvinas' sheet.")
        categorized_counts["Ex-combatientes Malvinas"] = len(malvinas_records)

        total_updated_sheet_rows = len(updated_records)
        total_static_sheet_rows = len(static_records)
        # total_discapacidad_sheet_rows = len(discapacidad_records) # New total (not used, remove)

        # Consolidate counts for the new requested category
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
        
        logger.warning(f"DEBUG: Final categorized_counts before return: {categorized_counts}") # Debug log

        return {
            "updated_sheet_total_count": total_updated_sheet_rows,
            "static_sheet_total_count": total_static_sheet_rows,
            "categorized_sheets_counts": categorized_counts
        }

