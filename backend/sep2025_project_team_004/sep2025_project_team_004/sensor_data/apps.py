# sensor_data/apps.py
from django.apps import AppConfig

class SensorDataConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'sep2025_project_team_004.sensor_data'

    def ready(self):
        from .tasks_setup import setup_periodic_tasks
        try:
            setup_periodic_tasks()
        except Exception as e:
            print(f"Periodic tasks setup failed: {e}")