from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date

class OrderItemBase(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    total: float
    total_tax: float
    price: float

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    order_id: int # This will be the WooCommerce order_id
    
    class Config:
        from_attributes = True # Was orm_mode = True in Pydantic v1

class OrderBase(BaseModel):
    order_id: int # WooCommerce Order ID
    status: str
    currency: str
    total: float
    customer_id: Optional[int] = None
    customer_first_name: Optional[str] = None
    customer_last_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None # NEW
    payment_method_title: Optional[str] = None
    shipping_total: Optional[float] = None
    discount_total: Optional[float] = None
    total_tax: Optional[float] = None
    prices_include_tax: Optional[bool] = None
    nro_documento: Optional[str] = None # NEW
    region_pesca: Optional[str] = None # NEW
    line_item_id: Optional[int] = None # NEW
    line_item_name: Optional[str] = None # NEW

class OrderCreate(OrderBase):
    items: List[OrderItemCreate] = []

class Order(OrderBase):
    id: int # Our internal database ID
    date_created: datetime
    date_modified: datetime

    class Config:
        from_attributes = True # Was orm_mode = True in Pydantic v1

class DateRangeRequest(BaseModel):
    start_date: date
    end_date: date

class DailyDataPoint(BaseModel):
    date: str
    count: Optional[int] = None
    revenue: Optional[float] = None

class NameCountPair(BaseModel):
    name: str
    value: int

class CustomReport(BaseModel):
    total_permits: int
    total_revenue: float
    daily_counts: List[DailyDataPoint]
    daily_revenue: List[DailyDataPoint]
    region_counts: List[NameCountPair]
    category_counts: List[NameCountPair]
    summary_text: str
