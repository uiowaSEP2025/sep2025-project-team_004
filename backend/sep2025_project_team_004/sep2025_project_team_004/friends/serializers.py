from rest_framework import serializers
from .models import FriendRequest

class FriendRequestSerializer(serializers.ModelSerializer):
    from_user_username = serializers.CharField(source="from_user.username", read_only=True)

    class Meta:
        model = FriendRequest
        fields = ["id", "from_user", "from_user_username", "to_user", "created_at"]
