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

class SensorViewSet(viewsets.ReadOnlyModelViewSet):

    serializer_class = SensorHomeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Belongs.objects.all()
    
