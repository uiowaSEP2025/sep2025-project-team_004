from django.urls import path
from .views import FriendRequestViewSet

urlpatterns = [
    path("send/", FriendRequestViewSet.as_view({"post": "send_request"}), name="send_friend_request"),
    path("accept/<int:pk>/", FriendRequestViewSet.as_view({"post": "accept_request"}), name="accept_friend_request"),
    path("reject/<int:pk>/", FriendRequestViewSet.as_view({"post": "reject_request"}), name="reject_friend_request"),
    path("pending/", FriendRequestViewSet.as_view({"get": "list_pending_requests"}), name="pending_friend_requests"),
    path("friends/", FriendRequestViewSet.as_view({"get": "list_friends"}), name="list_friends"),
]
