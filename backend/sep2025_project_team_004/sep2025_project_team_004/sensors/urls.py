from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserSensorListView, SensorViewSet


router = DefaultRouter()
router.register(r"sensors", SensorViewSet, basename="sensor")
urlpatterns = router.urls
urlpatterns += [
        path('my-sensors/', UserSensorListView.as_view(), name='user-sensor-list'),
    ]