"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  UserCog,
  MapPin,
  ClipboardList,
  ScrollText,
  LogOut,
  FileText,
  Users,
  Building,
  QrCode,
  Trash2,
  Plus,
  Search,
  Bell,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { QRCodeModal } from "@/components/qr-code-modal"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import type { Report, Location, SystemLog } from "@/lib/types"
import { format, formatDistanceToNow } from "date-fns"

type AdminTab = "overview" | "manager" | "locations" | "reports" | "logs"

interface ManagerData {
  id: string
  name: string
  email: string
  createdAt: string
}

export default function AdminPanelPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [manager, setManager] = useState<ManagerData | null>(null)
  const [loading, setLoading] = useState(true)

  // Manager form
  const [managerName, setManagerName] = useState("")
  const [managerEmail, setManagerEmail] = useState("")
  const [savingManager, setSavingManager] = useState(false)

  // Location form
  const [newLocName, setNewLocName] = useState("")
  const [newLocBuilding, setNewLocBuilding] = useState("")
  const [addingLocation, setAddingLocation] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  // QR modal
  const [qrModal, setQrModal] = useState<{ open: boolean; name: string; url: string }>({
    open: false,
    name: "",
    url: "",
  })

  // Report filters
  const [reportSearch, setReportSearch] = useState("")
  const [reportStatusFilter, setReportStatusFilter] = useState("all")

  useEffect(() => {
    async function fetchAll() {
      try {
        const [reportsRes, locationsRes, logsRes, managerRes] = await Promise.all([
          fetch("/api/reports"),
          fetch("/api/locations"),
          fetch("/api/logs"),
          fetch("/api/manager"),
        ])

        if (reportsRes.status === 401) {
          router.push("/admin/login")
          return
        }

        const reportsData = await reportsRes.json()
        const locationsData = await locationsRes.json()
        const logsData = await logsRes.json()
        const managerData = await managerRes.json()

        setReports(Array.isArray(reportsData) ? reportsData : [])
        setLocations(Array.isArray(locationsData) ? locationsData : [])
        setLogs(Array.isArray(logsData) ? logsData : [])
        if (managerData && !managerData.error) {
          setManager(managerData)
          setManagerName(managerData.name)
          setManagerEmail(managerData.email)
        }
      } catch {
        router.push("/admin/login")
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [router])

  const stats = useMemo(
    () => ({
      totalUsers: 2,
      totalReports: reports.length,
      totalLocations: locations.length,
    }),
    [reports, locations]
  )

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (reportStatusFilter !== "all" && r.status !== reportStatusFilter)
        return false
      if (reportSearch) {
        const s = reportSearch.toLowerCase()
        return (
          r.location.toLowerCase().includes(s) ||
          r.description.toLowerCase().includes(s) ||
          r.id.toLowerCase().includes(s) ||
          (r.reporter_name || "").toLowerCase().includes(s)
        )
      }
      return true
    })
  }, [reports, reportStatusFilter, reportSearch])

  async function handleSaveManager() {
    setSavingManager(true)
    try {
      const res = await fetch("/api/manager", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: managerName, email: managerEmail }),
      })
      const data = await res.json()
      if (data.success) {
        setManager(data.manager)
        toast.success("Manager account updated")
      }
    } catch {
      toast.error("Failed to update manager")
    } finally {
      setSavingManager(false)
    }
  }

  async function handleAddLocation() {
    if (!newLocName || !newLocBuilding) return
    setAddingLocation(true)
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLocName, building: newLocBuilding }),
      })
      const data = await res.json()
      if (data.success) {
        setLocations((prev) => [...prev, data.location])
        setNewLocName("")
        setNewLocBuilding("")
        setAddDialogOpen(false)
        toast.success("Location added")
      }
    } catch {
      toast.error("Failed to add location")
    } finally {
      setAddingLocation(false)
    }
  }

  async function handleDeleteLocation(id: string) {
    try {
      const res = await fetch(`/api/locations/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        setLocations((prev) => prev.filter((l) => l.id !== id))
        toast.success("Location deleted")
      }
    } catch {
      toast.error("Failed to delete location")
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/admin/login")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />

      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            CampusFix
          </h1>
          <p className="text-xs text-muted-foreground">System Administration</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 w-full flex-wrap justify-start gap-1 bg-transparent h-auto p-0">
            {[
              { value: "overview", label: "Overview", icon: LayoutDashboard },
              { value: "manager", label: "Manager", icon: UserCog },
              { value: "locations", label: "Locations", icon: MapPin },
              { value: "reports", label: "Reports", icon: ClipboardList },
              { value: "logs", label: "Logs", icon: ScrollText },
            ].map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="gap-2 data-[state=active]:bg-muted rounded-md px-3 py-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-semibold text-foreground">System Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Total Users" value={stats.totalUsers} icon={Users} />
                <StatCard
                  title="Total Reports"
                  value={stats.totalReports}
                  icon={FileText}
                  accentColor="#2563EB"
                />
                <StatCard
                  title="Total Locations"
                  value={stats.totalLocations}
                  icon={Building}
                  accentColor="#059669"
                />
              </div>

              <div className="rounded-lg border border-[#E5E7EB] p-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  Last Activity
                </h3>
                <div className="flex flex-col gap-2">
                  {reports.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Last report submitted:{" "}
                      <span className="text-foreground font-medium">
                        {formatDistanceToNow(new Date(reports[0].created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </p>
                  )}
                  {logs.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Last system event:{" "}
                      <span className="text-foreground font-medium">
                        {logs[0].action}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* MANAGER ACCOUNT */}
          <TabsContent value="manager">
            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-semibold text-foreground">
                Manager Account
              </h2>
              <p className="text-sm text-muted-foreground">
                This is the only manager account in the system.
              </p>

              {manager && (
                <div className="max-w-md rounded-lg border border-[#E5E7EB] p-6">
                  <div className="mb-4 text-xs text-muted-foreground">
                    Created{" "}
                    {format(new Date(manager.createdAt), "MMM d, yyyy")}
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="mgr-name">Name</Label>
                      <Input
                        id="mgr-name"
                        value={managerName}
                        onChange={(e) => setManagerName(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="mgr-email">Email</Label>
                      <Input
                        id="mgr-email"
                        type="email"
                        value={managerEmail}
                        onChange={(e) => setManagerEmail(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleSaveManager}
                      disabled={savingManager}
                      className="w-full bg-[#111111] text-background hover:bg-[#111111]/90"
                    >
                      {savingManager ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* LOCATIONS & QR CODES */}
          <TabsContent value="locations">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Locations & QR Codes
                </h2>
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2 bg-[#111111] text-background hover:bg-[#111111]/90">
                      <Plus className="h-4 w-4" />
                      Add Location
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Location</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                      <div className="flex flex-col gap-2">
                        <Label>Location Name</Label>
                        <Input
                          placeholder="e.g. Room B203"
                          value={newLocName}
                          onChange={(e) => setNewLocName(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Building</Label>
                        <Input
                          placeholder="e.g. Block B"
                          value={newLocBuilding}
                          onChange={(e) => setNewLocBuilding(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleAddLocation}
                        disabled={!newLocName || !newLocBuilding || addingLocation}
                        className="bg-[#111111] text-background hover:bg-[#111111]/90"
                      >
                        {addingLocation ? "Adding..." : "Add Location"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="rounded-lg border border-[#E5E7EB] overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Building</TableHead>
                        <TableHead className="hidden md:table-cell">URL</TableHead>
                        <TableHead className="hidden md:table-cell">Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locations.map((loc) => (
                        <TableRow key={loc.id}>
                          <TableCell className="font-medium">{loc.name}</TableCell>
                          <TableCell>{loc.building}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                            {loc.qr_url}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                            {format(new Date(loc.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                onClick={() =>
                                  setQrModal({
                                    open: true,
                                    name: loc.name,
                                    url: loc.qr_url,
                                  })
                                }
                              >
                                <QrCode className="h-3.5 w-3.5" />
                                QR
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteLocation(loc.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <QRCodeModal
                open={qrModal.open}
                onOpenChange={(open) => setQrModal((prev) => ({ ...prev, open }))}
                locationName={qrModal.name}
                qrUrl={qrModal.url}
              />
            </div>
          </TabsContent>

          {/* ALL REPORTS */}
          <TabsContent value="reports">
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-foreground">
                All Reports (Read-only)
              </h2>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search reports..."
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={reportStatusFilter}
                  onValueChange={setReportStatusFilter}
                >
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border border-[#E5E7EB] overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="hidden md:table-cell">Type</TableHead>
                        <TableHead className="hidden md:table-cell">Reporter</TableHead>
                        <TableHead className="hidden lg:table-cell">Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Notified</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-sm">{r.id}</TableCell>
                          <TableCell className="font-medium">{r.location}</TableCell>
                          <TableCell className="hidden md:table-cell">{r.issue_type}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {r.reporter_name || "Anonymous"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                            {r.reporter_email || "-"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={r.status} />
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {r.technician_notified ? (
                              <Bell className="h-4 w-4 text-[#2563EB]" />
                            ) : (
                              <span className="text-xs text-muted-foreground">No</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredReports.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No reports found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* SYSTEM LOGS */}
          <TabsContent value="logs">
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-foreground">
                System Logs
              </h2>

              <div className="rounded-lg border border-[#E5E7EB] overflow-hidden">
                {logs.length > 0 ? (
                  <div className="divide-y divide-[#E5E7EB]">
                    {logs.map((log, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-1 px-4 py-3 md:flex-row md:items-center md:gap-4"
                      >
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          {format(
                            new Date(log.timestamp),
                            "yyyy-MM-dd HH:mm:ss"
                          )}
                        </span>
                        <span className="text-sm text-foreground">
                          {log.action}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          by {log.actor}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    No system events recorded yet
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
