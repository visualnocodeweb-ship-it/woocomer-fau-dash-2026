from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, unique=True, index=True, nullable=False) # WooCommerce Order ID
    status = Column(String, index=True)
    currency = Column(String)
    total = Column(Float)
    customer_id = Column(Integer, index=True)
    customer_first_name = Column(String)
    customer_last_name = Column(String)
    customer_email = Column(String)
    customer_phone = Column(String, nullable=True) # NEW
    date_created = Column(DateTime) # Removed default for explicit setting
    date_modified = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    payment_method_title = Column(String)
    shipping_total = Column(Float)
    discount_total = Column(Float)
    total_tax = Column(Float)
    prices_include_tax = Column(Boolean)
    
    # Custom fields requested by user
    nro_documento = Column(String, nullable=True) # NEW
    region_pesca = Column(String, nullable=True) # NEW

    # Simplified line item info
    line_item_id = Column(Integer, nullable=True) # NEW (ID of first line item)
    line_item_name = Column(String, nullable=True) # NEW (Name of first line item)

    # Relationship to LineItems
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=False) # Foreign key to WooCommerce Order ID
    product_id = Column(Integer, index=True)
    product_name = Column(String)
    quantity = Column(Integer)
    total = Column(Float)
    total_tax = Column(Float)
    price = Column(Float)

    # Relationship back to Order
    order = relationship("Order", back_populates="items")
