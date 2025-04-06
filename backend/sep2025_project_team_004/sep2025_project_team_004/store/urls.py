from django.urls import path
from .views import ProductListView
from .views import ReviewCreateAPIView

app_name = "store" 

urlpatterns = [
    path("products/", ProductListView.as_view(), name="product-list"),
    path('reviews/', ReviewCreateAPIView.as_view(), name='review-create'),
]
