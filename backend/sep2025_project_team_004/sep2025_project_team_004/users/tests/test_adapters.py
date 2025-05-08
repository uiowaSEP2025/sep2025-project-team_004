from types import SimpleNamespace
from sep2025_project_team_004.users.adapters import SocialAccountAdapter
from django.contrib.auth import get_user_model

User = get_user_model()

def make_mock_sociallogin():
    return SimpleNamespace(user=User())

class TestSocialAccountAdapter:

    def test_populate_user_basic_fields(self):
        adapter = SocialAccountAdapter()
        request = SimpleNamespace()
        sociallogin = make_mock_sociallogin()
        data = {
            "first_name": "Jane",
            "last_name": "Doe",
            "name": "Jane Doe"
        }

        user = adapter.populate_user(request, sociallogin, data)
        assert user.first_name == "Jane"
        assert user.last_name == "Doe"

    def test_populate_user_only_name(self):
        adapter = SocialAccountAdapter()
        request = SimpleNamespace()
        sociallogin = make_mock_sociallogin()
        data = {
            "name": "John Smith"
        }

        user = adapter.populate_user(request, sociallogin, data)
        assert user.first_name == "John"
        assert user.last_name == "Smith"

    def test_populate_user_partial_name(self):
        adapter = SocialAccountAdapter()
        request = SimpleNamespace()
        sociallogin = make_mock_sociallogin()
        data = {
            "name": "Cher"
        }

        user = adapter.populate_user(request, sociallogin, data)
        assert user.first_name == "Cher"
        assert user.last_name == ""
