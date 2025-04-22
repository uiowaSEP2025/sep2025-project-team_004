from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import FriendRequest, Message, Friendship
from .serializers import FriendRequestSerializer, MessageSerializer
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from django.db import models
from django.db.models import Q, Max, Subquery, OuterRef
from collections import defaultdict
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
        friend_request.status = 'accepted'
        friend_request.save()

# Generate a consistent conversation_id using UUIDv5
        ids = sorted([str(friend_request.from_user.id), str(friend_request.to_user.id)])
        convo_id = uuid.uuid5(uuid.NAMESPACE_DNS, "-".join(ids))

# Create the friendship with the conversation_id
        from .models import Friendship  # If not already imported
        Friendship.objects.create(
            user1=friend_request.from_user,
            user2=friend_request.to_user,
            conversation_id=convo_id
        )
        
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
        """List all accepted friends with conversation_id."""
        user = request.user

    # Get friendships where the user is either user1 or user2
        friendships = Friendship.objects.filter(Q(user1=user) | Q(user2=user))

        result = []
        for friendship in friendships:
            friend = friendship.user2 if friendship.user1 == user else friendship.user1
            result.append({
                "id": friend.id,
                "username": friend.username,
                "conversation_id": str(friendship.conversation_id)
            })

        return Response(result)


class ConversationPagination(PageNumberPagination):
    page_size = 10

class MessagePagination(PageNumberPagination):
    page_size = 20

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
        provided_convo_id = self.request.data.get("conversation_id")

        if provided_convo_id:
            convo_id = uuid.UUID(provided_convo_id)
        else:
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

        latest_per_convo = (
            Message.objects
            .filter(Q(sender=user) | Q(recipient=user))
            .values("conversation_id")
            .annotate(latest_time=Max("timestamp"))
            .order_by("-latest_time")
        )

        latest_messages = Message.objects.filter(
            conversation_id__in=Subquery(latest_per_convo.values("conversation_id")),
            timestamp__in=Subquery(latest_per_convo.values("latest_time")),
        ).select_related("sender", "recipient")

        paginator = ConversationPagination()
        paginated = paginator.paginate_queryset(latest_messages, request)

        convo_ids = [msg.conversation_id for msg in paginated]
        all_messages = Message.objects.filter(
            conversation_id__in=convo_ids
        ).select_related("sender", "recipient").order_by("-timestamp")

        convo_map = defaultdict(list)
        for msg in all_messages:
            if len(convo_map[msg.conversation_id]) < 20:
                convo_map[msg.conversation_id].append(msg)

        result = []
        for msg in paginated:
            convo_id = msg.conversation_id
            partner = msg.recipient if msg.sender == user else msg.sender
            result.append({
                "partner_id": partner.id,
                "partner_username": partner.username,
                "messages": MessageSerializer(convo_map[convo_id], many=True).data
            })

        return paginator.get_paginated_response(result)