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
    nickname = models.CharField(max_length=30, null=True, blank=True)

    def __str__(self):
        return f"{self.id} ({self.sensor_type})"

class Fav_Sensor(models.Model):
    sensor = models.ForeignKey(Sensor, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    nickname = models.CharField(max_length=20, blank=True)

    class Meta:
        unique_together = ('sensor', 'user')

    def __str__(self):
        return f"{self.user.username} set {self.sensor.id} as '{self.nickname or 'no nickname'}'"


class Belongs(models.Model):
    sensor = models.OneToOneField(Sensor, on_delete=models.CASCADE, primary_key=True)
    sensor_type = models.CharField(max_length=20, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    address = models.CharField(max_length=100)
    registered_at = models.DateTimeField(auto_now_add=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    def __str__(self):
        return f"{self.sensor.id} belongs to {self.user.username} at {self.address}"