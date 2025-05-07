import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from unittest.mock import patch
from .models import Product, Order, OrderItem
from sep2025_project_team_004.payment.models import PaymentMethod


User = get_user_model()



class ProductModelTest(TestCase):
    def test_create_product(self):
        """
        Test creating a product
        """
        product = Product.objects.create(
            name="Test Product",
            description="This is a test product",
            price=100.00,
            stock=10
        )
        self.assertEqual(product.name, "Test Product")


class OrderCreationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="test@example.com", 
            password="testpass", 
            stripe_customer_id="cus_test123"  # Add a stripe customer ID
        )
        self.client.force_authenticate(user=self.user)

        self.card = PaymentMethod.objects.create(
            user=self.user,
            card_type="visa",
            last4="4242",
            is_default=True,
            stripe_payment_method_id="pm_test123"  # Add a stripe payment method ID
        )

        self.product = Product.objects.create(
            name="Sensor A",
            description="Air quality sensor",
            price=50.00,
            stock=10
        )

    def test_create_order_successfully(self):
        payload = {
            "items": [{"product_id": self.product.id, "quantity": 2}],
            "total_price": 100.00,
            "shipping_address": "123 Lane",
            "stripe_payment_method_id": "pm_test123",  # Use stripe_payment_method_id instead
            "city": "Iowa City",
            "state": "IA",
            "zip_code": "52240"
        }

        # Mock the Stripe payment intent creation 
        with patch('stripe.PaymentIntent.create') as mock_create:
            mock_create.return_value = {"id": "pi_test123", "status": "succeeded"}
            response = self.client.post("/api/store/orders/create/", payload, format="json")
            
            self.assertEqual(response.status_code, 201)
            
            # Check that the order was created
            order = Order.objects.get(user=self.user)
            self.assertEqual(order.total_price, 100.00)
            self.assertEqual(order.items.count(), 1)
            self.assertEqual(order.items.first().product, self.product)

    def test_create_order_unauthenticated(self):
        self.client.force_authenticate(user=None)  
        response = self.client.post("/api/store/orders/create/", {}, format="json")
        self.assertEqual(response.status_code, 403)
