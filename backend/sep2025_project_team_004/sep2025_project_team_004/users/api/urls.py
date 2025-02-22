from django.urls import path
from .views import RegisterView, ProfileUpdateView, UserProfileView

app_name = "users"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", RegisterView.as_view(), name="login"),
    path("profile/update/", ProfileUpdateView.as_view(), name="profile-update"),
    path("profile/", UserProfileView.as_view(), name="user-profile"),

]