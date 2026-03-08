export type Role = "manager" | "superadmin"
export type Status = "pending" | "in_progress" | "resolved"
export type IssueType = "Electricity" | "IT" | "Internet" | "Plumbing" | "Furniture" | "Other"

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  role: Role
  createdAt: string
}

export interface Report {
  id: string
  location: string
  issue_type: IssueType
  description: string
  image_url?: string
  reporter_name?: string
  reporter_email?: string
  status: Status
  created_at: string
  updated_at?: string
  resolved_at?: string
  technician_notified: boolean
}

export interface Location {
  id: string
  name: string
  building: string
  qr_url: string
  created_at: string
}

export interface SystemLog {
  timestamp: string
  action: string
  actor: string
}
