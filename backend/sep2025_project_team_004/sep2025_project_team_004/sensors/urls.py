from django.urls import path
from .views import AddSensorView,ListMySensorsView, RegisterSensorView, UpdateBelongsSensorView, UpdateFavoriteSensorView


urlpatterns = [
    path('add/', AddSensorView.as_view(), name='add-sensor'),
    path('my/', ListMySensorsView.as_view(), name='list-my-sensors'),
    path('register/', RegisterSensorView.as_view(), name='register-sensor'),
    path('<str:sensor_id>/update-favorite/', UpdateFavoriteSensorView.as_view()),
    path('<str:sensor_id>/update-belongs/', UpdateBelongsSensorView.as_view()),
]
