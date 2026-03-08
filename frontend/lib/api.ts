// API configuration for frontend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

interface FetchOptions extends RequestInit {
  body?: string | FormData
}

async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include", // Important pour envoyer les cookies
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    fetchAPI<{ success: boolean; token: string; role: string; name: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    ),

  logout: () =>
    fetchAPI<{ success: boolean }>("/auth/logout", {
      method: "POST",
    }),
}

// Reports API
export const reportsAPI = {
  getAll: () => fetchAPI<Report[]>("/reports"),

  getById: (id: string) => fetchAPI<Report>(`/reports/${id}`),

  create: (data: CreateReportData) =>
    fetchAPI<{ success: boolean; id: string; trackingUrl: string }>("/reports", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string) =>
    fetchAPI<{ success: boolean; report: Report }>(`/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  notifyTechnician: (id: string) =>
    fetchAPI<{ success: boolean }>(`/reports/${id}/notify`, {
      method: "POST",
    }),
}

// Locations API
export const locationsAPI = {
  getAll: () => fetchAPI<Location[]>("/locations"),

  create: (name: string, building: string) =>
    fetchAPI<{ success: boolean; location: Location }>("/locations", {
      method: "POST",
      body: JSON.stringify({ name, building }),
    }),

  delete: (id: string) =>
    fetchAPI<{ success: boolean }>(`/locations/${id}`, {
      method: "DELETE",
    }),
}

// Logs API
export const logsAPI = {
  getAll: () => fetchAPI<SystemLog[]>("/logs"),
}

// Manager API
export const managerAPI = {
  get: () => fetchAPI<ManagerInfo>("/manager"),

  update: (data: { name?: string; email?: string }) =>
    fetchAPI<{ success: boolean; manager: ManagerInfo }>("/manager", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
}

// Types
interface Report {
  id: string
  location: string
  issue_type: string
  description: string
  image_url?: string
  reporter_name?: string
  reporter_email?: string
  status: "pending" | "in_progress" | "resolved"
  created_at: string
  updated_at?: string
  resolved_at?: string
  technician_notified: boolean
}

interface CreateReportData {
  location: string
  issue_type: string
  description: string
  image_url?: string
  reporter_name?: string
  reporter_email?: string
}

interface Location {
  id: string
  name: string
  building: string
  qr_url: string
  created_at: string
}

interface SystemLog {
  timestamp: string
  action: string
  actor: string
}

interface ManagerInfo {
  id: string
  name: string
  email: string
  createdAt: string
}

export type { Report, CreateReportData, Location, SystemLog, ManagerInfo }
