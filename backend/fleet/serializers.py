from rest_framework import serializers
from .models import Vehicle, Driver

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
