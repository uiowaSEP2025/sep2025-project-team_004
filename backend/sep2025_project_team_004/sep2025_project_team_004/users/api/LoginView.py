from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.authtoken.models import Token 
from .serializers import UserSerializer

@method_decorator(csrf_exempt, name="dispatch")
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        
        #  Django's authenticate 
        user = authenticate(username=username, password=password)
        if user is not None:
        
            login(request, user)
            
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                "message": "Login successful!",
                "token": token.key,
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)
