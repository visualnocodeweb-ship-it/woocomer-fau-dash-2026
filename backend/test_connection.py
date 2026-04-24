import json
import os
from dotenv import load_dotenv
from woocommerce_service import WooCommerceService

# Load environment variables
load_dotenv()

def run_test():
    print("Intentando conectar a WooCommerce...")
    wc_service = WooCommerceService()
    
    # Fetch just one order for a quick test
    orders_data = wc_service.get_orders(per_page=1)
    
    if orders_data:
        print("\n¡Conexión exitosa! Se recibió 1 pedido:")
        # Use json.dumps for pretty printing
        print(json.dumps(orders_data, indent=2))
    else:
        print("\nNo se pudieron obtener los pedidos. Verifica las credenciales en tu archivo .env y la conexión de red.")

if __name__ == "__main__":
    run_test()
