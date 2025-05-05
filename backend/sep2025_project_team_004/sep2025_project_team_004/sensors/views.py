# from rest_framework import viewsets, permissions
# from .models import Sensor
# from .serializers import SensorSerializer

# class SensorViewSet(viewsets.ModelViewSet):
#     queryset = Sensor.objects.all()
#     serializer_class = SensorSerializer
#     permission_classes = [permissions.IsAuthenticated]

#     def get_queryset(self):
#         return Sensor.objects.filter(user=self.request.user)

#     def perform_create(self, serializer):
#         serializer.save(user=self.request.user)
from rest_framework import viewsets, permissions
from sep2025_project_team_004.sensors.models import Belongs
from .serializers import SensorHomeSerializer
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Fav_Sensor, Sensor

class SensorViewSet(viewsets.ReadOnlyModelViewSet):

    serializer_class = SensorHomeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Belongs.objects.all()

class UserSensorListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user

        default_sensor_id = None
        if hasattr(user, 'default_sensor') and user.default_sensor:
            default_sensor_id = user.default_sensor.id

        favorite_sensors = Fav_Sensor.objects.filter(user=user).select_related('sensor')

        response_data = []
        for fav in favorite_sensors:
            sensor = fav.sensor
            is_default = (sensor.id == default_sensor_id)

            sensor_data = {
                'id': sensor.id,
                'nickname': fav.nickname,
                'sensor_type': sensor.sensor_type,
                'latitude': sensor.latitude,
                'longitude': sensor.longitude,
                'is_default': is_default
            }
            response_data.append(sensor_data)

        return Response(response_data)
    

# New API for getting all sensors for a user
# sensors/views.py
from django.db.models import Q, F, Prefetch, BooleanField, Case, When, Value
from rest_framework import viewsets, permissions
from .models import Sensor, Fav_Sensor, Belongs
from .serializers import AggregatedSensorSerializer

class UserSensorViewSet(viewsets.ReadOnlyModelViewSet):

    serializer_class = AggregatedSensorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # 1) 只取：①我拥有的 ②我收藏的
        base_qs = (
            Sensor.objects
            .filter(
                Q(belongs_info__user=user) |       # 自己的传感器
                Q(fav_entries__user=user)          # 收藏的传感器
            )
            # 2) 预取 & 去重
            .select_related("belongs_info")
            .prefetch_related(
                Prefetch(
                    "fav_entries",
                    queryset=Fav_Sensor.objects.filter(user=user),
                    to_attr="fav_match"            # → obj.fav_match[0] or []
                )
            )
            .distinct()                            # 防止 JOIN 造成重复
        )
        return base_qs
