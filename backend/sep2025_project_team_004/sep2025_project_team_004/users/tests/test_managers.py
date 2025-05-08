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
def test_createsuperuser_command_skips_without_tty():
    """
    Under pytest (no real TTY), `createsuperuser --no_input`
    should skip—and print the skip message—instead of creating a user.
    """
    out = StringIO()
    call_command(
        "createsuperuser",
        email="henry@example.com",
        no_input=True,
        stdout=out,
    )
    output = out.getvalue()

    # When not running in a TTY, Django skips:
    assert "Superuser creation skipped due to not running in a TTY." in output

    # And no user was created:
    assert not User.objects.filter(email="henry@example.com").exists()
