from rest_framework import serializers
from .models import Belongs, Fav_Sensor


class AddSensorSerializer(serializers.Serializer):
    sensor_id = serializers.CharField() 
    nickname = serializers.CharField(max_length=20, required=False, allow_blank=True)


class RegisterSensorSerializer(serializers.Serializer):
    sensor_id = serializers.CharField()
    sensor_type = serializers.ChoiceField(choices=[('air', 'Air'), ('soil', 'Soil')])
    address = serializers.CharField()
    nickname = serializers.CharField(max_length=20, required=False, allow_blank=True)


class SensorDetailSerializer(serializers.Serializer):
    sensor_id = serializers.CharField()
    nickname = serializers.CharField()
    is_default = serializers.BooleanField()
    belongs_to = serializers.PrimaryKeyRelatedField(read_only=True)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    registered_at = serializers.DateTimeField()
    address = serializers.CharField()
    sensor_type = serializers.ChoiceField(choices=[("air", "Air"), ("soil", "Soil")])