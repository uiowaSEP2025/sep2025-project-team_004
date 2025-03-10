from django.db import models
from django.contrib.auth import get_user_model

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
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user1', 'user2')

    def __str__(self):
        return f"{self.user1} ↔ {self.user2}"
