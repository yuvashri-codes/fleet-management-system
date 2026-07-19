from django.db import models
from rest_framework import viewsets, permissions, status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from .models import Vehicle, Driver, Trip, FuelLog, Maintenance
from .serializers import (
    VehicleSerializer, DriverSerializer, 
    TripSerializer, FuelLogSerializer, MaintenanceSerializer
)
from .permissions import FleetModulePermission, IsAdminOrFleetManager

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated, FleetModulePermission]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        if user.role == 'DRIVER':
            # Driver can only read their own assigned vehicle
            return Vehicle.objects.filter(assigned_driver__email=user.email)
            
        queryset = Vehicle.objects.all()
        
        # 1. Search Filter
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(vehicle_number__icontains=search) |
                models.Q(registration_number__icontains=search) |
                models.Q(vin_number__icontains=search) |
                models.Q(brand__icontains=search) |
                models.Q(model__icontains=search)
            )
            
        # 2. Status Filter
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        # 3. Vehicle Type Filter
        vehicle_type = self.request.query_params.get('vehicle_type', None)
        if vehicle_type:
            queryset = queryset.filter(vehicle_type__iexact=vehicle_type)
            
        # 4. Fuel Type Filter
        fuel_type = self.request.query_params.get('fuel_type', None)
        if fuel_type:
            queryset = queryset.filter(fuel_type__iexact=fuel_type)

        # 5. Sorting
        ordering = self.request.query_params.get('ordering', None)
        if ordering:
            if ordering.startswith('-'):
                field = ordering[1:]
                prefix = '-'
            else:
                field = ordering
                prefix = ''
                
            if field in ['current_odometer', 'manufacturing_year', 'mileage', 'vehicle_number', 'created_at']:
                queryset = queryset.order_by(f"{prefix}{field}")
                
        return queryset


class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [permissions.IsAuthenticated, FleetModulePermission]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Driver.objects.all()
        
        # 1. Search Filter
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) |
                models.Q(employee_id__icontains=search) |
                models.Q(email__icontains=search) |
                models.Q(license_number__icontains=search)
            )
            
        # 2. Status Filter
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        # 3. License Expiry warnings
        license_expiry_near = self.request.query_params.get('license_expiry_near', None)
        if license_expiry_near == 'true':
            from datetime import date, timedelta
            thirty_days_later = date.today() + timedelta(days=30)
            queryset = queryset.filter(license_expiry__lte=thirty_days_later, license_expiry__gte=date.today())
            
        license_expired = self.request.query_params.get('license_expired', None)
        if license_expired == 'true':
            from datetime import date
            queryset = queryset.filter(license_expiry__lt=date.today())
            
        return queryset


class GlobalSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q or len(q) < 2:
            return Response({"vehicles": [], "drivers": [], "trips": [], "fuel": [], "maintenance": []}, status=status.HTTP_200_OK)
            
        # Limit to 5 results each for global search preview usability
        vehicles = Vehicle.objects.filter(
            models.Q(vehicle_number__icontains=q) |
            models.Q(registration_number__icontains=q) |
            models.Q(brand__icontains=q) |
            models.Q(model__icontains=q)
        )[:5]
        
        drivers = Driver.objects.filter(
            models.Q(name__icontains=q) |
            models.Q(employee_id__icontains=q) |
            models.Q(license_number__icontains=q)
        )[:5]

        trips = Trip.objects.filter(
            models.Q(trip_name__icontains=q) |
            models.Q(source_location__icontains=q) |
            models.Q(destination__icontains=q) |
            models.Q(customer_name__icontains=q)
        )[:5]

        fuel = FuelLog.objects.filter(
            models.Q(fuel_station__icontains=q) |
            models.Q(fuel_type__icontains=q) |
            models.Q(vehicle__vehicle_number__icontains=q)
        )[:5]

        maintenance = Maintenance.objects.filter(
            models.Q(service_center__icontains=q) |
            models.Q(issue_category__icontains=q) |
            models.Q(description__icontains=q)
        )[:5]
        
        # Drivers role limits on global search
        user = request.user
        if user.role == 'DRIVER':
            vehicles = vehicles.filter(assigned_driver__email=user.email)
            drivers = drivers.filter(email=user.email)
            trips = trips.filter(driver__email=user.email)
            fuel = FuelLog.objects.none()
            maintenance = Maintenance.objects.none()
        
        vehicle_serializer = VehicleSerializer(vehicles, many=True, context={'request': request})
        driver_serializer = DriverSerializer(drivers, many=True, context={'request': request})
        trip_serializer = TripSerializer(trips, many=True, context={'request': request})
        fuel_serializer = FuelLogSerializer(fuel, many=True, context={'request': request})
        maintenance_serializer = MaintenanceSerializer(maintenance, many=True, context={'request': request})
        
        return Response({
            "vehicles": vehicle_serializer.data,
            "drivers": driver_serializer.data,
            "trips": trip_serializer.data,
            "fuel": fuel_serializer.data,
            "maintenance": maintenance_serializer.data
        }, status=status.HTTP_200_OK)


