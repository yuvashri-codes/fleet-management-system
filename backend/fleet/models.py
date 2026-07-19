from django.db import models
from django.core.validators import MinValueValidator
from django.conf import settings

class Vehicle(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Available'
        IN_USE = 'IN_USE', 'In Use'
        MAINTENANCE = 'MAINTENANCE', 'Under Maintenance'
        INACTIVE = 'INACTIVE', 'Inactive'

    vehicle_number = models.CharField(max_length=50, unique=True, db_index=True)
    registration_number = models.CharField(max_length=50, unique=True, db_index=True)
    vin_number = models.CharField(max_length=100, unique=True, db_index=True)
    brand = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    vehicle_type = models.CharField(max_length=50, db_index=True) # e.g. Truck, SUV, Sedan, Van, Bus, Hybrid
    manufacturing_year = models.IntegerField()
    purchase_date = models.DateField(null=True, blank=True)
    insurance_number = models.CharField(max_length=100, blank=True)
    insurance_expiry = models.DateField(null=True, blank=True)
    rc_expiry = models.DateField(null=True, blank=True)
    fuel_type = models.CharField(max_length=50, db_index=True) # e.g. Diesel, Petrol, Electric, Hybrid, CNG
    mileage = models.FloatField(validators=[MinValueValidator(0.0)], null=True, blank=True)
    current_odometer = models.IntegerField(validators=[MinValueValidator(0)])
    capacity = models.CharField(max_length=50) # e.g. "10 Tons" or "5 Passengers"
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE, db_index=True)
    image = models.ImageField(upload_to='vehicles/', null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.brand} {self.model} ({self.vehicle_number})"


class Driver(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        INACTIVE = 'INACTIVE', 'Inactive'
        SUSPENDED = 'SUSPENDED', 'Suspended'

    employee_id = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    profile_photo = models.ImageField(upload_to='drivers/', null=True, blank=True)
    email = models.EmailField(unique=True, db_index=True)
    phone = models.CharField(max_length=30)
    license_number = models.CharField(max_length=50, unique=True, db_index=True)
    license_expiry = models.DateField(db_index=True)
    joining_date = models.DateField()
    experience = models.IntegerField(validators=[MinValueValidator(0)]) # Experience in years
    address = models.TextField(blank=True)
    emergency_contact = models.CharField(max_length=100)
    blood_group = models.CharField(max_length=10, blank=True)
    assigned_vehicle = models.OneToOneField(
        Vehicle,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_driver',
        db_index=True
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.employee_id})"


class Trip(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = 'SCHEDULED', 'Scheduled'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        DELAYED = 'DELAYED', 'Delayed'

    trip_name = models.CharField(max_length=150)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='trips', db_index=True)
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='trips', db_index=True)
    source_location = models.CharField(max_length=200)
    destination = models.CharField(max_length=200)
    route = models.TextField()
    start_date = models.DateField(db_index=True)
    start_time = models.TimeField()
    expected_end_date = models.DateField()
    actual_end_date = models.DateField(null=True, blank=True)
    distance = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.0)]) # in KM
    estimated_duration = models.CharField(max_length=100) # e.g. "5 hours"
    current_status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.SCHEDULED, 
        db_index=True
    )
    trip_cost = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0.0)])
    cargo_description = models.TextField()
    customer_name = models.CharField(max_length=150)
    customer_contact = models.CharField(max_length=30)
    notes = models.TextField(blank=True)
    gps_coordinates = models.CharField(max_length=255, blank=True, default='') # GPS Coordinates placeholder
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.trip_name} ({self.current_status})"


class FuelLog(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='fuel_logs', db_index=True)
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='fuel_logs', db_index=True)
    fuel_station = models.CharField(max_length=150)
    fuel_type = models.CharField(max_length=50, db_index=True) # e.g. Diesel, Petrol, Electric, CNG, Hybrid
    fuel_quantity = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0.01)]) # in Liters
    price_per_liter = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0.01)])
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    mileage = models.FloatField(validators=[MinValueValidator(0.0)]) # distance covered since last fill (or vehicle mileage indicator)
    current_odometer = models.IntegerField(validators=[MinValueValidator(0)])
    fuel_date = models.DateField(db_index=True)
    payment_method = models.CharField(max_length=50) # Cash, Card, Fuel Card
    receipt_upload = models.FileField(upload_to='receipts/', null=True, blank=True)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fuel_date', '-created_at']

    def __str__(self):
        return f"Fuel for {self.vehicle.vehicle_number} on {self.fuel_date}"


class Maintenance(models.Model):
    class Type(models.TextChoices):
        PREVENTIVE = 'PREVENTIVE', 'Preventive'
        CORRECTIVE = 'CORRECTIVE', 'Corrective'
        EMERGENCY = 'EMERGENCY', 'Emergency'
        INSPECTION = 'INSPECTION', 'Inspection'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SCHEDULED = 'SCHEDULED', 'Scheduled'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='maintenances', db_index=True)
    maintenance_type = models.CharField(max_length=30, choices=Type.choices, db_index=True)
    service_center = models.CharField(max_length=150)
    service_engineer = models.CharField(max_length=100)
    description = models.TextField()
    issue_category = models.CharField(max_length=100) # Engine, Brakes, Tires, Electrical, Transmission, etc.
    priority = models.CharField(
        max_length=20, 
        choices=[('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High'), ('CRITICAL', 'Critical')],
        default='MEDIUM',
        db_index=True
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    scheduled_date = models.DateField(db_index=True)
    completed_date = models.DateField(null=True, blank=True)
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.0)])
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0.0)])
    invoice_upload = models.FileField(upload_to='invoices/', null=True, blank=True)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-scheduled_date', '-created_at']

    def __str__(self):
        return f"{self.maintenance_type} Maintenance for {self.vehicle.vehicle_number} ({self.status})"


class AuditLog(models.Model):
    action = models.CharField(max_length=100)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    details = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        username = self.user.email if self.user else "Anonymous"
        return f"{username} - {self.action} at {self.timestamp}"


class SystemSettings(models.Model):
    company_name = models.CharField(max_length=150, default="FleetGuard Logistics")
    company_email = models.EmailField(default="info@fleetguard.com")
    currency = models.CharField(max_length=10, default="USD")
    theme = models.CharField(max_length=20, default="dark")
    fuel_unit = models.CharField(max_length=20, default="Liters")
    distance_unit = models.CharField(max_length=20, default="Kilometers")
    notification_email = models.BooleanField(default=True)
    notification_sms = models.BooleanField(default=True)

    def __str__(self):
        return f"System Settings: {self.company_name}"


