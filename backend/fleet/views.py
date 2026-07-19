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

    def perform_create(self, serializer):
        vehicle = serializer.save()
        from .logging_utils import log_audit
        log_audit("Vehicle Creation", self.request.user, self.request, f"Created vehicle {vehicle.vehicle_number}")

    def perform_update(self, serializer):
        vehicle = serializer.save()
        from .logging_utils import log_audit
        log_audit("Vehicle Update", self.request.user, self.request, f"Updated vehicle {vehicle.vehicle_number}")

    def perform_destroy(self, instance):
        from .logging_utils import log_audit
        log_audit("Vehicle Delete", self.request.user, self.request, f"Deleted vehicle {instance.vehicle_number}")
        instance.delete()



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
        trip = serializer.save()
        from .logging_utils import log_audit
        log_audit("Trip Creation", user, self.request, f"Scheduled trip {trip.trip_name}")

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == 'DRIVER':
            instance = self.get_object()
            if instance.driver.email != user.email:
                raise permissions.exceptions.PermissionDenied("You can only update your own trips.")
            
            allowed_fields = {'current_status'}
            request_fields = set(self.request.data.keys())
            for field in request_fields:
                if field not in allowed_fields and field in serializer.fields:
                    raise serializers.ValidationError({"detail": "Drivers are only allowed to update the status of their assigned trips."})
                    
        trip = serializer.save()
        from .logging_utils import log_audit
        log_audit("Trip Update", user, self.request, f"Updated trip {trip.trip_name} - status: {trip.current_status}")

    def destroy(self, request, *args, **kwargs):
        if request.user.role == 'DRIVER':
            return Response({"detail": "Drivers cannot delete trips."}, status=status.HTTP_403_FORBIDDEN)
        instance = self.get_object()
        from .logging_utils import log_audit
        log_audit("Trip Cancel/Delete", request.user, request, f"Deleted/Cancelled trip {instance.trip_name}")
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

    def perform_create(self, serializer):
        log = serializer.save()
        from .logging_utils import log_audit
        log_audit("Fuel Log Creation", self.request.user, self.request, f"Recorded refueling of ${log.total_cost} for {log.vehicle.vehicle_number}")

    def perform_update(self, serializer):
        log = serializer.save()
        from .logging_utils import log_audit
        log_audit("Fuel Log Update", self.request.user, self.request, f"Updated refueling of ${log.total_cost} for {log.vehicle.vehicle_number}")


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

    def perform_create(self, serializer):
        maint = serializer.save()
        from .logging_utils import log_audit
        log_audit("Maintenance Creation", self.request.user, self.request, f"Created maintenance ticket for {maint.vehicle.vehicle_number}")

    def perform_update(self, serializer):
        maint = serializer.save()
        from .logging_utils import log_audit
        log_audit("Maintenance Update", self.request.user, self.request, f"Updated maintenance ticket for {maint.vehicle.vehicle_number} - status: {maint.status}")


def get_user_filtered_querysets(user):
    if user.role == 'DRIVER':
        vehicles = Vehicle.objects.filter(assigned_driver__email=user.email)
        drivers = Driver.objects.filter(email=user.email)
        trips = Trip.objects.filter(driver__email=user.email)
        fuel_logs = FuelLog.objects.filter(driver__email=user.email)
        maintenances = Maintenance.objects.filter(vehicle__assigned_driver__email=user.email)
    else:
        vehicles = Vehicle.objects.all()
        drivers = Driver.objects.all()
        trips = Trip.objects.all()
        fuel_logs = FuelLog.objects.all()
        maintenances = Maintenance.objects.all()
    return vehicles, drivers, trips, fuel_logs, maintenances


