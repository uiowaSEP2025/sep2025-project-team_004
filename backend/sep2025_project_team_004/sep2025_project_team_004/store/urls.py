from django.urls import path
<<<<<<< HEAD
from .views import ProductListView, CreateOrderView
=======
from .views import ProductListView
from .views import ReviewCreateAPIView
>>>>>>> origin/main

app_name = "store" 

urlpatterns = [
    path("products/", ProductListView.as_view(), name="product-list"),
<<<<<<< HEAD
    path("orders/create/", CreateOrderView.as_view(), name="create-order"),
=======
    path('reviews/', ReviewCreateAPIView.as_view(), name='review-create'),
>>>>>>> origin/main
]
