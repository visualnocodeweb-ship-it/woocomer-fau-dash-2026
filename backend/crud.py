import os
import unicodedata
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date, desc, text
from backend import models
from datetime import datetime
from typing import List, Dict, Any, Optional

def get_meta_value(meta_data: List[Dict], key: str) -> Optional[Any]:
    """Helper function to find a value in the meta_data list of dictionaries."""
    for item in meta_data:
        if item.get('key') == key:
            return item.get('value')
    return None

def create_order(db: Session, order: models.Order):
    """Saves a single Order object to the database."""
    db.add(order)
    db.commit()
    db.refresh(order)
    return order

def create_orders_from_wc_data(db: Session, wc_orders_data: List[Dict[str, Any]]) -> List[models.Order]:
    """
    Processes a list of raw WooCommerce order dictionaries, extracts selected fields,
    and creates/updates Order records in the database in a single transaction per batch.
    """
    processed_orders = []
    order_ids_in_batch = [o['id'] for o in wc_orders_data if o.get('id') is not None]
    existing_orders_map = {o.order_id: o for o in db.query(models.Order).filter(models.Order.order_id.in_(order_ids_in_batch)).all()}

    for wc_order in wc_orders_data:
        order_id = wc_order.get('id')
        if not order_id:
            continue

        # Check if it already exists in the map (either from DB or added in this batch)
        db_order = existing_orders_map.get(order_id)

        if not db_order:
            db_order = models.Order(order_id=order_id)
            db.add(db_order)
            # Add to the map so it's found if it appears again in the same batch
            existing_orders_map[order_id] = db_order

        db_order.status = wc_order.get('status')
        db_order.currency = wc_order.get('currency')
        db_order.total = float(wc_order.get('total', 0.0))
        db_order.customer_id = wc_order.get('customer_id')
        db_order.payment_method_title = wc_order.get('payment_method_title')
        db_order.shipping_total = float(wc_order.get('shipping_total', 0.0))
        db_order.discount_total = float(wc_order.get('discount_total', 0.0))
        db_order.total_tax = float(wc_order.get('total_tax', 0.0))
        db_order.prices_include_tax = wc_order.get('prices_include_tax')
        db_order.date_created = datetime.fromisoformat(wc_order.get('date_created')) if wc_order.get('date_created') else None
        
        billing_info = wc_order.get('billing', {})
        db_order.customer_first_name = billing_info.get('first_name')
        db_order.customer_last_name = billing_info.get('last_name')
        db_order.customer_email = billing_info.get('email')
        db_order.customer_phone = billing_info.get('phone')

        line_items = wc_order.get('line_items', [])
        db_order.line_item_id = line_items[0].get('id') if line_items else None
        db_order.line_item_name = line_items[0].get('name') if line_items else None

        meta_data = wc_order.get('meta_data', [])
        db_order.nro_documento = get_meta_value(meta_data, '_billing_nro_documento')
        db_order.region_pesca = get_meta_value(meta_data, '_billing_regiones_pesca')

        processed_orders.append(db_order)

    try:
        db.commit()
        # Verificar si hay algún pedido completado en este lote para notificar a J.A.R.V.I.S. y al webhook externo
        if any(o.status == 'completed' for o in processed_orders):
            trigger_jarvis_webhook(db)
            trigger_external_webhook(db)
    except Exception as e:
        db.rollback()
        print(f"Error al confirmar el lote en la base de datos: {e}")
    
    return processed_orders

