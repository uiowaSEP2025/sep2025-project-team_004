import pytest
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.contrib.auth import get_user_model

from sep2025_project_team_004.store.models import Product, Order, OrderItem, Review

User = get_user_model()


class StoreModelsTest(TestCase):
    def setUp(self):
        # Create a user for orders and reviews
        self.user = User.objects.create_user(
            username="tester",
            email="tester@example.com",
            password="pass1234"
        )

        # Create a product
        self.product = Product.objects.create(
            name="Widget",
            description="Test widget",
            price=9.99,
            stock=100
        )

    def test_product_str_and_fields(self):
        """Product.__str__ should return its name, and fields should store correctly."""
        self.assertEqual(str(self.product), "Widget")
        self.assertEqual(self.product.price, 9.99)
        self.assertEqual(self.product.stock, 100)

    def test_order_and_orderitem_str(self):
        """Order.__str__ and OrderItem.__str__ reflect user and quantities."""
        order = Order.objects.create(
            user=self.user,
            shipping_address="123 Main St",
            city="Testville",
            state="TS",
            zip_code="12345",
            total_price=19.98
        )
        # Create two items
        item1 = OrderItem.objects.create(order=order, product=self.product, quantity=2)
        self.assertEqual(str(order), f"Order {order.id} by {self.user.username}")
        self.assertEqual(str(item1), f"2x {self.product.name} in Order {order.id}")
        self.assertEqual(order.items.count(), 1)

    def test_review_rating_validators(self):
        """Review.rating must be between 1 and 5 inclusive."""
        # Good rating
        review = Review(
            product=self.product,
            user=self.user,
            rating=4,
            comment="Great!"
        )
        # Should not raise
        review.full_clean()
        review.save()
        self.assertEqual(str(review), f"Review for {self.product.name} - {review.rating} stars")

        # Too low
        bad = Review(product=self.product, user=self.user, rating=0, comment="Too low")
        with self.assertRaises(ValidationError):
            bad.full_clean()

        # Too high
        bad2 = Review(product=self.product, user=self.user, rating=6, comment="Too high")
        with self.assertRaises(ValidationError):
            bad2.full_clean()
