from rest_framework import serializers
from .models import FriendRequest, Message

class FriendRequestSerializer(serializers.ModelSerializer):
    from_user_username = serializers.CharField(source="from_user.username", read_only=True)

    class Meta:
        model = FriendRequest
        fields = ["id", "from_user", "from_user_username", "to_user", "created_at"]


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_username', 'recipient', 'content', 'timestamp']
        read_only_fields = ['id', 'sender', 'sender_username', 'timestamp']