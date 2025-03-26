import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import AnonymousUser
from django.utils.http import urlsafe_base64_decode
from urllib.parse import parse_qs

from .models import ChatMessage
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
    # Parse token from query string
        query_string = self.scope["query_string"].decode()
        query_params = parse_qs(query_string)
        token_key = query_params.get("token", [None])[0]

        if token_key is None:
            self.user = AnonymousUser()
        else:
            try:
                token = await database_sync_to_async(Token.objects.get)(key=token_key)
                self.user = token.user
            except Token.DoesNotExist:
                self.user = AnonymousUser()

        self.friend_id = self.scope["url_route"]["kwargs"]["friend_id"]

    # Still check user is valid
        if not self.user.is_authenticated:
            await self.close()
            return

    # Now it's safe to build room name
        self.room_name = f"chat_{min(self.user.id, int(self.friend_id))}_{max(self.user.id, int(self.friend_id))}"
        self.room_group_name = f"chat_{self.room_name}"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get("message")

        await self.save_message(self.user.id, self.friend_id, message)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message,
                "sender": self.user.id,
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def save_message(self, sender_id, receiver_id, message):
        sender = User.objects.get(id=sender_id)
        receiver = User.objects.get(id=receiver_id)
        ChatMessage.objects.create(sender=sender, receiver=receiver, message=message)

    @database_sync_to_async
    def get_user_from_token(self):
        query_string = self.scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)
        token_key = query_params.get("token", [None])[0]

        if token_key:
            try:
                token = Token.objects.get(key=token_key)
                return token.user
            except Token.DoesNotExist:
                return AnonymousUser()

        return AnonymousUser()
