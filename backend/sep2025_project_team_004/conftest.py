import pytest
from django.conf import settings

@pytest.fixture(autouse=True)
def disable_migrations(monkeypatch):
    monkeypatch.setattr(settings, "MIGRATION_MODULES", {
        app: None for app in settings.INSTALLED_APPS
    })
