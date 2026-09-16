import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  Plus,
  Printer,
  Users,
} from "lucide-react";
import {
  type Booking,
  type BookingStatus,
  csv,
  dateLabel,
  downloadFile,
  money,
  nights,
  recordPayment,
  shiftDate,
  today,
  transitionBooking,
} from "./model";
import { useStore } from "./store";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Confirm,
  Empty,
  Field,
  IconButton,
  Modal,
  PageHeading,
  SearchInput,
  Stat,
  Table,
  Tabs,
  TextLink,
  usePagination,
} from "./ui";
import { BookingForm } from "./forms";

export function ReservationRows({ bookings }: { bookings: Booking[] }) {
  const { data } = useStore();
  return (
    <Table
      headings={[
        "Guest / reservation",
        "Property & room",
        "Dates",
        "Status",
        "Total",
        "",
      ]}
    >
      {bookings.map((b, i) => {
        const guest = data.guests.find((g) => g.id === b.guestId)!;
        const room = data.rooms.find((r) => r.id === b.roomId)!;
        return (
          <tr key={b.id}>
            <td>
              <a className="person" href={`#/reservations/${b.id}`}>
                <Avatar name={guest.name} index={i} />
                <span>
                  <strong>{guest.name}</strong>
                  <small>{b.id}</small>
                </span>
              </a>
            </td>
            <td>
              <strong>
                {data.properties.find((p) => p.id === room.propertyId)?.name}
              </strong>
              <small>
                {room.type} · Room {room.number}
              </small>
            </td>
            <td>
              <strong>
                {dateLabel(b.checkIn, "MMM d")} –{" "}
                {dateLabel(b.checkOut, "MMM d")}
              </strong>
              <small>
                {nights(b.checkIn, b.checkOut)} nights · {b.people} guests
              </small>
            </td>
            <td>
              <Badge value={b.status} />
            </td>
            <td className="number">
              {money(b.total)}
              <small>
                {b.paid >= b.total ? "Paid" : `${money(b.total - b.paid)} due`}
              </small>
            </td>
            <td>
              <a
                className="table-arrow"
                aria-label={`View ${b.id}`}
                href={`#/reservations/${b.id}`}
              >
                <ArrowUpRight size={17} />
              </a>
            </td>
          </tr>
        );
      })}
    </Table>
  );
}

