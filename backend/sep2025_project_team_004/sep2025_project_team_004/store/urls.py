from django.urls import path
from .views import ProductListView, ReviewCreateAPIView, CheckoutAndCreateOrderView, AdminOrderListView, MyOrdersPaginatedView, UpdateOrderStatusView, MyReviewsPaginatedView, ReviewDetailView, ReviewUpdateView, ProductReviewsView

app_name = "store" 

urlpatterns = [
    path("products/", ProductListView.as_view(), name="product-list"),
    path('reviews/', ReviewCreateAPIView.as_view(), name='review-create'),
    path("orders/create/", CheckoutAndCreateOrderView.as_view(), name="create-order"),
    path("orders/admin/", AdminOrderListView.as_view(), name="orders-admin"),
    path("orders/my/", MyOrdersPaginatedView.as_view(), name="my-orders"),
    path("orders/update/<int:order_id>/", UpdateOrderStatusView.as_view(), name="update-order"),
    path('reviews/my/', MyReviewsPaginatedView.as_view(), name='my-reviews'),
    path('reviews/<int:pk>/', ReviewDetailView.as_view(), name='review-detail'),
    path('reviews/<int:pk>/update/', ReviewUpdateView.as_view(), name='review-update'),
    path('products/<int:product_id>/reviews/', ProductReviewsView.as_view(), name='product-reviews'),
]
