from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet, DriverViewSet, GlobalSearchView

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'drivers', DriverViewSet, basename='driver')

urlpatterns = [
    path('global-search/', GlobalSearchView.as_view(), name='global-search'),
    path('', include(router.urls)),
]
