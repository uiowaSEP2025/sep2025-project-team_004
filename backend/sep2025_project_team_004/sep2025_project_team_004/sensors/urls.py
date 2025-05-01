from django.urls import path
from .views import AddSensorView,ListMySensorsView, RegisterSensorView


urlpatterns = [
    path('add/', AddSensorView.as_view(), name='add-sensor'),
    path('my/', ListMySensorsView.as_view(), name='list-my-sensors'),
    path('register/', RegisterSensorView.as_view(), name='register-sensor'),
]
