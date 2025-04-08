import requests

def fetch_sensor_data(sensor_id):
    url = f"https://esmc.uiowa.edu/esmc_services/data_base/querySensorInDB_working_reverse.php?sensorID={sensor_id}"
    response = requests.get(url, verify=False)
    if response.status_code == 200:
        return response.json()  # We assume it will always return json
    else:
        return None


# Caching
from django.core.cache import cache
import json

CACHE_TIMEOUT = 1500 # 25 min

def get_cached_sensor_data(sensor_id):
    cache_key = f"sensor:{sensor_id}"
    data = cache.get(cache_key)
    
    if data is not None:
        # hit
        return data
    # else:
    #     # If data is missing in redis, download json from api, update the fresh data to redis
    #     fresh_data = fetch_sensor_data(sensor_id)
    #     if fresh_data:
    #         cache.set(cache_key, fresh_data, timeout=CACHE_TIMEOUT)
    #     return fresh_data