def trigger_jarvis_webhook(db: Session, sheets_data: Optional[dict] = None):
    """
    Recopila las estadísticas de permisos en tiempo real y las envía
    a J.A.R.V.I.S. de forma asíncrona mediante un hilo de fondo.
    """
    try:
        from datetime import datetime
        from sqlalchemy import func, desc
        import threading
        import requests
        
        # Try importing sheets_sync_data if sheets_data is not passed
        if sheets_data is None:
            try:
                from backend.main import sheets_sync_data
                sheets_data = sheets_sync_data
            except Exception:
                pass

        # a) Total de permisos vendidos (todos los completados en la base de datos)
        permits_sold = db.query(models.Order).filter(
            models.Order.status == 'completed'
        ).count()
        
        # b) Recaudación total (todos los completados en la base de datos)
        total_revenue = db.query(func.sum(models.Order.total)).filter(
            models.Order.status == 'completed'
        ).scalar() or 0.0
        
        # c) Últimos 5 permisos de hoy
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        latest_orders = db.query(models.Order).filter(
            models.Order.status == 'completed',
            models.Order.date_created >= today_start
        ).order_by(desc(models.Order.date_created)).limit(5).all()
        
        # Formatear la lista de registros recientes del día
        latest_registrations = []
        for order in latest_orders:
            first_name = order.customer_first_name or ""
            last_name = order.customer_last_name or ""
            full_name = f"{first_name} {last_name}".strip()
            if not full_name:
                full_name = order.customer_email or "Sin Nombre"
                
            latest_registrations.append({
                "name": full_name,
                "timestamp": order.date_created.isoformat() if order.date_created else datetime.now().isoformat(),
                "amount": int(order.total or 0)
            })

        # d) Permisos sin cargo (Google Sheets)
        free_permits_total = 0
        free_permits_enviados = 0
        free_permits_pendientes = 0
        free_permits_latest = []
        if sheets_data:
            free_permits_total = int(sheets_data.get("live_free_total", 0))
            free_permits_enviados = int(sheets_data.get("live_free_enviados", 0))
            free_permits_pendientes = int(sheets_data.get("live_free_pendientes", 0))
            free_permits_latest = sheets_data.get("latest_free_registrations", [])

        disability_permits_total = 0
        if sheets_data:
            cat_counts = sheets_data.get("categorized_sheets_counts") or {}
            disability_permits_total = int(cat_counts.get("Permisos Discapacidad", 0))

        # Obtener las categorías reales
        categories = None
        try:
            categories_data = get_categorized_permit_stats(db, start_date=None)
            if categories_data and "categories" in categories_data:
                categories = categories_data["categories"]
        except Exception as cat_ex:
            print(f"[J.A.R.V.I.S. Webhook] Error al calcular categorías para el webhook: {cat_ex}")

        payload = {
            "permits_sold": int(permits_sold),
            "total_revenue": int(total_revenue),
            "latest_registrations": latest_registrations,
            "free_permits_total": free_permits_total,
            "free_permits_enviados": free_permits_enviados,
            "free_permits_pendientes": free_permits_pendientes,
            "free_permits_latest": free_permits_latest,
            "disability_permits_total": disability_permits_total,
            "categories": categories
        }

        # Ejecución en segundo plano para no demorar la petición original del checkout/sync
        def send_request():
            try:
                webhook_url = os.environ.get(
                    "JARVIS_WEBHOOK_URL",
                    "http://localhost:3000/api/permisos/webhook"
                )
                r = requests.post(webhook_url, json=payload, timeout=10)
                print(f"[J.A.R.V.I.S. Webhook] Datos enviados con éxito a {webhook_url}. Código de estado: {r.status_code}")
            except Exception as req_ex:
                print(f"[J.A.R.V.I.S. Webhook] Error al conectar con J.A.R.V.I.S.: {req_ex}")

        threading.Thread(target=send_request, daemon=True).start()

    except Exception as e:
        print(f"[J.A.R.V.I.S. Webhook] Error al preparar estadísticas: {e}")


# --- Webhook y Estadísticas de Categorías Externas ---

GROUPS = {
    "Permisos Ordinarios": [
        "Permiso residente país temporada",
        "Permiso 10 días residente país",
        "Permiso Residente País Menores (13 a 17 años)",
        "Permiso residente país diario",
        "Residentes mayores de 65 años, jubilados, menores hasta 12 años y personas con discapacidad",
        "Permiso no residente país diario",
        "Permiso 10 días no residente país",
        "Permiso no residente país temporada"
    ],
    "Permisos Adicionales de Trolling o Arrastre": [
        "Permiso 10 días para pesca de arrastre o trolling",
        "Permiso para pesca de arrastre o trolling diario",
        "Permiso para pesca de arrastre o trolling temporada"
    ],
    "Permisos Adicionales Zonas Preferenciales": [
        "Permiso adicional zona preferencial diario",
        "Permiso adicional 10 días zona preferencial",
        "Permiso adicional zona preferencial temporada"
    ],
    "Otros Permisos": [
        "Donaciones",
        "Otros"
    ]
}

