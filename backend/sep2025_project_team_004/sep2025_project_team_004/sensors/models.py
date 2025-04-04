from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Sensor(models.Model):
    SENSOR_TYPE_CHOICES = [
        ('air', 'Air'),
        ('soil', 'Soil'),
    ]

    id = models.CharField(max_length=50, primary_key=True)  # e.g., "usda-air-w05"
    sensor_type = models.CharField(max_length=10, choices=SENSOR_TYPE_CHOICES)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sensors")
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    def __str__(self):
        return f"{self.id} ({self.sensor_type})"
