from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from sep2025_project_team_004.friends.models import FriendRequest, Friendship, Message
import uuid

User = get_user_model()

class FriendRequestTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username="user1", password="pass", email="user1@gmail.com")
        self.user2 = User.objects.create_user(username="user2", password="pass", email="user2@gmail.com")
        self.client.force_authenticate(user=self.user1)

    def test_send_friend_request(self):
        url = reverse("friends:send_friend_request")
        response = self.client.post(url, {"to_user_id": self.user2.id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(FriendRequest.objects.filter(from_user=self.user1, to_user=self.user2).exists())

    def test_accept_friend_request(self):
        fr = FriendRequest.objects.create(from_user=self.user1, to_user=self.user2)
        self.client.force_authenticate(user=self.user2)
        url = reverse("friends:accept_friend_request", args=[fr.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(FriendRequest.objects.get(id=fr.id).status, "accepted")
        self.assertTrue(Friendship.objects.filter(user1=self.user1, user2=self.user2).exists())

    def test_reject_friend_request(self):
        fr = FriendRequest.objects.create(from_user=self.user1, to_user=self.user2)
        self.client.force_authenticate(user=self.user2)
        url = reverse("friends:reject_friend_request", args=[fr.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(FriendRequest.objects.filter(id=fr.id).exists())

    def test_list_pending_requests(self):
        FriendRequest.objects.create(from_user=self.user1, to_user=self.user2)
        self.client.force_authenticate(user=self.user2)
        url = reverse("friends:pending_friend_requests")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_list_friends(self):
        convo_id = uuid.uuid4()
        Friendship.objects.create(user1=self.user1, user2=self.user2, conversation_id=convo_id)
        self.client.force_authenticate(user=self.user1)
        url = reverse("friends:list_friends")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["username"], self.user2.username)


class MessageTests(APITestCase):
    def setUp(self):
        self.sender = User.objects.create_user(username="sender", password="pass", email="sender@gmail.com")
        self.recipient = User.objects.create_user(username="recipient", password="pass", email="recipient@gmail.com")
        self.client.force_authenticate(user=self.sender)
        self.convo_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"{self.sender.id}-{self.recipient.id}")

    def test_send_message(self):
        url = reverse("friends:message-list")
        data = {
            "recipient": self.recipient.id,
            "content": "Hello!",
            "conversation_id": str(self.convo_id),
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Message.objects.count(), 1)

    def test_mark_as_read(self):
        msg = Message.objects.create(
            sender=self.sender,
            recipient=self.recipient,
            content="Unseen",
            conversation_id=self.convo_id
        )
        self.client.force_authenticate(user=self.recipient)
        url = reverse("friends:message-mark-as-read")
        response = self.client.post(url, {"sender_id": self.sender.id, "conversation_id": str(self.convo_id)})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(Message.objects.get(id=msg.id).read)

    def test_conversation_view(self):
        Message.objects.create(
            sender=self.sender,
            recipient=self.recipient,
            content="Hi",
            conversation_id=self.convo_id
        )
        url = reverse("friends:message-conversation")
        response = self.client.get(url, {"conversation_id": str(self.convo_id)})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 1)

    def test_recent_conversations(self):
        Message.objects.create(
            sender=self.sender,
            recipient=self.recipient,
            content="Hi",
            conversation_id=self.convo_id
        )
        url = reverse("friends:message-recent-conversations")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 1)