STANDARD_MAPPING = {
    "permiso 10 dias residente pais": "Permiso 10 días residente país",
    "permiso 10 dias no residente pais": "Permiso 10 días no residente país",
    "permiso residente pais temporada": "Permiso residente país temporada",
    "permiso residente pais diario": "Permiso residente país diario",
    "permiso residente pais menores (13 a 17 anos)": "Permiso Residente País Menores (13 a 17 años)",
    "permiso no residente pais diario": "Permiso no residente país diario",
    "permiso no residente pais temporada": "Permiso no residente país temporada",
    "permiso adicional zona preferencial diario": "Permiso adicional zona preferencial diario",
    "permiso adicional 10 dias zona preferencial": "Permiso adicional 10 días zona preferencial",
    "permiso adicional zona preferencial temporada": "Permiso adicional zona preferencial temporada",
    "permiso 10 dias para pesca de arrastre o trolling": "Permiso 10 días para pesca de arrastre o trolling",
    "permiso para pesca de arrastre o trolling diario": "Permiso para pesca de arrastre o trolling diario",
    "permiso para pesca de arrastre o trolling temporada": "Permiso para pesca de arrastre o trolling temporada",
    "residentes mayores de 65 anos, jubilados, menores hasta 12 anos y personas con discapacidad": "Residentes mayores de 65 años, jubilados, menores hasta 12 años y personas con discapacidad",
    "permiso residente temporada laguna blanca": "Permiso residente temporada Laguna Blanca"
}

def normalize_name(s: str) -> str:
    if not s:
        return ""
    s_norm = unicodedata.normalize("NFD", s.lower())
    s_clean = "".join([c for c in s_norm if not unicodedata.combining(c)])
    return s_clean

# Build normalized to display mapping
normalized_to_display = {}
for group_name, items in GROUPS.items():
    for item in items:
        normalized_to_display[normalize_name(item)] = item

for k, v in STANDARD_MAPPING.items():
    normalized_to_display[k] = v

def get_categorized_permit_stats(db: Session, start_date: Optional[datetime] = None) -> Dict[str, Any]:
    """
    Agrupa y normaliza los permisos completados en la DB. Si start_date es provisto, filtra desde esa fecha.
    """
    query = db.query(
        models.Order.line_item_name,
        func.count(models.Order.id)
    ).filter(
        models.Order.status == 'completed',
        models.Order.line_item_name.isnot(None)
    )
    if start_date:
        query = query.filter(models.Order.date_created >= start_date)
        
    rows = query.group_by(models.Order.line_item_name).all()

    category_counts = {
        "Permisos Ordinarios": {},
        "Permisos Adicionales de Trolling o Arrastre": {},
        "Permisos Adicionales Zonas Preferenciales": {},
        "Otros Permisos": {}
    }
    
    total_all = 0
    
    for raw_name, count in rows:
        norm_name = normalize_name(raw_name)
        display_name = normalized_to_display.get(norm_name, raw_name)
        
        matched_group = None
        for grp, items in GROUPS.items():
            if display_name in items or norm_name in [normalize_name(x) for x in items]:
                matched_group = grp
                break
        
        if not matched_group:
            if "trolling" in norm_name or "arrastre" in norm_name:
                matched_group = "Permisos Adicionales de Trolling o Arrastre"
            elif "preferencial" in norm_name:
                matched_group = "Permisos Adicionales Zonas Preferenciales"
            elif "residente" in norm_name or "jubilado" in norm_name or "discapacidad" in norm_name or "menor" in norm_name:
                matched_group = "Permisos Ordinarios"
            else:
                matched_group = "Otros Permisos"
        
        std_name = normalized_to_display.get(norm_name, display_name)
        
        if std_name not in category_counts[matched_group]:
            category_counts[matched_group][std_name] = 0
        
        category_counts[matched_group][std_name] += count
        total_all += count

    result = {
        "timestamp": datetime.now().isoformat(),
        "total_permits": total_all,
        "categories": {}
    }
    
    for grp, items in category_counts.items():
        subtotal = sum(items.values())
        result["categories"][grp] = {
            "subtotal": subtotal,
            "items": [{"name": k, "count": v} for k, v in sorted(items.items(), key=lambda x: x[1], reverse=True)]
        }
        
    return result

