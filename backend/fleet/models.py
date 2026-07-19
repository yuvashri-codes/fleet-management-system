from django.db import models
from django.core.validators import MinValueValidator

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
