from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import FriendRequest
from .serializers import FriendRequestSerializer

User = get_user_model()

class FriendRequestViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def send_request(self, request):
        """Send a friend request to another user."""
        to_user_id = request.data.get("to_user_id")
        if not to_user_id:
            return Response({"error": "Missing 'to_user_id'"}, status=status.HTTP_400_BAD_REQUEST)

        to_user = User.objects.filter(id=to_user_id).first()
        if not to_user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if FriendRequest.objects.filter(from_user=request.user, to_user=to_user).exists():
            return Response({"error": "Friend request already sent"}, status=status.HTTP_400_BAD_REQUEST)

        FriendRequest.objects.create(from_user=request.user, to_user=to_user)
        return Response({"message": "Friend request sent"}, status=status.HTTP_201_CREATED)

    def accept_request(self, request, pk):
        """Accept a friend request."""
        friend_request = FriendRequest.objects.filter(id=pk, to_user=request.user).first()
        if not friend_request:
            return Response({"error": "Friend request not found"}, status=status.HTTP_404_NOT_FOUND)

        friend_request.accept()
        return Response({"message": "Friend request accepted"}, status=status.HTTP_200_OK)

    def reject_request(self, request, pk):
        """Reject a friend request."""
        friend_request = FriendRequest.objects.filter(id=pk, to_user=request.user).first()
        if not friend_request:
            return Response({"error": "Friend request not found"}, status=status.HTTP_404_NOT_FOUND)

        friend_request.delete()
        return Response({"message": "Friend request rejected"}, status=status.HTTP_200_OK)

    def list_pending_requests(self, request):
        """List pending incoming friend requests."""
        pending_requests = FriendRequest.objects.filter(to_user=request.user)
        serializer = FriendRequestSerializer(pending_requests, many=True)
        return Response(serializer.data)

    def list_friends(self, request):
        """List all accepted friends."""
        friends = request.user.friends.all()
        return Response([{"id": user.id, "username": user.username} for user in friends])
