from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import FriendRequest, Message
from .serializers import FriendRequestSerializer, MessageSerializer
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from django.db import models
from django.db.models import Q
import uuid

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

        # Accept the request (updates status and performs any other logic)
        friend_request.accept()
        
        # Update the ManyToMany field on both users
        request.user.friends.add(friend_request.from_user)
        friend_request.from_user.friends.add(request.user)
        
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
        pending_requests = FriendRequest.objects.filter(
            to_user=request.user, 
            status='pending'  
        )
        serializer = FriendRequestSerializer(pending_requests, many=True)
        return Response(serializer.data)

    def list_friends(self, request):
        """List all accepted friends."""
        friends = request.user.friends.all()
        return Response([{"id": user.id, "username": user.username} for user in friends])


class ConversationPagination(PageNumberPagination):
    page_size = 5

class MessagePagination(PageNumberPagination):
    page_size = 5

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = ConversationPagination

    def get_queryset(self):
        user = self.request.user
        sent = Message.objects.filter(sender=user)
        received = Message.objects.filter(recipient=user)
        return sent.union(received)

    def perform_create(self, serializer):
        sender = self.request.user
        recipient_id = self.request.data.get("recipient")
        recipient = User.objects.get(id=recipient_id)

        # Sort user IDs to always generate the same conversation ID for a pair
        ids = sorted([str(sender.id), str(recipient.id)])
        convo_id = uuid.uuid5(uuid.NAMESPACE_DNS, "-".join(ids))

        serializer.save(sender=sender, conversation_id=convo_id)

    @action(detail=False, methods=["post"])
    def mark_as_read(self, request):
        sender_id = request.data.get("sender_id")
        conversation_id = request.data.get("conversation_id")
        current_user = request.user

        if not sender_id or not conversation_id:
            return Response({"error": "Missing sender_id or conversation_id"}, status=400)

        messages = Message.objects.filter(
            sender_id=sender_id,
            recipient=current_user,
            conversation_id=conversation_id,
            read=False
        )

        updated_count = messages.update(read=True)
        return Response({"message": f"{updated_count} messages marked as read"})
    
    @action(detail=False, methods=["get"])
    def conversation(self, request):
        conversation_id = request.query_params.get("conversation_id")
        try:
            conversation_uuid = uuid.UUID(conversation_id)
        except (ValueError, TypeError):
            return Response({"error": "Invalid conversation_id"}, status=400)

        messages = Message.objects.filter(conversation_id=conversation_uuid).order_by("-timestamp")
        paginator = MessagePagination()
        page = paginator.paginate_queryset(messages, request)
        serializer = self.get_serializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    @action(detail=False, methods=["get"])
    def recent_conversations(self, request):
        user = request.user

    # All messages sent or received
        messages = Message.objects.filter(Q(sender=user) | Q(recipient=user)).distinct()

    # Get latest message per conversation_id
        latest_by_convo = {}
        for msg in messages:
            convo_id = msg.conversation_id
            if convo_id not in latest_by_convo or msg.timestamp > latest_by_convo[convo_id].timestamp:
                latest_by_convo[convo_id] = msg

    # Sort by most recent message
        sorted_msgs = sorted(latest_by_convo.values(), key=lambda m: m.timestamp, reverse=True)

    # Paginate
        paginator = ConversationPagination()
        paginated = paginator.paginate_queryset(sorted_msgs, request)

    # Fetch the latest 5 messages from each conversation
        result = []
        for message in paginated:
            convo_id = message.conversation_id
            messages_in_convo = Message.objects.filter(
             conversation_id=convo_id
            ).order_by("-timestamp")[:5]

            partner = message.recipient if message.sender == user else message.sender
            result.append({
                "partner_id": partner.id,
                "partner_username": partner.username,
                "messages": MessageSerializer(messages_in_convo, many=True).data
            })

        return paginator.get_paginated_response(result)