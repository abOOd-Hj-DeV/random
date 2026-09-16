import {
  addDays,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
} from "date-fns";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "checked-in"
  | "checked-out"
  | "cancelled";
export type RoomStatus = "ready" | "cleaning" | "maintenance";
export interface Property {
  id: string;
  name: string;
  city: string;
  address: string;
  type: string;
  image: string;
}
export interface Room {
  id: string;
  propertyId: string;
  number: string;
  type: string;
  capacity: number;
  status: RoomStatus;
}
export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  vip: boolean;
  notes: string;
}
export interface Booking {
  id: string;
  roomId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  people: number;
  rateAtBooking: number;
  total: number;
  paid: number;
  source: string;
  notes: string;
  createdAt: string;
}
export interface Rate {
  id: string;
  propertyId: string;
  roomType: string;
  name: string;
  price: number;
  from: string;
  to: string;
  active: boolean;
}
export interface Task {
  id: string;
  roomId: string;
  title: string;
  kind: "maintenance" | "housekeeping";
  priority: "low" | "medium" | "high";
  status: "todo" | "in-progress" | "done";
  assignee: string;
  due: string;
  notes: string;
}
export interface Activity {
  id: string;
  title: string;
  detail: string;
  date: string;
  category: string;
}
export interface Settings {
  name: string;
  email: string;
  workspace: string;
  compact: boolean;
}
export interface Data {
  version: 1;
  properties: Property[];
  rooms: Room[];
  guests: Guest[];
  bookings: Booking[];
  rates: Rate[];
  tasks: Task[];
  activity: Activity[];
  settings: Settings;
  readAt: string;
}
export type BookingInput = Pick<
  Booking,
  "roomId" | "guestId" | "checkIn" | "checkOut" | "people" | "source" | "notes"
>;
export const today = () => format(new Date(), "yyyy-MM-dd");
export const shiftDate = (date: string, days: number) =>
  format(addDays(parseISO(date), days), "yyyy-MM-dd");
export const nights = (start: string, end: string) =>
  differenceInCalendarDays(parseISO(end), parseISO(start));
