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