def trigger_external_webhook(db: Session):
    """
    Envía los datos de categorías normalizados al webhook externo si está configurado en las variables de entorno.
    """
    webhook_url = os.environ.get("EXTERNAL_PROJECT_WEBHOOK_URL")
    if not webhook_url:
        return
        
    try:
        import threading
        import requests
        
        # Sin límite de fecha para reportar el total histórico absoluto (69.023)
        stats = get_categorized_permit_stats(db, None)
        
        def send_request():
            try:
                headers = {"Content-Type": "application/json"}
                r = requests.post(webhook_url, json=stats, headers=headers, timeout=10)
                print(f"[External Webhook] Estadísticas enviadas con éxito a {webhook_url}. Código: {r.status_code}")
            except Exception as req_ex:
                print(f"[External Webhook] Error al enviar a {webhook_url}: {req_ex}")
                
        threading.Thread(target=send_request, daemon=True).start()
    except Exception as e:
        print(f"[External Webhook] Error al preparar estadísticas para el webhook externo: {e}")

def get_orders(db: Session, skip: int = 0, limit: int = 100) -> List[models.Order]:
    """Retrieves a list of Order objects from the database."""
    return db.query(models.Order).offset(skip).limit(limit).all()

def get_order_by_wc_id(db: Session, wc_order_id: int) -> Optional[models.Order]:
    """Retrieves a single Order by its WooCommerce ID."""
    return db.query(models.Order).filter(models.Order.order_id == wc_order_id).first()

def get_most_recent_order_date(db: Session) -> Optional[datetime]:
    """
    Finds the 'date_created' of the most recent order in the database to allow for incremental syncs.
    """
    latest_order = db.query(models.Order).order_by(desc(models.Order.date_created)).first()
    if latest_order and latest_order.date_created:
        return latest_order.date_created
    return None

def get_orders_count(db: Session, status: str = 'completed', after_date: Optional[datetime] = None, before_date: Optional[datetime] = None, line_item_name: Optional[str] = None, total: Optional[float] = None) -> int:
    """Gets the total count of orders with a specific status and other optional filters."""
    query = db.query(models.Order).filter(models.Order.status == status)
    if after_date:
        query = query.filter(models.Order.date_created >= after_date)
    if before_date:
        query = query.filter(models.Order.date_created < before_date)
    if line_item_name:
        query = query.filter(models.Order.line_item_name == line_item_name)
    if total is not None:
        query = query.filter(models.Order.total == total)
    return query.count()

