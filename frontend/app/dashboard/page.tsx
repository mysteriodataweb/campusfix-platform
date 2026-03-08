"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  ClipboardList,
  MapPin,
  LogOut,
  FileText,
  Clock,
  Wrench,
  CheckCircle,
  Search,
  QrCode,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { ReportDrawer } from "@/components/report-drawer"
import { QRCodeModal } from "@/components/qr-code-modal"
import { Toaster } from "@/components/ui/sonner"
import type { Report, Location, Status, IssueType } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"

// ─── Design tokens (Cuberto palette) ────────────────────────────────────────
// bg: #F2F3F7  |  surface: #FFFFFF  |  foreground: #111111
// muted-fg: #8A8FA8  |  border: #EBEBF0  |  accent-blue: #2563EB
// accent-amber: #F59E0B  |  accent-green: #10B981
// ────────────────────────────────────────────────────────────────────────────

const COLORS = ["#111111", "#2563EB", "#8A8FA8", "#F59E0B", "#10B981", "#7C3AED"]

type Tab = "overview" | "reports" | "locations"

export default function DashboardPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("overview")
  const [reports, setReports] = useState<Report[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [qrModal, setQrModal] = useState<{ open: boolean; name: string; url: string }>({
    open: false,
    name: "",
    url: "",
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [reportsRes, locationsRes] = await Promise.all([
          fetch("/api/reports"),
          fetch("/api/locations"),
        ])
        if (reportsRes.status === 401 || locationsRes.status === 401) {
          router.push("/login")
          return
        }
        setReports(await reportsRes.json())
        setLocations(await locationsRes.json())
      } catch {
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router])

  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    in_progress: reports.filter((r) => r.status === "in_progress").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  }), [reports])

  const issueBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    reports.forEach((r) => { counts[r.issue_type] = (counts[r.issue_type] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [reports])

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false
      if (typeFilter !== "all" && r.issue_type !== typeFilter) return false
      if (search) {
        const s = search.toLowerCase()
        return (
          r.location.toLowerCase().includes(s) ||
          r.description.toLowerCase().includes(s) ||
          r.id.toLowerCase().includes(s)
        )
      }
      return true
    })
  }, [reports, statusFilter, typeFilter, search])

  async function handleStatusChange(id: string, status: "in_progress" | "resolved") {
    await fetch(`/api/report/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status, updated_at: new Date().toISOString(), ...(status === "resolved" ? { resolved_at: new Date().toISOString() } : {}) }
          : r
      )
    )
    setSelectedReport((prev) =>
      prev?.id === id
        ? { ...prev, status, updated_at: new Date().toISOString(), ...(status === "resolved" ? { resolved_at: new Date().toISOString() } : {}) }
        : prev
    )
  }

  async function handleNotify(id: string) {
    await fetch(`/api/notify/${id}`, { method: "POST" })
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, technician_notified: true } : r)))
    setSelectedReport((prev) => (prev?.id === id ? { ...prev, technician_notified: true } : prev))
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#F2F3F7" }}>
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#111111] border-t-transparent" />
      </div>
    )
  }

  const navItems: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "reports", label: "Reports", icon: ClipboardList },
    { key: "locations", label: "Locations", icon: MapPin },
  ]

  return (
    <>
      {/* ── Google Font: DM Sans ─────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');

        .cf-root * { font-family: 'DM Sans', sans-serif; }

        /* Scrollbar */
        .cf-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .cf-root ::-webkit-scrollbar-track { background: transparent; }
        .cf-root ::-webkit-scrollbar-thumb { background: #DDDDE5; border-radius: 99px; }

        /* Sidebar nav active/hover */
        .cf-nav-btn { transition: background 0.15s, color 0.15s; }
        .cf-nav-btn:hover { background: #EBEBF0; }
        .cf-nav-btn.active { background: #111111; color: #ffffff !important; }
        .cf-nav-btn.active svg { color: #ffffff; }

        /* Stat card hover */
        .cf-stat-card { transition: box-shadow 0.2s, transform 0.2s; }
        .cf-stat-card:hover { box-shadow: 0 8px 32px rgba(17,17,17,0.10); transform: translateY(-2px); }

        /* Table row hover */
        .cf-table-row { transition: background 0.12s; }
        .cf-table-row:hover { background: #F7F8FC; }

        /* Button styles */
        .cf-btn-sm {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 8px;
          border: 1.5px solid #EBEBF0;
          background: #ffffff;
          color: #111111;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .cf-btn-sm:hover { background: #F2F3F7; border-color: #D0D1DC; }

        /* Input */
        .cf-input {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          background: #ffffff;
          border: 1.5px solid #EBEBF0;
          border-radius: 10px;
          padding: 8px 12px 8px 36px;
          outline: none;
          width: 100%;
          color: #111111;
          transition: border-color 0.15s;
        }
        .cf-input:focus { border-color: #111111; }
        .cf-input::placeholder { color: #B0B3C6; }

        /* Select */
        .cf-select select {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          background: #ffffff;
          border: 1.5px solid #EBEBF0;
          border-radius: 10px;
          padding: 8px 32px 8px 12px;
          color: #111111;
          outline: none;
          appearance: none;
          cursor: pointer;
        }

        /* Mobile bottom nav */
        .cf-mobile-nav-btn { transition: color 0.15s; }
        .cf-mobile-nav-btn.active { color: #111111 !important; }
        .cf-mobile-nav-btn.active svg { stroke-width: 2.5px; }

        /* Fade-in animation */
        @keyframes cf-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cf-fadein { animation: cf-fadein 0.3s ease both; }
      `}</style>

      <div
        className="cf-root flex min-h-screen"
        style={{ background: "#F2F3F7", color: "#111111" }}
      >
        <Toaster />

        {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
        <aside
          className="hidden md:flex flex-col"
          style={{
            width: 220,
            minWidth: 220,
            background: "#ffffff",
            borderRight: "1.5px solid #EBEBF0",
          }}
        >
          {/* Logo */}
          <div style={{ padding: "28px 24px 20px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "#111111",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Wrench style={{ width: 16, height: 16, color: "#ffffff" }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111111", lineHeight: 1.2 }}>
                  CampusFix
                </div>
                <div style={{ fontSize: 11, color: "#8A8FA8", fontWeight: 400 }}>
                  Manager Dashboard
                </div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "0 12px", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#B0B3C6", letterSpacing: "0.08em", padding: "0 12px", marginBottom: 4, marginTop: 4 }}>
              MENU
            </div>
            {navItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`cf-nav-btn ${tab === key ? "active" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: "transparent",
                  color: tab === key ? "#ffffff" : "#8A8FA8",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
                {label}
              </button>
            ))}
          </nav>

          {/* Sign out */}
          <div style={{ borderTop: "1.5px solid #EBEBF0", padding: 12 }}>
            <button
              onClick={handleLogout}
              className="cf-nav-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                background: "transparent",
                color: "#8A8FA8",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                width: "100%",
              }}
            >
              <LogOut style={{ width: 16, height: 16 }} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <main style={{ flex: 1, overflow: "auto", paddingBottom: 72 }}>
          <div style={{ padding: "32px 32px" }} className="max-w-[1200px]">

            {/* Mobile header */}
            <div className="flex items-center justify-between md:hidden" style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: "#111111",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Wrench style={{ width: 14, height: 14, color: "#ffffff" }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>CampusFix</div>
                  <div style={{ fontSize: 11, color: "#8A8FA8" }}>Manager</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1.5px solid #EBEBF0",
                  background: "#ffffff",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#111111",
                }}
              >
                <LogOut style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
            {tab === "overview" && (
              <div className="cf-fadein" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Page title */}
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#111111" }}>Overview</div>
                  <div style={{ fontSize: 13, color: "#8A8FA8", marginTop: 2 }}>Track and manage all campus reports</div>
                </div>

                {/* Stat cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
                  {[
                    { label: "Total Reports", value: stats.total, icon: FileText, accent: "#111111" },
                    { label: "Pending", value: stats.pending, icon: Clock, accent: "#F59E0B" },
                    { label: "In Progress", value: stats.in_progress, icon: Wrench, accent: "#2563EB" },
                    { label: "Resolved", value: stats.resolved, icon: CheckCircle, accent: "#10B981" },
                  ].map(({ label, value, icon: Icon, accent }) => (
                    <div
                      key={label}
                      className="cf-stat-card"
                      style={{
                        background: "#ffffff",
                        borderRadius: 16,
                        padding: "20px 22px",
                        boxShadow: "0 2px 12px rgba(17,17,17,0.06)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: "#8A8FA8" }}>{label}</span>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 9,
                            background: `${accent}18`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon style={{ width: 15, height: 15, color: accent }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 30, fontWeight: 700, color: "#111111", lineHeight: 1 }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom two panels */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="lg:grid-cols-2 grid-cols-1">

                  {/* Recent Reports */}
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: 16,
                      padding: "22px 24px",
                      boxShadow: "0 2px 12px rgba(17,17,17,0.06)",
                      gridColumn: "span 1",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#111111" }}>Recent Reports</span>
                      <span style={{ fontSize: 11, color: "#8A8FA8" }}>{reports.slice(0, 5).length} latest</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {reports.slice(0, 5).map((r) => (
                        <div
                          key={r.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "11px 14px",
                            borderRadius: 10,
                            background: "#F7F8FC",
                            border: "1.5px solid #EBEBF0",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#111111" }}>{r.location}</div>
                            <div style={{ fontSize: 11, color: "#8A8FA8", marginTop: 2 }}>
                              {r.issue_type} · {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                            </div>
                          </div>
                          <StatusBadge status={r.status} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Issue Breakdown */}
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: 16,
                      padding: "22px 24px",
                      boxShadow: "0 2px 12px rgba(17,17,17,0.06)",
                      gridColumn: "span 1",
                    }}
                  >
                    <div style={{ marginBottom: 18 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#111111" }}>Issue Breakdown</span>
                    </div>
                    {issueBreakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={issueBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {issueBreakdown.map((_, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              borderRadius: 10,
                              border: "1.5px solid #EBEBF0",
                              boxShadow: "0 4px 16px rgba(17,17,17,0.10)",
                              fontFamily: "DM Sans, sans-serif",
                              fontSize: 12,
                            }}
                          />
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: 12, fontFamily: "DM Sans, sans-serif", color: "#8A8FA8" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p style={{ fontSize: 13, color: "#8A8FA8" }}>No data yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── REPORTS TAB ──────────────────────────────────────────────── */}
            {tab === "reports" && (
              <div className="cf-fadein" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#111111" }}>Reports</div>
                  <div style={{ fontSize: 13, color: "#8A8FA8", marginTop: 2 }}>Manage and update all submitted reports</div>
                </div>

                {/* Filters */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  {/* Search */}
                  <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                    <Search
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 14,
                        height: 14,
                        color: "#B0B3C6",
                      }}
                    />
                    <Input
                      placeholder="Search reports..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: 13,
                        background: "#ffffff",
                        border: "1.5px solid #EBEBF0",
                        borderRadius: 10,
                        paddingLeft: 36,
                        height: 38,
                        color: "#111111",
                        outline: "none",
                        boxShadow: "none",
                      }}
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: 13,
                        background: "#ffffff",
                        border: "1.5px solid #EBEBF0",
                        borderRadius: 10,
                        height: 38,
                        width: 150,
                        color: "#111111",
                      }}
                    >
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, borderRadius: 10, border: "1.5px solid #EBEBF0" }}>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: 13,
                        background: "#ffffff",
                        border: "1.5px solid #EBEBF0",
                        borderRadius: 10,
                        height: 38,
                        width: 150,
                        color: "#111111",
                      }}
                    >
                      <SelectValue placeholder="Issue Type" />
                    </SelectTrigger>
                    <SelectContent style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, borderRadius: 10, border: "1.5px solid #EBEBF0" }}>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Electricity">Electricity</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="Internet">Internet</SelectItem>
                      <SelectItem value="Plumbing">Plumbing</SelectItem>
                      <SelectItem value="Furniture">Furniture</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 2px 12px rgba(17,17,17,0.06)",
                    border: "1.5px solid #EBEBF0",
                  }}
                >
                  <div style={{ overflowX: "auto" }}>
                    <Table>
                      <TableHeader>
                        <TableRow style={{ borderBottom: "1.5px solid #EBEBF0", background: "#F7F8FC" }}>
                          {["ID", "Location", "Issue Type", "Reported By", "Date", "Status", ""].map((h, i) => (
                            <TableHead
                              key={i}
                              style={{
                                fontFamily: "DM Sans, sans-serif",
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#8A8FA8",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                padding: "13px 16px",
                              }}
                              className={
                                h === "Issue Type" ? "hidden md:table-cell" :
                                  h === "Reported By" ? "hidden lg:table-cell" :
                                    h === "Date" ? "hidden md:table-cell" : ""
                              }
                            >
                              {h}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReports.map((report) => (
                          <TableRow
                            key={report.id}
                            className="cf-table-row"
                            style={{ borderBottom: "1.5px solid #F2F3F7" }}
                          >
                            <TableCell style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "#8A8FA8", padding: "14px 16px" }}>
                              {report.id}
                            </TableCell>
                            <TableCell style={{ fontSize: 13, fontWeight: 600, color: "#111111", padding: "14px 16px" }}>
                              {report.location}
                            </TableCell>
                            <TableCell className="hidden md:table-cell" style={{ fontSize: 13, color: "#8A8FA8", padding: "14px 16px" }}>
                              {report.issue_type}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell" style={{ fontSize: 13, color: "#8A8FA8", padding: "14px 16px" }}>
                              {report.reporter_name || "Anonymous"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell" style={{ fontSize: 12, color: "#B0B3C6", padding: "14px 16px" }}>
                              {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                            </TableCell>
                            <TableCell style={{ padding: "14px 16px" }}>
                              <StatusBadge status={report.status} />
                            </TableCell>
                            <TableCell style={{ padding: "14px 16px", textAlign: "right" }}>
                              <button
                                className="cf-btn-sm"
                                onClick={() => { setSelectedReport(report); setDrawerOpen(true) }}
                              >
                                Manage
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredReports.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              style={{
                                textAlign: "center",
                                padding: "48px 16px",
                                fontSize: 13,
                                color: "#B0B3C6",
                                fontFamily: "DM Sans, sans-serif",
                              }}
                            >
                              No reports found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <ReportDrawer
                  report={selectedReport}
                  open={drawerOpen}
                  onOpenChange={setDrawerOpen}
                  onStatusChange={handleStatusChange}
                  onNotify={handleNotify}
                />
              </div>
            )}

            {/* ── LOCATIONS TAB ────────────────────────────────────────────── */}
            {tab === "locations" && (
              <div className="cf-fadein" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#111111" }}>Locations</div>
                  <div style={{ fontSize: 13, color: "#8A8FA8", marginTop: 2 }}>Manage campus locations and their QR codes</div>
                </div>

                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 2px 12px rgba(17,17,17,0.06)",
                    border: "1.5px solid #EBEBF0",
                  }}
                >
                  <div style={{ overflowX: "auto" }}>
                    <Table>
                      <TableHeader>
                        <TableRow style={{ borderBottom: "1.5px solid #EBEBF0", background: "#F7F8FC" }}>
                          {["Location", "Building", "URL", "QR Code"].map((h, i) => (
                            <TableHead
                              key={i}
                              style={{
                                fontFamily: "DM Sans, sans-serif",
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#8A8FA8",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                padding: "13px 16px",
                                textAlign: h === "QR Code" ? "right" : "left",
                              }}
                              className={h === "URL" ? "hidden md:table-cell" : ""}
                            >
                              {h}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {locations.map((loc) => (
                          <TableRow
                            key={loc.id}
                            className="cf-table-row"
                            style={{ borderBottom: "1.5px solid #F2F3F7" }}
                          >
                            <TableCell style={{ fontSize: 13, fontWeight: 600, color: "#111111", padding: "14px 16px" }}>
                              {loc.name}
                            </TableCell>
                            <TableCell style={{ fontSize: 13, color: "#8A8FA8", padding: "14px 16px" }}>
                              {loc.building}
                            </TableCell>
                            <TableCell className="hidden md:table-cell" style={{ fontSize: 12, color: "#B0B3C6", padding: "14px 16px" }}>
                              {loc.qr_url}
                            </TableCell>
                            <TableCell style={{ padding: "14px 16px", textAlign: "right" }}>
                              <button
                                className="cf-btn-sm"
                                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                                onClick={() => setQrModal({ open: true, name: loc.name, url: loc.qr_url })}
                              >
                                <QrCode style={{ width: 12, height: 12 }} />
                                View QR
                              </button>
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
            )}
          </div>
        </main>

        {/* ── Mobile Bottom Nav ─────────────────────────────────────────────── */}
        <nav
          className="fixed bottom-0 left-0 right-0 md:hidden"
          style={{
            display: "flex",
            borderTop: "1.5px solid #EBEBF0",
            background: "#ffffff",
          }}
        >
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`cf-mobile-nav-btn ${tab === key ? "active" : ""}`}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "12px 0",
                fontSize: 11,
                fontWeight: 500,
                color: tab === key ? "#111111" : "#B0B3C6",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              <Icon style={{ width: 18, height: 18 }} />
              {label}
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}