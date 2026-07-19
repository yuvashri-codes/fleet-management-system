from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import date, timedelta
from .models import Vehicle, Driver

User = get_user_model()

class FleetAPITests(APITestCase):
    def setUp(self):
        # Create users with different roles
        self.admin_user = User.objects.create_user(
            email='admin@fleet.com', password='Password123!', role=User.Role.ADMIN
        )
        self.manager_user = User.objects.create_user(
            email='manager@fleet.com', password='Password123!', role=User.Role.FLEET_MANAGER
        )
        self.driver_user = User.objects.create_user(
            email='driver@fleet.com', password='Password123!', role=User.Role.DRIVER
        )

        # Setup standard vehicle for testing
        self.vehicle = Vehicle.objects.create(
            vehicle_number='TX-100',
            registration_number='REG-100',
            vin_number='VIN-100',
            brand='Tesla',
            model='Semi',
            vehicle_type='Truck',
            manufacturing_year=2024,
            fuel_type='Electric',
            current_odometer=5000,
            capacity='20 Tons'
        )

    def test_unauthenticated_access_denied(self):
        # Unauthenticated users cannot view vehicles
        response = self.client.get(reverse('vehicle-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_driver_read_only_access(self):
        # Authenticate as Driver
        self.client.force_authenticate(user=self.driver_user)
        
        # Safe GET should succeed
        response = self.client.get(reverse('vehicle-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Write POST should fail (Forbidden)
        response = self.client.post(reverse('vehicle-list'), {
            'vehicle_number': 'TX-200',
            'registration_number': 'REG-200',
            'vin_number': 'VIN-200',
            'brand': 'Ford',
            'model': 'F-150',
            'vehicle_type': 'Pickup',
            'manufacturing_year': 2023,
            'fuel_type': 'Petrol',
            'current_odometer': 12000,
            'capacity': '1 Ton'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_write_access_no_delete(self):
        # Authenticate as Manager
        self.client.force_authenticate(user=self.manager_user)
        
        # Write POST should succeed
        response = self.client.post(reverse('vehicle-list'), {
            'vehicle_number': 'TX-200',
            'registration_number': 'REG-200',
            'vin_number': 'VIN-200',
            'brand': 'Ford',
            'model': 'F-150',
            'vehicle_type': 'Pickup',
            'manufacturing_year': 2023,
            'fuel_type': 'Petrol',
            'current_odometer': 12000,
            'capacity': '1 Ton'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Delete should fail
        vehicle_to_delete = Vehicle.objects.get(vehicle_number='TX-200')
        response = self.client.delete(reverse('vehicle-detail', args=[vehicle_to_delete.id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_full_access(self):
        # Authenticate as Admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Delete should succeed
        response = self.client.delete(reverse('vehicle-detail', args=[self.vehicle.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_driver_vehicle_relationship_reassignment(self):
        # Authenticate as Admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Create a Driver
        driver = Driver.objects.create(
            employee_id='EMP-001',
            name='John Doe',
            email='john@doe.com',
            phone='1234567890',
            license_number='DL-001',
            license_expiry=date.today() + timedelta(days=365),
            joining_date=date.today(),
            experience=5,
            emergency_contact='9876543210'
        )

        # Update vehicle to assign driver
        response = self.client.put(reverse('vehicle-detail', args=[self.vehicle.id]), {
            'vehicle_number': self.vehicle.vehicle_number,
            'registration_number': self.vehicle.registration_number,
            'vin_number': self.vehicle.vin_number,
            'brand': self.vehicle.brand,
            'model': self.vehicle.model,
            'vehicle_type': self.vehicle.vehicle_type,
            'manufacturing_year': self.vehicle.manufacturing_year,
            'fuel_type': self.vehicle.fuel_type,
            'current_odometer': self.vehicle.current_odometer,
            'capacity': self.vehicle.capacity,
            'assigned_driver_id': driver.id
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify the driver's vehicle reference updated
        driver.refresh_from_db()
        self.assertEqual(driver.assigned_vehicle, self.vehicle)
