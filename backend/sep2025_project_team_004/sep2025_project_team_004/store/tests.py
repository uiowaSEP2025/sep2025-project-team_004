from django.test import TestCase
from .models import Product

class ProductModelTest(TestCase):
    def test_create_product(self):
        product = Product.objects.create(
            name="Test Product",
            description="A sample product",
            price=10.99,
            stock=50
        )
        self.assertEqual(product.name, "Test Product")
