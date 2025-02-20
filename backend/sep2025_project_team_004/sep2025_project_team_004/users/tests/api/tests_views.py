import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

@pytest.mark.django_db
class TestRegisterView:
    def setup_method(self):
        """Setup API client before each test"""
        self.client = APIClient()
        self.register_url = "/api/users/register/"

    def test_register_success(self):
        response = self.client.post(self.register_url, {
            "name": "John Doe",
            "email": "johndoe@example.com",
            "password": "SecurePass123!"
        }, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email="johndoe@example.com").exists()

    def test_register_existing_email(self):
        User.objects.create_user(email="johndoe@example.com", password="SecurePass123!")

        response = self.client.post(self.register_url, {
            "name": "John Doe",
            "email": "johndoe@example.com",
            "password": "AnotherPass456!"
        }, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "email" in response.data

    def test_register_invalid_email(self):
        response = self.client.post(self.register_url, {
            "name": "Invalid Email",
            "email": "invalid-email",
            "password": "SecurePass123!"
        }, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "email" in response.data

    def test_register_missing_fields(self):
        response = self.client.post(self.register_url, {
            "name": "John Doe"
        }, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "email" in response.data
        assert "password" in response.data
