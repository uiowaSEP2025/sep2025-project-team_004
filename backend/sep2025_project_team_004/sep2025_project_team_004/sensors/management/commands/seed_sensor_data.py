# To run this, use:
# python manage.py seed_sensor_data

# sensors/management/commands/seed_sensor_data.py

from django.core.management.base import BaseCommand
from sep2025_project_team_004.sensors.models import Sensor, Fav_Sensor, Belongs
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Seed Fav_Sensor and Belongs data using existing Sensor records'

    def handle(self, *args, **kwargs):
        User = get_user_model()

        try:
            user55 = User.objects.get(pk=55)
            user34 = User.objects.get(pk=34)
        except User.DoesNotExist:
            self.stderr.write("User 55 or 34 does not exist.")
            return

        try:
            w05 = Sensor.objects.get(id="usda-air-w05")
            w06 = Sensor.objects.get(id="usda-air-w06")
        except Sensor.DoesNotExist as e:
            self.stderr.write(f"Sensor not found: {e}")
            return

        self.stdout.write("Seeding Fav_Sensor...")

        fav_data = [
            (w05, user55, "HomeAir"),
            (w06, user55, "06-air"),
            (w05, user34, "my-w05"),
            (w06, user34, "my-w06"),
        ]

        for sensor, user, nickname in fav_data:
            Fav_Sensor.objects.update_or_create(
                sensor=sensor,
                user=user,
                defaults={'nickname': nickname}
            )

        self.stdout.write("Seeding Belongs...")

        belongs_data = [
            (w05, user55, "Home-1"),
            (w06, user55, "Home-2"),
        ]

        for sensor, user, address in belongs_data:
            Belongs.objects.update_or_create(
                sensor=sensor,
                defaults={
                    'user': user,
                    'address': address,
                    'latitude': sensor.latitude,
                    'longitude': sensor.longitude,
                    # registered_at autofill
                }
            )

        self.stdout.write(self.style.SUCCESS("Fav_Sensor & Belongs seeded successfully!"))
