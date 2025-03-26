import pytest
import smtplib
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


@pytest.mark.django_db
class TestRegisterView:
    def setup_method(self):
        """Setup API client before each test"""
        self.client = APIClient()
        self.register_url = "/api/users/register/"
        self.user = User.objects.create_user(username="existinguser", email="existing@example.com", password="SecurePass123!")

    def test_register_success(self):
        response = self.client.post(self.register_url, {
            "username": "johndoe",
            "email": "johndoe@example.com",
            "password": "SecurePass123!"
        }, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(username="johndoe").exists()

    def test_register_existing_username(self):
        response = self.client.post(self.register_url, {
            "username": "existinguser",
            "email": "new@example.com",
            "password": "SecurePass123!"
        }, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "username" in response.data["errors"]

    def test_register_missing_fields(self):
        response = self.client.post(self.register_url, {
            "username": "john"
        }, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "email" in response.data["errors"]
        assert "password" in response.data["errors"]

    def test_register_weak_password(self):
        response = self.client.post(self.register_url, {
            "username": "validuser",
            "email": "valid@example.com",
            "password": "123"  # Too short
        }, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "password" in response.data["errors"]

    

    

    

    

        


