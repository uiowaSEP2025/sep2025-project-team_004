import pytest
import smtplib
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.files.uploadedfile import SimpleUploadedFile
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

    @pytest.mark.django_db
    def test_user_detail_view(self):
        user = User.objects.create_user(username="john", email="john@example.com", password="TestPass123")
        self.client.force_authenticate(user=user)

        response = self.client.get("/api/users/me/")
        assert response.status_code == 200
        assert response.data["email"] == user.email

    @pytest.mark.django_db
    def test_profile_update(self):
        user = User.objects.create_user(username="upd", email="upd@example.com", password="Test123!")
        self.client.force_authenticate(user=user)

        response = self.client.patch("/api/users/profile/update/", {
            "first_name": "Updated",
            "city": "NewCity"
        }, format="json")

        assert response.status_code == 200
        assert response.data["first_name"] == "Updated"
        assert response.data["city"] == "NewCity"

    @pytest.mark.django_db
    def test_search_users_view(self):
        user = User.objects.create_user(username="searchme", email="search@example.com", password="Test123!")
        self.client.force_authenticate(user=user)

        User.objects.create_user(username="alice", email="a@example.com", password="pw123456")
        User.objects.create_user(username="alex", email="b@example.com", password="pw123456")

        response = self.client.get("/api/users/search/?username=al")
        assert response.status_code == 200
        assert len(response.data) >= 2

    @patch("smtplib.SMTP")
    def test_request_password_reset_valid(self, mock_smtp):
        User.objects.create_user(username="user", email="user@example.com", password="pass1234")

        response = self.client.post("/api/users/auth/request-password-reset/", {"email": "user@example.com"})
        assert response.status_code == 200
        assert "message" in response.data
        mock_smtp.assert_called_once()

    def test_request_password_reset_invalid_email(self):
        response = self.client.post("/api/users/auth/request-password-reset/", {"email": "wrong@example.com"})
        assert response.status_code == 400
        assert "error" in response.data or "email" in response.data

    @patch("smtplib.SMTP")
    def test_request_password_reset_email_failure(self, mock_smtp):
        User.objects.create_user(username="fail", email="fail@example.com", password="pass1234")

        # Simulate sendmail throwing an exception
        smtp_instance = mock_smtp.return_value
        smtp_instance.sendmail.side_effect = Exception("SMTP error")

        response = self.client.post("/api/users/auth/request-password-reset/", {"email": "fail@example.com"})

        assert response.status_code == 500
        assert "error" in response.data

    def test_reset_password_get_valid_token(self):
        user = User.objects.create_user(email="reset@example.com", password="OldPass123", username="reset")
        token = default_token_generator.make_token(user)
        response = self.client.get(f"/api/users/auth/reset-password/?email=reset@example.com&token={token}")
        assert response.status_code == 200

    def test_reset_password_get_invalid_token(self):
        response = self.client.get("/api/users/auth/reset-password/?email=none&token=invalid")
        assert response.status_code == 400

    def test_reset_password_post_valid(self):
        user = User.objects.create_user(email="res@example.com", password="OldPass123", username="res")
        token = default_token_generator.make_token(user)
        data = {"email": user.email, "token": token, "new_password": "NewStrongPass123"}
        response = self.client.post("/api/users/auth/reset-password/", data)
        assert response.status_code == 200

    def test_reset_password_post_expired_token(self):
        user = User.objects.create_user(email="bad@example.com", password="pass123", username="bad")
        data = {"email": user.email, "token": "invalid", "new_password": "NewPass123"}
        response = self.client.post("/api/users/auth/reset-password/", data)
        assert response.status_code == 400

    def test_reset_password_post_weak_password(self):
        user = User.objects.create_user(email="weak@example.com", password="pass123", username="weak")
        token = default_token_generator.make_token(user)
        data = {"email": user.email, "token": token, "new_password": "123"}
        response = self.client.post("/api/users/auth/reset-password/", data)
        assert response.status_code == 400

    def test_user_profile_view(self):
        user = User.objects.create_user(username="me", email="me@example.com", password="TestPass123")
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/users/profile/")
        assert response.status_code == 200
        assert response.data["email"] == user.email

    @patch("requests.get")
    def test_validate_address_valid(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = [{
            "delivery_line_1": "123 Main St",
            "components": {"city_name": "Anytown", "state_abbreviation": "IL", "zipcode": "60000"}
        }]
        user = User.objects.create_user(username="addr", email="addr@example.com", password="pw")
        self.client.force_authenticate(user=user)
        response = self.client.post("/api/users/validate-address/", {
            "address": "123 Main St", "city": "Anytown", "state": "IL", "zip_code": "60000"
        })
        assert response.status_code == 200
        assert response.data["valid"] is True

    @patch("requests.get")
    def test_validate_address_invalid(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = []
        user = User.objects.create_user(username="addr2", email="addr2@example.com", password="pw")
        self.client.force_authenticate(user=user)
        response = self.client.post("/api/users/validate-address/", {
            "address": "???", "city": "???", "state": "??", "zip_code": "00000"
        })
        assert response.status_code == 400

    @patch("requests.get", side_effect=Exception("Smarty error"))
    def test_validate_address_error(self, mock_get):
        user = User.objects.create_user(username="failaddr", email="failaddr@example.com", password="pw")
        self.client.force_authenticate(user=user)
        response = self.client.post("/api/users/validate-address/", {
            "address": "123", "city": "X", "state": "Y", "zip_code": "Z"
        })
        assert response.status_code == 500

@pytest.mark.django_db
class TestProfilePictureUploadView:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="picuser", email="pic@example.com", password="test1234")
        self.client.force_authenticate(user=self.user)

    def test_no_image_provided(self):
        response = self.client.post("/api/users/upload-profile-picture/", {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["error"] == "No image file provided"

    @patch("sep2025_project_team_004.users.api.views.User.save", side_effect=Exception("Save failed"))
    def test_upload_raises_exception(self, mock_save):
        image = SimpleUploadedFile("profile.jpg", b"file_content", content_type="image/jpeg")
        response = self.client.post("/api/users/upload-profile-picture/", {"profile_picture": image})

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "error" in response.data



    

    

    

    

        