export const uid = (prefix: string) =>
  `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
export const money = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
export const dateLabel = (date: string, pattern = "MMM d, yyyy") =>
  format(parseISO(date), pattern);
export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
export const label = (value: string) =>
  value.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
export const activeBooking = (booking: Booking) =>
  booking.status !== "cancelled" && booking.status !== "checked-out";
export const overlaps = (
  start: string,
  end: string,
  otherStart: string,
  otherEnd: string,
) => start < otherEnd && end > otherStart;
export const validDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value));

export function rateFor(data: Data, room: Room, date: string) {
  return data.rates.find(
    (r) =>
      r.propertyId === room.propertyId &&
      r.roomType === room.type &&
      r.active &&
      r.from <= date &&
      r.to >= date,
  );
}

export function quote(data: Data, room: Room, start: string, end: string) {
  const count = nights(start, end);
  if (!Number.isInteger(count) || count <= 0 || count > 365)
    throw new Error("Choose a stay between 1 and 365 nights.");
  let total = 0;
  for (let day = 0; day < count; day++) {
    const rate = rateFor(data, room, shiftDate(start, day));
    if (!rate)
      throw new Error(
        "No active rate covers every night. Add a rate in Rates & pricing.",
      );
    total += rate.price;
  }
  return {
    total: Math.round(total * 100) / 100,
    average: total / count,
    nights: count,
  };
}

export function createBooking(data: Data, input: BookingInput): Booking {
  const room = data.rooms.find((r) => r.id === input.roomId);
  if (!room || !data.guests.some((g) => g.id === input.guestId))
    throw new Error("Choose a room and a guest.");
  if (room.status !== "ready")
    throw new Error(
      "This room needs cleaning or maintenance before it can be booked.",
    );
  if (
    !validDate(input.checkIn) ||
    !validDate(input.checkOut) ||
    input.checkIn < today()
  )
    throw new Error("Choose valid dates starting today or later.");
  if (
    !Number.isInteger(input.people) ||
    input.people < 1 ||
    input.people > room.capacity
  )
    throw new Error(`This room accommodates up to ${room.capacity} guests.`);
  if (
    data.bookings.some(
      (b) =>
        b.roomId === room.id &&
        activeBooking(b) &&
        overlaps(input.checkIn, input.checkOut, b.checkIn, b.checkOut),
    )
  )
    throw new Error(
      "This room already has a booking for these dates. Choose another room or date.",
    );
  const pricing = quote(data, room, input.checkIn, input.checkOut);
  return {
    ...input,
    id: uid("HV"),
    status: "confirmed",
    rateAtBooking: pricing.average,
    total: pricing.total,
    paid: 0,
    createdAt: new Date().toISOString(),
  };
}

export function transitionBooking(
  data: Data,
  id: string,
  status: BookingStatus,
): Data {
  const booking = data.bookings.find((b) => b.id === id);
  if (!booking) throw new Error("Reservation not found.");
  const allowed: Record<BookingStatus, BookingStatus[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["checked-in", "cancelled"],
    "checked-in": ["checked-out"],
    "checked-out": [],
    cancelled: [],
  };
  if (!allowed[booking.status].includes(status))
    throw new Error("This reservation cannot move to that status.");
  const room = data.rooms.find((r) => r.id === booking.roomId);
  if (status === "checked-in") {
    if (booking.checkIn > today() || booking.checkOut <= today())
      throw new Error("Check-in is available during the reserved stay only.");
    if (!room || room.status !== "ready")
      throw new Error("The room must be ready before check-in.");
    if (
      data.bookings.some(
        (b) =>
          b.id !== id &&
          b.roomId === booking.roomId &&
          b.status === "checked-in",
      )
    )
      throw new Error(
        "Check out the current guest before checking in this stay.",
      );
  }
  if (status === "cancelled" && booking.paid > 0)
    throw new Error("Refund the recorded payment before cancelling.");
  return {
    ...data,
    bookings: data.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
    rooms:
      status === "checked-out"
        ? data.rooms.map((r) =>
            r.id === booking.roomId
              ? {
                  ...r,
                  status:
                    r.status === "maintenance" ? "maintenance" : "cleaning",
                }
              : r,
          )
        : data.rooms,
    tasks:
      status === "checked-out"
        ? [
            {
              id: uid("task"),
              roomId: booking.roomId,
              title: "Departure clean",
              kind: "housekeeping",
              priority: "medium",
              status: "todo",
              assignee: "Unassigned",
              due: today(),
              notes: `After ${booking.id}`,
            },
            ...data.tasks,
          ]
        : data.tasks,
  };
}

export function recordPayment(data: Data, id: string, amount: number): Data {
  const booking = data.bookings.find((b) => b.id === id);
  if (!booking || booking.status === "cancelled")
    throw new Error("Choose an active invoice.");
  if (
    !Number.isFinite(amount) ||
    amount === 0 ||
    Math.abs(Math.round(amount * 100) - amount * 100) > 0.000001
  )
    throw new Error("Enter a valid amount with at most two decimal places.");
  const paid = Math.round((booking.paid + amount) * 100) / 100;
  if (paid < 0 || paid > booking.total)
    throw new Error("The amount exceeds the balance or recorded payment.");
  return {
    ...data,
    bookings: data.bookings.map((b) => (b.id === id ? { ...b, paid } : b)),
  };
}

export function saveRate(data: Data, rate: Rate): Data {
  if (
    !data.properties.some((p) => p.id === rate.propertyId) ||
    !data.rooms.some(
      (r) => r.propertyId === rate.propertyId && r.type === rate.roomType,
    )
  )
    throw new Error("Choose an existing property and room type.");
  if (!rate.name.trim() || !Number.isFinite(rate.price) || rate.price <= 0)
    throw new Error("Enter a rate name and a positive nightly price.");
  if (!validDate(rate.from) || !validDate(rate.to) || rate.from > rate.to)
    throw new Error("Choose a valid effective date range.");
  if (
    rate.active &&
    data.rates.some(
      (r) =>
        r.id !== rate.id &&
        r.active &&
        r.propertyId === rate.propertyId &&
        r.roomType === rate.roomType &&
        r.from <= rate.to &&
        r.to >= rate.from,
    )
  )
    throw new Error(
      "An active rate already covers these dates and room type. Edit it or choose a different period.",
    );
  return {
    ...data,
    rates: data.rates.some((r) => r.id === rate.id)
      ? data.rates.map((r) => (r.id === rate.id ? rate : r))
      : [...data.rates, rate],
  };
}

export function completeTask(
  data: Data,
  id: string,
  status: Task["status"],
): Data {
  const task = data.tasks.find((t) => t.id === id);
  if (!task) throw new Error("Task not found.");
  const tasks = data.tasks.map((t) => (t.id === id ? { ...t, status } : t));
  const open = tasks.filter(
    (t) => t.roomId === task.roomId && t.status !== "done",
  );
  const roomStatus: RoomStatus = open.some((t) => t.kind === "maintenance")
    ? "maintenance"
    : open.length
      ? "cleaning"
      : "ready";
  return {
    ...data,
    tasks,
    rooms: data.rooms.map((r) =>
      r.id === task.roomId ? { ...r, status: roomStatus } : r,
    ),
  };
}

export function occupancy(data: Data, propertyId = "all", date = today()) {
  const rooms = data.rooms.filter(
    (r) => propertyId === "all" || r.propertyId === propertyId,
  );
  const occupied = rooms.filter((r) =>
    data.bookings.some(
      (b) =>
        b.roomId === r.id &&
        (date < today() ? b.status !== "cancelled" : activeBooking(b)) &&
        b.checkIn <= date &&
        b.checkOut > date,
    ),
  ).length;
  return {
    occupied,
    total: rooms.length,
    percent: rooms.length ? Math.round((occupied / rooms.length) * 100) : 0,
  };
}

export function downloadFile(
  filename: string,
  contents: string,
  type = "text/csv;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function csv(rows: (string | number)[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const text = String(cell);
          return `"${(/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replace(/"/g, '""')}"`;
        })
        .join(","),
    )
    .join("\r\n");
}
