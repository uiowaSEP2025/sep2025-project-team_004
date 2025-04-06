# tasks.py
# This task is to update every sensor data according to the list
# It should be triggered by beater
import requests
import json
import logging

from celery import shared_task, group
from django.conf import settings
from django.core.cache import cache  
from .sensor_ids import SENSOR_LIST  # import sensor list[........]

logger = logging.getLogger(__name__)

CACHE_TIMEOUT = getattr(settings, "CACHE_TIMEOUT", 1500)  # 25 min, then data expired and deleted

@shared_task
def fetch_and_cache_sensor(sensor_id):
    url = (
        "https://esmc.uiowa.edu/esmc_services/data_base/"
        f"querySensorInDB_working_reverse.php?sensorID={sensor_id}"
    )

    try:
        response = requests.get(url, timeout=10, verify=False) 
        if response.status_code == 200:
            data = response.json()
            cache_key = f"sensor:{sensor_id}"
            cache.set(cache_key, json.dumps(data), CACHE_TIMEOUT)
            logger.info(f"{sensor_id} data cached successfully.")
            return f"{sensor_id} cached successfully"
        else:
            logger.error(f"{sensor_id} fetch failed with status {response.status_code}")
            return f"{sensor_id} fetch failed: {response.status_code}"
    except requests.RequestException as e:
        logger.error(f"{sensor_id} fetch exception: {e}")
        return f"{sensor_id} fetch exception: {str(e)}"


# This is to put all sensor update in parallel task
# Equivelent to fetch_and_cache_sensor.s("a"), fetch_and_cache_sensor.s("b"), ....
@shared_task
def refresh_all_sensors():

    tasks_group = group(
        fetch_and_cache_sensor.s(sensor_id) for sensor_id in SENSOR_LIST
    )
    result = tasks_group.apply_async()
    return result
