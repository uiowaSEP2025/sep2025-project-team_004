import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from sep2025_project_team_004.payment.models import PaymentMethod
from sep2025_project_team_004.payment.serializers import PaymentMethodSerializer
from rest_framework.exceptions import ValidationError

User = get_user_model()

@pytest.mark.django_db
class TestPaymentViews:
    def setup_method(self):
        """Setup API client and test user before each test"""
        self.client = APIClient()
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="SecurePass123!")
        self.client.force_authenticate(user=self.user)

        # Create a test payment method
        self.payment_method = PaymentMethod.objects.create(
            user=self.user,
            card_number="4111111111111111",
            expiration_date="12/25",
            card_type="visa",
            cardholder_name= "Man man",
            last4="1111",
            is_default=True
        )

        self.payment_url = "/api/payment/payment-methods/"
        self.default_url = f"/api/payment/set-default/{self.payment_method.id}/"
        self.delete_url = f"/api/payment/delete/{self.payment_method.id}/"

    def test_get_payment_methods(self):
        """Test retrieving a user's payment methods"""
        response = self.client.get(self.payment_url, follow=True)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1  # Should return the one we created
        assert response.data[0]["card_type"].lower() == "visa"

    def test_create_payment_method_success(self):
        """Test adding a new payment method"""
        data = {
            "card_number": "5555444433332222",
            "expiration_date": "01/26",
            "card_type": "mastercard",
            "cardholder_name": "Man Dude",
        }
        response = self.client.post(self.payment_url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert PaymentMethod.objects.filter(user=self.user, card_type="mastercard").exists()


    def test_create_payment_method_invalid(self):
        """Test creating a payment method with missing data"""
        data = {"card_number": "1234567890123456"}  # Missing expiration date and card type
        response = self.client.post(self.payment_url, data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "expiration_date" in response.data

    def test_delete_payment_method_success(self):
        """Test deleting a non-default payment method"""
        # Create a second payment method (which is not default)
        another_payment = PaymentMethod.objects.create(
            user=self.user,
            card_number="1234123412341234",
            expiration_date="06/27",
            card_type="amex",
            is_default=False
        )

        delete_url = f"/api/payment/delete/{another_payment.id}/"
        response = self.client.delete(delete_url)
        assert response.status_code == status.HTTP_200_OK
        assert not PaymentMethod.objects.filter(id=another_payment.id).exists()

    def test_delete_default_payment_method(self):
        """Test trying to delete the default payment method (should fail)"""
        response = self.client.delete(self.delete_url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Cannot delete the default payment method" in response.data.get("error", "")


@pytest.mark.django_db
class TestPaymentSerializer:
    def setup_method(self):
        """Setup a test user and a payment method"""
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="SecurePass123!")
        self.payment_method = PaymentMethod.objects.create(
            user=self.user,
            card_number="1234567812345678",
            expiration_date="12/25",
            card_type="Visa",
            is_default=True
        )
        self.serializer = PaymentMethodSerializer()
    def test_validate_card_number_success(self):
        """Test that a valid 16-digit card number passes validation"""
        valid_card = "1234567812345678"
        assert self.serializer.validate_card_number(valid_card) == valid_card

    def test_validate_card_number_invalid_length(self):
        with pytest.raises(ValidationError, match="Card number must be 16 digits."):
            self.serializer.validate_card_number("12345678")
        with pytest.raises(ValidationError, match="Card number must be 16 digits."):
            self.serializer.validate_card_number("12345678123456789")

    def test_validate_card_number_non_numeric(self):
        with pytest.raises(ValidationError, match="Card number must be 16 digits."):
            self.serializer.validate_card_number("1234abcd1234abcd")

    def test_create_payment_method_masks_card_number(self):
        data = {
            "card_number": "8765432187654321",
            "expiration_date": "12/25",
            "card_type": "visa",
        }
        serializer = PaymentMethodSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

        saved_instance = serializer.save(user=self.user)
        assert saved_instance.last4 == "4321"
        assert saved_instance.card_number == "************4321"