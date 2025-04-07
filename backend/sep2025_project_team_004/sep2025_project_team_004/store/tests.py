from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from .models import Product, Order, OrderItem
from sep2025_project_team_004.payment.models import PaymentMethod


User = get_user_model()



class ProductModelTest(TestCase):
    def test_create_product(self):
        product = Product.objects.create(
            name="Test Product",
            description="A sample product",
            price=10.99,
            stock=50
        )
        self.assertEqual(product.name, "Test Product")


class OrderCreationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="test@example.com", password="testpass")
        self.client.force_authenticate(user=self.user)

        self.card = PaymentMethod.objects.create(
            user=self.user,
            card_type="visa",
            last4="4242",
            is_default=True
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
            "payment_method_id": self.card.id,
            "city": "Iowa City",
            "state": "IA",
            "zip_code": "52240"
        }

        response = self.client.post("/api/store/orders/create/", payload, format="json")
        self.assertEqual(response.status_code, 201)

        order = Order.objects.get(user=self.user)
        self.assertEqual(order.total_price, 100.00)
        self.assertEqual(order.items.count(), 1)
        self.assertEqual(order.items.first().product, self.product)

    def test_create_order_unauthenticated(self):
        self.client.force_authenticate(user=None)  
        response = self.client.post("/api/store/orders/create/", {}, format="json")
        self.assertEqual(response.status_code, 403)
