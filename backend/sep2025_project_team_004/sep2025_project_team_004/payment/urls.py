from django.urls import path
from .views import PaymentMethodListCreateView, DeletePaymentMethodView, SetDefaultPaymentMethodView

urlpatterns = [
    path("payment-methods/", PaymentMethodListCreateView.as_view(), name="payment-methods"),
    path("delete/<int:payment_id>/", DeletePaymentMethodView.as_view(), name="delete-payment-method"),
    path("set-default/<int:payment_id>/", SetDefaultPaymentMethodView.as_view(), name="set-default-payment"),
]
