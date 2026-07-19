from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, RegisterView, LogoutView, UserProfileView

urlpatterns = [
    path('login', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register', RegisterView.as_view(), name='auth_register'),
    path('logout', LogoutView.as_view(), name='auth_logout'),
    path('refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile', UserProfileView.as_view(), name='user_profile'),
]
