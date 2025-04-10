from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import PaymentMethod
from .serializers import PaymentMethodSerializer
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

import stripe
from django.conf import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

class CreateCheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user

            if not user.stripe_customer_id:
                customer = stripe.Customer.create(email=user.email)
                user.stripe_customer_id = customer.id
                user.save()

            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                mode='setup',  # we're only saving the card
                customer=user.stripe_customer_id,
                success_url = 'myapp://payment-success?session_id={CHECKOUT_SESSION_ID}',
                cancel_url = 'myapp://payment-cancel'
            )
            return Response({'checkout_url': checkout_session.url})
        except Exception as e:
            return Response({'error': str(e)}, status=400)
        
class ListStripePaymentMethodsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if not user.stripe_customer_id:
            return Response({"error": "Stripe customer ID not found"}, status=400)

        try:
            # Get all saved cards
            payment_methods = stripe.PaymentMethod.list(
                customer=user.stripe_customer_id,
                type="card"
            )

            # Get default payment method
            customer = stripe.Customer.retrieve(user.stripe_customer_id)
            default_id = customer.get("invoice_settings", {}).get("default_payment_method")

            cards = []
            for method in payment_methods.data:
                card = method.card
                cards.append({
                    "id": method.id,
                    "brand": card.brand,
                    "last4": card.last4,
                    "exp_month": card.exp_month,
                    "exp_year": card.exp_year,
                    "cardholder_name": method['billing_details']['name'],
                    "is_default": method.id == default_id,
                })

            return Response(cards)

        except Exception as e:
            return Response({"error": str(e)}, status=400)
        

class DeleteStripePaymentMethodView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, stripe_id):
        user = request.user

        if not user.stripe_customer_id:
            return Response({"error": "Stripe customer ID not found"}, status=400)

        try:
            # Detach the card from the customer
            stripe.PaymentMethod.detach(stripe_id)
            return Response({"message": "Card deleted from Stripe"}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
        

class SetStripeDefaultPaymentMethodView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, stripe_id):
        user = request.user

        if not user.stripe_customer_id:
            return Response({"error": "Stripe customer ID not found"}, status=400)

        try:
            # Update the default payment method in Stripe
            stripe.Customer.modify(
                user.stripe_customer_id,
                invoice_settings={"default_payment_method": stripe_id}
            )
            return Response({"message": "Default Stripe card updated"}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class CreateStripePaymentMethodView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            card = request.data.get("card")  # dict with number, exp_month, exp_year, cvc
            billing_details = request.data.get("billing_details")  # name, address, etc.

            # 1. Create the payment method with Stripe
            payment_method = stripe.PaymentMethod.create(
                type="card",
                card=card,
                billing_details=billing_details
            )

            # 2. Save to your DB
            user = request.user
            method = PaymentMethod.objects.create(
                user=user,
                stripe_payment_method_id=payment_method.id,
                card_type=payment_method.card["brand"],
                last4=payment_method.card["last4"],
                expiration_date=f"{payment_method.card['exp_month']:02d}/{str(payment_method.card['exp_year'])[-2:]}",
                cardholder_name=billing_details.get("name"),
                billing_address=billing_details.get("address", "")
            )

            return Response({
                "success": True,
                "id": method.id,
                "stripe_id": payment_method.id
            })

        except Exception as e:
            return Response({"error": str(e)}, status=400)

class PaymentMethodListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        payment_methods = PaymentMethod.objects.filter(user=request.user)
        serializer = PaymentMethodSerializer(payment_methods, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = PaymentMethodSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DeletePaymentMethodView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, payment_id):
        user = request.user
        payment_method = get_object_or_404(PaymentMethod, id=payment_id, user=user)

        # Prevent deleting the default card (optional)
        if payment_method.is_default:
            return Response({"error": "Cannot delete the default payment method"}, status=status.HTTP_400_BAD_REQUEST)

        payment_method.delete()
        return Response({"message": "Payment method deleted successfully"}, status=status.HTTP_200_OK)
    

class SetDefaultPaymentMethodView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, payment_id):
        user = request.user
        payment_method = get_object_or_404(PaymentMethod, id=payment_id, user=user)

        # Set all user's payment methods to is_default=False
        PaymentMethod.objects.filter(user=user).update(is_default=False)

        # Set the selected payment method to is_default=True
        payment_method.is_default = True
        payment_method.save()

        return Response(
            {
                "message": "Default payment method updated successfully",
                "payment_method": PaymentMethodSerializer(payment_method).data,  # Return updated card
            },
            status=status.HTTP_200_OK,
        )

