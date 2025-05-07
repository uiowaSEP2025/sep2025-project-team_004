from django.http import JsonResponse
from django.views.decorators.http import require_GET
from .utils import get_cached_sensor_data
from .sensors import SENSOR_LIST
from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import WeeklySensorAverage
import logging

logger = logging.getLogger(__name__)

@require_GET
def sensor_data_api(request, sensor_id):
    if sensor_id not in SENSOR_LIST:
        return JsonResponse({"error": "Sensor ID invalid."}, status=400)

    data = get_cached_sensor_data(sensor_id)
    if data:
        return JsonResponse({"sensor_id": sensor_id, "data": data})
    else:
        return JsonResponse({"error": "Sensor data unavailable."}, status=503)

class WeeklySensorAverageSerializer(serializers.ModelSerializer):
    """Serializer for the WeeklySensorAverage model."""
    class Meta:
        model = WeeklySensorAverage
        # List all fields you want to include in the JSON response
        fields = [
            'sensor_id',
            'year',
            'week_number',
            'avg_temperature',
            'avg_pressure',
            'avg_humidity',
            'avg_vcc',
            'datapoints',
            'calculation_timestamp'
        ]

@api_view(['GET'])
def get_weekly_averages_for_sensor(request, sensor_id):
    """API view to retrieve all weekly average data for a specific sensor."""
    try:
        # Query the database for all records matching the sensor_id
        # Order by year and week number for predictable results
        averages = WeeklySensorAverage.objects.filter(sensor_id=sensor_id).order_by('year', 'week_number')

        if not averages.exists():
            # If no data found for the sensor, return 404
            return Response({"error": f"No average data found for sensor ID: {sensor_id}"}, status=status.HTTP_404_NOT_FOUND)

        # Serialize the queryset
        serializer = WeeklySensorAverageSerializer(averages, many=True)

        # Return the serialized data as JSON response
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error retrieving weekly averages for sensor {sensor_id}: {e}")
        return Response({"error": "An internal server error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
