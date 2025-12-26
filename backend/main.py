import logging
import threading
import time
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from .database import Base, engine, get_db, SessionLocal
import models
import crud
import schemas
from woocommerce_service import WooCommerceService
from typing import List, Optional
from datetime import date, datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware

# --- Constants ---
SYNC_INTERVAL_SECONDS = 120  # 2 minutes

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="WooCommerce Sync API",
    description="API para sincronizar y analizar datos de pedidos de WooCommerce.",
    version="0.1.0",
)

# Configure CORS
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Background Sync Logic ---
def perform_sync(db: Session):
    """
    Performs an incremental sync of 'completed' orders from WooCommerce.
    This function contains the core logic and can be called from different contexts.
    """
    wc_service = WooCommerceService()
    logging.warning("\n-----------------------------------------------------")
    logging.warning("Iniciando trabajo de sincronización de pedidos...")

    last_sync_date = crud.get_most_recent_order_date(db)
    after_date_str = None
    if last_sync_date:
        after_date_str = (last_sync_date - timedelta(minutes=5)).isoformat()
        logging.warning(f"Sincronización incremental. Obteniendo pedidos creados después de: {after_date_str}")
    else:
        logging.warning("No se encontraron pedidos previos. Realizando sincronización completa.")

    total_synced = 0
    page = 1
    while True:
        logging.warning(f"Obteniendo página {page} de pedidos...")
        try:
            orders_page = wc_service.get_orders(page=page, per_page=100, status='completed', after_date=after_date_str)
        except Exception as e:
            logging.error(f"Error al obtener pedidos de WooCommerce: {e}")
            break

        if not orders_page:
            logging.warning("No se encontraron más pedidos. Finalizando.")
            break

        logging.warning(f"Página {page} obtenida. Procesando y guardando {len(orders_page)} pedidos en la base de datos...")
        synced_orders_in_batch = crud.create_orders_from_wc_data(db, orders_page)
        total_synced += len(synced_orders_in_batch)
        logging.warning(f"Lote procesado. Total de pedidos 'completed' sincronizados hasta ahora: {total_synced}")

        if len(orders_page) < 100:
            logging.warning("Se ha alcanzado la última página de pedidos.")
            break
        page += 1

    logging.warning(f"Sincronización completada en esta ejecución. Total de pedidos nuevos/actualizados: {total_synced}")
    logging.warning("-----------------------------------------------------\n")
    return total_synced

def sync_job():
    """
    Job to be run in the background thread. Creates its own DB session.
    """
    logging.warning("Background sync job iniciando una nueva ejecución.")
    try:
        db = SessionLocal()
        perform_sync(db)
    except Exception as e:
        logging.error(f"Error durante la ejecución del background sync job: {e}")
    finally:
        if 'db' in locals() and db:
            db.close()
        logging.warning("Background sync job ha finalizado su ejecución.")

def run_sync_periodically():
    """
    Infinite loop to run the sync job periodically.
    """
    while True:
        sync_job()
        logging.info(f"Siguiente sincronización automática en {SYNC_INTERVAL_SECONDS} segundos.")
        time.sleep(SYNC_INTERVAL_SECONDS)

@app.on_event("startup")
def startup_event():
    """
    On startup, run an initial sync and start the background thread.
    """
    logging.info("El servidor está iniciando. Lanzando la tarea de sincronización en segundo plano...")
    # Run initial sync in a separate thread to not block startup
    initial_sync_thread = threading.Thread(target=sync_job, daemon=True)
    initial_sync_thread.start()
    
    # Start the periodic sync
    background_thread = threading.Thread(target=run_sync_periodically, daemon=True)
    background_thread.start()


# --- API Routes ---
@app.get("/api")
def read_root():
    """Endpoint raíz para verificar que la API está funcionando."""
    return {"message": "API de WooCommerce Sync está en línea"}

