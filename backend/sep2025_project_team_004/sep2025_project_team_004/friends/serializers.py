from rest_framework import serializers
from .models import FriendRequest, Message, GroupChat, GroupMembership, GroupMessage
from django.contrib.auth import get_user_model

class FriendRequestSerializer(serializers.ModelSerializer):
    from_user_username = serializers.CharField(source="from_user.username", read_only=True)

    class Meta:
        model = FriendRequest
        fields = ["id", "from_user", "from_user_username", "to_user", "created_at"]


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_username', 'recipient', 'recipient_username', 'content', 'timestamp', 'read', 'conversation_id']
        read_only_fields = ['id', 'sender', 'sender_username', 'recipient_username', 'timestamp', 'read', 'conversation_id']


User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class GroupMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = GroupMembership
        fields = ['user', 'joined_at']

class GroupChatSerializer(serializers.ModelSerializer):
    admin = UserSerializer(read_only=True)
    members = UserSerializer(read_only=True, many=True)

    class Meta:
        model = GroupChat
        fields = ['id', 'name', 'image', 'admin', 'members', 'created_at', 'admin_id']

class GroupMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    read_by = UserSerializer(many=True, read_only=True)

    class Meta:
        model = GroupMessage
        fields = ['id', 'group', 'sender', 'content', 'timestamp', 'is_system', 'read_by']
        read_only_fields = ['id', 'timestamp', 'is_system', 'read_by', 'sender']