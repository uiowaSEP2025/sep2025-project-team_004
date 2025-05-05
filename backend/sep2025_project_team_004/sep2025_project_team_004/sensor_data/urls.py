from django.urls import path
from .views import sensor_data_api, get_weekly_averages_for_sensor

app_name = 'sensor_data'

urlpatterns = [
    path('get_average/<str:sensor_id>/', get_weekly_averages_for_sensor, name='get_weekly_averages'), #this must be written frist to get paired first!
    path('<str:sensor_id>/', sensor_data_api, name="sensor-data"),

]