@app.post("/api/backfill-orders")
def backfill_orders(request: schemas.DateRangeRequest, db: Session = Depends(get_db)):
    """
    Performs a historical sync of 'completed' orders from WooCommerce for a specific date range.
    """
    wc_service = WooCommerceService()
    logging.warning("\n-----------------------------------------------------")
    logging.warning(f"Iniciando backfill para el rango: {request.start_date} a {request.end_date}")

    # The WooCommerce API `before` parameter is exclusive (orders before this date), 
    # so we add one day to the end_date to include all orders on that day.
    end_date_exclusive = request.end_date + timedelta(days=1)

    after_date_str = datetime.combine(request.start_date, datetime.min.time()).isoformat()
    before_date_str = datetime.combine(end_date_exclusive, datetime.min.time()).isoformat()

    total_synced = 0
    page = 1
    while True:
        logging.warning(f"Obteniendo página {page} de pedidos del backfill...")
        try:
            orders_page = wc_service.get_orders(
                page=page, 
                per_page=100, 
                status='completed', 
                after_date=after_date_str,
                before_date=before_date_str
            )
        except Exception as e:
            logging.error(f"Error al obtener pedidos de WooCommerce durante el backfill: {e}")
            break

        if not orders_page:
            logging.warning("No se encontraron más pedidos en el rango. Finalizando backfill.")
            break

        logging.warning(f"Página {page} obtenida. Procesando y guardando {len(orders_page)} pedidos en la base de datos...")
        synced_orders_in_batch = crud.create_orders_from_wc_data(db, orders_page)
        total_synced += len(synced_orders_in_batch)
        logging.warning(f"Lote procesado. Total de pedidos sincronizados en este backfill hasta ahora: {total_synced}")

        if len(orders_page) < 100:
            logging.warning("Se ha alcanzado la última página de pedidos para el backfill.")
            break
        page += 1

    logging.warning(f"Backfill completado. Total de pedidos nuevos/actualizados: {total_synced}")
    logging.warning("-----------------------------------------------------\n")
    return {"message": f"Backfill completado. Total de pedidos nuevos/actualizados: {total_synced}"}

@app.get("/api/orders/latest")
def get_latest_orders(db: Session = Depends(get_db)):
    """
    Retrieves a summary of the latest orders for the dashboard.
    """
    return crud.get_latest_orders_summary(db)

@app.post("/api/sync-orders")
def sync_orders(db: Session = Depends(get_db)):
    """
    Manually triggers an incremental sync of 'completed' orders from WooCommerce.
    """
    total_synced = perform_sync(db)
    return {"message": f"Sincronización manual completada. Total de pedidos nuevos/actualizados: {total_synced}"}

@app.get("/api/orders", response_model=List[schemas.Order])
def get_all_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    orders = crud.get_orders(db, skip=skip, limit=limit)
    return orders

@app.post("/api/reports/custom", response_model=schemas.CustomReport)
def get_custom_report(request: schemas.DateRangeRequest, db: Session = Depends(get_db)):
    """
    Generates a custom report for a given date range.
    """
    start_datetime = datetime.combine(request.start_date, datetime.min.time())
    # For 'before' filters, we want to include the whole end day, so we go to the start of the next day.
    end_datetime = datetime.combine(request.end_date + timedelta(days=1), datetime.min.time())

    # --- Fetch all data in parallel (conceptually) ---
    total_permits = crud.get_orders_count(db, status='completed', after_date=start_datetime, before_date=end_datetime)
    total_revenue = crud.get_total_revenue(db, start_date=start_datetime, end_date=end_datetime)
    daily_counts = crud.get_daily_counts(db, start_date=start_datetime, end_date=end_datetime)
    daily_revenue = crud.get_daily_revenue(db, start_date=start_datetime, end_date=end_datetime)
    region_counts = crud.get_region_counts(db, start_date=start_datetime, end_date=end_datetime)
    category_counts = crud.get_product_name_counts(db, start_date=start_datetime, end_date=end_datetime)
    
    # Standardize the key name from 'count' to 'value' to match the NameCountPair schema
    category_counts = [{'name': item['name'], 'value': item['count']} for item in category_counts]

    # --- Generate a brief text summary ---
    # Formatting for the summary
    start_str = request.start_date.strftime('%d/%m/%Y')
    end_str = request.end_date.strftime('%d/%m/%Y')
    revenue_str = f"${total_revenue:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    summary_text = (
        f"Resumen del período del {start_str} al {end_str}:\n"
        f"- Se vendieron un total de {total_permits} permisos.\n"
        f"- La recaudación total fue de {revenue_str}.\n"
    )
    
    if category_counts:
        top_category = category_counts[0]
        summary_text += f"- El tipo de permiso más popular fue '{top_category['name']}' con {top_category['value']} unidades.\n"
    
    if region_counts:
        # Find the top region that is not 'None' or empty
        top_region = next((r for r in region_counts if r['name']), None)
        if top_region:
            summary_text += f"- La región más solicitada fue '{top_region['name']}' con {top_region['value']} permisos."

    # --- Assemble the report ---
    report = schemas.CustomReport(
        total_permits=total_permits,
        total_revenue=total_revenue,
        daily_counts=daily_counts,
        daily_revenue=daily_revenue,
        region_counts=region_counts,
        category_counts=category_counts,
        summary_text=summary_text,
    )

    return report
    
