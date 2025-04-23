from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import FriendRequest, Message, Friendship, GroupChat, GroupMembership, GroupMessage
from .serializers import FriendRequestSerializer, MessageSerializer, GroupChatSerializer, GroupMembershipSerializer, GroupMessageSerializer
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action, api_view, permission_classes
from django.db import models
from django.db.models import Q, Max, Subquery, OuterRef
from collections import defaultdict
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
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

class UnifiedConversationPagination(PageNumberPagination):
    page_size = 10

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
    
    

class GroupMessagePagination(PageNumberPagination):
    page_size = 20


class GroupChatViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def list(self, request):
        """List all group chats the user is a member of"""
        groups = GroupChat.objects.filter(members=request.user).distinct()
        serializer = GroupChatSerializer(groups, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        group = get_object_or_404(GroupChat, id=pk)

    # Only members can view
        if not GroupMembership.objects.filter(user=request.user, group=group).exists():
            return Response({"error": "Not a member"}, status=403)

        serializer = GroupChatSerializer(group)
        return Response(serializer.data)

    def create(self, request):
        """Create a new group chat"""
        name = request.data.get("name")
        members = request.data.getlist("members[]")  # list of user IDs

        if not name or not members:
            return Response({"error": "Name and members are required"}, status=400)

        group = GroupChat.objects.create(name=name, admin=request.user)
        GroupMembership.objects.create(user=request.user, group=group)  # add admin

        for member_id in members:
            if str(member_id) != str(request.user.id):  # skip self
                user = get_object_or_404(User, id=member_id)
                GroupMembership.objects.get_or_create(user=user, group=group)
                GroupMessage.objects.create(
                    group=group,
                    sender=request.user,
                    content=f"{request.user.username} added {user.username} to the group",
                    is_system=True
                )

        serializer = GroupChatSerializer(group)
        return Response(serializer.data, status=201)
    

    @action(detail=True, methods=["post"])
    def rename(self, request, pk=None):
        group = get_object_or_404(GroupChat, id=pk)
        if group.admin != request.user:
            return Response({"error": "Only admin can rename the group"}, status=403)

        group.name = request.data.get("name", group.name)
        group.save()
        return Response({"message": "Group name updated", "name": group.name})

    @action(detail=True, methods=["post"])
    def update_picture(self, request, pk=None):
        group = get_object_or_404(GroupChat, id=pk)
        if group.admin != request.user:
            return Response({"error": "Only admin can update picture"}, status=403)

        group.image = request.data.get("image")
        group.save()
        return Response({"message": "Group picture updated"})

    @action(detail=True, methods=["get"])
    def members(self, request, pk=None):
        group = get_object_or_404(GroupChat, id=pk)
        if not GroupMembership.objects.filter(user=request.user, group=group).exists():
            return Response({"error": "Not a member"}, status=403)

        members = GroupMembership.objects.filter(group=group)
        serializer = GroupMembershipSerializer(members, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def add_member(self, request, pk=None):
        group = get_object_or_404(GroupChat, id=pk)
        new_user_id = request.data.get("user_id")
        new_user = get_object_or_404(User, id=new_user_id)

        if not GroupMembership.objects.filter(user=request.user, group=group).exists():
            return Response({"error": "You must be a member to add others"}, status=403)

        # Must be friends
        if new_user not in request.user.friends.all():
            return Response({"error": "Can only add your friends"}, status=403)

        GroupMembership.objects.get_or_create(user=new_user, group=group)
        GroupMessage.objects.create(
            group=group,
            sender=request.user,
            content=f"{request.user.username} added {new_user.username} to the group",
            is_system=True
        )

        return Response({"message": "Member added"})

    @action(detail=True, methods=["post"])
    def remove_member(self, request, pk=None):
        group = get_object_or_404(GroupChat, id=pk)
        if group.admin != request.user:
            return Response({"error": "Only admin can remove members"}, status=403)

        user_id = request.data.get("user_id")
        user_to_remove = get_object_or_404(User, id=user_id)

        if user_to_remove == group.admin:
            return Response({"error": "Admin cannot be removed"}, status=400)

        GroupMembership.objects.filter(user=user_to_remove, group=group).delete()
        GroupMessage.objects.create(
            group=group,
            sender=request.user,
            content=f"{user_to_remove.username} was removed by {request.user.username}",
            is_system=True
        )

        return Response({"message": "Member removed"})

    @action(detail=True, methods=["post"])
    def leave(self, request, pk=None):
        group = get_object_or_404(GroupChat, id=pk)
        if group.admin == request.user:
            return Response({"error": "Admin cannot leave the group"}, status=403)

        GroupMembership.objects.filter(user=request.user, group=group).delete()
        GroupMessage.objects.create(
            group=group,
            sender=request.user,
            content=f"{request.user.username} left the group",
            is_system=True
        )

        return Response({"message": "You have left the group"})

    @action(detail=True, methods=["post"])
    def send_message(self, request, pk=None):
        group = get_object_or_404(GroupChat, id=pk)

        if not GroupMembership.objects.filter(user=request.user, group=group).exists():
            return Response({"error": "Not a member"}, status=403)

        content = request.data.get("content")
        if not content:
            return Response({"error": "Content required"}, status=400)

        message = GroupMessage.objects.create(group=group, sender=request.user, content=content)
        serializer = GroupMessageSerializer(message)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def messages(self, request, pk=None):
        group = get_object_or_404(GroupChat, id=pk)
        if not GroupMembership.objects.filter(user=request.user, group=group).exists():
            return Response({"error": "Not a member"}, status=403)

        messages = GroupMessage.objects.filter(group=group).order_by("-timestamp")
        paginator = GroupMessagePagination()
        page = paginator.paginate_queryset(messages, request)
        serializer = GroupMessageSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @action(detail=True, methods=["post"])
    def mark_as_read(self, request, pk=None):
        group = get_object_or_404(GroupChat, id=pk)
        unread_messages = GroupMessage.objects.filter(group=group).exclude(read_by=request.user)
        for msg in unread_messages:
            msg.read_by.add(request.user)
        return Response({"message": f"{unread_messages.count()} messages marked as read"})
    
    @action(detail=True, methods=["delete"])
    def delete_group(self, request, pk=None):
        group = get_object_or_404(GroupChat, id=pk)

        if group.admin != request.user:
            return Response({"error": "Only the admin can delete the group."}, status=403)

    # Delete related messages and read-tracking
        GroupMessage.objects.filter(group=group).delete()
        GroupMembership.objects.filter(group=group).delete()
        group.delete()

        return Response({"message": "Group chat deleted successfully."}, status=200)
    
from collections import defaultdict
from django.db.models import Max, Q, Subquery, OuterRef

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def unified_recent_conversations(request):
    user = request.user

    # --- 1. Fetch all DMs with last timestamp ---
    recent_dm_convos = (
        Message.objects
        .filter(Q(sender=user) | Q(recipient=user))
        .values("conversation_id")
        .annotate(last_time=Max("timestamp"))
    )

    # --- 2. Fetch all group chats with last timestamp ---
    group_ids = GroupMembership.objects.filter(user=user).values_list("group_id", flat=True)
    recent_group_convos = (
        GroupMessage.objects
        .filter(group_id__in=group_ids)
        .values("group_id")
        .annotate(last_time=Max("timestamp"))
    )

    # --- 3. Combine all conversations ---
    combined = [
        {"type": "dm", "id": str(d["conversation_id"]), "last_time": d["last_time"]}
        for d in recent_dm_convos
    ] + [
        {"type": "group", "id": str(g["group_id"]), "last_time": g["last_time"]}
        for g in recent_group_convos
    ]

    # --- 4. Sort and paginate combined list ---
    combined.sort(key=lambda x: x["last_time"], reverse=True)

    paginator = UnifiedConversationPagination()
    page = paginator.paginate_queryset(combined, request)
    if page is None:
        return paginator.get_paginated_response([])

    # --- 5. Separate paginated IDs ---
    paginated_dm_ids = [uuid.UUID(c["id"]) for c in page if c["type"] == "dm"]
    paginated_group_ids = [uuid.UUID(c["id"]) for c in page if c["type"] == "group"]

    # --- 6. Fetch last 20 messages for paginated convos ---
    dm_msgs = (
        Message.objects.filter(conversation_id__in=paginated_dm_ids)
        .select_related("sender", "recipient")
        .order_by("conversation_id", "-timestamp")
    )

    group_msgs = (
        GroupMessage.objects.filter(group_id__in=paginated_group_ids)
        .select_related("group", "sender")
        .order_by("group_id", "-timestamp")
    )

    # --- 7. Group top 20 messages per convo ---
    recent_dm_dict = defaultdict(list)
    for msg in dm_msgs:
        if len(recent_dm_dict[msg.conversation_id]) < 20:
            recent_dm_dict[msg.conversation_id].append(msg)

    recent_group_dict = defaultdict(list)
    for msg in group_msgs:
        group_key = str(msg.group_id)
        if len(recent_group_dict[group_key]) < 20:
            recent_group_dict[group_key].append(msg)
    # --- 8. Build final response list ---
    final_results = []
    for convo in page:
        if convo["type"] == "dm":
            msgs = recent_dm_dict[uuid.UUID(convo["id"])]
            if not msgs:
                continue
            latest = msgs[0]
            partner = latest.recipient if latest.sender == user else latest.sender
            final_results.append({
                "type": "dm",
                "conversation_id": str(latest.conversation_id),
                "timestamp": latest.timestamp,
                "partner_id": partner.id,
                "partner_username": partner.username,
                "messages": MessageSerializer(msgs, many=True).data,
            })
        else:
            msgs = recent_group_dict[convo["id"]]
            if not msgs:
                continue
            latest = msgs[0]
            group = latest.group
            final_results.append({
                "type": "group",
                "group_id": str(group.id),
                "group_name": group.name,
                "group_image": group.image.url if group.image else None,
                "timestamp": latest.timestamp,
                "messages": GroupMessageSerializer(msgs, many=True).data,
            })

    return paginator.get_paginated_response(final_results)