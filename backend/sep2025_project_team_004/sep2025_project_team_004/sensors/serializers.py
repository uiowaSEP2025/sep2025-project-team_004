# from rest_framework import serializers
# from .models import Sensor

# class SensorSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Sensor
#         fields = ["id", "sensor_type", "user", "is_default", "created_at", "latitude", "longitude", "nickname"]
#         read_only_fields = ["created_at"]

# New
# sensors/serializers.py

from rest_framework import serializers
from sep2025_project_team_004.sensors.models import Belongs, Fav_Sensor

class SensorHomeSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(source='registered_at', read_only=True)
    nickname = serializers.SerializerMethodField()
    is_default = serializers.SerializerMethodField()
    
    class Meta:
        model = Belongs
        fields = [
            'sensor',        
            'sensor_type',
            'created_at', 
            'user',     
            'latitude',
            'longitude',
            'nickname',
            'address',
            'is_default',
        ]
    
    def get_nickname(self, obj):

        request = self.context.get("request")
        if request and hasattr(request, "user"):
            fav = Fav_Sensor.objects.filter(user=request.user, sensor=obj.sensor).first()
            return fav.nickname if fav else ""
        return ""
    
    def get_is_default(self, obj):

        request = self.context.get("request")
        if request and hasattr(request, "user"):
            default_sensor = getattr(request.user, "default_sensor", None)
            if default_sensor:
                return str(default_sensor.id) == str(obj.sensor.id)
        return False