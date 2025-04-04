from rest_framework import serializers
from .models import Sensor

class SensorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sensor
        fields = ["id", "sensor_type", "user", "is_default", "created_at", "latitude", "longitude", "nickname"]
        read_only_fields = ["created_at"]
