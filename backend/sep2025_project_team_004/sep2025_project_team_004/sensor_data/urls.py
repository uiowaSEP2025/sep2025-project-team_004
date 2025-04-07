from django.urls import path
from .views import sensor_data_api

urlpatterns = [
    path('<str:sensor_id>/', sensor_data_api, name="sensor-data"),
]
