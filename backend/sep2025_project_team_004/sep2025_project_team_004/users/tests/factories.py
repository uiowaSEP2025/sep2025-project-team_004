from typing import Any, Sequence  # Import Sequence from typing
from factory import Faker, Sequence as FactorySequence, post_generation
from factory.django import DjangoModelFactory

from sep2025_project_team_004.users.models import User


class UserFactory(DjangoModelFactory[User]):
    username = FactorySequence(lambda n: f"user{n}")
    email = FactorySequence(lambda n: f"user{n}@example.com")
    first_name = Faker("first_name")
    last_name = Faker("last_name")

    @post_generation
    def password(self, create: bool, extracted: Sequence[Any], **kwargs):  # noqa: FBT001
        password = (
            extracted
            if extracted
            else Faker(
                "password",
                length=42,
                special_chars=True,
                digits=True,
                upper_case=True,
                lower_case=True,
            ).evaluate(None, None, extra={"locale": None})
        )
        self.set_password(password)

    @classmethod
    def _after_postgeneration(cls, instance, create, results=None):
        """Save again the instance if creating and at least one hook ran."""
        if create and results and not cls._meta.skip_postgeneration_save:
            # Some post-generation hooks ran, and may have modified us.
            instance.save()

    class Meta:
        model = User
        django_get_or_create = ["email", "username"]
