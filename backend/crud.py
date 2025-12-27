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
        if not wc_order.get('id'):
            continue

        db_order = existing_orders_map.get(wc_order['id'])

        if not db_order:
            db_order = models.Order(order_id=wc_order.get('id'))
            db.add(db_order)

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
    except Exception as e:
        db.rollback()
        print(f"Error al confirmar el lote en la base de datos: {e}")
    
    return processed_orders

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
            func.strftime('%Y-%m-%d', models.Order.date_created, '-3 hours').label("date"),
            func.count(models.Order.id).label("count"),
        )
        .filter(models.Order.status == "completed")
    )
    if start_date:
        query = query.filter(models.Order.date_created >= start_date)
    if end_date:
        query = query.filter(models.Order.date_created < end_date)
        
    result = (
        query.group_by(func.strftime('%Y-%m-%d', models.Order.date_created, '-3 hours'))
        .order_by(func.strftime('%Y-%m-%d', models.Order.date_created, '-3 hours'))
        .all()
    )
    return [{"date": row.date, "count": row.count} for row in result]

def get_monthly_counts(db: Session) -> List[Dict[str, Any]]:
    """
    Gets the count of completed orders grouped by month, adjusting for a -3 hour timezone offset.
    """
    result = (
        db.query(
            func.strftime('%Y-%m', models.Order.date_created, '-3 hours').label("date"),
            func.count(models.Order.id).label("count"),
        )
        .filter(models.Order.status == "completed")
        .group_by(func.strftime('%Y-%m', models.Order.date_created, '-3 hours'))
        .order_by(func.strftime('%Y-%m', models.Order.date_created, '-3 hours'))
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
            func.strftime('%Y-%m-%d', models.Order.date_created, '-3 hours').label("date"),
            func.sum(models.Order.total).label("revenue"),
        )
        .filter(models.Order.status == "completed")
    )
    if start_date:
        query = query.filter(models.Order.date_created >= start_date)
    if end_date:
        query = query.filter(models.Order.date_created < end_date)

    result = (
        query.group_by(func.strftime('%Y-%m-%d', models.Order.date_created, '-3 hours'))
        .order_by(func.strftime('%Y-%m-%d', models.Order.date_created, '-3 hours'))
        .all()
    )
    return [{"date": row.date, "revenue": row.revenue or 0} for row in result]
def get_monthly_revenue(db: Session) -> List[Dict[str, Any]]:
    """
    Gets the sum of revenue grouped by month, adjusting for a -3 hour timezone offset.
    """
    result = (
        db.query(
            func.strftime('%Y-%m', models.Order.date_created, '-3 hours').label("date"),
            func.sum(models.Order.total).label("revenue"),
        )
        .filter(models.Order.status == "completed")
        .group_by(func.strftime('%Y-%m', models.Order.date_created, '-3 hours'))
        .order_by(func.strftime('%Y-%m', models.Order.date_created, '-3 hours'))
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