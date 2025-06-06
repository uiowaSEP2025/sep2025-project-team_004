from typing import ClassVar

from django.contrib.auth.models import AbstractUser
from django.db.models import CharField
from django.db.models import EmailField
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from django.db import models



from .managers import UserManager


class User(AbstractUser):
    """
    Default custom user model for ICanopyBackend.
    If adding fields that need to be filled at user signup,
    check forms.SignupForm and forms.SocialSignupForms accordingly.
    """
    ROLE_CHOICES = [
        ('user', 'User'),
        ('admin', 'Admin'),
    ]
    # First and last name do not cover name patterns around the globe
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    stripe_customer_id = models.CharField(_("Stripe Customer ID"), blank=True, null=True, max_length=255)
    first_name = CharField(_("First Name"), blank=True, max_length=255)
    last_name = CharField(_("Last Name"), blank=True, max_length=255)
    phone_number = CharField(_("Phone Number"), blank=True, max_length=20)
    zip_code = CharField(_("Zip Code"), blank=True, max_length=6)
    state = CharField(_("State"), blank=True, max_length=255)
    city = CharField(_("City"), blank=True, max_length=255)
    address = CharField(_("Address"), blank=True, max_length=255)
    email = EmailField(_("email address"), unique=True)
    username = CharField(_("username"), unique=True, blank=False, null=False, max_length=255)
    profile_picture = models.ImageField(_("Profile Picture"), upload_to="profile_pictures/", blank=True, null=True)
    
    friends = models.ManyToManyField("self", symmetrical=False, blank=True, related_name="friend_requests")


    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects: ClassVar[UserManager] = UserManager()

    def get_absolute_url(self) -> str:
        """Get URL for user's detail view.

        Returns:
            str: URL for user detail.

        """
        return reverse("users:detail", args=[self.id])


    def add_friend(self, friend):
        """Adds a friend relationship between two users."""
        self.friends.add(friend)
        self.save()

    def remove_friend(self, friend):
        """Removes a friend relationship between two users."""
        self.friends.remove(friend)
        self.save()

    def is_friends_with(self, user):
        """Checks if the user is friends with another user."""
        return self.friends.filter(id=user.id).exists()

    @property
    def name(self) -> str:
        """Concatenate first and last name for backward‐compatibility."""
        full = f"{self.first_name or ''} {self.last_name or ''}".strip()
        return full

    @name.setter
    def name(self, value: str) -> None:
        """
        Allow setting name="First Last" (or single token) for tests and factories.
        Splits on first space.
        """
        parts = value.split(" ", 1)
        self.first_name = parts[0]
        self.last_name = parts[1] if len(parts) > 1 else ""