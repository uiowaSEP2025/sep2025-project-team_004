import pytest
from sep2025_project_team_004.users.api.serializers import UserSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
class TestUserSerializer:
    def test_valid_user_serializer(self):
        data = {
            "name": "Jane Doe",
            "email": "janedoe@example.com",
            "password": "SecurePass123!"
        }
        serializer = UserSerializer(data=data)
        assert serializer.is_valid()
        user = serializer.save()
        assert user.email == "janedoe@example.com"

    def test_invalid_email_serializer(self):
        data = {
            "name": "Invalid User",
            "email": "invalid-email",
            "password": "SecurePass123!"
        }
        serializer = UserSerializer(data=data)
        assert not serializer.is_valid()
        assert "email" in serializer.errors

    def test_missing_fields_serializer(self):
        data = {
            "name": "Missing Fields"
        }
        serializer = UserSerializer(data=data)
        assert not serializer.is_valid()
        assert "email" in serializer.errors
        assert "password" in serializer.errors

    def test_duplicate_email_serializer(self):
        User.objects.create_user(email="duplicate@example.com", password="SecurePass123!")

        data = {
            "name": "Duplicate User",
            "email": "duplicate@example.com",
            "password": "SecurePass123!"
        }
        serializer = UserSerializer(data=data)
        assert not serializer.is_valid()
        assert "email" in serializer.errors
