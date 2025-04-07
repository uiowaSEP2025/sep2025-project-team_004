# sep2025_project_team_004/sensor_data/tasks.py

from celery import shared_task, group
from django.core.cache import cache
import requests
import json
import logging

logger = logging.getLogger(__name__)

from .sensors import SENSOR_LIST  # import sensor list[........]

CACHE_TIMEOUT = 1500  # 25min

@shared_task
def fetch_and_cache_sensor(sensor_id):
    url = f"https://esmc.uiowa.edu/esmc_services/data_base/querySensorInDB_working_reverse.php?sensorID={sensor_id}"
    response = requests.get(url, timeout=10, verify=False)
    if response.status_code == 200:
        data = response.json()
        cache_key = f"sensor:{sensor_id}"
        cache.set(cache_key, json.dumps(data), CACHE_TIMEOUT)
        return f"{sensor_id} cached successfully"
    else:
        return f"{sensor_id} fetch failed"

@shared_task
def refresh_all_sensors():
    tasks = group(fetch_and_cache_sensor.s(sensor_id) for sensor_id in SENSOR_LIST)
    tasks.apply_async()
