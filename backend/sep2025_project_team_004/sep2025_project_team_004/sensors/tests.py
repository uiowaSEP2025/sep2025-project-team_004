from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from sep2025_project_team_004.sensors.models import Belongs, Fav_Sensor
from unittest.mock import patch
from django.core.management import call_command
import json

User = get_user_model()

class SensorViewTests(APITestCase):
        def setUp(self):
            self.user = User.objects.create_user(username='testuser', password='testpass', email="user@gmail.com")
            self.client.force_authenticate(user=self.user)

        @patch("sep2025_project_team_004.sensors.views.requests.get")
        def test_register_sensor_success(self, mock_get):
            mock_get.return_value.status_code = 200
            mock_get.return_value.json.return_value = [{
                "delivery_line_1": "123 Main St",
                "metadata": {
                    "latitude": 40.7128,
                    "longitude": -74.0060
                }
            }]
            payload = {
                "sensor_id": "sensor123",
                "sensor_type": "air",
                "address": "123 Main St",
                "nickname": "My Air Sensor"
            }
            response = self.client.post(reverse("sensors:register-sensor"), data=payload)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertEqual(Belongs.objects.count(), 1)
            self.assertEqual(Fav_Sensor.objects.count(), 1)

        def test_add_sensor_fails_when_not_registered(self):
            payload = {
                "sensor_id": "unregistered123",
                "nickname": "Ghost Sensor"
            }
            response = self.client.post(reverse("sensors:add-sensor"), data=payload)
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        def test_list_my_sensors_returns_expected_structure(self):
            Belongs.objects.create(
                sensor_id="abc123", sensor_type="air", user=self.user,
                address="123 Test St", latitude=1.1, longitude=2.2
            )
            Fav_Sensor.objects.create(
                sensor_id="abc123", user=self.user, belongs_to=self.user,
                nickname="Test Sensor", is_default=True
            )
            response = self.client.get(reverse("sensors:list-my-sensors"))
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(len(response.data) == 1)
            self.assertEqual(response.data[0]["sensor_id"], "abc123")

        def test_update_favorite_sensor(self):
            Belongs.objects.create(sensor_id="abc123", sensor_type="air", user=self.user, address="123", latitude=1, longitude=2)
            Fav_Sensor.objects.create(sensor_id="abc123", user=self.user, belongs_to=self.user, nickname="", is_default=True)
            payload = {"nickname": "Updated Name", "is_default": True}
            response = self.client.patch(reverse("sensors:update-fav-sensor", args=["abc123"]), data=payload)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(Fav_Sensor.objects.get(sensor_id="abc123").nickname, "Updated Name")

        @patch("sep2025_project_team_004.sensors.views.requests.get")
        def test_update_belongs_sensor_success(self, mock_get):
            Belongs.objects.create(sensor_id="abc123", sensor_type="air", user=self.user, address="Old", latitude=0, longitude=0)
            mock_get.return_value.status_code = 200
            mock_get.return_value.json.return_value = [{
                "delivery_line_1": "456 Updated St",
                "metadata": {
                    "latitude": 41.0,
                    "longitude": -75.0
                }
            }]
            payload = {"address": "456 Updated St"}
            response = self.client.patch(reverse("sensors:update-belongs-sensor", args=["abc123"]), data=payload)
            self.assertEqual(response.status_code, 200)
            belongs = Belongs.objects.get(sensor_id="abc123")
            self.assertEqual(belongs.address, "456 Updated St")
            self.assertEqual(float(belongs.latitude), 41.0)
            self.assertEqual(float(belongs.longitude), -75.0)
            