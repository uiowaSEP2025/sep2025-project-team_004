import pytest
from django.urls import reverse, resolve
from sep2025_project_team_004.users.api.views import RegisterView

@pytest.mark.django_db
def test_register_url():
    path = reverse("users:register")
    assert resolve(path).func.view_class == RegisterView
