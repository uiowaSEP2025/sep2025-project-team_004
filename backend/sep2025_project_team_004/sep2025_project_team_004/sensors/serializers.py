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
    

from rest_framework import serializers
from .models import Sensor

class AggregatedSensorSerializer(serializers.ModelSerializer):
    nickname    = serializers.SerializerMethodField()
    latitude    = serializers.SerializerMethodField()
    longitude   = serializers.SerializerMethodField()
    is_default  = serializers.SerializerMethodField()

    class Meta:
        model  = Sensor
        # Make sure the return structure is consistent with the old version
        fields = (
            "id", "sensor_type",
            "nickname", "latitude", "longitude",
            "is_default"
        )

    def get_nickname(self, obj):
        user = self.context["request"].user
        fav   = getattr(obj, "fav_match", None)
        return fav.nickname if fav else None

    def get_latitude(self, obj):
        b = getattr(obj, "belongs_info", None)
        return b.latitude if b else None

    def get_longitude(self, obj):
        b = getattr(obj, "belongs_info", None)
        return b.longitude if b else None

    def get_is_default(self, obj):
        user = self.context["request"].user
        return user.default_sensor_id == obj.id