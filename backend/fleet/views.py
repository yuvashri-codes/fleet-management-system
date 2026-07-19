from django.db import models
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from .models import Vehicle, Driver
from .serializers import VehicleSerializer, DriverSerializer
from .permissions import FleetModulePermission

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
                # Sort by nullable field mileage might need nulls last, but standard order_by is fine
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
            return Response({"vehicles": [], "drivers": []}, status=status.HTTP_200_OK)
            
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
        
        vehicle_serializer = VehicleSerializer(vehicles, many=True, context={'request': request})
        driver_serializer = DriverSerializer(drivers, many=True, context={'request': request})
        
        return Response({
            "vehicles": vehicle_serializer.data,
            "drivers": driver_serializer.data
        }, status=status.HTTP_200_OK)
