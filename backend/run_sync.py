import requests
import time

def start_sync():
    sync_url = "http://127.0.0.1:8002/api/sync-orders"
    print(f"Enviando petición POST a {sync_url} para iniciar la sincronización...")
    
    try:
        # Usamos un timeout bajo. No nos importa la respuesta, solo iniciar el proceso.
        # El script enviará la petición y se desconectará, dejando que el servidor trabaje.
        requests.post(sync_url, timeout=3) 
    except requests.exceptions.ReadTimeout:
        # Este es el resultado ESPERADO. La petición se envió correctamente.
        print("\n¡Petición enviada con éxito!")
        print("El servidor ha recibido la orden y debería estar ahora procesando en segundo plano.")
        print("Revisa la OTRA terminal (la de uvicorn) para ver los mensajes de progreso.")
    except requests.exceptions.RequestException as e:
        print(f"\nError: No se pudo conectar con el servidor en {sync_url}.")
        print("Asegúrate de que el servidor FastAPI (uvicorn) esté corriendo en otra terminal.")
        print(f"Detalle del error: {e}")

if __name__ == "__main__":
    start_sync()