def get_daily_counts(db: Session, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
    """
    Gets the count of completed orders grouped by day, adjusting for a -3 hour timezone offset.
    """
    query = (
        db.query(
            func.to_char(models.Order.date_created - text("INTERVAL '3 hours'"), 'YYYY-MM-DD').label("date"),
            func.count(models.Order.id).label("count"),
        )
        .filter(models.Order.status == "completed")
    )
    if start_date:
        query = query.filter(models.Order.date_created >= start_date)
    if end_date:
        query = query.filter(models.Order.date_created < end_date)
        
    result = (
        query.group_by(func.to_char(models.Order.date_created - text("INTERVAL '3 hours'"), 'YYYY-MM-DD'))
        .order_by(func.to_char(models.Order.date_created - text("INTERVAL '3 hours'"), 'YYYY-MM-DD'))
        .all()
    )
    return [{"date": row.date, "count": row.count} for row in result]

def get_monthly_counts(db: Session) -> List[Dict[str, Any]]:
    """
    Gets the count of completed orders grouped by month, adjusting for a -3 hour timezone offset.
    """
    result = (
        db.query(
            func.to_char(models.Order.date_created - text("INTERVAL '3 hours'"), 'YYYY-MM').label("date"),
            func.count(models.Order.id).label("count"),
        )
        .filter(models.Order.status == "completed")
        .group_by(func.to_char(models.Order.date_created - text("INTERVAL '3 hours'"), 'YYYY-MM'))
        .order_by(func.to_char(models.Order.date_created - text("INTERVAL '3 hours'"), 'YYYY-MM'))
        .all()
    )
    return [{"date": row.date, "count": row.count} for row in result]
def get_all_region_strings(db: Session) -> List[str]:
    """
    Gets all non-null 'region_pesca' strings from completed orders.
    """
    results = db.query(models.Order.region_pesca).filter(models.Order.status == "completed").filter(models.Order.region_pesca.isnot(None)).all()
    return [result[0] for result in results]

def get_product_name_counts(db: Session, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
    """
    Gets the count of completed orders grouped by 'line_item_name', within a specific date range.
    """
    query = (
        db.query(
            models.Order.line_item_name.label("name"),
            func.count(models.Order.id).label("count"),
        )
        .filter(models.Order.status == "completed")
        .filter(models.Order.line_item_name.isnot(None))
    )
    if start_date:
        query = query.filter(models.Order.date_created >= start_date)
    if end_date:
        query = query.filter(models.Order.date_created < end_date)
        
    result = (
        query.group_by(models.Order.line_item_name)
        .order_by(func.count(models.Order.id).desc())
        .all()
    )
    return [{"name": row.name, "count": row.count} for row in result]

def get_region_counts(db: Session, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
    """
    Calculates the number of orders per fishing region within a given date range.
    """
    query = db.query(models.Order.region_pesca).filter(models.Order.status == "completed").filter(models.Order.region_pesca.isnot(None))
    if start_date:
        query = query.filter(models.Order.date_created >= start_date)
    if end_date:
        query = query.filter(models.Order.date_created < end_date)
    
    all_region_strings = [result[0] for result in query.all()]
    
    valid_regions = ["Confluencia", "Comarca", "Lagos del Sur", "Pehuén", "Alto Neuquén", "Limay", "Vaca Muerta"]
    region_counts = {region: 0 for region in valid_regions}

    for region_string in all_region_strings:
        regions_in_order = [r.strip() for r in region_string.split(',')]
        for region in regions_in_order:
            if region in region_counts:
                region_counts[region] += 1
    
    sorted_counts = sorted([{"name": name, "value": count} for name, count in region_counts.items()], key=lambda item: item['value'], reverse=True)
    return sorted_counts

def get_total_revenue(db: Session, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> float:
    """Calculates the sum of the 'total' for all completed orders within a date range."""
    query = db.query(func.sum(models.Order.total)).filter(models.Order.status == 'completed')
    if start_date:
        query = query.filter(models.Order.date_created >= start_date)
    if end_date:
        query = query.filter(models.Order.date_created < end_date)
    
    total_revenue = query.scalar()
    return total_revenue or 0.0

def get_daily_revenue(db: Session, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
    """
    Gets the sum of revenue grouped by day, adjusting for a -3 hour timezone offset, for a given date range.
    """
    query = (
        db.query(
            func.to_char(models.Order.date_created - text("INTERVAL '3 hours'"), 'YYYY-MM-DD').label("date"),
            func.sum(models.Order.total).label("revenue"),
        )
        .filter(models.Order.status == "completed")
    )
    if start_date:
        query = query.filter(models.Order.date_created >= start_date)
    if end_date:
        query = query.filter(models.Order.date_created < end_date)

    result = (
        query.group_by(func.to_char(models.Order.date_created - text("INTERVAL '3 hours'"), 'YYYY-MM-DD'))
        .order_by(func.to_char(models.Order.date_created - text("INTERVAL '3 hours'"), 'YYYY-MM-DD'))
        .all()
    )
    return [{"date": row.date, "revenue": row.revenue or 0} for row in result]
def get_monthly_revenue(db: Session) -> List[Dict[str, Any]]:
    """
    Gets the sum of revenue grouped by month, adjusting for a -3 hour timezone offset.
    """
    result = (
        db.query(
            func.to_char(models.Order.date_created - text("INTERVAL '3 hours'"), 'YYYY-MM').label("date"),
            func.sum(models.Order.total).label("revenue"),
        )
        .filter(models.Order.status == "completed")
        .group_by(func.to_char(models.Order.date_created - text("INTERVAL '3 hours'"), 'YYYY-MM'))
        .order_by(func.to_char(models.Order.date_created - text("INTERVAL '3 hours'"), 'YYYY-MM'))
        .all()
    )
    return [{"date": row.date, "revenue": row.revenue or 0} for row in result]
def get_latest_orders_summary(db: Session, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Retrieves a summary of the latest orders.
    """
    latest_orders = db.query(models.Order).order_by(desc(models.Order.date_created)).limit(limit).all()
    
    summary = []
    for order in latest_orders:
        summary.append({
            "order_id": order.order_id,
            "date_created": order.date_created.isoformat() if order.date_created else None,
            "customer_name": f"{order.customer_first_name or ''} {order.customer_last_name or ''}".strip(),
            "permission_type": order.line_item_name
        })
    return summary
def get_all_order_dates(db: Session) -> List[Dict[str, Any]]:
    """
    Retrieves order_id and 'date_created' from all orders (no status filter).
    """
    orders_data = db.query(models.Order.order_id, models.Order.date_created).all()
    return [{"order_id": o.order_id, "date_created": o.date_created} for o in orders_data if o.date_created is not None]