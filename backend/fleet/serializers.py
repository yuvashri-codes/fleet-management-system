from rest_framework import serializers
from .models import Vehicle, Driver, Trip, FuelLog, Maintenance

class MiniDriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = ('id', 'employee_id', 'name', 'email', 'phone')

class MiniVehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = ('id', 'vehicle_number', 'brand', 'model', 'vehicle_type')

class VehicleSerializer(serializers.ModelSerializer):
    assigned_driver = MiniDriverSerializer(read_only=True)
    assigned_driver_id = serializers.PrimaryKeyRelatedField(
        queryset=Driver.objects.all(),
        source='assigned_driver',
        write_only=True,
        required=False,
        allow_null=True
    )
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Vehicle
        fields = '__all__'

    def create(self, validated_data):
        driver = validated_data.pop('assigned_driver', None)
        vehicle = super().create(validated_data)
        if driver:
            # Clear previous assigned vehicle of this driver to avoid unique constraint violations
            previous_vehicle = getattr(driver, 'assigned_vehicle', None)
            if previous_vehicle:
                # We can just unassign it
                driver.assigned_vehicle = None
                driver.save()
            driver.assigned_vehicle = vehicle
            driver.save()
        return vehicle

    def update(self, instance, validated_data):
        # We need to support assigning a driver or unassigning a driver
        if 'assigned_driver' in validated_data:
            new_driver = validated_data.pop('assigned_driver')
            
            # 1. Unassign current driver if there is one
            current_driver = getattr(instance, 'assigned_driver', None)
            if current_driver:
                current_driver.assigned_vehicle = None
                current_driver.save()
                
            # 2. If a new driver is specified, assign them
            if new_driver:
                # If new driver already has a vehicle assigned, break that association
                if getattr(new_driver, 'assigned_vehicle', None):
                    # No need to raise error, just clear the other vehicle's relation
                    pass
                new_driver.assigned_vehicle = instance
                new_driver.save()
                
        return super().update(instance, validated_data)


class DriverSerializer(serializers.ModelSerializer):
    assigned_vehicle = MiniVehicleSerializer(read_only=True)
    assigned_vehicle_id = serializers.PrimaryKeyRelatedField(
        queryset=Vehicle.objects.all(),
        source='assigned_vehicle',
        write_only=True,
        required=False,
        allow_null=True
    )
    profile_photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Driver
        fields = '__all__'

    def create(self, validated_data):
        assigned_vehicle = validated_data.get('assigned_vehicle', None)
        if assigned_vehicle:
            # If vehicle already has an assigned driver, unassign them
            previous_driver = getattr(assigned_vehicle, 'assigned_driver', None)
            if previous_driver:
                previous_driver.assigned_vehicle = None
                previous_driver.save()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        assigned_vehicle = validated_data.get('assigned_vehicle', None)
        if 'assigned_vehicle' in validated_data:
            if assigned_vehicle:
                # Clear previous driver of that vehicle to avoid 1:1 conflicts
                previous_driver = getattr(assigned_vehicle, 'assigned_driver', None)
                if previous_driver and previous_driver != instance:
                    previous_driver.assigned_vehicle = None
                    previous_driver.save()
            instance.assigned_vehicle = assigned_vehicle
        return super().update(instance, validated_data)


class TripSerializer(serializers.ModelSerializer):
    vehicle = MiniVehicleSerializer(read_only=True)
    vehicle_id = serializers.PrimaryKeyRelatedField(
        queryset=Vehicle.objects.all(),
        source='vehicle',
        write_only=True
    )
    driver = MiniDriverSerializer(read_only=True)
    driver_id = serializers.PrimaryKeyRelatedField(
        queryset=Driver.objects.all(),
        source='driver',
        write_only=True
    )

    class Meta:
        model = Trip
        fields = '__all__'

    def validate(self, attrs):
        start_date = attrs.get('start_date')
        expected_end_date = attrs.get('expected_end_date')
        actual_end_date = attrs.get('actual_end_date')
        trip_cost = attrs.get('trip_cost')
        distance = attrs.get('distance')

        # 1. Dates validation
        if start_date and expected_end_date and expected_end_date < start_date:
            raise serializers.ValidationError({"expected_end_date": "Expected end date cannot be earlier than start date."})
        if start_date and actual_end_date and actual_end_date < start_date:
            raise serializers.ValidationError({"actual_end_date": "Actual end date cannot be earlier than start date."})
        
        # 2. Positive cost validation
        if trip_cost is not None and trip_cost < 0:
            raise serializers.ValidationError({"trip_cost": "Trip cost must be non-negative."})
        
        # 3. Positive distance validation
        if distance is not None and distance < 0:
            raise serializers.ValidationError({"distance": "Distance must be non-negative."})

        return attrs


class FuelLogSerializer(serializers.ModelSerializer):
    vehicle = MiniVehicleSerializer(read_only=True)
    vehicle_id = serializers.PrimaryKeyRelatedField(
        queryset=Vehicle.objects.all(),
        source='vehicle',
        write_only=True
    )
    driver = MiniDriverSerializer(read_only=True)
    driver_id = serializers.PrimaryKeyRelatedField(
        queryset=Driver.objects.all(),
        source='driver',
        write_only=True
    )
    receipt_upload = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = FuelLog
        fields = '__all__'

    def validate(self, attrs):
        quantity = attrs.get('fuel_quantity')
        price = attrs.get('price_per_liter')
        cost = attrs.get('total_cost')
        mileage = attrs.get('mileage')
        odometer = attrs.get('current_odometer')

        # Auto-compute total cost if quantity and price per liter are provided
        if quantity and price and cost is None:
            attrs['total_cost'] = quantity * price

        # Positive cost and mileage validation
        if quantity is not None and quantity <= 0:
            raise serializers.ValidationError({"fuel_quantity": "Fuel quantity must be positive."})
        if price is not None and price <= 0:
            raise serializers.ValidationError({"price_per_liter": "Price per liter must be positive."})
        if mileage is not None and mileage < 0:
            raise serializers.ValidationError({"mileage": "Mileage must be non-negative."})
        if odometer is not None and odometer < 0:
            raise serializers.ValidationError({"current_odometer": "Current odometer must be non-negative."})

        return attrs


class MaintenanceSerializer(serializers.ModelSerializer):
    vehicle = MiniVehicleSerializer(read_only=True)
    vehicle_id = serializers.PrimaryKeyRelatedField(
        queryset=Vehicle.objects.all(),
        source='vehicle',
        write_only=True
    )
    invoice_upload = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Maintenance
        fields = '__all__'

    def validate(self, attrs):
        scheduled_date = attrs.get('scheduled_date')
        completed_date = attrs.get('completed_date')
        estimated_cost = attrs.get('estimated_cost')
        actual_cost = attrs.get('actual_cost')

        # Dates validation
        if scheduled_date and completed_date and completed_date < scheduled_date:
            raise serializers.ValidationError({"completed_date": "Completed date cannot be earlier than scheduled date."})

        # Positive cost validation
        if estimated_cost is not None and estimated_cost < 0:
            raise serializers.ValidationError({"estimated_cost": "Estimated cost must be non-negative."})
        if actual_cost is not None and actual_cost < 0:
            raise serializers.ValidationError({"actual_cost": "Actual cost must be non-negative."})

        return attrs


from .models import AuditLog, SystemSettings

class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'action', 'user', 'user_email', 'ip_address', 'details', 'timestamp']


class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = '__all__'

