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
