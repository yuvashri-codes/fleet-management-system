export type UserRole = 'ADMIN' | 'FLEET_MANAGER' | 'DRIVER'

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: UserRole
  created_at: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: User
}

export interface RegisterResponse {
  message: string
  user: User
  tokens?: AuthTokens
}

export interface MiniDriver {
  id: number
  employee_id: string
  name: string
  email: string
  phone: string
}

export interface MiniVehicle {
  id: number
  vehicle_number: string
  brand: string
  model: string
  vehicle_type: string
}

export interface Vehicle {
  id: number
  vehicle_number: string
  registration_number: string
  vin_number: string
  brand: string
  model: string
  vehicle_type: string
  manufacturing_year: number
  purchase_date: string | null
  insurance_number: string
  insurance_expiry: string | null
  rc_expiry: string | null
  fuel_type: string
  mileage: number | null
  current_odometer: number
  capacity: string
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'INACTIVE'
  image: string | null
  notes: string
  assigned_driver?: MiniDriver | null
  created_at: string
  updated_at: string
}

export interface Driver {
  id: number
  employee_id: string
  name: string
  profile_photo: string | null
  email: string
  phone: string
  license_number: string
  license_expiry: string
  joining_date: string
  experience: number
  address: string
  emergency_contact: string
  blood_group: string
  assigned_vehicle?: MiniVehicle | null
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  created_at: string
  updated_at: string
}

export type TripStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DELAYED'

export interface Trip {
  id: number
  trip_name: string
  vehicle: MiniVehicle
  driver: MiniDriver
  source_location: string
  destination: string
  route: string
  start_date: string
  start_time: string
  expected_end_date: string
  actual_end_date: string | null
  distance: number
  estimated_duration: string
  current_status: TripStatus
  trip_cost: number
  cargo_description: string
  customer_name: string
  customer_contact: string
  notes: string
  gps_coordinates: string
  created_at: string
  updated_at: string
}

export interface FuelLog {
  id: number
  vehicle: MiniVehicle
  driver: MiniDriver
  fuel_station: string
  fuel_type: string
  fuel_quantity: number
  price_per_liter: number
  total_cost: number
  mileage: number
  current_odometer: number
  fuel_date: string
  payment_method: string
  receipt_upload: string | null
  remarks: string
  created_at: string
}

export type MaintenanceType = 'PREVENTIVE' | 'CORRECTIVE' | 'EMERGENCY' | 'INSPECTION'
export type MaintenanceStatus = 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface Maintenance {
  id: number
  vehicle: MiniVehicle
  maintenance_type: MaintenanceType
  service_center: string
  service_engineer: string
  description: string
  issue_category: string
  priority: MaintenancePriority
  status: MaintenanceStatus
  scheduled_date: string
  completed_date: string | null
  estimated_cost: number
  actual_cost: number | null
  invoice_upload: string | null
  remarks: string
  created_at: string
  updated_at: string
}
