from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import date, timedelta, time
from .models import Vehicle, Driver, Trip, FuelLog, Maintenance

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

        # Create driver profile matching driver_user email
        self.driver_profile = Driver.objects.create(
            employee_id='EMP-DRV-1',
            name='Test Driver',
            email='driver@fleet.com',
            phone='555-0199',
            license_number='DL-DRV-1',
            license_expiry=date.today() + timedelta(days=200),
            joining_date=date.today(),
            experience=4,
            emergency_contact='555-0100',
            assigned_vehicle=self.vehicle
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

    def test_driver_read_assigned_vehicle_only(self):
        self.client.force_authenticate(user=self.driver_user)
        # Create another vehicle unassigned to this driver
        Vehicle.objects.create(
            vehicle_number='TX-X', registration_number='REG-X', vin_number='VIN-X',
            brand='Nissan', model='NV', vehicle_type='Van', manufacturing_year=2022,
            fuel_type='Petrol', current_odometer=8000, capacity='2 Tons'
        )
        response = self.client.get(reverse('vehicle-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['vehicle_number'], 'TX-100')

    def test_driver_own_trips_only(self):
        # Create second driver
        driver2 = Driver.objects.create(
            employee_id='EMP-DRV-2', name='Driver 2', email='drv2@fleet.com', phone='555-0299',
            license_number='DL-DRV-2', license_expiry=date.today(), joining_date=date.today(),
            experience=2, emergency_contact='555-0200'
        )
        
        # Create trip for driver_user
        trip1 = Trip.objects.create(
            trip_name='Trip 1', vehicle=self.vehicle, driver=self.driver_profile,
            source_location='Austin', destination='Dallas', route='I-35',
            start_date=date.today(), start_time=time(8, 0), expected_end_date=date.today(),
            distance=200, estimated_duration='3 hours', trip_cost=150,
            cargo_description='Box goods', customer_name='ACME Corp', customer_contact='555-0111'
        )
        
        # Create trip for driver2
        trip2 = Trip.objects.create(
            trip_name='Trip 2', vehicle=self.vehicle, driver=driver2,
            source_location='Houston', destination='Dallas', route='I-45',
            start_date=date.today(), start_time=time(9, 0), expected_end_date=date.today(),
            distance=240, estimated_duration='4 hours', trip_cost=200,
            cargo_description='Raw material', customer_name='Globex', customer_contact='555-0222'
        )

        self.client.force_authenticate(user=self.driver_user)
        response = self.client.get(reverse('trip-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['trip_name'], 'Trip 1')

    def test_driver_trip_update_status_only(self):
        trip = Trip.objects.create(
            trip_name='Austin Cargo Run', vehicle=self.vehicle, driver=self.driver_profile,
            source_location='Austin', destination='Dallas', route='I-35',
            start_date=date.today(), start_time=time(8, 0), expected_end_date=date.today(),
            distance=200, estimated_duration='3 hours', trip_cost=150,
            cargo_description='Box goods', customer_name='ACME Corp', customer_contact='555-0111'
        )
        
        self.client.force_authenticate(user=self.driver_user)
        
        # Succeeds: Update status to IN_PROGRESS
        response = self.client.patch(reverse('trip-detail', args=[trip.id]), {
            'current_status': 'IN_PROGRESS'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Fails: Attempting to modify destination
        response = self.client.patch(reverse('trip-detail', args=[trip.id]), {
            'destination': 'El Paso'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_driver_blocked_from_fuel_and_maintenance(self):
        self.client.force_authenticate(user=self.driver_user)
        
        response = self.client.get(reverse('fuel-list'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        response = self.client.get(reverse('maintenance-list'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_trip_validation_dates(self):
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.post(reverse('trip-list'), {
            'trip_name': 'Bad Dates Trip',
            'vehicle_id': self.vehicle.id,
            'driver_id': self.driver_profile.id,
            'source_location': 'Austin',
            'destination': 'Dallas',
            'route': 'I-35',
            'start_date': date.today(),
            'start_time': '08:00:00',
            'expected_end_date': date.today() - timedelta(days=2), # Bad expected end date
            'distance': 200,
            'estimated_duration': '3 hours',
            'trip_cost': 100,
            'cargo_description': 'Food items',
            'customer_name': 'Heinz',
            'customer_contact': '555-9999'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('expected_end_date', response.data)

    def test_dashboard_stats_and_kpis_access_driver_vs_admin(self):
        # Create another vehicle and trip not assigned to driver
        other_vehicle = Vehicle.objects.create(
            vehicle_number='TX-200', registration_number='REG-200', vin_number='VIN-200',
            brand='Ford', model='Transit', vehicle_type='Van', manufacturing_year=2023,
            fuel_type='Petrol', current_odometer=10000, capacity='5 Tons'
        )
        other_driver = Driver.objects.create(
            employee_id='EMP-DRV-2', name='Other Driver', email='other@fleet.com',
            phone='555-0299', license_number='DL-DRV-2', license_expiry=date.today() + timedelta(days=100),
            joining_date=date.today(), experience=2, emergency_contact='555-0200', assigned_vehicle=other_vehicle
        )
        Trip.objects.create(
            trip_name='Driver Trip', vehicle=self.vehicle, driver=self.driver_profile,
            source_location='Austin', destination='Dallas', route='I-35',
            start_date=date.today(), start_time=time(8, 0), expected_end_date=date.today() + timedelta(days=1),
            distance=200, estimated_duration='3 hours', trip_cost=100, cargo_description='Goods',
            customer_name='Client A', customer_contact='555-1111', current_status='SCHEDULED'
        )
        Trip.objects.create(
            trip_name='Other Trip', vehicle=other_vehicle, driver=other_driver,
            source_location='Dallas', destination='Houston', route='I-45',
            start_date=date.today(), start_time=time(9, 0), expected_end_date=date.today() + timedelta(days=1),
            distance=250, estimated_duration='4 hours', trip_cost=150, cargo_description='Tools',
            customer_name='Client B', customer_contact='555-2222', current_status='SCHEDULED'
        )

        # Authenticate as DRIVER
        self.client.force_authenticate(user=self.driver_user)
        response = self.client.get(reverse('dashboard-stats'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Driver should only see statistics of 1 vehicle (their own) and 1 trip
        self.assertEqual(response.data['total_vehicles'], 1)
        self.assertEqual(response.data['total_drivers'], 1)

        # Authenticate as ADMIN
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('dashboard-stats'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Admin should see all 2 vehicles and 2 drivers
        self.assertEqual(response.data['total_vehicles'], 2)
        self.assertEqual(response.data['total_drivers'], 2)

    def test_dashboard_notifications_filtering(self):
        # Create a vehicle with expiring insurance
        expiring_vehicle = Vehicle.objects.create(
            vehicle_number='TX-300', registration_number='REG-300', vin_number='VIN-300',
            brand='Volvo', model='FH16', vehicle_type='Truck', manufacturing_year=2024,
            fuel_type='Diesel', current_odometer=8000, capacity='25 Tons',
            insurance_expiry=date.today() + timedelta(days=10) # Expiring in 10 days
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('dashboard-notifications'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that warning is returned
        titles = [n['title'] for n in response.data]
        self.assertIn('Insurance Expiring Soon', titles)

