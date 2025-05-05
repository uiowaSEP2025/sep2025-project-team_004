# backend/sep2025_project_team_004/sep2025_project_team_004/sensors/tests.py

from django.urls import reverse # Optional: If you named your URL pattern
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase # Use APITestCase for convenience
from decimal import Decimal

from .models import Sensor, Fav_Sensor

User = get_user_model()

class UserSensorListViewTest(APITestCase):

    @classmethod
    def setUpTestData(cls):
        """
        Set up non-modified objects used by all test methods.
        This runs once for the entire class.
        """
        # 1. Create User
        cls.user = User.objects.create_user(username='testuser', password='password123', email='test@example.com')

        # 2. Create Sensors
        cls.sensor1 = Sensor.objects.create(
            id='test-air-01',
            sensor_type='air',
            latitude=Decimal('41.6611'),
            longitude=Decimal('-91.5302')
        )
        cls.sensor2 = Sensor.objects.create(
            id='test-soil-02',
            sensor_type='soil',
            latitude=Decimal('41.6600'),
            longitude=Decimal('-91.5300')
        )
        cls.sensor3 = Sensor.objects.create( # A sensor the user doesn't favorite
            id='test-air-03',
            sensor_type='air'
        )

        # 3. Create Fav_Sensor entries for the user
        cls.fav1 = Fav_Sensor.objects.create(
            user=cls.user,
            sensor=cls.sensor1,
            nickname='Living Room Air'
        )
        cls.fav2 = Fav_Sensor.objects.create(
            user=cls.user,
            sensor=cls.sensor2,
            nickname='Backyard Soil'
        )

        # 4. Set Default Sensor ON THE USER MODEL
        #    Make sure your User model actually has a field named 'default_sensor'
        #    If it doesn't, this line will cause an error, and you need to adjust
        #    your User model definition or the test setup.
        if hasattr(cls.user, 'default_sensor'):
             cls.user.default_sensor = cls.sensor1
             cls.user.save()
        else:
             # Handle the case where User model doesn't have default_sensor
             # Maybe print a warning or raise an error if it's expected
             print("Warning: User model does not have 'default_sensor' field in test setup.")


        # Store the URL (replace 'user-sensor-list' if your URL name is different)
        # If you don't have a URL name, use the literal path: '/api/sensors/'
        try:
            # Make sure you have defined a name in your urls.py like:
            # path('api/sensors/', UserSensorListView.as_view(), name='user-sensor-list')
            cls.url = reverse('user-sensor-list')
        except Exception: # noqa - Catch potential NoReverseMatch
            cls.url = '/api/sensors/' # Fallback to literal path


    def test_get_user_sensor_list_authenticated(self):
        """
        Test retrieving the sensor list for an authenticated user using Fav_Sensor.
        """
        # Authenticate the client as the test user
        self.client.force_authenticate(user=self.user)

        # Make GET request to the API endpoint
        response = self.client.get(self.url)

        # --- Assertions ---
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Expected 200 OK, got {response.status_code}")
        self.assertIsInstance(response.data, list, "Response data should be a list")
        self.assertEqual(len(response.data), 2, "Should only return the 2 favorited sensors")

        # --- Define the expected data structure ---
        # Note: Serializers often return Decimal fields as strings.
        # Verify this matches your actual serializer output or adjust the test.
        expected_data = [
            {
                'id': self.sensor1.id,
                'nickname': self.fav1.nickname, # Nickname from Fav_Sensor
                'sensor_type': self.sensor1.sensor_type,
                'latitude': str(self.sensor1.latitude) if self.sensor1.latitude is not None else None,
                'longitude': str(self.sensor1.longitude) if self.sensor1.longitude is not None else None,
                'is_default': True # sensor1 is the default (assuming user.default_sensor was set)
            },
            {
                'id': self.sensor2.id,
                'nickname': self.fav2.nickname, # Nickname from Fav_Sensor
                'sensor_type': self.sensor2.sensor_type,
                'latitude': str(self.sensor2.latitude) if self.sensor2.latitude is not None else None,
                'longitude': str(self.sensor2.longitude) if self.sensor2.longitude is not None else None,
                'is_default': False # sensor2 is not the default
            }
        ]

        # Sort both actual and expected data by 'id' for reliable comparison
        # as the order of results from the database isn't always guaranteed.
        actual_data_sorted = sorted(response.data, key=lambda x: x['id'])
        expected_data_sorted = sorted(expected_data, key=lambda x: x['id'])

        # Compare the sorted lists
        self.assertEqual(actual_data_sorted, expected_data_sorted, "Response data does not match expected data.")

    def test_get_user_sensor_list_unauthenticated(self):
        """
        Test that unauthenticated users cannot access the list.
        """
        # Make GET request without authentication
        response = self.client.get(self.url)

        # Expect 401 Unauthorized or 403 Forbidden depending on DRF default settings
        # (IsAuthenticated permission usually results in 401 if using TokenAuthentication etc.)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, "Unauthenticated access should be denied (401).")