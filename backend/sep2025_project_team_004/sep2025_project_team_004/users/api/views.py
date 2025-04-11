from django.contrib.auth import get_user_model
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny
from .serializers import UserSerializer, UpdateUserSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from django.conf import settings
from rest_framework.generics import UpdateAPIView
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail, BadHeaderError
from django.contrib.auth.hashers import make_password
from sep2025_project_team_004.users.api.serializers import PasswordResetRequestSerializer, PasswordResetSerializer
import environ
import smtplib
from email.mime.text import MIMEText
import os
import requests
from rest_framework.decorators import api_view, permission_classes

env = environ.Env()


User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    

@method_decorator(csrf_exempt, name="dispatch")
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print("Incoming POST request to /api/users/register/")
        print("Parsed data:", request.data)
        if "username" not in request.data or not request.data["username"].strip():
            return Response({"error": "Username is required."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"message": "User registered successfully!"}, status=status.HTTP_201_CREATED)
        print("Validation errors:", serializer.errors)
        return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
class RequestPasswordResetView(APIView):

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]

            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({"error": "User with this email does not exist."}, status=status.HTTP_400_BAD_REQUEST)

            token = default_token_generator.make_token(user)
            user_agent = request.headers.get("User-Agent", "").lower()
            print(user_agent)
            if "mobile" in user_agent or "android" in user_agent or "ios" in user_agent or "expo" in user_agent:
                # Request came from a mobile device
                EXPO_DEV_HOST = os.getenv("PC_IP")
                reset_url = f"{EXPO_DEV_HOST}:8081/--/ResetPasswordScreen/?email={email}&token={token}"
            else:
                # Request came from a web browser
                reset_url = f"http://localhost:8081/ResetPasswordScreen/?email={email}&token={token}"


            print(f" Sending from: {settings.EMAIL_HOST_USER}")
            print(f" SMTP Password: {settings.EMAIL_HOST_PASSWORD}")

            EMAIL_HOST = "smtp.gmail.com"
            EMAIL_PORT = 587
            EMAIL_HOST_USER = env("EMAIL_HOST_USER")

            msg = MIMEText(f"Click the link below to reset your password:\n\n{reset_url}")
            msg["Subject"] = "Password Reset Request"
            msg["From"] = EMAIL_HOST_USER
            msg["To"] = email

            try:
                server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
                server.starttls()
                server.login(EMAIL_HOST_USER, env("EMAIL_HOST_PASSWORD"))
                server.sendmail(EMAIL_HOST_USER, [email], msg.as_string())
                server.quit()
                print(" Email sent successfully!")
                return Response({"message": "Password reset link sent to your email."}, status=status.HTTP_200_OK)
            except Exception as e:
                print(f" Email sending failed: {e}")
                return Response({"error": "Email could not be sent. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordView(APIView):
    """
    Handles password reset.
    """

    def get(self, request):
        """
        Validate token before resetting the password.
        """
        email = request.query_params.get("email")
        token = request.query_params.get("token")

        if not email or not token:
            return Response({"error": "Missing email or token"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Invalid email"}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": "Token is valid"}, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Handles password reset submission.
        """
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password successfully reset."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileUpdateView(UpdateAPIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        """
        Update user profile fields.
        """
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UserProfileView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
    
class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Return the logged-in user's details.
        """
        user = request.user
        return Response({
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "username": user.username,
            "address": user.address,
            "zip_code": user.zip_code,
            "phone_number": user.phone_number,
            "state": user.state,
            "city": user.city,
            "role": user.role,
               
        })
        
class SearchUsersView(APIView):
    permission_classes = [IsAuthenticated]  

    def get(self, request):
        username_query = request.query_params.get('username', '')
        if not username_query:
            return Response({"error": "Username is required"}, status=400)

        users = User.objects.filter(username__icontains=username_query)[:10]
        serializer = UserSerializer(users, many=True)

        return Response(serializer.data, status=200)
    
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ValidateAddressView(request):
    address = request.data

    SMARTY_AUTH_ID = os.getenv("SMARTY_AUTH_ID")
    SMARTY_AUTH_TOKEN = os.getenv("SMARTY_AUTH_TOKEN")

    params = {
        "street": address.get("address"),
        "city": address.get("city"),
        "state": address.get("state"),
        "zipcode": address.get("zip_code"),
        "auth-id": SMARTY_AUTH_ID,
        "auth-token": SMARTY_AUTH_TOKEN,
    }

    try:
        res = requests.get("https://us-street.api.smartystreets.com/street-address", params=params)
        data = res.json()

        if res.status_code == 200 and data:
            validated = data[0]
            return Response({
                "valid": True,
                "standardized": {
                    "address": validated.get("delivery_line_1"),
                    "city": validated["components"].get("city_name"),
                    "state": validated["components"].get("state_abbreviation"),
                    "zip_code": validated["components"].get("zipcode"),
                }
            })
        return Response({"valid": False, "message": "Address not found or invalid."}, status=400)

    except Exception as e:
        return Response({"error": str(e)}, status=500)