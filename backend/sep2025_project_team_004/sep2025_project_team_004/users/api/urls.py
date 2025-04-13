from django.urls import path
from django.contrib.auth.views import LoginView, LogoutView
from .views import RegisterView, ProfileUpdateView, UserProfileView, UserDetailView, SearchUsersView, RequestPasswordResetView, ResetPasswordView, ValidateAddressView
from rest_framework.authtoken.views import obtain_auth_token


app_name = "users"

urlpatterns = [
    path("me/", UserDetailView.as_view(), name="get_user_details"),
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("profile/update/", ProfileUpdateView.as_view(), name="profile-update"),
    path("profile/", UserProfileView.as_view(), name="user-profile"),
    path("api-token-auth/", obtain_auth_token, name="api-token-auth"),
    path('search/', SearchUsersView.as_view(), name='search_users'),
    path("auth/request-password-reset/", RequestPasswordResetView.as_view(), name="request-password-reset"),
    path("auth/reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("validate-address/", ValidateAddressView, name="validate-address"),
]