export default function Reservations({ property }: { property: string }) {
  const { data } = useStore();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [booking, setBooking] = useState(false);
  const filtered = data.bookings
    .filter(
      (b) =>
        (property === "all" ||
          data.rooms.find((r) => r.id === b.roomId)?.propertyId === property) &&
        (status === "all" || b.status === status) &&
        `${b.id} ${data.guests.find((g) => g.id === b.guestId)?.name} ${data.rooms.find((r) => r.id === b.roomId)?.number}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  const { visible, control } = usePagination(
    filtered,
    `${property}${status}${search}`,
  );
  return (
    <>
      <PageHeading
        eyebrow="EVERY STAY, THOUGHTFULLY MANAGED"
        title="Reservations"
        description="From the first hello to the next welcome back."
      >
        <Button
          onClick={() =>
            downloadFile(
              "haven-reservations.csv",
              csv([
                [
                  "ID",
                  "Guest",
                  "Check-in",
                  "Check-out",
                  "Status",
                  "Total",
                  "Paid",
                ],
                ...filtered.map((b) => [
                  b.id,
                  data.guests.find((g) => g.id === b.guestId)?.name || "",
                  b.checkIn,
                  b.checkOut,
                  b.status,
                  b.total,
                  b.paid,
                ]),
              ]),
            )
          }
        >
          <Download size={15} />
          Export
        </Button>
        <Button variant="primary" onClick={() => setBooking(true)}>
          <Plus size={16} />
          New reservation
        </Button>
      </PageHeading>
      <Card>
        <div className="list-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search guests, rooms or reservation IDs…"
          />
          <a className="btn btn-secondary" href="#/calendar">
            <CalendarDays size={16} />
            Calendar view
          </a>
        </div>
        <Tabs
          options={[
            "all",
            "confirmed",
            "pending",
            "checked-in",
            "checked-out",
            "cancelled",
          ].map((s) => ({
            id: s,
            label: s === "all" ? "All reservations" : s.replace(/-/g, " "),
          }))}
          value={status}
          onChange={setStatus}
        />
        {visible.length ? (
          <ReservationRows bookings={visible} />
        ) : (
          <Empty
            title="No matching reservations"
            description="Change your filters or create a new reservation."
          />
        )}{" "}
        {control}
      </Card>
      {booking && (
        <BookingForm propertyId={property} onClose={() => setBooking(false)} />
      )}
    </>
  );
}

export function ReservationDetail({
  id,
  invoice = false,
}: {
  id: string;
  invoice?: boolean;
}) {
  const { data, update } = useStore();
  const b = data.bookings.find((entry) => entry.id === id);
  const [confirmStatus, setConfirmStatus] = useState<BookingStatus | null>(
    null,
  );
  const [payment, setPayment] = useState(false);
  const [refund, setRefund] = useState(false);
  const [amount, setAmount] = useState("");
  const [editNotes, setEditNotes] = useState(false);
  const [notes, setNotes] = useState(b?.notes || "");
  if (!b)
    return (
      <Empty
        title="Reservation not found"
        description="This record may have been removed when sample data was reset."
      >
        <TextLink href="#/reservations">All reservations</TextLink>
      </Empty>
    );
  const guest = data.guests.find((g) => g.id === b.guestId)!;
  const room = data.rooms.find((r) => r.id === b.roomId)!;
  const property = data.properties.find((p) => p.id === room.propertyId)!;
  return (
    <>
      <PageHeading
        eyebrow={invoice ? "BILLING & PAYMENTS" : "THE DETAILS THAT MATTER"}
        title={
          invoice ? `Invoice ${b.id}` : `A stay for ${guest.name.split(" ")[0]}`
        }
        description={`${b.id} · Created ${dateLabel(b.createdAt)} · ${b.source}`}
        back={invoice ? "#/billing" : "#/reservations"}
      >
        {invoice ? (
          <Button onClick={() => window.print()}>
            <Printer size={16} />
            Print invoice
          </Button>
        ) : (
          <a className="btn btn-secondary" href={`#/billing/${id}`}>
            <CircleDollarSign size={16} />
            View invoice
          </a>
        )}
        {b.status === "pending" && (
          <Button
            variant="primary"
            onClick={() => setConfirmStatus("confirmed")}
          >
            Confirm reservation
          </Button>
        )}
        {b.status === "confirmed" && (
          <Button
            variant="primary"
            onClick={() => setConfirmStatus("checked-in")}
          >
            <ArrowDownLeft size={16} />
            Check in
          </Button>
        )}
        {b.status === "checked-in" && (
          <Button
            variant="primary"
            onClick={() => setConfirmStatus("checked-out")}
          >
            <ArrowUpRight size={16} />
            Check out
          </Button>
        )}
      </PageHeading>
      <div className="detail-layout">
        <div>
          <Card className="stay-card">
            <div className="stay-photo">
              <img src={property.image} alt={property.name} />
              <Badge value={b.status} />
            </div>
            <div className="stay-content">
              <div className="section-heading">
                <div>
                  <h2>{property.name}</h2>
                  <p>
                    {property.address}, {property.city}
                  </p>
                </div>
                <TextLink href={`#/properties/${property.id}`}>
                  View property
                </TextLink>
              </div>
              <div className="stay-dates">
                <div>
                  <span>CHECK-IN</span>
                  <strong>{dateLabel(b.checkIn, "MMM d, yyyy")}</strong>
                  <small>From 3:00 PM</small>
                </div>
                <div className="nights-divider">
                  <CalendarDays size={20} />
                  <span>{nights(b.checkIn, b.checkOut)} nights</span>
                </div>
                <div>
                  <span>CHECK-OUT</span>
                  <strong>{dateLabel(b.checkOut, "MMM d, yyyy")}</strong>
                  <small>Before 11:00 AM</small>
                </div>
              </div>
              <div className="detail-pairs">
                <div>
                  <span>Room</span>
                  <strong>
                    {room.number} · {room.type}
                  </strong>
                </div>
                <div>
                  <span>Guests</span>
                  <strong>{b.people} people</strong>
                </div>
                <div>
                  <span>Booking source</span>
                  <strong>{b.source}</strong>
                </div>
              </div>
            </div>
          </Card>
          <Card
            title="Your guest"
            action={
              <TextLink href={`#/guests/${guest.id}`}>Guest profile</TextLink>
            }
          >
            <div className="guest-detail-inline">
              <Avatar name={guest.name} large />
              <div>
                <h3>
                  {guest.name}{" "}
                  {guest.vip && <span className="vip-label">VIP</span>}
                </h3>
                <p>{guest.email}</p>
                <p>
                  {guest.phone} · {guest.country}
                </p>
              </div>
            </div>
          </Card>
          <Card
            title="Stay notes"
            action={
              <Button variant="ghost" onClick={() => setEditNotes(true)}>
                Edit notes
              </Button>
            }
          >
            <p className="card-text preserve-lines">
              {b.notes ||
                "No special requests. Add a personal touch to this stay."}
            </p>
          </Card>
        </div>
        <div>
          <Card
            title={invoice ? "Invoice summary" : "Payment summary"}
            subtitle="USD · Rate locked at booking"
          >
            <div className="invoice-lines">
              <p>
                <span>
                  {money(b.rateAtBooking)} × {nights(b.checkIn, b.checkOut)}{" "}
                  nights
                </span>
                <strong>{money(b.total)}</strong>
              </p>
              <p>
                <span>Additional charges</span>
                <strong>{money(0)}</strong>
              </p>
              <hr />
              <p className="invoice-total">
                <span>Total amount</span>
                <strong>{money(b.total)}</strong>
              </p>
              <p>
                <span>Payments recorded</span>
                <strong className="positive">{money(b.paid)}</strong>
              </p>
              <p className="balance">
                <span>
                  {b.status === "cancelled"
                    ? "Cancelled · nothing due"
                    : "Balance due"}
                </span>
                <strong>
                  {money(b.status === "cancelled" ? 0 : b.total - b.paid)}
                </strong>
              </p>
            </div>
            <div className="invoice-actions">
              {b.status !== "cancelled" && b.total > b.paid && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setAmount(String(b.total - b.paid));
                    setRefund(false);
                    setPayment(true);
                  }}
                >
                  Record payment
                  <ArrowRight size={15} />
                </Button>
              )}
              {b.paid > 0 && (
                <Button
                  onClick={() => {
                    setAmount(String(b.paid));
                    setRefund(true);
                    setPayment(true);
                  }}
                >
                  Record refund
                </Button>
              )}
              {invoice && (
                <a
                  className="btn btn-secondary"
                  href={`#/reservations/${b.id}`}
                >
                  View reservation
                </a>
              )}
              <p>
                Local records only. No card processing, bank transfer, or real
                refund takes place.
              </p>
            </div>
          </Card>
          {["confirmed", "pending"].includes(b.status) && (
            <Card
              title="Plans changed?"
              subtitle="Cancel this stay to release the room."
            >
              <div className="card-text">
                <Button
                  variant="danger"
                  onClick={() => setConfirmStatus("cancelled")}
                >
                  Cancel reservation
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
      {confirmStatus && (
        <Confirm
          title={`${confirmStatus === "cancelled" ? "Cancel" : confirmStatus === "checked-in" ? "Check in" : confirmStatus === "checked-out" ? "Check out" : "Confirm"} this reservation?`}
          description={
            confirmStatus === "checked-out"
              ? "A departure-clean task will be created and the room marked for cleaning."
              : confirmStatus === "cancelled"
                ? "The room will be released. Recorded payments must be refunded first."
                : "The reservation status will be updated in this workspace."
          }
          danger={confirmStatus === "cancelled"}
          onClose={() => setConfirmStatus(null)}
          onConfirm={() => {
            if (
              update(
                (current) => transitionBooking(current, id, confirmStatus),
                `Reservation ${confirmStatus}`,
                `${id} · ${guest.name}`,
                "Reservations",
              )
            )
              setConfirmStatus(null);
          }}
        />
      )}
      {payment && (
        <Modal
          title={refund ? "Record a refund" : "Record a payment"}
          description="Track an offline payment in your local workspace. No money is moved."
          onClose={() => setPayment(false)}
        >
          <form
            className="form-body"
            onSubmit={(e) => {
              e.preventDefault();
              if (
                update(
                  (current) =>
                    recordPayment(
                      current,
                      id,
                      (refund ? -1 : 1) * Number(amount),
                    ),
                  refund ? "Refund recorded" : "Payment recorded",
                  `${id} · ${money(Number(amount))}`,
                  "Billing",
                )
              )
                setPayment(false);
            }}
          >
            <Field label="Amount (USD)">
              <input
                required
                autoFocus
                type="number"
                min="0.01"
                step="0.01"
                max={refund ? b.paid : b.total - b.paid}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <div className="modal-actions">
              <Button onClick={() => setPayment(false)}>Cancel</Button>
              <Button type="submit" variant="primary">
                Record {refund ? "refund" : "payment"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {editNotes && (
        <Modal title="Stay notes" onClose={() => setEditNotes(false)}>
          <form
            className="form-body"
            onSubmit={(e) => {
              e.preventDefault();
              if (
                update(
                  (current) => ({
                    ...current,
                    bookings: current.bookings.map((entry) =>
                      entry.id === b.id ? { ...entry, notes } : entry,
                    ),
                  }),
                  "Stay notes updated",
                  b.id,
                  "Reservations",
                )
              )
                setEditNotes(false);
            }}
          >
            <Field label="Special requests & notes">
              <textarea
                autoFocus
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
            <div className="modal-actions">
              <Button onClick={() => setEditNotes(false)}>Cancel</Button>
              <Button variant="primary" type="submit">
                Save notes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

export function Calendar({ property }: { property: string }) {
  const { data } = useStore();
  const [start, setStart] = useState(today());
  const [count, setCount] = useState(14);
  const [roomType, setRoomType] = useState("all");
  const [booking, setBooking] = useState<{
    roomId: string;
    date: string;
  } | null>(null);
  const rooms = data.rooms.filter(
    (r) =>
      (property === "all" || r.propertyId === property) &&
      (roomType === "all" || r.type === roomType),
  );
  const days = Array.from({ length: count }, (_, i) => shiftDate(start, i));
  return (
    <>
      <PageHeading
        eyebrow="A PLACE FOR EVERY PLAN"
        title="Stay calendar"
        description="See your collection's rhythm. Select an open night to create a stay."
      >
        <Button
          variant="primary"
          onClick={() => setBooking({ roomId: "", date: today() })}
        >
          <Plus size={16} />
          New reservation
        </Button>
      </PageHeading>
      <Card>
        <div className="calendar-toolbar">
          <div>
            <IconButton
              icon={ChevronLeft}
              title="Previous dates"
              onClick={() => setStart(shiftDate(start, -count))}
            />
            <h2>{dateLabel(start, "MMMM yyyy")}</h2>
            <IconButton
              icon={ChevronRight}
              title="Next dates"
              onClick={() => setStart(shiftDate(start, count))}
            />
            <Button onClick={() => setStart(today())}>Today</Button>
          </div>
          <div>
            <select
              aria-label="Calendar room type"
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
            >
              <option value="all">All room types</option>
              {[...new Set(data.rooms.map((r) => r.type))].map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <select
              aria-label="Calendar range"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
            </select>
          </div>
        </div>
        <div className="calendar-scroll">
          <div
            className="calendar-board"
            style={{ minWidth: count === 14 ? 1120 : 820 }}
          >
            <div className="calendar-header">
              <div>PROPERTY / ROOM</div>
              <div
                className="calendar-days"
                style={{
                  gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
                }}
              >
                {days.map((day) => (
                  <div key={day} className={day === today() ? "is-today" : ""}>
                    <span>{dateLabel(day, "EEE")}</span>
                    <strong>{dateLabel(day, "d")}</strong>
                  </div>
                ))}
              </div>
            </div>
            {data.properties
              .filter((p) => rooms.some((r) => r.propertyId === p.id))
              .map((p) => (
                <div key={p.id}>
                  <a
                    href={`#/properties/${p.id}`}
                    className="calendar-property"
                  >
                    {p.name}
                    <ArrowUpRight size={13} />
                  </a>
                  {rooms
                    .filter((r) => r.propertyId === p.id)
                    .map((room) => (
                      <div key={room.id} className="calendar-row">
                        <div className="calendar-room">
                          <strong>
                            {room.number} <small>{room.type}</small>
                          </strong>
                          <span>
                            {room.status !== "ready"
                              ? room.status
                              : `${room.capacity} guests`}
                          </span>
                        </div>
                        <div
                          className="calendar-lane"
                          style={{
                            gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
                          }}
                        >
                          {days.map((day, i) => (
                            <button
                              key={day}
                              className={`calendar-cell ${day === today() ? "is-today" : ""}`}
                              style={{ gridColumn: i + 1, gridRow: 1 }}
                              aria-label={`Book ${p.name} room ${room.number} on ${day}`}
                              disabled={
                                day < today() || room.status !== "ready"
                              }
                              onClick={() =>
                                setBooking({ roomId: room.id, date: day })
                              }
                            >
                              <Plus size={12} />
                            </button>
                          ))}
                          {data.bookings
                            .filter(
                              (b) =>
                                b.roomId === room.id &&
                                b.status !== "cancelled" &&
                                b.checkOut > start &&
                                b.checkIn <= days[count - 1],
                            )
                            .map((b) => {
                              const first = Math.max(
                                0,
                                nights(start, b.checkIn),
                              );
                              const last = Math.min(
                                count,
                                nights(start, b.checkOut),
                              );
                              return (
                                <a
                                  key={b.id}
                                  className={`calendar-booking booking-${b.status}`}
                                  style={{
                                    gridColumn: `${first + 1} / ${last + 1}`,
                                    gridRow: 1,
                                  }}
                                  href={`#/reservations/${b.id}`}
                                  title={`${data.guests.find((g) => g.id === b.guestId)?.name} · ${b.checkIn} to ${b.checkOut} · ${b.status}`}
                                >
                                  <span>
                                    {
                                      data.guests.find(
                                        (g) => g.id === b.guestId,
                                      )?.name
                                    }
                                  </span>
                                  <small>
                                    {nights(b.checkIn, b.checkOut)} nights
                                  </small>
                                </a>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                </div>
              ))}
          </div>
        </div>
        <div className="calendar-legend">
          <Badge value="confirmed" />
          <Badge value="checked-in" />
          <Badge value="pending" />
          <Badge value="checked-out" />
          <span>Scroll horizontally to explore your timeline</span>
        </div>
        {!rooms.length && (
          <Empty
            title="No rooms in this view"
            description="Choose another filter or add rooms in Properties."
          />
        )}
      </Card>
      {booking && (
        <BookingForm
          propertyId={property}
          roomId={booking.roomId}
          date={booking.date}
          onClose={() => setBooking(null)}
        />
      )}
    </>
  );
}

export function Billing({ property }: { property: string }) {
  const { data } = useStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const bookings = data.bookings.filter(
    (b) =>
      b.status !== "cancelled" &&
      (property === "all" ||
        data.rooms.find((r) => r.id === b.roomId)?.propertyId === property),
  );
  const filtered = bookings
    .filter(
      (b) =>
        (status === "all" ||
          (status === "paid" ? b.paid >= b.total : b.paid < b.total)) &&
        `${b.id} ${data.guests.find((g) => g.id === b.guestId)?.name}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  const { visible, control } = usePagination(
    filtered,
    `${property}${search}${status}`,
  );
  return (
    <>
      <PageHeading
        eyebrow="EVERY DETAIL, ACCOUNTED FOR"
        title="Billing & payments"
        description="A clear view of stay charges, recorded payments, and outstanding balances."
      >
        <Button
          onClick={() =>
            downloadFile(
              "haven-invoices.csv",
              csv([
                ["Invoice", "Guest", "Total", "Paid", "Due"],
                ...filtered.map((b) => [
                  b.id,
                  data.guests.find((g) => g.id === b.guestId)?.name || "",
                  b.total,
                  b.paid,
                  b.total - b.paid,
                ]),
              ]),
            )
          }
        >
          <Download size={15} />
          Export invoices
        </Button>
      </PageHeading>
      <div className="stats-grid three">
        <Stat
          title="Total invoiced"
          value={money(bookings.reduce((s, b) => s + b.total, 0))}
          caption="All non-cancelled reservations"
          icon={CircleDollarSign}
        />
        <Stat
          title="Recorded payments"
          value={money(bookings.reduce((s, b) => s + b.paid, 0))}
          caption="Local payment records"
          icon={ArrowDownLeft}
          accent="blue"
        />
        <Stat
          title="Outstanding balance"
          value={money(bookings.reduce((s, b) => s + b.total - b.paid, 0))}
          caption={`${bookings.filter((b) => b.paid < b.total).length} unpaid or partially paid invoices`}
          icon={Users}
          accent="peach"
        />
      </div>
      <Card>
        <div className="list-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search invoices or guests…"
          />
          <Tabs
            value={status}
            onChange={setStatus}
            options={[
              { id: "all", label: "All invoices" },
              { id: "unpaid", label: "Outstanding" },
              { id: "paid", label: "Paid" },
            ]}
          />
        </div>
        {visible.length ? (
          <Table
            headings={[
              "Invoice",
              "Guest",
              "Check-in",
              "Total",
              "Balance",
              "Status",
              "",
            ]}
          >
            {visible.map((b) => (
              <tr key={b.id}>
                <td>
                  <a className="strong-link" href={`#/billing/${b.id}`}>
                    {b.id}
                  </a>
                </td>
                <td>{data.guests.find((g) => g.id === b.guestId)?.name}</td>
                <td>{dateLabel(b.checkIn)}</td>
                <td className="number">{money(b.total)}</td>
                <td className="number">{money(b.total - b.paid)}</td>
                <td>
                  <Badge
                    value={
                      b.paid >= b.total
                        ? "paid"
                        : b.paid > 0
                          ? "partial"
                          : "unpaid"
                    }
                  />
                </td>
                <td>
                  <TextLink href={`#/billing/${b.id}`}>View invoice</TextLink>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty title="No invoices match" />
        )}{" "}
        {control}
      </Card>
      <p className="page-footnote">
        Payments and refunds are local records. This workspace does not process
        real transactions.
      </p>
    </>
  );
}
