# tasks.py
# This task is to update every sensor data according to the list
# It should be triggered by beater
import requests
import json
import logging
from datetime import datetime

from celery import shared_task, group
from django.conf import settings
from django.core.cache import cache  
from .sensor_ids import SENSOR_LIST  # import sensor list[........]
import openai

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
            cache.set(cache_key, data, CACHE_TIMEOUT)
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

@shared_task
def read_sensor_data_from_cache(sensor_id=None):
    """
    Read sensor data from Redis cache.
    If sensor_id is None, read all sensors' data.
    Returns a dictionary of sensor data.
    """
    try:
        if sensor_id:
            cache_key = f"sensor:{sensor_id}"
            data = cache.get(cache_key)
            return {sensor_id: data} if data else {}
        
        # If no specific sensor_id, get all sensors' data
        result = {}
        for sensor_id in SENSOR_LIST:
            cache_key = f"sensor:{sensor_id}"
            data = cache.get(cache_key)
            if data:
                result[sensor_id] = data
        return result
    except Exception as e:
        logger.error(f"Error reading sensor data from cache: {e}")
        return {}

@shared_task
def generate_sensor_summary(sensor_id):
    """
    Generate a summary report for a sensor using ChatGPT API and store it in Redis.
    """
    try:
        # Get sensor data
        sensor_data = read_sensor_data_from_cache(sensor_id)
        if not sensor_data or sensor_id not in sensor_data:
            logger.error(f"No data found for sensor {sensor_id}")
            return f"No data available for sensor {sensor_id}"

        # Prepare prompt for ChatGPT
        prompt = f"""This is a one-month sensor data from Iowa City in US, analysis this sensor's data
(should contain temperature, ignore humidity, pressure, may contain soil temperature and soil moisture, if so, analysis them too, if not, don't mention the soil) check the vcc, if the vcc is above 3600, then mention the battery level is good, if it dropped below 3600 for a few times, ask them to contact support to replace the battery. 
Generate a report and focus on the recent week and the last day, if it is an abnormal time. Write 1-2 paragraphs. 

Data: {json.dumps(sensor_data[sensor_id], indent=2)}"""

        # Call ChatGPT API using new version syntax
        try:
            client = openai.OpenAI()
            response = client.chat.completions.create(
                model="gpt-4.1-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that analyzes environmental sensor data."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            summary = response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error calling ChatGPT API: {e}")
            return f"Error generating summary for sensor {sensor_id}: {str(e)}"

        # Store summary in Redis
        summary_key = f"summary:{sensor_id}"
        summary_data = {
            "summary": summary,
            "generated_at": datetime.utcnow().isoformat(),
            "sensor_id": sensor_id
        }
        cache.set(summary_key, json.dumps(summary_data), timeout=172800)  # 2 days expiration
        
        logger.info(f"Successfully generated and stored summary for sensor {sensor_id}")
        return f"Summary generated for sensor {sensor_id}"

    except Exception as e:
        logger.error(f"Error in generate_sensor_summary: {e}")
        return f"Error in generate_sensor_summary: {str(e)}"

@shared_task
def generate_all_sensor_summaries():
    """
    Generate summaries for all sensors in parallel.
    This task is scheduled to run daily at UTC 4:00 (US Eastern 12:00 AM)
    """
    tasks_group = group(
        generate_sensor_summary.s(sensor_id) for sensor_id in SENSOR_LIST
    )
    # Execute immediately
    result = tasks_group.apply_async()
    logger.info("Started generating summaries for all sensors")
    return result

# Run summaries generation on startup if needed
from django.core.cache import cache
startup_key = "summaries_generated_on_startup"
if not cache.get(startup_key):
    generate_all_sensor_summaries.delay()
    cache.set(startup_key, "1", timeout=86400)  # Set for 24 hours to prevent multiple startup runs