@app.get("/api/orders/count")
def get_completed_orders_count(after_date: Optional[date] = None, before_date: Optional[date] = None, line_item_name: Optional[str] = None, total: Optional[float] = None, db: Session = Depends(get_db)):
    count = crud.get_orders_count(db, status='completed', after_date=after_date, before_date=before_date, line_item_name=line_item_name, total=total)
    return {"total_completed": count}
    
@app.get("/api/stats/daily_counts")
def get_daily_stats(start_date: date, db: Session = Depends(get_db)):
    start_datetime = datetime.combine(start_date, datetime.min.time())
    return crud.get_daily_counts(db, start_date=start_datetime)

@app.get("/api/stats/monthly_counts")
def get_monthly_stats(db: Session = Depends(get_db)):
    return crud.get_monthly_counts(db)

@app.get("/api/stats/category_counts")
def get_category_stats(db: Session = Depends(get_db)):
    valid_regions = ["Confluencia", "Comarca", "Lagos del Sur", "Pehuén", "Alto Neuquén", "Limay", "Vaca Muerta"]
    region_counts = {region: 0 for region in valid_regions}
    all_region_strings = crud.get_all_region_strings(db)
    for region_string in all_region_strings:
        regions_in_order = [r.strip() for r in region_string.split(',')]
        for region in regions_in_order:
            if region in region_counts:
                region_counts[region] += 1
    sorted_counts = sorted([{"name": name, "value": count} for name, count in region_counts.items()], key=lambda item: item['value'], reverse=True)
    return sorted_counts

@app.get("/api/stats/product_counts")
def get_product_stats(start_date: date, db: Session = Depends(get_db)):
    start_datetime = datetime.combine(start_date, datetime.min.time())
    return crud.get_product_name_counts(db, start_date=start_datetime)

@app.get("/api/stats/total_revenue")
def get_total_revenue_stats(db: Session = Depends(get_db)):
    return {"total_revenue": crud.get_total_revenue(db)}

@app.get("/api/stats/daily_revenue")
def get_daily_revenue_stats(db: Session = Depends(get_db)):
    return crud.get_daily_revenue(db)

@app.get("/api/stats/monthly_revenue")
def get_monthly_revenue_stats(db: Session = Depends(get_db)):
    return crud.get_monthly_revenue(db)

@app.get("/api/orders/by-wc-id/{wc_order_id}", response_model=schemas.Order)
def get_single_order_by_wc_id(wc_order_id: int, db: Session = Depends(get_db)):
    db_order = crud.get_order_by_wc_id(db, wc_order_id=wc_order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Pedido no encontrado en nuestra base de datos.")
    return db_order

# --- Mount Static Files ---
app.mount("/", StaticFiles(directory="../frontend/client/dist", html=True), name="static")