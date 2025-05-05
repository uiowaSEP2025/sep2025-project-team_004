from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Belongs, Fav_Sensor
from .serializers import AddSensorSerializer, SensorDetailSerializer, RegisterSensorSerializer

import requests
import os

class AddSensorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AddSensorSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        sensor_id = serializer.validated_data["sensor_id"]
        nickname = serializer.validated_data.get("nickname", "")

        try:
            belongs = Belongs.objects.get(sensor_id=sensor_id)
        except Belongs.DoesNotExist:
            return Response({"error": "This sensor is not registered yet."}, status=status.HTTP_404_NOT_FOUND)

        if Fav_Sensor.objects.filter(sensor_id=sensor_id, user=request.user, belongs_to=belongs.user).exists():
            return Response({"error": "You have already added this sensor."}, status=status.HTTP_400_BAD_REQUEST)

        is_first = not Fav_Sensor.objects.filter(user=request.user).exists()

        Fav_Sensor.objects.create(
            sensor_id=sensor_id,
            user=request.user,
            belongs_to=belongs.user,
            nickname=nickname,
            is_default=is_first
        )

        return Response({"message": "Sensor added successfully."}, status=status.HTTP_201_CREATED)


class ListMySensorsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        favorites = Fav_Sensor.objects.select_related('belongs_to').filter(user=request.user)
        data = []

        for fav in favorites:
            try:
                belongs = Belongs.objects.get(sensor_id=fav.sensor_id)
                entry = {
                    "sensor_id": fav.sensor_id,
                    "nickname": fav.nickname,
                    "is_default": fav.is_default,
                    "belongs_to": fav.belongs_to.id,
                    "latitude": belongs.latitude,
                    "longitude": belongs.longitude,
                    "registered_at": belongs.registered_at,
                    "address": belongs.address,
                    "sensor_type": belongs.sensor_type,
                }
                serialized = SensorDetailSerializer(entry).data
                data.append(serialized)
            except Belongs.DoesNotExist:
                continue

        return Response(data, status=status.HTTP_200_OK)


class RegisterSensorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RegisterSensorSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        sensor_id = serializer.validated_data["sensor_id"]
        sensor_type = serializer.validated_data["sensor_type"]  
        nickname = serializer.validated_data.get("nickname", "")
        address_str = serializer.validated_data["address"]

        if Belongs.objects.filter(sensor_id=sensor_id).exists():
            return Response({"error": "This sensor is already registered by another user."}, status=400)

        SMARTY_AUTH_ID = os.getenv("SMARTY_AUTH_ID")
        SMARTY_AUTH_TOKEN = os.getenv("SMARTY_AUTH_TOKEN")

        params = {
            "street": address_str,
            "auth-id": SMARTY_AUTH_ID,
            "auth-token": SMARTY_AUTH_TOKEN,
        }

        try:
            res = requests.get("https://us-street.api.smartystreets.com/street-address", params=params)
            data = res.json()

            if res.status_code != 200 or not data:
                return Response({"error": "Invalid address or geocoding failed."}, status=400)

            metadata = data[0].get("metadata", {})
            full_address = data[0]["delivery_line_1"]
            latitude = metadata.get("latitude")
            longitude = metadata.get("longitude")

            if latitude is None or longitude is None:
                return Response({"error": "Geocoding did not return coordinates."}, status=400)

        except Exception as e:
            return Response({"error": f"Geocoding error: {str(e)}"}, status=500)

        Belongs.objects.create(
            sensor_id=sensor_id,
            sensor_type=sensor_type,
            user=request.user,
            address=full_address,
            latitude=latitude,
            longitude=longitude
        )

        is_first = not Fav_Sensor.objects.filter(user=request.user).exists()

        Fav_Sensor.objects.create(
            sensor_id=sensor_id,
            user=request.user,
            belongs_to=request.user,
            nickname=nickname,
            is_default=is_first
        )

        return Response({"message": "Sensor registered successfully."}, status=201)
    

class UpdateFavoriteSensorView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, sensor_id):
        try:
            fav = Fav_Sensor.objects.get(sensor_id=sensor_id, user=request.user)
        except Fav_Sensor.DoesNotExist:
            return Response({"error": "Sensor not found in your favorites."}, status=404)

        nickname = request.data.get("nickname")
        is_default = request.data.get("is_default")

        if nickname is not None:
            fav.nickname = nickname

        if is_default:
            # Set others to False
            Fav_Sensor.objects.filter(user=request.user).update(is_default=False)
            fav.is_default = True

        fav.save()
        return Response({"message": "Favorite updated."}, status=200)


class UpdateBelongsSensorView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, sensor_id):
        try:
            belongs = Belongs.objects.get(sensor_id=sensor_id)
        except Belongs.DoesNotExist:
            return Response({"error": "Sensor not found."}, status=404)

        if belongs.user != request.user:
            return Response({"error": "You do not have permission to update this sensor."}, status=403)

        address_str = request.data.get("address")
        if not address_str:
            return Response({"error": "Address is required."}, status=400)

        SMARTY_AUTH_ID = os.getenv("SMARTY_AUTH_ID")
        SMARTY_AUTH_TOKEN = os.getenv("SMARTY_AUTH_TOKEN")
        params = {
            "street": address_str,
            "auth-id": SMARTY_AUTH_ID,
            "auth-token": SMARTY_AUTH_TOKEN,
        }

        res = requests.get("https://us-street.api.smartystreets.com/street-address", params=params)
        data = res.json()

        if res.status_code != 200 or not data:
            return Response({"error": "Invalid address or geocoding failed."}, status=400)

        metadata = data[0].get("metadata", {})
        full_address = data[0]["delivery_line_1"]
        latitude = metadata.get("latitude")
        longitude = metadata.get("longitude")

        if latitude is None or longitude is None:
            return Response({"error": "Geocoding failed to return coordinates."}, status=400)

        belongs.address = full_address
        belongs.latitude = latitude
        belongs.longitude = longitude
        belongs.save()

        return Response({"message": "Sensor location updated."}, status=200)
