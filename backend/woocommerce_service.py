import os
from woocommerce import API
from dotenv import load_dotenv
import time

load_dotenv()

class WooCommerceService:
    def __init__(self):
        self.wcapi = API(
            url=os.getenv("WC_STORE_URL"),
            consumer_key=os.getenv("WC_CONSUMER_KEY"),
            consumer_secret=os.getenv("WC_CONSUMER_SECRET"),
            version="wc/v3",
            timeout=30 # Increased timeout to 30 seconds
        )

    def get_orders(self, page=1, per_page=100, after_date=None, before_date=None, status=None):
        """
        Fetches orders from WooCommerce API with a retry mechanism.
        """
        params = {
            "page": page,
            "per_page": per_page,
        }
        if after_date:
            params["after"] = after_date
        if before_date:
            params["before"] = before_date
        if status:
            params["status"] = status

        retries = 3
        for attempt in range(retries):
            try:
                response = self.wcapi.get("orders", params=params)
                response.raise_for_status()  # Raise an exception for HTTP errors
                return response.json()
            except Exception as e:
                print(f"Error en el intento {attempt + 1} de {retries}: {e}")
                if attempt < retries - 1:
                    wait_time = 10 * (attempt + 1)  # Wait 10, 20 seconds
                    print(f"Esperando {wait_time} segundos antes de reintentar...")
                    time.sleep(wait_time)
                else:
                    print("Se han agotado los reintentos. Falló la obtención de pedidos para esta página.")
                    # We will now raise the exception to stop the sync process
                    # instead of silently returning [], so the user knows it failed.
                    raise e
        return [] # Should not be reached if retries are exhausted and exception is raised
