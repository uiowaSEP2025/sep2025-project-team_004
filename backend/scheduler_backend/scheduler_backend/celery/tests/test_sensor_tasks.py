import pytest
from django.core.cache import cache
from scheduler_backend.celery.tasks import fetch_and_cache_sensor, read_sensor_data_from_cache, generate_sensor_summary
from scheduler_backend.celery.sensor_ids import SENSOR_LIST
import json
import time

@pytest.mark.django_db
class TestSensorTasks:
    def test_fetch_and_store_sensor_data(self):
        """Test fetching sensor data and storing it in Redis"""
        # Test with the first sensor in the list
        test_sensor_id = SENSOR_LIST[0]
        
        # Fetch and cache the data
        fetch_and_cache_sensor(test_sensor_id)
        
        # Read the data from cache
        cached_data = read_sensor_data_from_cache(test_sensor_id)
        sensor_data = cached_data.get(test_sensor_id)
        
        # Basic assertions
        assert sensor_data is not None, "No data found in cache"
        
        # Verify sensor ID is present in the data or in error message
        if isinstance(sensor_data, list):
            assert 'sensorID' in sensor_data[0] or 'sensor_id' in sensor_data[0], "Sensor ID field not found in data"
        elif isinstance(sensor_data, dict):
            # Check if it's either a valid response with sensorID or an error response containing the sensor ID
            has_sensor_id = (
                'sensorID' in sensor_data or 
                'sensor_id' in sensor_data or 
                test_sensor_id in str(sensor_data)
            )
            assert has_sensor_id, "Sensor ID not found in response"

    def test_read_all_sensors_data(self):
        """Test reading all sensors data from Redis"""
        # First, fetch and cache all sensors
        for sensor_id in SENSOR_LIST:
            fetch_and_cache_sensor(sensor_id)
        
        # Read all sensors data
        all_sensors_data = read_sensor_data_from_cache()
        
        # Basic assertions
        assert len(all_sensors_data) > 0, "No sensor data found in cache"
        
        # Verify each sensor has data and contains sensor ID
        for sensor_id, data in all_sensors_data.items():
            assert data is not None, f"No data found for sensor {sensor_id}"
            if isinstance(data, list):
                assert 'sensorID' in data[0] or 'sensor_id' in data[0], f"Sensor ID field not found in data for {sensor_id}"
            elif isinstance(data, dict):
                # Check if it's either a valid response with sensorID or an error response containing the sensor ID
                has_sensor_id = (
                    'sensorID' in data or 
                    'sensor_id' in data or 
                    sensor_id in str(data)
                )
                assert has_sensor_id, f"Sensor ID not found in response for {sensor_id}"

    def test_generate_sensor_summary(self):
        """Test generating summary for a sensor using ChatGPT"""
        # Test with the first sensor in the list
        test_sensor_id = SENSOR_LIST[0]
        
        # First, fetch and cache the sensor data
        fetch_and_cache_sensor(test_sensor_id)
        
        # Generate summary
        result = generate_sensor_summary(test_sensor_id)
        print(f"\nGenerate summary result: {result}")
        
        # Wait for the summary to be generated (max 30 seconds)
        max_retries = 6
        retry_interval = 5
        cached_summary = None
        
        for _ in range(max_retries):
            summary_key = f"summary:{test_sensor_id}"
            cached_summary = cache.get(summary_key)
            if cached_summary is not None:
                break
            print(f"\nWaiting for summary generation... ({_ + 1}/{max_retries})")
            time.sleep(retry_interval)
        
        # Basic assertions
        assert cached_summary is not None, "No summary found in cache after waiting"
        
        # Parse the JSON data
        summary_data = json.loads(cached_summary)
        
        # Print the summary for inspection
        print(f"\nGenerated summary for sensor {test_sensor_id}:")
        print("=" * 80)
        print(summary_data['summary'])
        print("=" * 80)
        print(f"Generated at: {summary_data['generated_at']}")
        
        # Verify the structure of stored data
        assert 'summary' in summary_data, "Summary field missing"
        assert 'generated_at' in summary_data, "Generated_at field missing"
        assert 'sensor_id' in summary_data, "Sensor_id field missing"
        assert summary_data['sensor_id'] == test_sensor_id, "Incorrect sensor ID"
        assert len(summary_data['summary']) > 0, "Empty summary" 