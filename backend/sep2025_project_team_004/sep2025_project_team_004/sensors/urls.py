from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SensorViewSet

router = DefaultRouter()
router.register(r"", SensorViewSet, basename="sensor")

urlpatterns = router.urls
