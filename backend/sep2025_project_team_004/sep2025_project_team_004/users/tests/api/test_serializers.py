import pytest
from sep2025_project_team_004.users.api.serializers import UserSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
class TestUserSerializer:
    def test_valid_user_serializer(self):
        data = {
            "username": "janedoe",
            "email": "janedoe@example.com",
            "password": "SecurePass123!"
        }
        serializer = UserSerializer(data=data)
        assert serializer.is_valid()
        user = serializer.save()
        assert user.email == "janedoe@example.com"

    def test_invalid_email_serializer(self):
        data = {
            "username": "invaliduser",
            "email": "invalid-email",
            "password": "SecurePass123!"
        }
        serializer = UserSerializer(data=data)
        assert not serializer.is_valid()
        assert "email" in serializer.errors

    def test_missing_fields_serializer(self):
        data = {
            "username": "missingfields"
        }
        serializer = UserSerializer(data=data)
        assert not serializer.is_valid()
        assert "email" in serializer.errors
        assert "password" in serializer.errors

    def test_duplicate_email_serializer(self):
        User.objects.create_user(username="janedoe", email="duplicate@example.com", password="SecurePass123!")

        data = {
            "username": "janedoe",
            "email": "duplicate@example.com",
            "password": "SecurePass123!"
        }
        serializer = UserSerializer(data=data)
        assert not serializer.is_valid()
        assert "email" in serializer.errors

    def test_duplicate_username_serializer(self):
        User.objects.create_user(username="janedoe", email="unique@example.com", password="SecurePass123!")

        data = {
            "username": "janedoe",
            "email": "another@example.com",
            "password": "SecurePass123!"
        }
        serializer = UserSerializer(data=data)
        assert not serializer.is_valid()
        assert "username" in serializer.errors

    def test_password_too_short(self):
        """Test password validation for length < 8"""
        data = {
            "username": "shortpass",
            "email": "shortpass@example.com",
            "password": "Short1"  # Too short (6 characters)
        }
        serializer = UserSerializer(data=data)
        assert not serializer.is_valid()
        assert "password" in serializer.errors
        assert "Password must be at least 8 characters long." in serializer.errors["password"]

    def test_password_missing_number(self):
        """Test password validation when missing a number"""
        data = {
            "username": "nonumber",
            "email": "nonumber@example.com",
            "password": "OnlyLetters"  # No digits
        }
        serializer = UserSerializer(data=data)
        assert not serializer.is_valid()
        assert "password" in serializer.errors
        assert "Password must contain at least one number." in serializer.errors["password"]

    def test_password_missing_letter(self):
        """Test password validation when missing a letter"""
        data = {
            "username": "noletter",
            "email": "noletter@example.com",
            "password": "12345678"  # No letters
        }
        serializer = UserSerializer(data=data)
        assert not serializer.is_valid()
        assert "password" in serializer.errors
        assert "Password must contain at least one letter." in serializer.errors["password"]

