import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from sep2025_project_team_004.payment.models import PaymentMethod
from sep2025_project_team_004.payment.serializers import PaymentMethodSerializer
from rest_framework.exceptions import ValidationError

User = get_user_model()

class HybridMock:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)
    def __getitem__(self, key):
        return self.__dict__[key]

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
            last4="1111",
            expiration_date="12/25",
            card_type="visa",
            cardholder_name="Man man",
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
            last4="1234",
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
            last4="5678",
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
        # Don't check for card_number as it's no longer stored in the model
        assert saved_instance.card_type == "visa"


from unittest.mock import patch
from types import SimpleNamespace

@pytest.mark.django_db
class TestStripePaymentViews:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="stripeuser",
            email="stripe@example.com",
            password="testpass123",
            stripe_customer_id="cus_test123"  # needed for most views
        )
        self.client.force_authenticate(user=self.user)

    @patch("stripe.checkout.Session.create")
    def test_create_checkout_session_success(self, mock_create):
        mock_create.return_value = type("obj", (object,), {"url": "https://checkout.stripe.com/testsession"})

        response = self.client.post("/api/payment/create-checkout-session/", {"return_url": "https://myapp.com"})
        assert response.status_code == 200
        assert "checkout_url" in response.data

    @patch("stripe.checkout.Session.create", side_effect=Exception("Stripe error"))
    def test_create_checkout_session_failure(self, mock_create):
        response = self.client.post("/api/payment/create-checkout-session/", {"return_url": "https://myapp.com"})
        assert response.status_code == 400
        assert "error" in response.data

    @patch("stripe.PaymentMethod.list")
    @patch("stripe.Customer.retrieve")
    def test_list_stripe_payment_methods_success(self, mock_retrieve, mock_list):
        mock_retrieve.return_value = {
            "invoice_settings": {"default_payment_method": "pm_default"}
        }

        mock_card = SimpleNamespace(
            brand="visa",
            last4="4242",
            exp_month=12,
            exp_year=2026
        )

        mock_method = HybridMock(
            id="pm_default",
            card=mock_card,
            billing_details={"name": "John Doe"}
        )

        mock_list.return_value.data = [mock_method]

        response = self.client.get("/api/payment/stripe-methods/")
        print("RESPONSE STATUS:", response.status_code)
        print("RESPONSE DATA:", response.data)
        assert response.status_code == 200
        assert response.data[0]["is_default"] is True
        assert response.data[0]["last4"] == "4242"

    @patch("stripe.PaymentMethod.detach")
    def test_delete_stripe_payment_method_success(self, mock_detach):
        response = self.client.delete("/api/payment/stripe/delete/pm_test123/")
        assert response.status_code == 200
        assert response.data["message"] == "Card deleted from Stripe"

    @patch("stripe.PaymentMethod.detach", side_effect=Exception("Detach failed"))
    def test_delete_stripe_payment_method_failure(self, mock_detach):
        response = self.client.delete("/api/payment/stripe/delete/pm_test123/")
        assert response.status_code == 400
        assert "error" in response.data

    @patch("stripe.Customer.modify")
    def test_set_stripe_default_payment_method_success(self, mock_modify):
        response = self.client.post("/api/payment/stripe/set-default/pm_test123/")
        assert response.status_code == 200
        assert response.data["message"] == "Default Stripe card updated"

    @patch("stripe.Customer.modify", side_effect=Exception("Modify failed"))
    def test_set_stripe_default_payment_method_failure(self, mock_modify):
        response = self.client.post("/api/payment/stripe/set-default/pm_test123/")
        assert response.status_code == 400
        assert "error" in response.data

    @patch("stripe.PaymentMethod.create")
    def test_create_stripe_payment_method_success(self, mock_create):
        mock_create.return_value = type(
            "obj", (object,), {
                "id": "pm_test_123",
                "card": {
                    "brand": "visa",
                    "last4": "1234",
                    "exp_month": 12,
                    "exp_year": 2026
                },
                "billing_details": {
                    "name": "Jane Doe"
                }
            }
        )

        data = {
            "card": {
                "number": "4242424242424242",
                "exp_month": 12,
                "exp_year": 2026,
                "cvc": "123"
            },
            "billing_details": {
                "name": "Jane Doe",
                "address": "123 Stripe St"
            }
        }

        response = self.client.post("/api/payment/create-stripe-payment-method/", data, format="json")
        assert response.status_code == 200
        assert response.data["success"] is True
        assert "stripe_id" in response.data

    @patch("stripe.PaymentMethod.create", side_effect=Exception("Creation failed"))
    def test_create_stripe_payment_method_failure(self, mock_create):
        response = self.client.post("/api/payment/create-stripe-payment-method/", {}, format="json")
        assert response.status_code == 400
        assert "error" in response.data