class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        if user.role == 'DRIVER':
            # Driver can only view trips assigned to them
            return Trip.objects.filter(driver__email=user.email)
            
        queryset = Trip.objects.all()
        
        # Search Filter
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(trip_name__icontains=search) |
                models.Q(source_location__icontains=search) |
                models.Q(destination__icontains=search) |
                models.Q(customer_name__icontains=search)
            )
            
        # Status Filter
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(current_status=status_param)
            
        # Vehicle Filter
        vehicle = self.request.query_params.get('vehicle', None)
        if vehicle:
            queryset = queryset.filter(vehicle_id=vehicle)
            
        # Driver Filter
        driver = self.request.query_params.get('driver', None)
        if driver:
            queryset = queryset.filter(driver_id=driver)
            
        # Date filters
        start_date_after = self.request.query_params.get('start_date_after', None)
        if start_date_after:
            queryset = queryset.filter(start_date__gte=start_date_after)
            
        start_date_before = self.request.query_params.get('start_date_before', None)
        if start_date_before:
            queryset = queryset.filter(start_date__lte=start_date_before)

        # Sorting
        ordering = self.request.query_params.get('ordering', None)
        if ordering:
            if ordering.startswith('-'):
                field = ordering[1:]
                prefix = '-'
            else:
                field = ordering
                prefix = ''
                
            if field in ['distance', 'trip_cost', 'start_date', 'trip_name', 'created_at']:
                queryset = queryset.order_by(f"{prefix}{field}")
                
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'DRIVER':
            raise permissions.exceptions.PermissionDenied("Drivers cannot create trips.")
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == 'DRIVER':
            # Driver can only update current_status on their own trip
            instance = self.get_object()
            if instance.driver.email != user.email:
                raise permissions.exceptions.PermissionDenied("You can only update your own trips.")
            
            # Check fields being modified
            allowed_fields = {'current_status'}
            request_fields = set(self.request.data.keys())
            for field in request_fields:
                if field not in allowed_fields and field in serializer.fields:
                    raise serializers.ValidationError({"detail": "Drivers are only allowed to update the status of their assigned trips."})
                    
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        if request.user.role == 'DRIVER':
            return Response({"detail": "Drivers cannot delete trips."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class FuelLogViewSet(viewsets.ModelViewSet):
    queryset = FuelLog.objects.all()
    serializer_class = FuelLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrFleetManager]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = FuelLog.objects.all()
        
        # Search Filter
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(fuel_station__icontains=search) |
                models.Q(fuel_type__icontains=search) |
                models.Q(vehicle__vehicle_number__icontains=search) |
                models.Q(driver__name__icontains=search)
            )
            
        # Vehicle Filter
        vehicle = self.request.query_params.get('vehicle', None)
        if vehicle:
            queryset = queryset.filter(vehicle_id=vehicle)
            
        # Date Filter
        fuel_date_after = self.request.query_params.get('fuel_date_after', None)
        if fuel_date_after:
            queryset = queryset.filter(fuel_date__gte=fuel_date_after)
            
        fuel_date_before = self.request.query_params.get('fuel_date_before', None)
        if fuel_date_before:
            queryset = queryset.filter(fuel_date__lte=fuel_date_before)
            
        # Fuel Type Filter
        fuel_type = self.request.query_params.get('fuel_type', None)
        if fuel_type:
            queryset = queryset.filter(fuel_type__iexact=fuel_type)
            
        return queryset


class MaintenanceViewSet(viewsets.ModelViewSet):
    queryset = Maintenance.objects.all()
    serializer_class = MaintenanceSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrFleetManager]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Maintenance.objects.all()
        
        # Search Filter
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(service_center__icontains=search) |
                models.Q(issue_category__icontains=search) |
                models.Q(description__icontains=search) |
                models.Q(vehicle__vehicle_number__icontains=search)
            )
            
        # Status Filter
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        # Priority Filter
        priority = self.request.query_params.get('priority', None)
        if priority:
            queryset = queryset.filter(priority=priority)
            
        # Vehicle Filter
        vehicle = self.request.query_params.get('vehicle', None)
        if vehicle:
            queryset = queryset.filter(vehicle_id=vehicle)
            
        # Date Filter
        scheduled_date_after = self.request.query_params.get('scheduled_date_after', None)
        if scheduled_date_after:
            queryset = queryset.filter(scheduled_date__gte=scheduled_date_after)
            
        scheduled_date_before = self.request.query_params.get('scheduled_date_before', None)
        if scheduled_date_before:
            queryset = queryset.filter(scheduled_date__lte=scheduled_date_before)
            
        return queryset
