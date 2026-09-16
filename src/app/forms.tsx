import { useState, type FormEvent } from "react";
import { ArrowRight, BedDouble, CalendarDays, Info, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  type Guest,
  type Property,
  type Rate,
  type Task,
  createBooking,
  money,
  quote,
  saveRate,
  shiftDate,
  today,
  uid,
} from "./model";
import { useStore } from "./store";
import { Button, Field, Modal } from "./ui";

export function GuestForm({
  guest,
  onClose,
  onSaved,
}: {
  guest?: Guest;
  onClose: () => void;
  onSaved?: (id: string) => void;
}) {
  const { update } = useStore();
  const [form, setForm] = useState<Guest>(
    guest || {
      id: uid("guest"),
      name: "",
      email: "",
      phone: "",
      country: "",
      vip: false,
      notes: "",
    },
  );
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (
      update(
        (data) => {
          if (
            data.guests.some(
              (g) =>
                g.id !== form.id &&
                g.email.toLowerCase() === form.email.trim().toLowerCase(),
            )
          )
            throw new Error("A guest with this email already exists.");
          const entry = {
            ...form,
            name: form.name.trim(),
            email: form.email.trim(),
            country: form.country.trim(),
          };
          if (!entry.name || !entry.country)
            throw new Error("Enter the guest's name and country.");
          return {
            ...data,
            guests: guest
              ? data.guests.map((g) => (g.id === form.id ? entry : g))
              : [...data.guests, entry],
          };
        },
        guest ? "Guest profile updated" : "Guest added",
        form.name,
        "Guests",
      )
    ) {
      onSaved?.(form.id);
      onClose();
    }
  };
  return (
    <Modal
      title={guest ? "Edit guest profile" : "A warm welcome starts here"}
      description="Add a guest to your collection. You can book their stay next."
      onClose={onClose}
    >
      <form onSubmit={submit} className="form-body">
        <Field label="Full name">
          <input
            required
            autoFocus
            maxLength={100}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Amelia Bennett"
          />
        </Field>
        <div className="form-grid">
          <Field label="Email address">
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="guest@example.com"
            />
          </Field>
          <Field label="Phone number">
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 212 555 0100"
            />
          </Field>
        </div>
        <Field label="Country">
          <input
            required
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            placeholder="United States"
          />
        </Field>
        <Field label="Preferences & notes">
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Make their next stay a little more personal…"
            rows={3}
          />
        </Field>
        <label className="check-row">
          <input
            type="checkbox"
            checked={form.vip}
            onChange={(e) => setForm({ ...form, vip: e.target.checked })}
          />
          Mark as a VIP guest
        </label>
        <div className="modal-actions">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">
            {guest ? "Save changes" : "Add guest"}
            <ArrowRight size={15} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function BookingForm({
  onClose,
  roomId = "",
  guestId = "",
  date = today(),
  propertyId = "all",
}: {
  onClose: () => void;
  roomId?: string;
  guestId?: string;
  date?: string;
  propertyId?: string;
}) {
  const { data, update } = useStore();
  const [property, setProperty] = useState(
    data.rooms.find((r) => r.id === roomId)?.propertyId ||
      (propertyId !== "all" ? propertyId : data.properties[0]?.id || ""),
  );
  const [form, setForm] = useState({
    roomId,
    guestId,
    checkIn: date,
    checkOut: shiftDate(date, 2),
    people: 2,
    source: "Direct",
    notes: "",
  });
  const [addGuest, setAddGuest] = useState(false);
  const room = data.rooms.find((r) => r.id === form.roomId);
  let pricing: ReturnType<typeof quote> | undefined;
  let priceError = "";
  if (room) {
    try {
      pricing = quote(data, room, form.checkIn, form.checkOut);
    } catch (error) {
      priceError = error instanceof Error ? error.message : "";
    }
  }
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (
      update(
        (current) => ({
          ...current,
          bookings: [createBooking(current, form), ...current.bookings],
        }),
        "Reservation confirmed",
        `${data.guests.find((g) => g.id === form.guestId)?.name} · ${form.checkIn} → ${form.checkOut}`,
        "Reservations",
      )
    )
      onClose();
  };
  return (
    <>
      <Modal
        title="Make room for a great stay"
        description="Create a reservation. Rates are locked at the time of booking."
        onClose={onClose}
        wide
      >
        <form onSubmit={submit} className="form-body">
          <div className="form-section-label">
            <BedDouble size={16} /> THE PERFECT ROOM
          </div>
          <div className="form-grid">
            <Field label="Property">
              <select
                value={property}
                onChange={(e) => {
                  setProperty(e.target.value);
                  setForm({ ...form, roomId: "" });
                }}
              >
                {data.properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Room">
              <select
                required
                value={form.roomId}
                onChange={(e) => setForm({ ...form, roomId: e.target.value })}
              >
                <option value="">Choose a room</option>
                {data.rooms
                  .filter((r) => r.propertyId === property)
                  .map((r) => (
                    <option
                      key={r.id}
                      value={r.id}
                      disabled={r.status !== "ready"}
                    >
                      {r.number} · {r.type} · {r.capacity} guests
                      {r.status !== "ready" ? ` (${r.status})` : ""}
                    </option>
                  ))}
              </select>
            </Field>
          </div>
          <div className="form-grid">
            <Field label="Check-in">
              <input
                type="date"
                required
                min={today()}
                value={form.checkIn}
                onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
              />
            </Field>
            <Field label="Check-out">
              <input
                type="date"
                required
                min={form.checkIn ? shiftDate(form.checkIn, 1) : today()}
                value={form.checkOut}
                onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
              />
            </Field>
          </div>
          <div className="form-section-label">
            <CalendarDays size={16} /> THE LITTLE DETAILS
          </div>
          <Field label="Guest">
            <select
              required
              value={form.guestId}
              onChange={(e) => setForm({ ...form, guestId: e.target.value })}
            >
              <option value="">Select a guest</option>
              {data.guests.map((g) => (
                <option value={g.id} key={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </Field>
          <Button variant="ghost" onClick={() => setAddGuest(true)}>
            <Plus size={14} /> Add a new guest
          </Button>
          <div className="form-grid">
            <Field label="Number of guests">
              <input
                required
                type="number"
                min={1}
                max={room?.capacity || 10}
                value={form.people}
                onChange={(e) =>
                  setForm({ ...form, people: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Booking source">
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              >
                {[
                  "Direct",
                  "Booking.com",
                  "Airbnb",
                  "Expedia",
                  "Travel agent",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Special requests">
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Early arrival, a special occasion, or a personal touch…"
            />
          </Field>
          <div className="booking-total">
            <div>
              <span>
                {pricing
                  ? `${pricing.nights} nights · ${money(pricing.average)} average / night`
                  : "Reservation total"}
              </span>
              <small>
                <Info size={13} /> No real payment will be collected
              </small>
            </div>
            <strong>{pricing ? money(pricing.total) : "—"}</strong>
          </div>
          {priceError && (
            <p className="form-error" role="alert">
              {priceError}
            </p>
          )}
          <div className="modal-actions">
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={!pricing}>
              Confirm reservation
              <ArrowRight size={15} />
            </Button>
          </div>
        </form>
      </Modal>
      {addGuest && (
        <GuestForm
          onClose={() => setAddGuest(false)}
          onSaved={(id) => setForm({ ...form, guestId: id })}
        />
      )}
    </>
  );
}

export function PropertyForm({
  property,
  onClose,
}: {
  property?: Property;
  onClose: () => void;
}) {
  const { update } = useStore();
  const [form, setForm] = useState(
    property || {
      id: uid("property"),
      name: "",
      city: "",
      address: "",
      type: "Boutique hotel",
      image: "/images/meridian.jpg",
    },
  );
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (
      update(
        (data) => {
          const entry = {
            ...form,
            name: form.name.trim(),
            city: form.city.trim(),
            address: form.address.trim(),
          };
          if (!entry.name || !entry.city || !entry.address)
            throw new Error("Complete the property details.");
          return {
            ...data,
            properties: property
              ? data.properties.map((p) => (p.id === form.id ? entry : p))
              : [...data.properties, entry],
          };
        },
        property ? "Property updated" : "Property added",
        form.name,
        "Properties",
      )
    ) {
      onClose();
      if (!property) location.hash = `/properties/${form.id}`;
    }
  };
  return (
    <Modal
      title={property ? "Edit property" : "Grow your collection"}
      description="Add the property first, then create rooms and nightly rates."
      onClose={onClose}
    >
      <form onSubmit={submit} className="form-body">
        <Field label="Property name">
          <input
            required
            autoFocus
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="The name of somewhere special"
          />
        </Field>
        <div className="form-grid">
          <Field label="Property type">
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {[
                "Boutique hotel",
                "Coastal resort",
                "Country retreat",
                "Apartment",
                "Villa",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="City">
            <input
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="City, state"
            />
          </Field>
        </div>
        <Field label="Street address">
          <input
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </Field>
        <Field label="Cover photograph">
          <select
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
          >
            <option value="/images/meridian.jpg">Garden hotel</option>
            <option value="/images/azure.jpg">Coastal resort</option>
            <option value="/images/willow.jpg">Country house</option>
          </select>
        </Field>
        <img
          className="cover-preview"
          src={form.image}
          alt="Selected property cover"
        />
        <div className="modal-actions">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">
            Save property
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function RoomForm({
  propertyId,
  onClose,
}: {
  propertyId: string;
  onClose: () => void;
}) {
  const { update } = useStore();
  const [number, setNumber] = useState("");
  const [type, setType] = useState("Deluxe");
  const [capacity, setCapacity] = useState(2);
  return (
    <Modal
      title="Add a room"
      description="Set up inventory. Add an active rate for this room type before booking."
      onClose={onClose}
    >
      <form
        className="form-body"
        onSubmit={(e) => {
          e.preventDefault();
          if (
            update(
              (data) => {
                if (!number.trim()) throw new Error("Enter a room number.");
                if (
                  data.rooms.some(
                    (r) =>
                      r.propertyId === propertyId &&
                      r.number.toLowerCase() === number.trim().toLowerCase(),
                  )
                )
                  throw new Error("This room number is already in use.");
                return {
                  ...data,
                  rooms: [
                    ...data.rooms,
                    {
                      id: uid("room"),
                      propertyId,
                      number: number.trim(),
                      type,
                      capacity,
                      status: "ready",
                    },
                  ],
                };
              },
              "Room added",
              `${number} · ${type}`,
              "Properties",
            )
          )
            onClose();
        }}
      >
        <Field label="Room number">
          <input
            required
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="e.g. 501"
          />
        </Field>
        <div className="form-grid">
          <Field label="Room type">
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {["Deluxe", "Suite", "Penthouse", "Studio", "Villa"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Capacity">
            <input
              required
              type="number"
              min={1}
              max={20}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
            />
          </Field>
        </div>
        <div className="modal-actions">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">
            Add room
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function RateForm({
  rate,
  propertyId,
  onClose,
}: {
  rate?: Rate;
  propertyId?: string;
  onClose: () => void;
}) {
  const { data, update } = useStore();
  const defaultProperty =
    propertyId && propertyId !== "all"
      ? propertyId
      : data.properties[0]?.id || "";
  const [form, setForm] = useState<Rate>(
    rate || {
      id: uid("rate"),
      propertyId: defaultProperty,
      roomType:
        data.rooms.find((r) => r.propertyId === defaultProperty)?.type || "",
      name: "",
      price: 185,
      from: today(),
      to: shiftDate(today(), 365),
      active: true,
    },
  );
  const [reason, setReason] = useState("");
  const roomTypes = [
    ...new Set(
      data.rooms
        .filter((r) => r.propertyId === form.propertyId)
        .map((r) => r.type),
    ),
  ];
  return (
    <Modal
      title={rate ? "Refine your nightly rate" : "Create a rate plan"}
      description="Existing reservations keep their original price."
      onClose={onClose}
    >
      <form
        className="form-body"
        onSubmit={(e) => {
          e.preventDefault();
          if (
            update(
              (current) => saveRate(current, form),
              rate ? "Rate plan updated" : "Rate plan created",
              `${form.name}: ${rate ? `${money(rate.price)} → ` : ""}${money(form.price)} / night. ${reason}`,
              "Rates",
            )
          )
            onClose();
        }}
      >
        <Field label="Rate name">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <div className="form-grid">
          <Field label="Property">
            <select
              value={form.propertyId}
              onChange={(e) =>
                setForm({
                  ...form,
                  propertyId: e.target.value,
                  roomType:
                    data.rooms.find((r) => r.propertyId === e.target.value)
                      ?.type || "",
                })
              }
            >
              {data.properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Room type">
            <select
              required
              value={form.roomType}
              onChange={(e) => setForm({ ...form, roomType: e.target.value })}
            >
              <option value="">Select type</option>
              {roomTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Nightly price (USD)">
          <input
            type="number"
            min="1"
            step="0.01"
            required
            value={form.price}
            onChange={(e) =>
              setForm({ ...form, price: Number(e.target.value) })
            }
          />
        </Field>
        <div className="form-grid">
          <Field label="Effective from">
            <input
              type="date"
              required
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
            />
          </Field>
          <Field label="Effective to">
            <input
              type="date"
              required
              min={form.from}
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
            />
          </Field>
        </div>
        {rate && (
          <Field label="Reason for change">
            <input
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Seasonal pricing update"
            />
          </Field>
        )}
        <label className="check-row">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Rate plan is active
        </label>
        <div className="modal-actions">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">
            Save rate plan
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function TaskForm({
  kind,
  onClose,
  roomId = "",
}: {
  kind: Task["kind"];
  onClose: () => void;
  roomId?: string;
}) {
  const { data, update } = useStore();
  const [form, setForm] = useState<Task>({
    id: uid("task"),
    kind,
    roomId,
    title: "",
    priority: "medium",
    status: "todo",
    assignee: "Unassigned",
    due: today(),
    notes: "",
  });
  return (
    <Modal
      title={
        kind === "maintenance" ? "Create a work order" : "Schedule a room clean"
      }
      description="The room is taken out of ready inventory until its tasks are complete."
      onClose={onClose}
    >
      <form
        className="form-body"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.title.trim()) {
            toast.error("Enter a task title.");
            return;
          }
          if (
            update(
              (current) => ({
                ...current,
                tasks: [form, ...current.tasks],
                rooms: current.rooms.map((r) =>
                  r.id === form.roomId
                    ? {
                        ...r,
                        status:
                          kind === "maintenance" || r.status === "maintenance"
                            ? "maintenance"
                            : "cleaning",
                      }
                    : r,
                ),
              }),
              "Task created",
              form.title,
              "Operations",
            )
          )
            onClose();
        }}
      >
        <Field label="Task title">
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={
              kind === "maintenance"
                ? "e.g. Inspect air conditioning"
                : "e.g. Departure clean"
            }
          />
        </Field>
        <Field label="Room">
          <select
            required
            value={form.roomId}
            onChange={(e) => setForm({ ...form, roomId: e.target.value })}
          >
            <option value="">Select room</option>
            {data.rooms.map((r) => (
              <option value={r.id} key={r.id}>
                {data.properties.find((p) => p.id === r.propertyId)?.name} ·{" "}
                {r.number}
              </option>
            ))}
          </select>
        </Field>
        <div className="form-grid">
          <Field label="Priority">
            <select
              value={form.priority}
              onChange={(e) =>
                setForm({
                  ...form,
                  priority: e.target.value as Task["priority"],
                })
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
          <Field label="Due date">
            <input
              type="date"
              required
              value={form.due}
              onChange={(e) => setForm({ ...form, due: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Assigned to">
          <select
            value={form.assignee}
            onChange={(e) => setForm({ ...form, assignee: e.target.value })}
          >
            {[
              "Unassigned",
              "Alex Morgan",
              "Sarah Davis",
              "Chris Lee",
              "Maria Garcia",
            ].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </Field>
        <Field label="Instructions">
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Field>
        <div className="modal-actions">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">
            Create task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
