from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import PaymentMethod
from .serializers import PaymentMethodSerializer
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

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

