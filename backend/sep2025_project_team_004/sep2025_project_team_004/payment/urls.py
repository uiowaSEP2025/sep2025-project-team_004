from django.urls import path
from .views import PaymentMethodListCreateView, DeletePaymentMethodView, SetDefaultPaymentMethodView, CreateStripePaymentMethodView

urlpatterns = [
    path("payment-methods/", PaymentMethodListCreateView.as_view(), name="payment-methods"),
    path("delete/<int:payment_id>/", DeletePaymentMethodView.as_view(), name="delete-payment-method"),
    path("set-default/<int:payment_id>/", SetDefaultPaymentMethodView.as_view(), name="set-default-payment"),
    path("create-stripe-payment-method/", CreateStripePaymentMethodView.as_view(), name="create-stripe-payment-method"),
]
