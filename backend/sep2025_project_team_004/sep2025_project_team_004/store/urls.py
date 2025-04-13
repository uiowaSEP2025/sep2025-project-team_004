from django.urls import path
from .views import ProductListView, ReviewCreateAPIView, CreateOrderView, MyOrdersListView

app_name = "store" 

urlpatterns = [
    path("products/", ProductListView.as_view(), name="product-list"),
    path('reviews/', ReviewCreateAPIView.as_view(), name='review-create'),
    path("orders/create/", CreateOrderView.as_view(), name="create-order"),
    path("orders/my/", MyOrdersListView.as_view(), name="my-orders"),
]
