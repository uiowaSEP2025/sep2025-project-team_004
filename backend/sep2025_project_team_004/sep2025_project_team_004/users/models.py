
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

    # First and last name do not cover name patterns around the globe
    name = CharField(_("Name of User"), blank=True, max_length=255)
    first_name = CharField(_("First Name"), blank=True, max_length=255)
    last_name = CharField(_("Last Name"), blank=True, max_length=255)
    phone_number = CharField(_("Phone Number"), blank=True, max_length=20)
    zip_code = CharField(_("Zip Code"), blank=True, max_length=6)
    state = CharField(_("State"), blank=True, max_length=255)
    city = CharField(_("City"), blank=True, max_length=255)
    address = CharField(_("Address"), blank=True, max_length=255)
    email = EmailField(_("email address"), unique=True)
    username = CharField(_("username"), unique=True, blank=False, null=False, max_length=255)
    
    friends = models.ManyToManyField("self", symmetrical=False, blank=True, related_name="friend_requests")

    default_sensor = models.ForeignKey(
        "sensors.Sensor",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="default_for_users"
    )


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