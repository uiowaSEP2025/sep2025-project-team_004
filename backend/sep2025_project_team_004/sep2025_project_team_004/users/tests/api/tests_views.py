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
            "username": "johndoe",
            "email": "johndoe@example.com",
            "password": "SecurePass123!"
        }, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(username="johndoe").exists()

    def test_register_existing_email(self):
        User.objects.create_user(username="john", email="johndoe@example.com", password="SecurePass123!")

        response = self.client.post(self.register_url, {
            "username": "johndoe",
            "email": "johndoe@example.com",
            "password": "AnotherPass456!"
        }, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "email" in response.data

    def test_register_existing_username(self):
        User.objects.create_user(username="johndoe", email="unique@example.com", password="SecurePass123!")

        response = self.client.post(self.register_url, {
            "username": "johndoe",
            "email": "new@example.com",
            "password": "SecurePass123!"
        }, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "username" in response.data

    def test_register_invalid_email(self):
        response = self.client.post(self.register_url, {
            "username": "invaliduser",
            "email": "invalid-email",
            "password": "SecurePass123!"
        }, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "email" in response.data

    def test_register_missing_fields(self):
        response = self.client.post(self.register_url, {
            "username": "john"
        }, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "email" in response.data
        assert "password" in response.data

    def test_register_missing_username(self):
        response = self.client.post(self.register_url, {
            "email": "john@example.com",
            "password": "SecurePass123!"
        }, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data
        assert response.data["error"] == "Username is required."

    def test_register_empty_username(self):
        """Test registering with an empty username"""
        response = self.client.post(self.register_url, {
            "username": "  ",  # Whitespace username
            "email": "emptyuser@example.com",
            "password": "SecurePass123!"
        }, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data
        assert response.data["error"] == "Username is required."

    def test_register_weak_password(self):
        """Test registering with a weak password"""
        response = self.client.post(self.register_url, {
            "username": "validuser",
            "email": "valid@example.com",
            "password": "123"  # Too short
        }, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "password" in response.data

    def test_register_valid_username_invalid_email(self):
        """Test registering with valid username but invalid email"""
        response = self.client.post(self.register_url, {
            "username": "validuser",
            "email": "invalidemail",
            "password": "SecurePass123!"
        }, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "email" in response.data

    def test_update_user_profile(self):
        """Test updating user profile fields"""
        update_url = "/api/users/profile/"  # Adjust if necessary
        response = self.client.patch(update_url, {
            "first_name": "UpdatedName"
        }, format="json")

        assert response.status_code == status.HTTP_200_OK
        self.user.refresh_from_db()
        assert self.user.first_name == "UpdatedName"

    def test_update_user_invalid_data(self):
        """Test updating with invalid data"""
        update_url = "/api/users/profile/"  # Adjust if necessary
        response = self.client.patch(update_url, {
            "email": "invalid-email"
        }, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "email" in response.data

    def test_get_logged_in_user(self):
        """Test retrieving the logged-in user"""
        url = "/api/users/get-object/"  # Adjust if necessary
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == self.user.email

    def test_get_user_details(self):
        """Test retrieving user details"""
        url = "/api/users/details/"  # Adjust if necessary
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["username"] == self.user.username
        assert response.data["email"] == self.user.email
