// User types
export type UserRole = "admin" | "owner" | "manager" | "staff"
export type UserStatus = "active" | "pending" | "inactive"

export interface User {
  id: number
  name: string
  email: string
  business?: string
  businessId?: number
  role: UserRole
  status: UserStatus
  lastLogin?: string
}

// Business types
export type BusinessStatus = "active" | "pending" | "inactive"

export interface Business {
  id: number
  name: string
  users: number
  reviews: number
  avgRating: number
  status: BusinessStatus
  createdAt: string
}

// Review types
export interface Review {
  id: number
  name: string
  rating: number
  date: string
  message: string
  location: string
  email?: string
  phone?: string
  replied: boolean
  approved?: boolean
}

// Review link types
export interface ReviewLink {
  url: string
  title: string
  businessName: string
  previewText: string
  reviewGatingEnabled: boolean
  imageUrl?: string
}
