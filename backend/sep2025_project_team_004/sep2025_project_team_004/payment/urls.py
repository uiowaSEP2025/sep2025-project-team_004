from django.urls import path
from .views import PaymentMethodListCreateView, DeletePaymentMethodView, SetDefaultPaymentMethodView, CreateStripePaymentMethodView, CreateCheckoutSessionView, ListStripePaymentMethodsView, DeleteStripePaymentMethodView, SetStripeDefaultPaymentMethodView

urlpatterns = [
    path("payment-methods/", PaymentMethodListCreateView.as_view(), name="payment-methods"),
    path("delete/<int:payment_id>/", DeletePaymentMethodView.as_view(), name="delete-payment-method"),
    path("set-default/<int:payment_id>/", SetDefaultPaymentMethodView.as_view(), name="set-default-payment"),
    path("create-stripe-payment-method/", CreateStripePaymentMethodView.as_view(), name="create-stripe-payment-method"),
    path("create-checkout-session/", CreateCheckoutSessionView.as_view(), name="create-checkout-session"),
    path("stripe-methods/", ListStripePaymentMethodsView.as_view(), name="stripe-methods"),
    path("stripe/delete/<str:stripe_id>/", DeleteStripePaymentMethodView.as_view(), name="delete"),
    path("stripe/set-default/<str:stripe_id>/", SetStripeDefaultPaymentMethodView.as_view(), name="set-default"),
]