def get_date_range(request):
    import datetime
    range_param = request.query_params.get('range', 'this_month')
    today = datetime.date.today()
    start_date = None
    end_date = today

    if range_param == 'today':
        start_date = today
    elif range_param == 'yesterday':
        start_date = today - datetime.timedelta(days=1)
        end_date = start_date
    elif range_param == 'this_week':
        start_date = today - datetime.timedelta(days=today.weekday())
    elif range_param == 'this_month':
        start_date = today.replace(day=1)
    elif range_param == 'this_year':
        start_date = today.replace(month=1, day=1)
    elif range_param == 'custom':
        start_str = request.query_params.get('start_date')
        end_str = request.query_params.get('end_date')
        if start_str:
            try:
                start_date = datetime.datetime.strptime(start_str, '%Y-%m-%d').date()
            except ValueError:
                pass
        if end_str:
            try:
                end_date = datetime.datetime.strptime(end_str, '%Y-%m-%d').date()
            except ValueError:
                pass
    
    return start_date, end_date


def apply_report_filters(queryset, request, date_field):
    # Date Range
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    if start_date:
        queryset = queryset.filter(**{f"{date_field}__gte": start_date})
    if end_date:
        queryset = queryset.filter(**{f"{date_field}__lte": end_date})

    # Month / Year
    month = request.query_params.get('month')
    year = request.query_params.get('year')
    if month and month != 'all':
        queryset = queryset.filter(**{f"{date_field}__month": month})
    if year and year != 'all':
        queryset = queryset.filter(**{f"{date_field}__year": year})

    # Status
    status_param = request.query_params.get('status')
    if status_param and status_param != 'all':
        if hasattr(queryset.model, 'current_status'):
            queryset = queryset.filter(current_status=status_param)
        elif hasattr(queryset.model, 'status'):
            queryset = queryset.filter(status=status_param)

    # Vehicle
    vehicle = request.query_params.get('vehicle')
    if vehicle and vehicle != 'all':
        if hasattr(queryset.model, 'vehicle'):
            queryset = queryset.filter(vehicle_id=vehicle)
        elif hasattr(queryset.model, 'assigned_vehicle'):
            queryset = queryset.filter(assigned_vehicle_id=vehicle)
        elif queryset.model == Vehicle:
            queryset = queryset.filter(id=vehicle)

    # Driver
    driver = request.query_params.get('driver')
    if driver and driver != 'all':
        if hasattr(queryset.model, 'driver'):
            queryset = queryset.filter(driver_id=driver)
        elif queryset.model == Driver:
            queryset = queryset.filter(id=driver)

    return queryset


