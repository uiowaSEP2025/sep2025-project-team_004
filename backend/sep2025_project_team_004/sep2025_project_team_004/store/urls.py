from django.urls import path
from .views import ProductListView, CreateOrderView

app_name = "store" 

urlpatterns = [
    path("products/", ProductListView.as_view(), name="product-list"),
    path("orders/create/", CreateOrderView.as_view(), name="create-order"),
]
