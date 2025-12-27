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
SHEET_NAME_UPDATED = "permisos actualizados"
SHEET_NAME_STATIC = "permiso-de-pesca-jubilados-65-2025-12-26"
SHEET_NAME_DISCAPACIDAD = "discapacidad"

class GoogleSheetsService:
    def __init__(self):
        self.gc = self._authenticate_gspread()
        self.spreadsheet = self.gc.open_by_key(GOOGLE_SHEET_ID)

    def _authenticate_gspread(self):
        """Authenticates with Google Sheets API using service account credentials from a file."""
        try:
            # Assuming credentials.json is in the same directory as this script
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

        # Process 'permisos actualizados' sheet
        updated_records = self._get_all_records_from_sheet(SHEET_NAME_UPDATED)
        for record in updated_records:
            first_col_text = record[0].lower() if record else "" # Assuming category info is in the first column

            if "jubilado" in first_col_text:
                categorized_counts["jubilados"] += 1
            elif "mayor" in first_col_text and "65" in first_col_text: # Assuming "mayores de 65" implies "mayor" and "65"
                categorized_counts["Residentes mayores de 65 años"] += 1
            elif "menor" in first_col_text or "12 años" in first_col_text: # Assuming "menores hasta 12 años" implies "menor" or "12 años"
                categorized_counts["menores hasta 12 años"] += 1
            elif "discapacidad" in first_col_text:
                categorized_counts["personas con discapacidad"] += 1
            else:
                categorized_counts["Otros Permisos Google Sheets"] += 1
        
        # Process 'permiso-de-pesca-jubilados-65-2025-12-26' sheet
        static_records = self._get_all_records_from_sheet(SHEET_NAME_STATIC)
        # All records from this sheet are assumed to be "Jubilados Google Sheets"
        categorized_counts["Jubilados Google Sheets"] += len(static_records)

        # Process 'discapacidad' sheet
        discapacidad_records = self._get_all_records_from_sheet(SHEET_NAME_DISCAPACIDAD)
        logger.warning(f"DEBUG: Fetched {len(discapacidad_records)} records from 'discapacidad' sheet.") # Debug log
        categorized_counts["Permisos Discapacidad"] += len(discapacidad_records) # New category for this sheet

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
            categorized_counts["Permisos Discapacidad"] # Include new count in consolidated total
        )
        categorized_counts["Residentes mayores de 65 años, jubilados, menores hasta 12 años y personas con discapacidad"] = consolidated_permits_count
        
        logger.warning(f"DEBUG: Final categorized_counts before return: {categorized_counts}") # Debug log

        return {
            "updated_sheet_total_count": total_updated_sheet_rows,
            "static_sheet_total_count": total_static_sheet_rows,
            "categorized_sheets_counts": categorized_counts
        }