class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        vehicles, drivers, trips, fuel_logs, maintenances = get_user_filtered_querysets(user)
        
        start_date, end_date = get_date_range(request)
        
        filtered_trips = trips
        filtered_fuel = fuel_logs
        filtered_maint = maintenances
        
        if start_date:
            filtered_trips = filtered_trips.filter(start_date__gte=start_date)
            filtered_fuel = filtered_fuel.filter(fuel_date__gte=start_date)
            filtered_maint = filtered_maint.filter(scheduled_date__gte=start_date)
        if end_date:
            filtered_trips = filtered_trips.filter(start_date__lte=end_date)
            filtered_fuel = filtered_fuel.filter(fuel_date__lte=end_date)
            filtered_maint = filtered_maint.filter(scheduled_date__lte=end_date)

        total_vehicles = vehicles.count()
        active_vehicles = vehicles.filter(status='AVAILABLE').count() + vehicles.filter(status='IN_USE').count()
        maint_vehicles = vehicles.filter(status='MAINTENANCE').count()
        
        total_drivers = drivers.count()
        available_drivers = drivers.filter(status='ACTIVE').count()
        
        import datetime
        today = datetime.date.today()
        trips_today = trips.filter(start_date=today).count()
        running_trips = trips.filter(current_status='IN_PROGRESS').count()
        completed_trips = filtered_trips.filter(current_status='COMPLETED').count()
        cancelled_trips = filtered_trips.filter(current_status='CANCELLED').count()
        
        from django.db.models import Sum, Avg
        monthly_fuel_cost = filtered_fuel.aggregate(total=Sum('total_cost'))['total'] or 0.0
        maint_cost = filtered_maint.aggregate(total=Sum('actual_cost'))['total'] or filtered_maint.aggregate(total=Sum('estimated_cost'))['total'] or 0.0
        
        health_score = 100.0
        if total_vehicles > 0:
            unhealthy = vehicles.filter(status__in=['MAINTENANCE', 'INACTIVE']).count()
            health_score = round(((total_vehicles - unhealthy) / total_vehicles) * 100, 1)
            
        avg_mileage = filtered_fuel.aggregate(avg=Avg('mileage'))['avg'] or 0.0
        avg_mileage = round(float(avg_mileage), 1)
        
        vehicle_utilization = 0.0
        if total_vehicles > 0:
            vehicle_utilization = round((vehicles.filter(status='IN_USE').count() / total_vehicles) * 100, 1)
            
        driver_utilization = 0.0
        if total_drivers > 0:
            driver_utilization = round((drivers.filter(status='ACTIVE').count() / total_drivers) * 100, 1)

        thirty_days_later = today + datetime.timedelta(days=30)
        ins_expiry = vehicles.filter(insurance_expiry__lte=thirty_days_later, insurance_expiry__gte=today).count()
        lic_expiry = drivers.filter(license_expiry__lte=thirty_days_later, license_expiry__gte=today).count()
        
        upcoming_services = maintenances.filter(status__in=['PENDING', 'SCHEDULED'], scheduled_date__gte=today).count()

        return Response({
            "total_vehicles": total_vehicles,
            "active_vehicles": active_vehicles,
            "vehicles_under_maintenance": maint_vehicles,
            "total_drivers": total_drivers,
            "available_drivers": available_drivers,
            "trips_today": trips_today,
            "running_trips": running_trips,
            "completed_trips": completed_trips,
            "cancelled_trips": cancelled_trips,
            "monthly_fuel_cost": float(monthly_fuel_cost),
            "maintenance_cost": float(maint_cost),
            "fleet_health_score": health_score,
            "average_mileage": avg_mileage,
            "vehicle_utilization": vehicle_utilization,
            "driver_utilization": driver_utilization,
            "upcoming_services": upcoming_services,
            "insurance_expiry": ins_expiry,
            "license_expiry": lic_expiry
        })


class DashboardKPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        vehicles, drivers, trips, fuel_logs, maintenances = get_user_filtered_querysets(user)
        
        from django.db.models import Avg, Sum
        
        avg_distance = trips.aggregate(avg=Avg('distance'))['avg'] or 0.0
        avg_fuel_qty = fuel_logs.aggregate(avg=Avg('fuel_quantity'))['avg'] or 0.0
        avg_repair_cost = maintenances.filter(status='COMPLETED').aggregate(avg=Avg('actual_cost'))['avg'] or 0.0
        avg_maint_cost = maintenances.aggregate(avg=Avg('estimated_cost'))['avg'] or 0.0
        
        total_v = vehicles.count()
        avail_v = vehicles.filter(status__in=['AVAILABLE', 'IN_USE']).count()
        v_availability = round((avail_v / total_v) * 100, 1) if total_v > 0 else 100.0
        
        fleet_efficiency = fuel_logs.aggregate(avg=Avg('mileage'))['avg'] or 0.0
        
        total_fuel_cost = fuel_logs.aggregate(total=Sum('total_cost'))['total'] or 0.0
        total_distance = trips.aggregate(total=Sum('distance'))['total'] or 0.0
        cost_per_km = float(total_fuel_cost) / float(total_distance) if total_distance > 0 else 0.0
        
        avg_driver_rating = 4.8
        vehicle_downtime = maintenances.filter(status='COMPLETED').count()

        return Response({
            "average_trip_distance": round(float(avg_distance), 1),
            "average_fuel_consumption": round(float(avg_fuel_qty), 1),
            "average_repair_cost": round(float(avg_repair_cost), 1),
            "average_maintenance_cost": round(float(avg_maint_cost), 1),
            "vehicle_availability": v_availability,
            "fleet_efficiency": round(float(fleet_efficiency), 1),
            "fuel_efficiency": round(float(fleet_efficiency), 1),
            "cost_per_kilometer": round(cost_per_km, 2),
            "average_driver_rating": avg_driver_rating,
            "vehicle_downtime": vehicle_downtime
        })


class DashboardChartsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        vehicles, drivers, trips, fuel_logs, maintenances = get_user_filtered_querysets(user)
        
        import datetime
        current_year = datetime.date.today().year
        
        monthly_trips = [0] * 12
        monthly_fuel_qty = [0.0] * 12
        monthly_fuel_cost = [0.0] * 12
        monthly_maint_cost = [0.0] * 12
        monthly_expenses = [0.0] * 12
        
        for t in trips.filter(start_date__year=current_year):
            m = t.start_date.month - 1
            if 0 <= m < 12:
                monthly_trips[m] += 1
                
        for log in fuel_logs.filter(fuel_date__year=current_year):
            m = log.fuel_date.month - 1
            if 0 <= m < 12:
                monthly_fuel_qty[m] += float(log.fuel_quantity)
                monthly_fuel_cost[m] += float(log.total_cost)
                monthly_expenses[m] += float(log.total_cost)
                
        for m_item in maintenances.filter(scheduled_date__year=current_year):
            m = m_item.scheduled_date.month - 1
            if 0 <= m < 12:
                cost = float(m_item.actual_cost or m_item.estimated_cost)
                monthly_maint_cost[m] += cost
                monthly_expenses[m] += cost

        months_labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        monthly_trends = []
        for i in range(12):
            monthly_trends.append({
                "month": months_labels[i],
                "trips": monthly_trips[i],
                "fuel_quantity": round(monthly_fuel_qty[i], 1),
                "fuel_cost": round(monthly_fuel_cost[i], 2),
                "maintenance_cost": round(monthly_maint_cost[i], 2),
                "total_expense": round(monthly_expenses[i], 2)
            })

        v_status = {}
        for v in vehicles:
            v_status[v.status] = v_status.get(v.status, 0) + 1
        vehicle_status_dist = [{"status": k, "count": v} for k, v in v_status.items()]

        t_status = {}
        for t in trips:
            t_status[t.current_status] = t_status.get(t.current_status, 0) + 1
        trip_status_dist = [{"status": k, "count": v} for k, v in t_status.items()]

        driver_perf = {}
        for t in trips.filter(current_status='COMPLETED'):
            driver_perf[t.driver.name] = driver_perf.get(t.driver.name, 0.0) + float(t.distance)
        driver_performance = [{"driver": k, "distance": round(v, 1)} for k, v in driver_perf.items()]
        driver_performance.sort(key=lambda x: x['distance'], reverse=True)

        fuel_eff = {}
        for f in fuel_logs:
            plate = f.vehicle.vehicle_number
            if plate not in fuel_eff:
                fuel_eff[plate] = {"sum": 0.0, "count": 0}
            fuel_eff[plate]["sum"] += float(f.mileage)
            fuel_eff[plate]["count"] += 1
        fuel_efficiency = [{"vehicle": k, "efficiency": round(v["sum"] / v["count"], 1)} for k, v in fuel_eff.items() if v["count"] > 0]
        fuel_efficiency.sort(key=lambda x: x['efficiency'], reverse=True)

        top_v = {}
        for t in trips.filter(current_status='COMPLETED'):
            plate = t.vehicle.vehicle_number
            top_v[plate] = top_v.get(plate, 0) + 1
        top_vehicles = [{"vehicle": k, "trips": v} for k, v in top_v.items()]
        top_vehicles.sort(key=lambda x: x['trips'], reverse=True)

        top_d = {}
        for t in trips.filter(current_status='COMPLETED'):
            name = t.driver.name
            top_d[name] = top_d.get(name, 0) + 1
        top_drivers = [{"driver": k, "trips": v} for k, v in top_d.items()]
        top_drivers.sort(key=lambda x: x['trips'], reverse=True)

        yearly_exp = {}
        for f in fuel_logs:
            y = f.fuel_date.year
            yearly_exp[y] = yearly_exp.get(y, 0.0) + float(f.total_cost)
        for m_item in maintenances:
            y = m_item.scheduled_date.year
            yearly_exp[y] = yearly_exp.get(y, 0.0) + float(m_item.actual_cost or m_item.estimated_cost)
        yearly_expenses = [{"year": str(k), "expense": round(v, 2)} for k, v in yearly_exp.items()]
        yearly_expenses.sort(key=lambda x: x['year'])

        return Response({
            "monthly_trends": monthly_trends,
            "vehicle_status_distribution": vehicle_status_dist,
            "trip_status_distribution": trip_status_dist,
            "driver_performance": driver_performance[:8],
            "fuel_efficiency": fuel_efficiency[:8],
            "top_performing_vehicles": top_vehicles[:8],
            "top_drivers": top_drivers[:8],
            "yearly_expenses": yearly_expenses
        })


class DashboardRecentActivitiesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        vehicles, drivers, trips, fuel_logs, maintenances = get_user_filtered_querysets(user)
        
        activities = []
        
        for trip in trips.order_by('-created_at')[:5]:
            activities.append({
                "id": f"trip-{trip.id}",
                "type": "TRIP",
                "title": f"Trip Scheduled: {trip.trip_name}",
                "desc": f"Route: {trip.source_location} to {trip.destination}",
                "timestamp": trip.created_at.isoformat()
            })
            
        for v in vehicles.order_by('-created_at')[:5]:
            activities.append({
                "id": f"vehicle-{v.id}",
                "type": "VEHICLE",
                "title": f"Vehicle Registered",
                "desc": f"Added {v.brand} {v.model} ({v.vehicle_number})",
                "timestamp": v.created_at.isoformat()
            })
            
        for d in drivers.order_by('-created_at')[:5]:
            activities.append({
                "id": f"driver-{d.id}",
                "type": "DRIVER",
                "title": "Driver Profile Added",
                "desc": f"Added operator {d.name} (ID: {d.employee_id})",
                "timestamp": d.created_at.isoformat()
            })
            
        for f in fuel_logs.order_by('-created_at')[:5]:
            activities.append({
                "id": f"fuel-{f.id}",
                "type": "FUEL",
                "title": "Refueling Log Added",
                "desc": f"Refueled {f.vehicle.vehicle_number} at {f.fuel_station} for ${f.total_cost}",
                "timestamp": f.created_at.isoformat()
            })
            
        for m in maintenances.order_by('-created_at')[:5]:
            activities.append({
                "id": f"maint-{m.id}",
                "type": "MAINTENANCE",
                "title": "Maintenance Ticket Updated",
                "desc": f"Vehicle {m.vehicle.vehicle_number} service status is {m.status}",
                "timestamp": m.created_at.isoformat()
            })
            
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        return Response(activities[:10])


class DashboardNotificationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        vehicles, drivers, trips, fuel_logs, maintenances = get_user_filtered_querysets(user)
        
        notifications = []
        import datetime
        today = datetime.date.today()
        thirty_days_later = today + datetime.timedelta(days=30)
        
        # Insurance Expiry
        for v in vehicles.filter(insurance_expiry__lte=thirty_days_later, insurance_expiry__gte=today):
            notifications.append({
                "id": f"ins-{v.id}",
                "type": "WARNING",
                "title": "Insurance Expiring Soon",
                "desc": f"Insurance for Vehicle {v.vehicle_number} expires on {v.insurance_expiry}."
            })
            
        # License Expiry
        for d in drivers.filter(license_expiry__lte=thirty_days_later, license_expiry__gte=today):
            notifications.append({
                "id": f"lic-{d.id}",
                "type": "WARNING",
                "title": "Driver License Expiring Soon",
                "desc": f"License for operator {d.name} expires on {d.license_expiry}."
            })
            
        # Maintenance Due
        for m in maintenances.filter(status__in=['PENDING', 'SCHEDULED'], scheduled_date__lte=today):
            notifications.append({
                "id": f"maint-{m.id}",
                "type": "DANGER",
                "title": "Vehicle Maintenance Due",
                "desc": f"Maintenance for vehicle {m.vehicle.vehicle_number} was scheduled for {m.scheduled_date}."
            })
            
        # Fuel Budget Warning
        for f in fuel_logs.filter(total_cost__gt=1000):
            notifications.append({
                "id": f"fuel-budget-{f.id}",
                "type": "INFO",
                "title": "High Refueling Cost Warning",
                "desc": f"Refueling ticket for vehicle {f.vehicle.vehicle_number} cost ${f.total_cost}."
            })
            
        # Vehicle Inactive
        for v in vehicles.filter(status='INACTIVE'):
            notifications.append({
                "id": f"v-inact-{v.id}",
                "type": "INFO",
                "title": "Vehicle Inactive",
                "desc": f"Vehicle {v.vehicle_number} is flagged as Inactive."
            })
            
        # Driver Inactive
        for d in drivers.filter(status='INACTIVE'):
            notifications.append({
                "id": f"d-inact-{d.id}",
                "type": "INFO",
                "title": "Driver Inactive",
                "desc": f"Driver {d.name} is flagged as Inactive."
            })
            
        return Response(notifications)


class FleetReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        vehicles, drivers, trips, fuel_logs, maintenances = get_user_filtered_querysets(user)
        
        # Calculate summary row
        total_v = vehicles.count()
        total_d = drivers.count()
        total_t = trips.count()
        total_f = fuel_logs.count()
        total_m = maintenances.count()
        
        from django.db.models import Sum
        total_fuel_cost = fuel_logs.aggregate(total=Sum('total_cost'))['total'] or 0.0
        total_maint_cost = maintenances.aggregate(total=Sum('actual_cost'))['total'] or list(maintenances.aggregate(total=Sum('estimated_cost')).values())[0] or 0.0
        total_expenses = float(total_fuel_cost) + float(total_maint_cost)

        return Response([{
            "total_vehicles": total_v,
            "total_drivers": total_d,
            "total_trips": total_t,
            "total_fuel_logs": total_f,
            "total_maintenance_records": total_m,
            "total_fuel_cost": float(total_fuel_cost),
            "total_maintenance_cost": float(total_maint_cost),
            "total_expenses": total_expenses
        }])


class VehicleReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        vehicles, _, _, _, _ = get_user_filtered_querysets(user)
        filtered_vehicles = apply_report_filters(vehicles, request, 'purchase_date')
        serializer = VehicleSerializer(filtered_vehicles, many=True, context={'request': request})
        return Response(serializer.data)


class DriverReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        _, drivers, _, _, _ = get_user_filtered_querysets(user)
        filtered_drivers = apply_report_filters(drivers, request, 'joining_date')
        serializer = DriverSerializer(filtered_drivers, many=True, context={'request': request})
        return Response(serializer.data)


class TripsReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        _, _, trips, _, _ = get_user_filtered_querysets(user)
        filtered_trips = apply_report_filters(trips, request, 'start_date')
        serializer = TripSerializer(filtered_trips, many=True, context={'request': request})
        return Response(serializer.data)


class FuelReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        _, _, _, fuel_logs, _ = get_user_filtered_querysets(user)
        filtered_fuel = apply_report_filters(fuel_logs, request, 'fuel_date')
        serializer = FuelLogSerializer(filtered_fuel, many=True, context={'request': request})
        return Response(serializer.data)


class MaintenanceReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        _, _, _, _, maintenances = get_user_filtered_querysets(user)
        filtered_maint = apply_report_filters(maintenances, request, 'scheduled_date')
        serializer = MaintenanceSerializer(filtered_maint, many=True, context={'request': request})
        return Response(serializer.data)


from .ai_service import PredictiveAIService

class AIPredictiveMaintenanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        result = PredictiveAIService.get_maintenance_predictions(request.user)
        return Response(result)


class AIFuelPredictionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            distance = float(request.query_params.get('distance', 100.0))
            load_tons = float(request.query_params.get('load_tons', 5.0))
        except ValueError:
            distance = 100.0
            load_tons = 5.0
        result = PredictiveAIService.get_fuel_predictions(request.user, distance, load_tons)
        return Response(result)


class AIDriverScoreView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        result = PredictiveAIService.get_driver_scores(request.user)
        return Response(result)


class AIFleetHealthView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        result = PredictiveAIService.get_fleet_health(request.user)
        return Response(result)


class AICostForecastView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        result = PredictiveAIService.get_cost_forecast(request.user)
        return Response(result)


class AIRecommendationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        result = PredictiveAIService.get_intelligent_recommendations(request.user)
        return Response(result)


from .models import AuditLog, SystemSettings
from .serializers import AuditLogSerializer, SystemSettingsSerializer
import json
import datetime
from django.core import serializers as django_serializers
from django.http import HttpResponse

class AuditLogListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role in ['ADMIN', 'FLEET_MANAGER']:
            logs = AuditLog.objects.all().order_by('-timestamp')[:150]
        else:
            logs = AuditLog.objects.filter(user=user).order_by('-timestamp')[:150]
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)


class SystemSettingsDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        settings_inst, created = SystemSettings.objects.get_or_create(id=1)
        serializer = SystemSettingsSerializer(settings_inst)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role != 'ADMIN':
            return Response({"detail": "Only administrators can modify system settings."}, status=status.HTTP_403_FORBIDDEN)
        settings_inst, created = SystemSettings.objects.get_or_create(id=1)
        serializer = SystemSettingsSerializer(settings_inst, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            from .logging_utils import log_audit
            log_audit("System Settings Update", request.user, request, f"System settings updated for company: {settings_inst.company_name}")
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DatabaseBackupExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({"detail": "Only administrators can trigger database backups."}, status=status.HTTP_403_FORBIDDEN)
        
        data = {
            "vehicles": json.loads(django_serializers.serialize('json', Vehicle.objects.all())),
            "drivers": json.loads(django_serializers.serialize('json', Driver.objects.all())),
            "trips": json.loads(django_serializers.serialize('json', Trip.objects.all())),
            "fuel_logs": json.loads(django_serializers.serialize('json', FuelLog.objects.all())),
            "maintenance_records": json.loads(django_serializers.serialize('json', Maintenance.objects.all())),
            "audit_logs": json.loads(django_serializers.serialize('json', AuditLog.objects.all())),
            "system_settings": json.loads(django_serializers.serialize('json', SystemSettings.objects.all()))
        }
        
        response = HttpResponse(json.dumps(data, indent=2), content_type='application/json')
        response['Content-Disposition'] = f'attachment; filename=fleet_backup_{datetime.date.today().isoformat()}.json'
        
        from .logging_utils import log_audit
        log_audit("Database Backup Exported", request.user, request, "Database backup export successfully completed.")
        return response


class DatabaseBackupImportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != 'ADMIN':
            return Response({"detail": "Only administrators can restore database backups."}, status=status.HTTP_403_FORBIDDEN)
        
        backup_file = request.FILES.get('backup_file')
        if not backup_file:
            return Response({"detail": "No backup file uploaded."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            data = json.loads(backup_file.read().decode('utf-8'))
            
            Vehicle.objects.all().delete()
            Driver.objects.all().delete()
            Trip.objects.all().delete()
            FuelLog.objects.all().delete()
            Maintenance.objects.all().delete()
            AuditLog.objects.all().delete()
            SystemSettings.objects.all().delete()
            
            for key, serialized_objects in data.items():
                for obj in django_serializers.deserialize('json', json.dumps(serialized_objects)):
                    obj.save()
                    
            from .logging_utils import log_audit
            log_audit("Database Backup Restored", request.user, request, "Database backup restored successfully.")
            return Response({"detail": "Database backup successfully restored."})
            
        except Exception as e:
            return Response({"detail": f"Failed to restore backup: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)



