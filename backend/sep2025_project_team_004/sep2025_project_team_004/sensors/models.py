from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Belongs(models.Model):
    SENSOR_TYPE_CHOICES = [
        ('air', 'Air'),
        ('soil', 'Soil'),
    ]

    sensor_id = models.CharField(max_length=50, unique=True)
    sensor_type = models.CharField(max_length=10, choices=SENSOR_TYPE_CHOICES)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    address = models.CharField(max_length=100)
    registered_at = models.DateTimeField(auto_now_add=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    def __str__(self):
        return f"{self.sensor_id} ({self.sensor_type}) belongs to {self.user.username}"


class Fav_Sensor(models.Model):
    sensor_id = models.CharField(max_length=50)  # link to Belongs.sensor_id
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorite_sensors')
    nickname = models.CharField(max_length=20, blank=True)
    is_default = models.BooleanField(default=False)
    belongs_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_fav_sensors')

    class Meta:
        unique_together = ('sensor_id', 'user')

    def __str__(self):
        return f"{self.user.username} set {self.sensor_id} as '{self.nickname or 'no nickname'}'"