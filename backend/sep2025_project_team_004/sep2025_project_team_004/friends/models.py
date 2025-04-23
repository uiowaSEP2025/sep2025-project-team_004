from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class FriendRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    from_user = models.ForeignKey(User, related_name="sent_requests", on_delete=models.CASCADE)
    to_user = models.ForeignKey(User, related_name="received_requests", on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('from_user', 'to_user')

    def accept(self):
        """Accepts the friend request"""
        self.status = 'accepted'
        self.save()
        Friendship.objects.create(user1=self.from_user, user2=self.to_user)

    def reject(self):
        """Rejects the friend request"""
        self.status = 'rejected'
        self.save()

    def __str__(self):
        return f"{self.from_user} → {self.to_user} ({self.status})"

class Friendship(models.Model):
    """Tracks actual friendships"""
    user1 = models.ForeignKey(User, related_name="friends1", on_delete=models.CASCADE)
    user2 = models.ForeignKey(User, related_name="friends2", on_delete=models.CASCADE)
    conversation_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user1', 'user2')

    def __str__(self):
        return f"{self.user1} ↔ {self.user2}"
    

class Message(models.Model):
    sender = models.ForeignKey(User, related_name="sent_messages", on_delete=models.CASCADE)
    recipient = models.ForeignKey(User, related_name="received_messages", on_delete=models.CASCADE)
    content = models.TextField()
    read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    conversation_id = models.UUIDField(default=uuid.uuid4, editable=False, db_index=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender.username} → {self.recipient.username}: {self.content[:30]}"
    
class GroupChat(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    image = models.ImageField(upload_to='group_images/', null=True, blank=True)
    admin = models.ForeignKey(User, related_name='administered_groups', on_delete=models.CASCADE)
    members = models.ManyToManyField(User, through='GroupMembership')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class GroupMembership(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    group = models.ForeignKey(GroupChat, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'group')


class GroupMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group = models.ForeignKey(GroupChat, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_system = models.BooleanField(default=False)  # For system messages like "X added Y"
    read_by = models.ManyToManyField(User, related_name='read_group_messages', blank=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:30]}"
