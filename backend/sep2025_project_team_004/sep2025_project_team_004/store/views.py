from rest_framework import generics
from .models import Product, Review
from .serializers import ProductSerializer, OrderSerializer, ReviewSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import RetrieveUpdateAPIView, ListAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework import status
from .models import Order

import traceback

import stripe

class ProductListView(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = []

class CreateOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OrderSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReviewCreateAPIView(generics.CreateAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CheckoutAndCreateOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data

        try:
            # Validate payment
            if not user.stripe_customer_id:
                return Response({"error": "Missing Stripe customer ID."}, status=400)

            payment_intent = stripe.PaymentIntent.create(
                amount=int(float(data["total_price"]) * 100), 
                currency="usd",
                customer=user.stripe_customer_id,
                payment_method=data["stripe_payment_method_id"],
                off_session=True,
                confirm=True
            )

            # If payment succeeds, create the order
            serializer = OrderSerializer(data=data, context={"request": request})
            if serializer.is_valid():
                order = serializer.save(status="processing")
                return Response(OrderSerializer(order).data, status=201)
            return Response(serializer.errors, status=400)

        except stripe.error.CardError as e:
            return Response({"error": f"Card Error: {e.user_message}"}, status=402)
        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)
        
class AdminOrderPagination(PageNumberPagination):
    page_size = 5

class AdminOrderListView(ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = AdminOrderPagination

    def get_queryset(self):
        if self.request.user.role != "admin":
            return Order.objects.none()
        return Order.objects.all().select_related("user").prefetch_related("items").order_by('-created_at')


class OrderPagination(PageNumberPagination):
    page_size = 5

class MyOrdersPaginatedView(ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = OrderPagination

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items").order_by('-created_at')
    
class UpdateOrderStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        if request.user.role != "admin":
            return Response({"error": "Unauthorized"}, status=403)

        try:
            order = Order.objects.get(id=order_id)
            order.status = request.data.get("status", order.status)
            order.tracking_number = request.data.get("tracking_number", order.tracking_number)
            order.save()
            return Response(OrderSerializer(order).data)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=404)
        
class ReviewPagination(PageNumberPagination):
    page_size = 5

class MyReviewsPaginatedView(ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = ReviewPagination

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user).order_by('-created_at')
    
class ReviewDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            review = Review.objects.get(id=pk, user=request.user)
            review.delete()
            return Response(status=204)
        except Review.DoesNotExist:
            return Response({"error": "Not found"}, status=404)
        
class ReviewUpdateView(RetrieveUpdateAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)