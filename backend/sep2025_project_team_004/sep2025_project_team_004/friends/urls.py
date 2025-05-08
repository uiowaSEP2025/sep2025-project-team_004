from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FriendRequestViewSet, MessageViewSet

app_name = "friends"

router = DefaultRouter()
router.register(r"messages", MessageViewSet, basename="message")

urlpatterns = [
    path("send/", FriendRequestViewSet.as_view({"post": "send_request"}), name="send_friend_request"),
    path("accept/<int:pk>/", FriendRequestViewSet.as_view({"post": "accept_request"}), name="accept_friend_request"),
    path("reject/<int:pk>/", FriendRequestViewSet.as_view({"post": "reject_request"}), name="reject_friend_request"),
    path("pending/", FriendRequestViewSet.as_view({"get": "list_pending_requests"}), name="pending_friend_requests"),
    path("friends/", FriendRequestViewSet.as_view({"get": "list_friends"}), name="list_friends"),
    path("", include(router.urls)),
]
