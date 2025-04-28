from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from ..models import Product, Review
from decimal import Decimal

User = get_user_model()

class ProductReviewsViewTests(TestCase):
    """Test the product reviews API endpoints."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
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
            comment='Excellent product!'
        )
        
        self.review2 = Review.objects.create(
            product=self.product,
            user=self.user,
            rating=3,
            comment='Average product.'
        )
        
        self.review3 = Review.objects.create(
            product=self.product,
            user=self.user,
            rating=4,
            comment='Good product.'
        )
        
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