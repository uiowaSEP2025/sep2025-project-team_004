from django.urls import path
from .views import ProductListView
from .views import ReviewCreateAPIView
from .views import ProductListView, CreateOrderView

app_name = "store" 

urlpatterns = [
    path("products/", ProductListView.as_view(), name="product-list"),
    path('reviews/', ReviewCreateAPIView.as_view(), name='review-create'),
    path("orders/create/", CreateOrderView.as_view(), name="create-order"),
]
