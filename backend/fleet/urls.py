from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VehicleViewSet, DriverViewSet, GlobalSearchView,
    TripViewSet, FuelLogViewSet, MaintenanceViewSet
)

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'drivers', DriverViewSet, basename='driver')
router.register(r'trips', TripViewSet, basename='trip')
router.register(r'fuel', FuelLogViewSet, basename='fuel')
router.register(r'maintenance', MaintenanceViewSet, basename='maintenance')

urlpatterns = [
    path('global-search/', GlobalSearchView.as_view(), name='global-search'),
    path('', include(router.urls)),
]
