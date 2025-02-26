from io import StringIO

import pytest
from django.core.management import call_command

from sep2025_project_team_004.users.models import User


@pytest.mark.django_db
class TestUserManager:
    def test_create_user(self):
        user = User.objects.create_user(
            username="johndoe",
            email="john@example.com",
            password="something-r@nd0m!",  # noqa: S106
        )
        assert user.email == "john@example.com"
        assert user.username == "johndoe"
        assert not user.is_staff
        assert not user.is_superuser
        assert user.check_password("something-r@nd0m!")
        

    def test_create_superuser(self):
        user = User.objects.create_superuser(
            username="adminuser",
            email="admin@example.com",
            password="something-r@nd0m!",  # noqa: S106
        )
        assert user.email == "admin@example.com"
        assert user.username == "adminuser"
        assert user.is_staff
        assert user.is_superuser
        

    def test_create_superuser_username_ignored(self):
        user = User.objects.create_superuser(
            username="superadmin",
            email="test@example.com",
            password="something-r@nd0m!",  # noqa: S106
        )
        assert user.username == "superadmin"


@pytest.mark.django_db
def test_createsuperuser_command():
    """Ensure createsuperuser command works with our custom manager."""
    out = StringIO()
    command_result = call_command(
        "createsuperuser",
        "--email",
        "henry@example.com",
        interactive=False,
        stdout=out,
    )

    assert command_result is None
    assert out.getvalue() == "Superuser created successfully.\n"
    user = User.objects.get(email="henry@example.com")
    assert not user.has_usable_password()
