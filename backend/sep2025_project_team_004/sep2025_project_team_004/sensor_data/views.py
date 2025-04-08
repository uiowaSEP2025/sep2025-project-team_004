from django.http import JsonResponse
from django.views.decorators.http import require_GET
from .utils import get_cached_sensor_data
from .sensors import SENSOR_LIST

@require_GET
def sensor_data_api(request, sensor_id):
    if sensor_id not in SENSOR_LIST:
        return JsonResponse({"error": "Sensor ID invalid."}, status=400)

    data = get_cached_sensor_data(sensor_id)
    if data:
        return JsonResponse({"sensor_id": sensor_id, "data": data})
    else:
        return JsonResponse({"error": "Sensor data unavailable."}, status=503)
