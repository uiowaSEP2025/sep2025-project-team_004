from django.test import TestCase
from django.urls import reverse
from unittest.mock import patch
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from ..models import Product, Review, OrderItem, Order
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

now = timezone.now()

User = get_user_model()

def create_sample_order(user, product=None):
    if not product:
        product = Product.objects.create(name="Sample Product", price=Decimal("10.00"), stock=10)

    order = Order.objects.create(
        user=user,
        shipping_address="123 Test St",
        city="Testville",
        state="IA",
        zip_code="50010",
        total_price=Decimal("20.00"),
        status="processing"
    )
    OrderItem.objects.create(order=order, product=product, quantity=2)
    return order

def create_sample_review(user, product=None):
    if not product:
        product = Product.objects.create(name="Sample Product", price=Decimal("10.00"), stock=10)

    return Review.objects.create(
        product=product,
        user=user,
        rating=4,
        comment="Nice product."
    )

class ProductReviewsViewTests(TestCase):
    """Test the product reviews API endpoints."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()

        self.admin_user = User.objects.create_user(
            username='adminuser',
            email='admin@example.com',
            password='adminpass123',
            role='admin' 
        )
        
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            stripe_customer_id='cus_test123'
        )
        
        # Create a test product
        self.product = Product.objects.create(
            name='Test Product',
            description='Test description',
            price=Decimal('99.99'),
            stock=10
        )
        
        # Create some reviews for the product
        self.review1 = Review.objects.create(
            product=self.product,
            user=self.user,
            rating=5,
            comment='Excellent product!',
            created_at=now - timedelta(seconds=30)
        )
        self.review1.save()
        
        self.review2 = Review.objects.create(
            product=self.product,
            user=self.user,
            rating=3,
            comment='Average product.',
            created_at=now - timedelta(seconds=20)
        )
        self.review2.save()
        
        self.review3 = Review.objects.create(
            product=self.product,
            user=self.user,
            rating=4,
            comment='Good product.',
            created_at=now - timedelta(seconds=10)
        )
        self.review3.save()
        
        # URLs
        self.product_reviews_url = reverse('store:product-reviews', args=[self.product.id])
        self.product_list_url = reverse('store:product-list')
        
    def test_get_product_reviews(self):
        """Test retrieving reviews for a specific product."""
        response = self.client.get(self.product_reviews_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check that response is paginated
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)
        
        # Check we have the right number of reviews in the results
        self.assertEqual(len(response.data['results']), 3)  # We created 3 reviews
        self.assertEqual(response.data['count'], 3)
        
        # Check that reviews are ordered by most recent first
        self.assertEqual(response.data['results'][0]['id'], self.review3.id)
        self.assertEqual(response.data['results'][1]['id'], self.review2.id)
        self.assertEqual(response.data['results'][2]['id'], self.review1.id)
        
    def test_product_serializer_includes_review_data(self):
        """Test that the product serializer includes review data."""
        response = self.client.get(self.product_list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        product_data = response.data[0]  # Get the first product
        
        # Check product has review fields
        self.assertIn('average_rating', product_data)
        self.assertIn('new_reviews', product_data)
        self.assertIn('review_count', product_data)
        
        # Check values are correct
        self.assertEqual(product_data['review_count'], 3)
        self.assertEqual(len(product_data['new_reviews']), 3)  # Should return 3 preview reviews
        
        # Average of 5 + 3 + 4 = 12/3 = 4
        self.assertEqual(product_data['average_rating'], 4.0)
        
    def test_get_reviews_for_nonexistent_product(self):
        """Test that the API handles requests for reviews of non-existent products."""
        non_existent_url = reverse('store:product-reviews', args=[999])
        response = self.client.get(non_existent_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check we get an empty results list in the paginated response
        self.assertIn('results', response.data)
        self.assertEqual(len(response.data['results']), 0)  # Empty list, not an error
        self.assertEqual(response.data['count'], 0)
        
    def test_create_review(self):
        """Test creating a new review."""
        self.client.force_authenticate(user=self.user)
        
        review_data = {
            'product': self.product.id,
            'rating': 5,
            'comment': 'Another excellent review!'
        }
        
        url = reverse('store:review-create')
        response = self.client.post(url, review_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Review.objects.count(), 4)  # Now we have 4 reviews
        
        # Check if the review was created with the correct data
        review = Review.objects.get(id=response.data['id'])
        self.assertEqual(review.rating, 5)
        self.assertEqual(review.comment, 'Another excellent review!')
        self.assertEqual(review.user, self.user)
        self.assertEqual(review.product, self.product) 

    @patch("stripe.PaymentIntent.create")
    def test_checkout_and_create_order_success(self, mock_stripe):
        self.client.force_authenticate(user=self.user)
        mock_stripe.return_value = {"id": "pi_123"}
    
        payload = {
            "stripe_payment_method_id": "pm_123",
            "shipping_address": "123 Street",
            "city": "Townsville",
            "state": "IA",
            "zip_code": "50011",
            "total_price": "45.00",
            "items": [
                {"product_id": self.product.id, "quantity": 2}
            ]
        }

        url = reverse("store:create-order")
        response = self.client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED

    def test_admin_can_update_order_status(self):
        self.client.force_authenticate(user=self.admin_user)
        order = create_sample_order(user=self.user)

        url = reverse("store:update-order", args=[order.id])
        response = self.client.post(url, {"status": "out_for_delivery", "tracking_number": "TRACK123"})
        assert response.status_code == 200
        order.refresh_from_db()
        assert order.status == "out_for_delivery"
        assert order.tracking_number == "TRACK123"

    def test_user_can_view_own_orders(self):
        self.client.force_authenticate(user=self.user)
        create_sample_order(user=self.user)
    
        url = reverse("store:my-orders")
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data["count"] == 1

    def test_admin_can_view_all_orders(self):
        self.client.force_authenticate(user=self.admin_user)
        create_sample_order(user=self.user)

        url = reverse("store:orders-admin")
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data["count"] == 1

    def test_user_can_update_own_review(self):
        self.client.force_authenticate(user=self.user)
        review = create_sample_review(user=self.user, product=self.product)
    
        url = reverse("store:review-update", args=[review.id])
        response = self.client.patch(url, {"rating": 2})
        assert response.status_code == 200
        assert response.data["rating"] == 2

    def test_user_can_delete_own_review(self):
        self.client.force_authenticate(user=self.user)
        review = create_sample_review(user=self.user, product=self.product)

        url = reverse("store:review-detail", args=[review.id])
        response = self.client.delete(url)
        assert response.status_code == 204
        assert Review.objects.count() == 3