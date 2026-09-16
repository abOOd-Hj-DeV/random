import { useState } from "react";
import {
  LayoutDashboard, Building2, BedDouble, Users, CalendarDays,
  DollarSign, Wrench, ClipboardCheck, Receipt, History,
  ChevronLeft, ChevronRight, Plus, X, Search,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Edit2, Menu, Bell, FileText, Clock, RefreshCw,
} from "lucide-react";
import { addDays, format, differenceInDays, parseISO, subDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Page =
  | "dashboard" | "properties" | "calendar" | "guests"
  | "reservations" | "rates" | "maintenance" | "housekeeping"
  | "billing" | "audit";

type ResStatus = "pending" | "confirmed" | "checked-in" | "checked-out" | "cancelled";
type RoomStatus = "available" | "occupied" | "maintenance" | "cleaning";

interface Property { id: string; name: string; address: string; city: string; type: string; totalRooms: number; }
interface Room { id: string; propertyId: string; number: string; type: string; floor: number; capacity: number; status: RoomStatus; }
interface Guest { id: string; name: string; email: string; phone: string; idType: string; idNumber: string; nationality: string; createdAt: string; }
interface Reservation {
  id: string; roomId: string; guestId: string; checkIn: string; checkOut: string;
  status: ResStatus; rateAtBooking: number; totalAmount: number; notes: string; createdAt: string;
}
interface Rate {
  id: string; propertyId: string; roomType: string; name: string; pricePerNight: number;
  effectiveFrom: string; effectiveTo: string; createdAt: string; createdBy: string; isActive: boolean;
}
interface RateAuditEntry {
  id: string; rateId: string; propertyId: string; roomType: string;
  oldPrice: number; newPrice: number; changedAt: string; changedBy: string; reason: string;
}

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const PROPERTIES: Property[] = [
  { id: "p1", name: "Grand Hotel Downtown", address: "123 Main Street", city: "New York, NY", type: "Hotel", totalRooms: 8 },
  { id: "p2", name: "Sunset Apartments", address: "456 Ocean Boulevard", city: "Miami, FL", type: "Apartment", totalRooms: 6 },
];

const ALL_ROOMS: Room[] = [
  { id: "r1", propertyId: "p1", number: "101", type: "Standard", floor: 1, capacity: 2, status: "occupied" },
  { id: "r2", propertyId: "p1", number: "102", type: "Standard", floor: 1, capacity: 2, status: "available" },
  { id: "r3", propertyId: "p1", number: "201", type: "Deluxe", floor: 2, capacity: 2, status: "occupied" },
  { id: "r4", propertyId: "p1", number: "202", type: "Deluxe", floor: 2, capacity: 3, status: "maintenance" },
  { id: "r5", propertyId: "p1", number: "301", type: "Suite", floor: 3, capacity: 4, status: "occupied" },
  { id: "r6", propertyId: "p1", number: "302", type: "Suite", floor: 3, capacity: 4, status: "available" },
  { id: "r7", propertyId: "p1", number: "401", type: "Penthouse", floor: 4, capacity: 6, status: "available" },
  { id: "r8", propertyId: "p1", number: "402", type: "Penthouse", floor: 4, capacity: 6, status: "cleaning" },
  { id: "r9",  propertyId: "p2", number: "A101", type: "Studio",      floor: 1, capacity: 2, status: "occupied" },
  { id: "r10", propertyId: "p2", number: "A102", type: "Studio",      floor: 1, capacity: 2, status: "available" },
  { id: "r11", propertyId: "p2", number: "B101", type: "One Bedroom", floor: 1, capacity: 3, status: "occupied" },
  { id: "r12", propertyId: "p2", number: "B102", type: "One Bedroom", floor: 1, capacity: 3, status: "available" },
  { id: "r13", propertyId: "p2", number: "C201", type: "Two Bedroom", floor: 2, capacity: 4, status: "maintenance" },
  { id: "r14", propertyId: "p2", number: "C202", type: "Two Bedroom", floor: 2, capacity: 4, status: "available" },
];

const INIT_GUESTS: Guest[] = [
  { id: "g1", name: "James Harrison",  email: "j.harrison@email.com",  phone: "+1 212 555 0101", idType: "Passport",       idNumber: "US1234567",   nationality: "American",  createdAt: "2025-03-15" },
  { id: "g2", name: "Sofia Andersson", email: "sofia.a@email.com",     phone: "+46 8 555 0142",  idType: "National ID",    idNumber: "SE9876543",   nationality: "Swedish",   createdAt: "2025-04-20" },
  { id: "g3", name: "Marcus Chen",     email: "m.chen@email.com",      phone: "+1 415 555 0189", idType: "Passport",       idNumber: "US7654321",   nationality: "American",  createdAt: "2025-05-08" },
  { id: "g4", name: "Amelia Rossi",    email: "a.rossi@email.com",     phone: "+39 02 555 0175", idType: "National ID",    idNumber: "IT1234567",   nationality: "Italian",   createdAt: "2025-06-12" },
  { id: "g5", name: "David Park",      email: "d.park@email.com",      phone: "+1 310 555 0231", idType: "Driver License", idNumber: "CA-D1234567", nationality: "American",  createdAt: "2025-07-01" },
  { id: "g6", name: "Yuki Tanaka",     email: "y.tanaka@email.com",    phone: "+81 3 555 0199",  idType: "Passport",       idNumber: "JP8765432",   nationality: "Japanese",  createdAt: "2025-08-22" },
  { id: "g7", name: "Emma Williams",   email: "e.williams@email.com",  phone: "+44 20 555 0156", idType: "National ID",    idNumber: "GB5432198",   nationality: "British",   createdAt: "2025-09-14" },
  { id: "g8", name: "Carlos Mendez",   email: "c.mendez@email.com",    phone: "+34 91 555 0178", idType: "Passport",       idNumber: "ES2345678",   nationality: "Spanish",   createdAt: "2025-10-03" },
];

const INIT_RESERVATIONS: Reservation[] = [
  { id: "res1",  roomId: "r1",  guestId: "g1", checkIn: "2026-06-22", checkOut: "2026-06-28", status: "checked-in",  rateAtBooking: 150, totalAmount: 900,  notes: "VIP guest",        createdAt: "2026-05-15" },
  { id: "res2",  roomId: "r1",  guestId: "g3", checkIn: "2026-07-01", checkOut: "2026-07-06", status: "confirmed",   rateAtBooking: 150, totalAmount: 750,  notes: "",                 createdAt: "2026-06-01" },
  { id: "res3",  roomId: "r2",  guestId: "g2", checkIn: "2026-06-27", checkOut: "2026-07-03", status: "confirmed",   rateAtBooking: 150, totalAmount: 900,  notes: "",                 createdAt: "2026-06-10" },
  { id: "res4",  roomId: "r3",  guestId: "g4", checkIn: "2026-06-23", checkOut: "2026-06-26", status: "checked-out", rateAtBooking: 200, totalAmount: 600,  notes: "Late checkout",    createdAt: "2026-06-05" },
  { id: "res5",  roomId: "r3",  guestId: "g5", checkIn: "2026-06-28", checkOut: "2026-07-05", status: "confirmed",   rateAtBooking: 200, totalAmount: 1400, notes: "",                 createdAt: "2026-06-12" },
  { id: "res6",  roomId: "r5",  guestId: "g6", checkIn: "2026-06-20", checkOut: "2026-06-27", status: "checked-in",  rateAtBooking: 380, totalAmount: 2660, notes: "Honeymoon suite",  createdAt: "2026-05-25" },
  { id: "res7",  roomId: "r5",  guestId: "g7", checkIn: "2026-07-02", checkOut: "2026-07-09", status: "confirmed",   rateAtBooking: 380, totalAmount: 2660, notes: "",                 createdAt: "2026-06-15" },
  { id: "res8",  roomId: "r6",  guestId: "g8", checkIn: "2026-06-29", checkOut: "2026-07-04", status: "confirmed",   rateAtBooking: 380, totalAmount: 1900, notes: "",                 createdAt: "2026-06-18" },
  { id: "res9",  roomId: "r7",  guestId: "g1", checkIn: "2026-06-18", checkOut: "2026-06-22", status: "checked-out", rateAtBooking: 650, totalAmount: 2600, notes: "",                 createdAt: "2026-05-20" },
  { id: "res10", roomId: "r9",  guestId: "g3", checkIn: "2026-06-24", checkOut: "2026-07-01", status: "checked-in",  rateAtBooking: 120, totalAmount: 840,  notes: "",                 createdAt: "2026-06-10" },
  { id: "res11", roomId: "r11", guestId: "g4", checkIn: "2026-06-25", checkOut: "2026-06-30", status: "checked-in",  rateAtBooking: 180, totalAmount: 900,  notes: "",                 createdAt: "2026-06-01" },
  { id: "res12", roomId: "r11", guestId: "g6", checkIn: "2026-07-05", checkOut: "2026-07-12", status: "confirmed",   rateAtBooking: 180, totalAmount: 1260, notes: "",                 createdAt: "2026-06-20" },
];

const INIT_RATES: Rate[] = [
  { id: "rt1",  propertyId: "p1", roomType: "Standard",    name: "Standard Summer Rate",   pricePerNight: 150, effectiveFrom: "2026-06-01", effectiveTo: "2026-08-31", createdAt: "2026-05-15", createdBy: "Admin",   isActive: true  },
  { id: "rt2",  propertyId: "p1", roomType: "Standard",    name: "Standard Base Rate",     pricePerNight: 120, effectiveFrom: "2026-01-01", effectiveTo: "2026-05-31", createdAt: "2025-12-10", createdBy: "Admin",   isActive: false },
  { id: "rt3",  propertyId: "p1", roomType: "Deluxe",      name: "Deluxe Summer Rate",     pricePerNight: 200, effectiveFrom: "2026-06-01", effectiveTo: "2026-08-31", createdAt: "2026-05-15", createdBy: "Admin",   isActive: true  },
  { id: "rt4",  propertyId: "p1", roomType: "Deluxe",      name: "Deluxe Base Rate",       pricePerNight: 170, effectiveFrom: "2026-01-01", effectiveTo: "2026-05-31", createdAt: "2025-12-10", createdBy: "Admin",   isActive: false },
  { id: "rt5",  propertyId: "p1", roomType: "Suite",       name: "Suite Peak Rate",        pricePerNight: 380, effectiveFrom: "2026-06-01", effectiveTo: "2026-08-31", createdAt: "2026-05-15", createdBy: "Admin",   isActive: true  },
  { id: "rt6",  propertyId: "p1", roomType: "Suite",       name: "Suite Standard Rate",    pricePerNight: 320, effectiveFrom: "2026-01-01", effectiveTo: "2026-05-31", createdAt: "2025-12-10", createdBy: "Admin",   isActive: false },
  { id: "rt7",  propertyId: "p1", roomType: "Penthouse",   name: "Penthouse Summer Rate",  pricePerNight: 650, effectiveFrom: "2026-06-01", effectiveTo: "2026-08-31", createdAt: "2026-05-15", createdBy: "Admin",   isActive: true  },
  { id: "rt8",  propertyId: "p2", roomType: "Studio",      name: "Studio Annual Rate",     pricePerNight: 120, effectiveFrom: "2026-01-01", effectiveTo: "2026-12-31", createdAt: "2025-12-01", createdBy: "Admin",   isActive: true  },
  { id: "rt9",  propertyId: "p2", roomType: "One Bedroom", name: "One Bed Annual Rate",    pricePerNight: 180, effectiveFrom: "2026-01-01", effectiveTo: "2026-12-31", createdAt: "2025-12-01", createdBy: "Admin",   isActive: true  },
  { id: "rt10", propertyId: "p2", roomType: "Two Bedroom", name: "Two Bed Annual Rate",    pricePerNight: 260, effectiveFrom: "2026-01-01", effectiveTo: "2026-12-31", createdAt: "2025-12-01", createdBy: "Manager", isActive: true  },
];

const INIT_RATE_AUDIT: RateAuditEntry[] = [
  { id: "ra1", rateId: "rt1",  propertyId: "p1", roomType: "Standard",  oldPrice: 120, newPrice: 150, changedAt: "2026-05-15T10:30:00", changedBy: "Admin",   reason: "Peak summer season — 25% increase per revenue strategy" },
  { id: "ra2", rateId: "rt3",  propertyId: "p1", roomType: "Deluxe",    oldPrice: 170, newPrice: 200, changedAt: "2026-05-15T10:31:00", changedBy: "Admin",   reason: "Peak summer season — aligned with market survey" },
  { id: "ra3", rateId: "rt5",  propertyId: "p1", roomType: "Suite",     oldPrice: 320, newPrice: 380, changedAt: "2026-05-15T10:32:00", changedBy: "Admin",   reason: "Peak summer season adjustment" },
  { id: "ra4", rateId: "rt7",  propertyId: "p1", roomType: "Penthouse", oldPrice: 550, newPrice: 650, changedAt: "2026-05-15T10:33:00", changedBy: "Admin",   reason: "High demand — penthouse premium increase for summer" },
  { id: "ra5", rateId: "rt8",  propertyId: "p2", roomType: "Studio",    oldPrice: 110, newPrice: 120, changedAt: "2026-03-01T09:00:00", changedBy: "Manager", reason: "Annual CPI adjustment" },
  { id: "ra6", rateId: "rt9",  propertyId: "p2", roomType: "One Bedroom", oldPrice: 165, newPrice: 180, changedAt: "2026-03-01T09:05:00", changedBy: "Manager", reason: "Annual CPI adjustment + amenity upgrades" },
];

// ─── CONSTANTS & HELPERS ─────────────────────────────────────────────────────

const TODAY_STR = "2026-06-25";
const GANTT_DAYS = 42;
const DAY_PX = 40;

function isSimToday(date: Date) { return format(date, "yyyy-MM-dd") === TODAY_STR; }

const RS: Record<ResStatus, { bg: string; text: string; dot: string; bar: string }> = {
  "checked-in":  { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500", bar: "#10b981" },
  confirmed:     { bg: "bg-blue-100",    text: "text-blue-800",    dot: "bg-blue-500",    bar: "#3b82f6" },
  pending:       { bg: "bg-amber-100",   text: "text-amber-800",   dot: "bg-amber-500",   bar: "#f59e0b" },
  "checked-out": { bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400",   bar: "#94a3b8" },
  cancelled:     { bg: "bg-red-100",     text: "text-red-800",     dot: "bg-red-400",     bar: "#f87171" },
};

const ROOM_ST: Record<RoomStatus, { bg: string; text: string }> = {
  available:   { bg: "bg-emerald-100", text: "text-emerald-700" },
  occupied:    { bg: "bg-blue-100",    text: "text-blue-700" },
  maintenance: { bg: "bg-red-100",     text: "text-red-700" },
  cleaning:    { bg: "bg-amber-100",   text: "text-amber-700" },
};

function cx(...args: (string | boolean | null | undefined)[]) {
  return args.filter(Boolean).join(" ");
}

function fmt$(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function ucFirst(s: string) {
  return s.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase());
}

// ─── UI ATOMS ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ResStatus }) {
  const s = RS[status];
  return (
    <span className={cx("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", s.bg, s.text)}>
      <span className={cx("w-1.5 h-1.5 rounded-full flex-shrink-0", s.dot)} />
      {ucFirst(status)}
    </span>
  );
}

function RoomBadge({ status }: { status: RoomStatus }) {
  const s = ROOM_ST[status];
  return (
    <span className={cx("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium", s.bg, s.text)}>
      {ucFirst(status)}
    </span>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cx("relative bg-white rounded-xl shadow-2xl w-full max-h-[90vh] overflow-y-auto", wide ? "max-w-lg" : "max-w-md")}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white z-10">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const iCls = "w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground";
const sCls = "w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground";

function Btn({
  variant = "primary", onClick, children, type = "button", disabled, className,
}: {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  onClick?: () => void; children: React.ReactNode; type?: "button" | "submit";
  disabled?: boolean; className?: string;
}) {
  const base = "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer";
  const v = {
    primary:   "bg-primary text-white hover:bg-primary/90",
    secondary: "bg-white text-foreground border border-border hover:bg-muted",
    ghost:     "text-muted-foreground hover:bg-muted hover:text-foreground",
    danger:    "bg-red-500 text-white hover:bg-red-600",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cx(base, v[variant], className)}>
      {children}
    </button>
  );
}

function KpiCard({ label, value, sub, trend, icon: Icon, color }: {
  label: string; value: string; sub?: string; trend?: number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground leading-none" style={{ fontFamily: "'DM Mono', monospace" }}>{value}</p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={cx("p-2.5 rounded-lg flex-shrink-0", color)}>
          <Icon size={17} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {trend >= 0
            ? <TrendingUp size={11} className="text-emerald-600" />
            : <TrendingDown size={11} className="text-red-500" />}
          <span className={trend >= 0 ? "text-emerald-600" : "text-red-500"}>
            {Math.abs(trend)}% vs last month
          </span>
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

function DashboardPage({ reservations, guests, rates, onNavigate }: {
  reservations: Reservation[]; guests: Guest[]; rates: Rate[];
  onNavigate: (p: Page) => void;
}) {
  const rooms = ALL_ROOMS;
  const occupied = rooms.filter(r => r.status === "occupied").length;
  const available = rooms.filter(r => r.status === "available").length;
  const maintenance = rooms.filter(r => r.status === "maintenance").length;
  const occupancy = Math.round((occupied / rooms.length) * 100);
  const active = reservations.filter(r => r.status === "checked-in");
  const checkInsToday = reservations.filter(r => r.checkIn === TODAY_STR && (r.status === "confirmed" || r.status === "checked-in")).length;
  const monthRevenue = reservations.filter(r => r.checkIn.startsWith("2026-06") && r.status !== "cancelled").reduce((s, r) => s + r.totalAmount, 0);

  const chartData = PROPERTIES.map(p => {
    const pr = rooms.filter(r => r.propertyId === p.id);
    return { name: p.name.split(" ").slice(0, 2).join(" "), occupancy: Math.round((pr.filter(r => r.status === "occupied").length / pr.length) * 100) };
  });

  const upcoming = reservations.filter(r => r.checkIn >= TODAY_STR && r.status === "confirmed").slice(0, 6);
  const activeStays = active.slice(0, 6);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Occupancy" value={`${occupancy}%`} sub={`${occupied} of ${rooms.length} rooms`} trend={4} icon={TrendingUp} color="bg-blue-50 text-blue-600" />
        <KpiCard label="Active Guests" value={`${active.length}`} sub="Currently checked in" icon={Users} color="bg-emerald-50 text-emerald-600" />
        <KpiCard label="Available" value={`${available}`} sub="Ready for booking" icon={BedDouble} color="bg-violet-50 text-violet-600" />
        <KpiCard label="June Revenue" value={fmt$(monthRevenue)} sub="Month to date" trend={12} icon={DollarSign} color="bg-amber-50 text-amber-600" />
        <KpiCard label="Check-ins Today" value={`${checkInsToday}`} sub="Arrivals expected" icon={CheckCircle2} color="bg-sky-50 text-sky-600" />
        <KpiCard label="Maintenance" value={`${maintenance}`} sub="Rooms out of service" icon={AlertTriangle} color="bg-red-50 text-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Occupancy by Property</h3>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} domain={[0, 100]} unit="%" />
              <Tooltip formatter={(v) => [`${v}%`, "Occupancy"]} contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="occupancy" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={i === 0 ? "#3b82f6" : "#10b981"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Active Stays</h3>
            <button onClick={() => onNavigate("reservations")} className="text-xs text-primary hover:underline">View all</button>
          </div>
          <div className="space-y-0 divide-y divide-border">
            {activeStays.map(res => {
              const guest = guests.find(g => g.id === res.guestId);
              const room = ALL_ROOMS.find(r => r.id === res.roomId);
              const prop = PROPERTIES.find(p => p.id === room?.propertyId);
              return (
                <div key={res.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                      {initials(guest?.name || "?")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{guest?.name}</p>
                      <p className="text-xs text-muted-foreground">{prop?.name.split(" ").slice(0, 2).join(" ")} · Rm {room?.number}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs text-muted-foreground">Out: {res.checkOut}</p>
                    <p className="text-xs font-semibold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{fmt$(res.rateAtBooking)}/nt</p>
                  </div>
                </div>
              );
            })}
            {activeStays.length === 0 && <p className="text-sm text-muted-foreground py-4">No active stays</p>}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Upcoming Arrivals</h3>
            <button onClick={() => onNavigate("calendar")} className="text-xs text-primary hover:underline">Calendar</button>
          </div>
          <div className="divide-y divide-border">
            {upcoming.map(res => {
              const guest = guests.find(g => g.id === res.guestId);
              const room = ALL_ROOMS.find(r => r.id === res.roomId);
              return (
                <div key={res.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{guest?.name}</p>
                    <p className="text-xs text-muted-foreground">Room {room?.number} · {room?.type}</p>
                  </div>
                  <div className="flex-shrink-0 ml-2 text-right">
                    <p className="text-xs text-muted-foreground">{res.checkIn}</p>
                    <StatusBadge status={res.status} />
                  </div>
                </div>
              );
            })}
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground py-4">No upcoming arrivals</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CALENDAR / GANTT ────────────────────────────────────────────────────────

function NewReservationModal({ roomId, checkIn, guests, rates, onClose, onSave, onAddGuest }: {
  roomId: string; checkIn: string; guests: Guest[]; rates: Rate[];
  onClose: () => void;
  onSave: (res: Omit<Reservation, "id">) => void;
  onAddGuest: (g: Omit<Guest, "id" | "createdAt">) => string;
}) {
  const room = ALL_ROOMS.find(r => r.id === roomId)!;
  const prop = PROPERTIES.find(p => p.id === room.propertyId)!;
  const currentRate = rates.find(r =>
    r.propertyId === room.propertyId && r.roomType === room.type &&
    r.effectiveFrom <= checkIn && r.effectiveTo >= checkIn
  );
  const [guestId, setGuestId] = useState(guests[0]?.id || "");
  const [checkOut, setCheckOut] = useState("");
  const [notes, setNotes] = useState("");
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestForm, setGuestForm] = useState({ name: "", email: "", phone: "", idType: "Passport", idNumber: "", nationality: "" });

  const nights = checkOut ? Math.max(0, differenceInDays(parseISO(checkOut), parseISO(checkIn))) : 0;
  const price = currentRate?.pricePerNight || 0;
  const total = nights * price;

  function handleSaveGuest() {
    if (!guestForm.name) return;
    const id = onAddGuest(guestForm);
    setGuestId(id);
    setShowGuestForm(false);
    setGuestForm({ name: "", email: "", phone: "", idType: "Passport", idNumber: "", nationality: "" });
  }

  const allGuests = guests; // will include newly added

  return (
    <Modal title="New Reservation" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-slate-50 border border-border rounded-lg p-3 text-sm">
          <p className="font-semibold text-foreground">{prop.name}</p>
          <p className="text-muted-foreground text-xs mt-0.5">Room {room.number} · {room.type} · up to {room.capacity} guests · Check-in: <span className="font-medium text-foreground">{checkIn}</span></p>
        </div>

        <Field label="Guest">
          <div className="flex gap-2">
            <select className={sCls} value={guestId} onChange={e => setGuestId(e.target.value)}>
              {allGuests.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <button
              className="px-3 py-2 rounded-lg border border-dashed border-primary text-primary text-xs font-medium hover:bg-primary/5 whitespace-nowrap transition-colors"
              onClick={() => setShowGuestForm(v => !v)}
            >
              <Plus size={12} className="inline mr-1" />New
            </button>
          </div>
        </Field>

        {showGuestForm && (
          <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Add Guest</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Name"><input className={iCls} placeholder="Full name" value={guestForm.name} onChange={e => setGuestForm(f => ({ ...f, name: e.target.value }))} /></Field>
              <Field label="Nationality"><input className={iCls} placeholder="American" value={guestForm.nationality} onChange={e => setGuestForm(f => ({ ...f, nationality: e.target.value }))} /></Field>
              <Field label="Email"><input className={iCls} type="email" placeholder="email@domain.com" value={guestForm.email} onChange={e => setGuestForm(f => ({ ...f, email: e.target.value }))} /></Field>
              <Field label="Phone"><input className={iCls} placeholder="+1 555 0100" value={guestForm.phone} onChange={e => setGuestForm(f => ({ ...f, phone: e.target.value }))} /></Field>
              <Field label="ID Type">
                <select className={sCls} value={guestForm.idType} onChange={e => setGuestForm(f => ({ ...f, idType: e.target.value }))}>
                  <option>Passport</option><option>National ID</option><option>Driver License</option>
                </select>
              </Field>
              <Field label="ID Number"><input className={iCls} placeholder="AB1234567" value={guestForm.idNumber} onChange={e => setGuestForm(f => ({ ...f, idNumber: e.target.value }))} /></Field>
            </div>
            <div className="flex gap-2">
              <Btn variant="secondary" onClick={() => setShowGuestForm(false)}>Cancel</Btn>
              <Btn onClick={handleSaveGuest} disabled={!guestForm.name} className="flex-1 justify-center">Save Guest</Btn>
            </div>
          </div>
        )}

        <Field label="Check-out Date">
          <input className={iCls} type="date" value={checkOut} min={addDays(parseISO(checkIn), 1).toISOString().slice(0, 10)} onChange={e => setCheckOut(e.target.value)} />
        </Field>

        {currentRate ? (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
            <DollarSign size={14} className="text-blue-600 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-blue-900">{fmt$(currentRate.pricePerNight)}/night</span>
              <span className="text-blue-600 ml-1.5">— {currentRate.name} (locked at booking)</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            No active rate found for {room.type} on {checkIn}. Please set up a rate first.
          </div>
        )}

        {nights > 0 && (
          <div className="flex justify-between items-center py-2 border-t border-border">
            <span className="text-sm text-muted-foreground">{nights} night{nights > 1 ? "s" : ""} × {fmt$(price)}</span>
            <span className="text-base font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{fmt$(total)}</span>
          </div>
        )}

        <Field label="Notes (optional)">
          <input className={iCls} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special requests, preferences..." />
        </Field>

        <div className="flex gap-2 pt-1">
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn
            className="flex-1 justify-center"
            disabled={!checkOut || !guestId || nights <= 0 || !currentRate}
            onClick={() => onSave({ roomId, guestId, checkIn, checkOut, status: "confirmed", rateAtBooking: price, totalAmount: total, notes, createdAt: TODAY_STR })}
          >
            Confirm Reservation
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function CalendarPage({ reservations, guests, rates, selectedPropertyId, setSelectedPropertyId, onAddReservation, onAddGuest }: {
  reservations: Reservation[]; guests: Guest[]; rates: Rate[];
  selectedPropertyId: string; setSelectedPropertyId: (id: string) => void;
  onAddReservation: (res: Omit<Reservation, "id">) => void;
  onAddGuest: (g: Omit<Guest, "id" | "createdAt">) => string;
}) {
  const [offset, setOffset] = useState(0);
  const [newRes, setNewRes] = useState<{ roomId: string; checkIn: string } | null>(null);

  const ganttStart = subDays(new Date(2026, 5, 18), -offset);
  const dates = Array.from({ length: GANTT_DAYS }, (_, i) => addDays(ganttStart, i));
  const propRooms = ALL_ROOMS.filter(r => r.propertyId === selectedPropertyId);

  function getBarPos(res: Reservation) {
    const ci = parseISO(res.checkIn);
    const co = parseISO(res.checkOut);
    const s = Math.max(0, differenceInDays(ci, ganttStart));
    const e = Math.min(GANTT_DAYS, differenceInDays(co, ganttStart));
    return { left: s * DAY_PX, width: (e - s) * DAY_PX - 2, visible: e > s };
  }

  function handleCellClick(roomId: string, date: Date) {
    const ds = format(date, "yyyy-MM-dd");
    const booked = reservations.some(r => r.roomId === roomId && r.status !== "cancelled" && ds >= r.checkIn && ds < r.checkOut);
    if (!booked) setNewRes({ roomId, checkIn: ds });
  }

  const legendItems = Object.entries(RS) as [ResStatus, typeof RS[ResStatus]][];
  const totalW = 180 + GANTT_DAYS * DAY_PX;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-3 flex-wrap shrink-0 bg-background">
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-muted-foreground flex-shrink-0" />
          <select className={cx(sCls, "w-60")} value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)}>
            {PROPERTIES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-muted-foreground px-2">{format(ganttStart, "MMM d")} — {format(addDays(ganttStart, GANTT_DAYS - 1), "MMM d, yyyy")}</span>
          <button onClick={() => setOffset(o => o - 14)} className="p-1.5 rounded border border-border hover:bg-muted transition-colors"><ChevronLeft size={13} /></button>
          <button onClick={() => setOffset(0)} className="px-2.5 py-1.5 rounded border border-border text-xs font-medium hover:bg-muted transition-colors">Today</button>
          <button onClick={() => setOffset(o => o + 14)} className="p-1.5 rounded border border-border hover:bg-muted transition-colors"><ChevronRight size={13} /></button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {legendItems.map(([status, s]) => (
            <span key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.bar }} />
              {ucFirst(status)}
            </span>
          ))}
        </div>
      </div>

      {/* Gantt */}
      <div className="flex-1 overflow-auto min-h-0 bg-white">
        <div style={{ minWidth: totalW }}>
          {/* Sticky header row */}
          <div className="flex sticky top-0 z-20 border-b border-border bg-slate-50">
            <div className="flex-shrink-0 sticky left-0 z-30 bg-slate-50 border-r border-border" style={{ width: 180 }}>
              <div className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Room</div>
            </div>
            <div className="flex flex-shrink-0">
              {dates.map((date, i) => {
                const today = isSimToday(date);
                const weekend = [0, 6].includes(date.getDay());
                return (
                  <div
                    key={i}
                    className={cx("text-center border-r border-border/60 py-1.5 flex-shrink-0", today ? "bg-primary/10" : weekend ? "bg-slate-100/80" : "")}
                    style={{ width: DAY_PX }}
                  >
                    <div className="text-[10px] text-muted-foreground leading-none">{format(date, "EEE")}</div>
                    <div className={cx("text-xs font-bold mt-0.5 leading-none", today ? "text-primary" : "text-foreground")}>{format(date, "d")}</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5 leading-none">{format(date, "MMM")}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Room rows */}
          {propRooms.length === 0 ? (
            <div className="py-20 text-center text-sm text-muted-foreground">No rooms for this property.</div>
          ) : propRooms.map(room => {
            const roomRes = reservations.filter(r => {
              if (r.roomId !== room.id) return false;
              const ci = parseISO(r.checkIn); const co = parseISO(r.checkOut);
              return co > ganttStart && ci < addDays(ganttStart, GANTT_DAYS);
            });
            return (
              <div key={room.id} className="flex border-b border-border hover:bg-blue-50/20 transition-colors group" style={{ height: 52 }}>
                {/* Sticky label */}
                <div
                  className="flex-shrink-0 sticky left-0 z-10 bg-white group-hover:bg-blue-50/20 border-r border-border px-4 flex flex-col justify-center"
                  style={{ width: 180 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">Rm {room.number}</span>
                    <RoomBadge status={room.status} />
                  </div>
                  <span className="text-xs text-muted-foreground mt-0.5">{room.type} · {room.capacity} pax</span>
                </div>

                {/* Day grid */}
                <div className="relative flex-shrink-0" style={{ width: GANTT_DAYS * DAY_PX, height: 52 }}>
                  {/* Day cell backgrounds */}
                  <div className="absolute inset-0 flex">
                    {dates.map((date, i) => {
                      const today = isSimToday(date);
                      const weekend = [0, 6].includes(date.getDay());
                      return (
                        <div
                          key={i}
                          className={cx("h-full border-r border-border/40 cursor-pointer transition-colors hover:bg-blue-100/30", today ? "bg-primary/5" : weekend ? "bg-slate-50" : "")}
                          style={{ width: DAY_PX }}
                          onClick={() => handleCellClick(room.id, date)}
                        />
                      );
                    })}
                  </div>

                  {/* Reservation bars */}
                  {roomRes.map(res => {
                    const { left, width, visible } = getBarPos(res);
                    if (!visible) return null;
                    const guest = guests.find(g => g.id === res.guestId);
                    return (
                      <div
                        key={res.id}
                        className="absolute top-2 bottom-2 rounded-md flex items-center px-2.5 overflow-hidden shadow-sm cursor-pointer"
                        style={{ left: left + 1, width: Math.max(width, 4), backgroundColor: RS[res.status].bar + "e0" }}
                        title={`${guest?.name} | ${res.checkIn} → ${res.checkOut} | ${fmt$(res.rateAtBooking)}/night (locked)`}
                      >
                        <span className="text-white text-[11px] font-semibold truncate leading-none drop-shadow-sm">{guest?.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {newRes && (
        <NewReservationModal
          roomId={newRes.roomId}
          checkIn={newRes.checkIn}
          guests={guests}
          rates={rates}
          onClose={() => setNewRes(null)}
          onAddGuest={onAddGuest}
          onSave={res => { onAddReservation(res); setNewRes(null); }}
        />
      )}
    </div>
  );
}

// ─── GUESTS ───────────────────────────────────────────────────────────────────

function AddGuestModal({ onClose, onSave }: {
  onClose: () => void; onSave: (g: Omit<Guest, "id" | "createdAt">) => void;
}) {
  const [f, setF] = useState({ name: "", email: "", phone: "", idType: "Passport", idNumber: "", nationality: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF(p => ({ ...p, [k]: e.target.value }));
  return (
    <Modal title="Add New Guest" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Full Name"><input className={iCls} placeholder="Full name" value={f.name} onChange={set("name")} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email"><input className={iCls} type="email" placeholder="email@domain.com" value={f.email} onChange={set("email")} /></Field>
          <Field label="Phone"><input className={iCls} placeholder="+1 555 0100" value={f.phone} onChange={set("phone")} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ID Type">
            <select className={sCls} value={f.idType} onChange={set("idType")}>
              <option>Passport</option><option>National ID</option><option>Driver License</option>
            </select>
          </Field>
          <Field label="ID Number"><input className={iCls} placeholder="AB1234567" value={f.idNumber} onChange={set("idNumber")} /></Field>
        </div>
        <Field label="Nationality"><input className={iCls} placeholder="American" value={f.nationality} onChange={set("nationality")} /></Field>
        <div className="flex gap-2 pt-2">
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn className="flex-1 justify-center" disabled={!f.name || !f.email} onClick={() => onSave(f)}>Add Guest</Btn>
        </div>
      </div>
    </Modal>
  );
}

function GuestsPage({ guests, setGuests, reservations }: {
  guests: Guest[]; setGuests: React.Dispatch<React.SetStateAction<Guest[]>>; reservations: Reservation[];
}) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);

  const filtered = guests.filter(g =>
    [g.name, g.email, g.nationality, g.phone].some(v => v.toLowerCase().includes(search.toLowerCase()))
  );

  function addGuest(g: Omit<Guest, "id" | "createdAt">) {
    setGuests(prev => [...prev, { ...g, id: `g${Date.now()}`, createdAt: TODAY_STR }]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className={cx(iCls, "pl-9 w-64")} placeholder="Search guests…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{filtered.length} guests</span>
          <Btn onClick={() => setModal(true)}><Plus size={14} />Add Guest</Btn>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {["Guest", "Contact", "ID Document", "Nationality", "Stays", "Member Since"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(guest => {
              const stays = reservations.filter(r => r.guestId === guest.id).length;
              return (
                <tr key={guest.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">{initials(guest.name)}</div>
                      <span className="font-medium text-foreground">{guest.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-foreground">{guest.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{guest.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-foreground font-mono text-xs">{guest.idNumber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{guest.idType}</p>
                  </td>
                  <td className="px-4 py-3 text-foreground">{guest.nationality}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">{stays}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{guest.createdAt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-16 text-center text-muted-foreground">No guests found.</div>}
      </div>

      {modal && <AddGuestModal onClose={() => setModal(false)} onSave={g => { addGuest(g); setModal(false); }} />}
    </div>
  );
}

// ─── RATES ────────────────────────────────────────────────────────────────────

function EditRateModal({ rate, onClose, onSave }: {
  rate: Rate; onClose: () => void; onSave: (id: string, price: number, reason: string) => void;
}) {
  const [price, setPrice] = useState(String(rate.pricePerNight));
  const [reason, setReason] = useState("");
  const diff = Number(price) - rate.pricePerNight;
  const pct = Math.round((diff / rate.pricePerNight) * 100);
  return (
    <Modal title={`Update Rate — ${rate.roomType}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
          <p className="font-semibold text-foreground">{rate.name}</p>
          <p className="text-muted-foreground">Current: <span className="font-mono font-semibold text-foreground">{fmt$(rate.pricePerNight)}</span>/night</p>
          <p className="text-xs text-amber-700 flex items-start gap-1.5 mt-1"><AlertTriangle size={11} className="mt-0.5 flex-shrink-0" />Past reservations retain their locked rate — only new bookings use the updated price.</p>
        </div>
        <Field label="New Price per Night ($)">
          <input className={iCls} type="number" min="1" value={price} onChange={e => setPrice(e.target.value)} />
        </Field>
        {Number(price) !== rate.pricePerNight && Number(price) > 0 && (
          <div className={cx("text-sm px-3 py-2 rounded-lg font-mono", diff > 0 ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200")}>
            {diff > 0 ? "+" : ""}{fmt$(diff)} ({pct > 0 ? "+" : ""}{pct}%)
          </div>
        )}
        <Field label="Reason for Change (required)">
          <input className={iCls} placeholder="e.g. Peak season adjustment, market rate update…" value={reason} onChange={e => setReason(e.target.value)} />
        </Field>
        <div className="flex gap-2 pt-1">
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn className="flex-1 justify-center" disabled={!reason || Number(price) <= 0 || Number(price) === rate.pricePerNight} onClick={() => onSave(rate.id, Number(price), reason)}>Update Price</Btn>
        </div>
      </div>
    </Modal>
  );
}

function AddRateModal({ propertyId, onClose, onSave }: {
  propertyId: string; onClose: () => void;
  onSave: (r: Omit<Rate, "id" | "createdAt" | "createdBy" | "isActive">) => void;
}) {
  const prop = PROPERTIES.find(p => p.id === propertyId)!;
  const [f, setF] = useState({ propertyId, roomType: "Standard", name: "", pricePerNight: "", effectiveFrom: TODAY_STR, effectiveTo: "2026-12-31" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF(p => ({ ...p, [k]: e.target.value }));
  return (
    <Modal title="Add Rate" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
          Property: <span className="font-semibold text-foreground">{prop.name}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Room Type">
            <select className={sCls} value={f.roomType} onChange={set("roomType")}>
              {["Standard","Deluxe","Suite","Penthouse","Studio","One Bedroom","Two Bedroom"].map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Price / Night ($)">
            <input className={iCls} type="number" min="1" placeholder="150" value={f.pricePerNight} onChange={set("pricePerNight")} />
          </Field>
        </div>
        <Field label="Rate Name"><input className={iCls} placeholder="Summer Peak Rate" value={f.name} onChange={set("name")} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Effective From"><input className={iCls} type="date" value={f.effectiveFrom} onChange={set("effectiveFrom")} /></Field>
          <Field label="Effective To"><input className={iCls} type="date" value={f.effectiveTo} onChange={set("effectiveTo")} /></Field>
        </div>
        <div className="flex gap-2 pt-1">
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn className="flex-1 justify-center" disabled={!f.name || !f.pricePerNight} onClick={() => onSave({ ...f, pricePerNight: Number(f.pricePerNight) })}>Add Rate</Btn>
        </div>
      </div>
    </Modal>
  );
}

function RatesPage({ rates, setRates, rateAudit, setRateAudit }: {
  rates: Rate[]; setRates: React.Dispatch<React.SetStateAction<Rate[]>>;
  rateAudit: RateAuditEntry[]; setRateAudit: React.Dispatch<React.SetStateAction<RateAuditEntry[]>>;
}) {
  const [propId, setPropId] = useState("p1");
  const [tab, setTab] = useState<"rates" | "audit">("rates");
  const [addModal, setAddModal] = useState(false);
  const [editRate, setEditRate] = useState<Rate | null>(null);

  const propRates = rates.filter(r => r.propertyId === propId).sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0) || a.roomType.localeCompare(b.roomType));
  const propAudit = rateAudit.filter(r => r.propertyId === propId).sort((a, b) => b.changedAt.localeCompare(a.changedAt));

  function handleUpdate(rateId: string, newPrice: number, reason: string) {
    const rate = rates.find(r => r.id === rateId)!;
    setRateAudit(prev => [{
      id: `ra${Date.now()}`, rateId, propertyId: rate.propertyId, roomType: rate.roomType,
      oldPrice: rate.pricePerNight, newPrice, changedAt: new Date().toISOString(), changedBy: "Admin", reason,
    }, ...prev]);
    setRates(prev => prev.map(r => r.id === rateId ? { ...r, pricePerNight: newPrice } : r));
    setEditRate(null);
  }

  function handleAdd(r: Omit<Rate, "id" | "createdAt" | "createdBy" | "isActive">) {
    setRates(prev => [...prev, { ...r, id: `rt${Date.now()}`, createdAt: TODAY_STR, createdBy: "Admin", isActive: true }]);
    setAddModal(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-muted-foreground" />
          <select className={cx(sCls, "w-60")} value={propId} onChange={e => setPropId(e.target.value)}>
            {PROPERTIES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden ml-auto">
          {(["rates", "audit"] as const).map(t => (
            <button key={t} className={cx("px-4 py-2 text-sm font-medium transition-colors", tab === t ? "bg-primary text-white" : "hover:bg-muted text-muted-foreground")} onClick={() => setTab(t)}>
              {t === "rates" ? "Rate List" : "Price Audit Log"}
            </button>
          ))}
        </div>
        {tab === "rates" && <Btn onClick={() => setAddModal(true)}><Plus size={14} />Add Rate</Btn>}
      </div>

      {tab === "rates" ? (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Room Type","Rate Name","Price / Night","Effective Period","Status",""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {propRates.map(rate => (
                <tr key={rate.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-semibold">{rate.roomType}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{rate.name}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-foreground">{fmt$(rate.pricePerNight)}<span className="text-xs font-sans text-muted-foreground font-normal">/nt</span></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{rate.effectiveFrom} → {rate.effectiveTo}</td>
                  <td className="px-4 py-3">
                    <span className={cx("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium", rate.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                      <span className={cx("w-1.5 h-1.5 rounded-full", rate.isActive ? "bg-emerald-500" : "bg-slate-400")} />
                      {rate.isActive ? "Active" : "Expired"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {rate.isActive && (
                      <button className="flex items-center gap-1 text-xs text-primary hover:underline font-medium" onClick={() => setEditRate(rate)}>
                        <Edit2 size={11} />Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {propRates.length === 0 && <tr><td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">No rates configured for this property.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-amber-50/60">
            <p className="text-xs text-amber-800 flex items-center gap-1.5"><AlertTriangle size={12} />Rate changes are logged here. All past reservations are protected — rates are locked at booking time and never change retroactively.</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Timestamp","Room Type","Price Change","Changed By","Reason"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {propAudit.map(entry => {
                const up = entry.newPrice > entry.oldPrice;
                const pct = Math.round(((entry.newPrice - entry.oldPrice) / entry.oldPrice) * 100);
                return (
                  <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">{entry.changedAt.replace("T", " ").slice(0, 16)}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-semibold">{entry.roomType}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-400 line-through text-xs">{fmt$(entry.oldPrice)}</span>
                        <ChevronRight size={12} className="text-muted-foreground flex-shrink-0" />
                        <span className={cx("font-semibold text-sm", up ? "text-emerald-700" : "text-red-600")}>{fmt$(entry.newPrice)}</span>
                        <span className={cx("text-xs px-1.5 py-0.5 rounded", up ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600")}>
                          {up ? "+" : ""}{pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{entry.changedBy}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs">{entry.reason}</td>
                  </tr>
                );
              })}
              {propAudit.length === 0 && <tr><td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">No price changes recorded for this property.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {addModal && <AddRateModal propertyId={propId} onClose={() => setAddModal(false)} onSave={handleAdd} />}
      {editRate && <EditRateModal rate={editRate} onClose={() => setEditRate(null)} onSave={handleUpdate} />}
    </div>
  );
}

// ─── RESERVATIONS ─────────────────────────────────────────────────────────────

function ReservationsPage({ reservations, guests }: { reservations: Reservation[]; guests: Guest[] }) {
  const [statusFilter, setStatusFilter] = useState<ResStatus | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = reservations
    .filter(res => {
      const guest = guests.find(g => g.id === res.guestId);
      const room = ALL_ROOMS.find(r => r.id === res.roomId);
      const matchSearch = !search || guest?.name.toLowerCase().includes(search.toLowerCase()) || room?.number.includes(search);
      return matchSearch && (statusFilter === "all" || res.status === statusFilter);
    })
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className={cx(iCls, "pl-9 w-56")} placeholder="Guest name or room…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className={cx(sCls, "w-44")} value={statusFilter} onChange={e => setStatusFilter(e.target.value as ResStatus | "all")}>
          <option value="all">All Statuses</option>
          {(["pending","confirmed","checked-in","checked-out","cancelled"] as ResStatus[]).map(s => (
            <option key={s} value={s}>{ucFirst(s)}</option>
          ))}
        </select>
        <span className="ml-auto text-sm text-muted-foreground">{filtered.length} reservations</span>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {["Guest","Room","Check-in","Check-out","Nights","Status","Rate (Locked)","Total"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(res => {
              const guest = guests.find(g => g.id === res.guestId);
              const room = ALL_ROOMS.find(r => r.id === res.roomId);
              const prop = PROPERTIES.find(p => p.id === room?.propertyId);
              const nights = differenceInDays(parseISO(res.checkOut), parseISO(res.checkIn));
              return (
                <tr key={res.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold flex-shrink-0">{initials(guest?.name || "?")}</div>
                      <span className="font-medium text-foreground">{guest?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">Rm {room?.number}</p>
                    <p className="text-xs text-muted-foreground">{prop?.name.split(" ").slice(0,2).join(" ")} · {room?.type}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{res.checkIn}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{res.checkOut}</td>
                  <td className="px-4 py-3 text-center text-foreground font-medium">{nights}</td>
                  <td className="px-4 py-3"><StatusBadge status={res.status} /></td>
                  <td className="px-4 py-3 font-mono text-foreground">{fmt$(res.rateAtBooking)}<span className="text-xs font-sans text-muted-foreground">/nt</span></td>
                  <td className="px-4 py-3 font-mono font-bold text-foreground">{fmt$(res.totalAmount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-16 text-center text-muted-foreground">No reservations match your filters.</div>}
      </div>
    </div>
  );
}

// ─── PROPERTIES ───────────────────────────────────────────────────────────────

function PropertiesPage({ reservations }: { reservations: Reservation[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {PROPERTIES.map(prop => {
        const propRooms = ALL_ROOMS.filter(r => r.propertyId === prop.id);
        const occupied = propRooms.filter(r => r.status === "occupied").length;
        const available = propRooms.filter(r => r.status === "available").length;
        const maintenance = propRooms.filter(r => r.status === "maintenance").length;
        const cleaning = propRooms.filter(r => r.status === "cleaning").length;
        const occupancy = Math.round((occupied / propRooms.length) * 100);
        const active = reservations.filter(r => propRooms.some(pr => pr.id === r.roomId) && r.status === "checked-in").length;
        return (
          <div key={prop.id} className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">{prop.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{prop.address}, {prop.city}</p>
                <span className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-semibold">{prop.type}</span>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{occupancy}%</div>
                <div className="text-xs text-muted-foreground">occupancy</div>
              </div>
            </div>

            <div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${occupancy}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: "Available", value: available, bg: "bg-emerald-50", text: "text-emerald-700" },
                { label: "Occupied", value: occupied, bg: "bg-blue-50", text: "text-blue-700" },
                { label: "Cleaning", value: cleaning, bg: "bg-amber-50", text: "text-amber-700" },
                { label: "Maintenance", value: maintenance, bg: "bg-red-50", text: "text-red-700" },
              ].map(s => (
                <div key={s.label} className={cx("rounded-lg p-2.5", s.bg)}>
                  <div className={cx("text-xl font-bold", s.text)} style={{ fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
                  <div className={cx("text-[11px] font-medium mt-0.5", s.text)}>{s.label}</div>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">All Rooms</p>
              <div className="flex flex-wrap gap-1.5">
                {propRooms.map(room => {
                  const s = ROOM_ST[room.status];
                  return (
                    <div key={room.id} className={cx("rounded px-2 py-1 text-center min-w-[44px]", s.bg)} title={`${room.type} · ${room.status}`}>
                      <div className={cx("text-xs font-bold", s.text)}>{room.number}</div>
                      <div className={cx("text-[9px]", s.text)}>{room.type.slice(0, 3)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAINTENANCE ──────────────────────────────────────────────────────────────

const MT_TASKS = [
  { id: "mt1", roomId: "r4",  desc: "HVAC unit replacement — floor 2 wing B",   priority: "High",   status: "In Progress", reported: "2026-06-20", assignee: "Facilities Team" },
  { id: "mt2", roomId: "r13", desc: "Plumbing — shower drain blockage unit C201",priority: "High",   status: "Scheduled",   reported: "2026-06-23", assignee: "Plumber On-call" },
  { id: "mt3", roomId: "r8",  desc: "Deep cleaning post-checkout 402",           priority: "Low",    status: "Completed",   reported: "2026-06-25", assignee: "Maria Santos"   },
  { id: "mt4", roomId: "r2",  desc: "Bathroom light fixture — bulb replacement", priority: "Low",    status: "Pending",     reported: "2026-06-24", assignee: "Unassigned"     },
  { id: "mt5", roomId: "r6",  desc: "Air conditioning thermostat calibration",   priority: "Medium", status: "Pending",     reported: "2026-06-24", assignee: "Facilities Team" },
];

function MaintenancePage() {
  const open = MT_TASKS.filter(t => t.status !== "Completed").length;
  const inprog = MT_TASKS.filter(t => t.status === "In Progress").length;
  const done = MT_TASKS.filter(t => t.status === "Completed").length;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Open Tasks" value={String(open)} sub="Pending + Scheduled" icon={AlertTriangle} color="bg-red-50 text-red-600" />
        <KpiCard label="In Progress" value={String(inprog)} sub="Currently active" icon={RefreshCw} color="bg-amber-50 text-amber-600" />
        <KpiCard label="Completed" value={String(done)} sub="Resolved today" icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
      </div>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/40">
            {["Room","Description","Assignee","Priority","Status","Reported"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {MT_TASKS.map(t => {
              const room = ALL_ROOMS.find(r => r.id === t.roomId);
              const pc = { High: "bg-red-100 text-red-700", Medium: "bg-amber-100 text-amber-700", Low: "bg-slate-100 text-slate-600" };
              const sc = { "In Progress": "bg-blue-100 text-blue-700", "Scheduled": "bg-violet-100 text-violet-700", "Completed": "bg-emerald-100 text-emerald-700", "Pending": "bg-slate-100 text-slate-600" };
              return (
                <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-semibold text-foreground">Rm {room?.number}</td>
                  <td className="px-4 py-3 text-foreground max-w-xs">{t.desc}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.assignee}</td>
                  <td className="px-4 py-3"><span className={cx("px-2 py-0.5 rounded text-xs font-semibold", pc[t.priority as keyof typeof pc])}>{t.priority}</span></td>
                  <td className="px-4 py-3"><span className={cx("px-2 py-0.5 rounded-full text-xs font-semibold", sc[t.status as keyof typeof sc])}>{t.status}</span></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{t.reported}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── HOUSEKEEPING ────────────────────────────────────────────────────────────

const HK_TASKS = [
  { id: "hk1", roomId: "r8",  type: "Deep Clean",     assignee: "Maria Santos",  status: "In Progress", scheduled: "2026-06-25" },
  { id: "hk2", roomId: "r3",  type: "Turnover",        assignee: "James Okafor", status: "Pending",     scheduled: "2026-06-26" },
  { id: "hk3", roomId: "r9",  type: "Standard Clean",  assignee: "Maria Santos",  status: "Scheduled",   scheduled: "2026-06-26" },
  { id: "hk4", roomId: "r5",  type: "Turnover",        assignee: "Carlos Rivera", status: "Scheduled",   scheduled: "2026-06-27" },
  { id: "hk5", roomId: "r1",  type: "Linen Change",    assignee: "James Okafor", status: "Completed",   scheduled: "2026-06-25" },
  { id: "hk6", roomId: "r11", type: "Inspection",      assignee: "Maria Santos",  status: "Completed",   scheduled: "2026-06-25" },
];

function HousekeepingPage() {
  const sc = { "In Progress": "bg-blue-100 text-blue-700", Scheduled: "bg-violet-100 text-violet-700", Completed: "bg-emerald-100 text-emerald-700", Pending: "bg-slate-100 text-slate-600" };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Pending",     count: HK_TASKS.filter(t => t.status === "Pending").length,     color: "bg-slate-50 text-slate-600" },
          { label: "In Progress", count: HK_TASKS.filter(t => t.status === "In Progress").length,  color: "bg-blue-50 text-blue-600" },
          { label: "Scheduled",   count: HK_TASKS.filter(t => t.status === "Scheduled").length,   color: "bg-violet-50 text-violet-600" },
          { label: "Completed",   count: HK_TASKS.filter(t => t.status === "Completed").length,   color: "bg-emerald-50 text-emerald-600" },
        ].map(s => (
          <div key={s.label} className={cx("rounded-xl border border-border p-4 shadow-sm bg-card")}>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className="text-3xl font-black mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>{s.count}</p>
          </div>
        ))}
      </div>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/40">
            {["Room","Task Type","Assignee","Status","Scheduled"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {HK_TASKS.map(t => {
              const room = ALL_ROOMS.find(r => r.id === t.roomId);
              return (
                <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-semibold text-foreground">Rm {room?.number} <span className="text-xs font-normal text-muted-foreground">· {room?.type}</span></td>
                  <td className="px-4 py-3 text-foreground">{t.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.assignee}</td>
                  <td className="px-4 py-3"><span className={cx("px-2 py-0.5 rounded-full text-xs font-semibold", sc[t.status as keyof typeof sc])}>{t.status}</span></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{t.scheduled}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── BILLING ─────────────────────────────────────────────────────────────────

function BillingPage({ reservations, guests }: { reservations: Reservation[]; guests: Guest[] }) {
  const relevant = reservations.filter(r => r.status !== "cancelled" && r.status !== "pending");
  const totalRev = relevant.filter(r => r.status === "checked-out").reduce((s, r) => s + r.totalAmount, 0);
  const outstanding = relevant.filter(r => r.status === "checked-in").reduce((s, r) => s + r.totalAmount, 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Collected Revenue" value={fmt$(totalRev)} sub="Checked-out stays" icon={DollarSign} color="bg-emerald-50 text-emerald-600" />
        <KpiCard label="Outstanding" value={fmt$(outstanding)} sub="Active stays billing" icon={Clock} color="bg-amber-50 text-amber-600" />
        <KpiCard label="Invoices" value={String(relevant.length)} sub="Total billing records" icon={Receipt} color="bg-blue-50 text-blue-600" />
      </div>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/40">
            {["Guest","Room","Stay Period","Nights","Rate (Locked)","Total","Status"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {relevant.sort((a,b) => b.checkIn.localeCompare(a.checkIn)).map(res => {
              const guest = guests.find(g => g.id === res.guestId);
              const room = ALL_ROOMS.find(r => r.id === res.roomId);
              const nights = differenceInDays(parseISO(res.checkOut), parseISO(res.checkIn));
              return (
                <tr key={res.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{guest?.name}</td>
                  <td className="px-4 py-3 text-foreground">Rm {room?.number}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">{res.checkIn} → {res.checkOut}</td>
                  <td className="px-4 py-3 text-center font-medium text-foreground">{nights}</td>
                  <td className="px-4 py-3 font-mono text-foreground">{fmt$(res.rateAtBooking)}<span className="text-xs font-sans text-muted-foreground">/nt</span></td>
                  <td className="px-4 py-3 font-mono font-bold text-foreground">{fmt$(res.totalAmount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={res.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────

function AuditPage({ rateAudit, reservations, guests }: { rateAudit: RateAuditEntry[]; reservations: Reservation[]; guests: Guest[] }) {
  const events = [
    ...rateAudit.map(r => ({
      id: r.id, time: r.changedAt, type: "Rate Change",
      desc: `${r.roomType} rate: ${fmt$(r.oldPrice)} → ${fmt$(r.newPrice)}/night`,
      user: r.changedBy, detail: r.reason,
      color: "bg-amber-50 text-amber-700 border-amber-200",
    })),
    ...reservations.map(r => {
      const guest = guests.find(g => g.id === r.guestId);
      return {
        id: r.id + "_r", time: r.createdAt + "T00:00:00", type: "Reservation",
        desc: `Booking created for ${guest?.name} — rate locked at ${fmt$(r.rateAtBooking)}/night`,
        user: "System", detail: r.notes || "",
        color: "bg-blue-50 text-blue-700 border-blue-200",
      };
    }),
  ].sort((a, b) => b.time.localeCompare(a.time));

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
        <span>This is the immutable audit trail. Rate changes never affect existing reservations — the <strong>rateAtBooking</strong> field is set at creation and never modified.</span>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/40">
            {["Timestamp","Event","Description","User","Notes"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {events.map(ev => (
              <tr key={ev.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">{ev.time.replace("T", " ").slice(0, 16)}</td>
                <td className="px-4 py-3"><span className={cx("inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold", ev.color)}>{ev.type}</span></td>
                <td className="px-4 py-3 text-foreground">{ev.desc}</td>
                <td className="px-4 py-3 text-muted-foreground">{ev.user}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{ev.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

const NAV: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: "dashboard",    label: "Dashboard",      icon: LayoutDashboard },
  { id: "properties",  label: "Properties",     icon: Building2 },
  { id: "calendar",    label: "Room Calendar",  icon: CalendarDays },
  { id: "guests",      label: "Guests",         icon: Users },
  { id: "reservations",label: "Reservations",   icon: FileText },
  { id: "rates",       label: "Rate Management",icon: DollarSign },
  { id: "maintenance", label: "Maintenance",    icon: Wrench },
  { id: "housekeeping",label: "Housekeeping",   icon: ClipboardCheck },
  { id: "billing",     label: "Billing",        icon: Receipt },
  { id: "audit",       label: "Audit Log",      icon: History },
];

function Sidebar({ page, onNavigate, collapsed, onToggle }: {
  page: Page; onNavigate: (p: Page) => void; collapsed: boolean; onToggle: () => void;
}) {
  return (
    <div className={cx("flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200 flex-shrink-0", collapsed ? "w-[60px]" : "w-[220px]")}>
      <div className="flex items-center gap-3 px-3 py-4 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <Building2 size={15} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-sidebar-foreground leading-tight">PropertyOS</p>
            <p className="text-[10px] text-sidebar-foreground/40 leading-tight">Management Suite</p>
          </div>
        )}
        <button onClick={onToggle} className={cx("p-1.5 rounded hover:bg-sidebar-accent transition-colors text-sidebar-foreground/50 hover:text-sidebar-foreground", collapsed ? "mx-auto" : "ml-auto")}>
          <Menu size={13} />
        </button>
      </div>

      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={cx(
                "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors text-left",
                active ? "bg-sidebar-primary text-white font-semibold" : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon size={15} className="flex-shrink-0" />
              {!collapsed && <span className="font-medium truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className={cx("border-t border-sidebar-border p-3 flex items-center gap-2.5", collapsed ? "justify-center" : "")}>
        <div className="w-7 h-7 rounded-full bg-sidebar-primary/30 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">AD</div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">Admin User</p>
            <p className="text-[10px] text-sidebar-foreground/40 truncate">admin@propertyos.com</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────

const PAGE_TITLES: Record<Page, string> = {
  dashboard: "Dashboard", properties: "Properties", calendar: "Room Calendar",
  guests: "Guests", reservations: "Reservations", rates: "Rate Management",
  maintenance: "Maintenance", housekeeping: "Housekeeping", billing: "Billing", audit: "Audit Log",
};

function Header({ page }: { page: Page }) {
  return (
    <div className="h-12 border-b border-border bg-card flex items-center px-5 gap-3 flex-shrink-0 shadow-sm">
      <h1 className="text-sm font-bold text-foreground">{PAGE_TITLES[page]}</h1>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md font-mono">Jun 25, 2026</span>
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell size={15} className="text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
        <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold">AD</div>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [propId, setPropId] = useState("p1");
  const [collapsed, setCollapsed] = useState(false);
  const [guests, setGuests] = useState<Guest[]>(INIT_GUESTS);
  const [reservations, setReservations] = useState<Reservation[]>(INIT_RESERVATIONS);
  const [rates, setRates] = useState<Rate[]>(INIT_RATES);
  const [rateAudit, setRateAudit] = useState<RateAuditEntry[]>(INIT_RATE_AUDIT);

  function addReservation(res: Omit<Reservation, "id">) {
    setReservations(prev => [...prev, { ...res, id: `res${Date.now()}` }]);
  }

  function addGuest(g: Omit<Guest, "id" | "createdAt">): string {
    const id = `g${Date.now()}`;
    setGuests(prev => [...prev, { ...g, id, createdAt: TODAY_STR }]);
    return id;
  }

  const isCalendar = page === "calendar";

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Sidebar page={page} onNavigate={setPage} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header page={page} />
        <main className={cx("flex-1 min-h-0", isCalendar ? "overflow-hidden" : "overflow-auto p-5")}>
          {page === "dashboard"    && <DashboardPage reservations={reservations} guests={guests} rates={rates} onNavigate={setPage} />}
          {page === "properties"  && <PropertiesPage reservations={reservations} />}
          {page === "calendar"    && <CalendarPage reservations={reservations} guests={guests} rates={rates} selectedPropertyId={propId} setSelectedPropertyId={setPropId} onAddReservation={addReservation} onAddGuest={addGuest} />}
          {page === "guests"      && <GuestsPage guests={guests} setGuests={setGuests} reservations={reservations} />}
          {page === "reservations"&& <ReservationsPage reservations={reservations} guests={guests} />}
          {page === "rates"       && <RatesPage rates={rates} setRates={setRates} rateAudit={rateAudit} setRateAudit={setRateAudit} />}
          {page === "maintenance" && <MaintenancePage />}
          {page === "housekeeping"&& <HousekeepingPage />}
          {page === "billing"     && <BillingPage reservations={reservations} guests={guests} />}
          {page === "audit"       && <AuditPage rateAudit={rateAudit} reservations={reservations} guests={guests} />}
        </main>
      </div>
    </div>
  );
}
