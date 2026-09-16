import { useState } from "react";
import {
  ArrowUpRight,
  BedDouble,
  Building2,
  CalendarDays,
  Download,
  Edit3,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  Star,
  Users,
  Wrench,
} from "lucide-react";
import {
  type Rate,
  activeBooking,
  csv,
  dateLabel,
  downloadFile,
  money,
  occupancy,
  rateFor,
  today,
} from "./model";
import { useStore } from "./store";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  PageHeading,
  SearchInput,
  Stat,
  Table,
  Tabs,
  TextLink,
  usePagination,
} from "./ui";
import {
  BookingForm,
  GuestForm,
  PropertyForm,
  RateForm,
  RoomForm,
  TaskForm,
} from "./forms";
import { ReservationRows } from "./Reservations";

export default function Properties({ property }: { property: string }) {
  const { data } = useStore();
  const [search, setSearch] = useState("");
  const [layout, setLayout] = useState("grid");
  const [add, setAdd] = useState(false);
  const filtered = data.properties.filter(
    (p) =>
      (property === "all" || property === p.id) &&
      `${p.name} ${p.city} ${p.type}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const roomCount = data.rooms.filter((r) =>
    filtered.some((p) => p.id === r.propertyId),
  ).length;
  return (
    <>
      <PageHeading
        eyebrow="PLACES WITH PERSONALITY"
        title="Your collection"
        description="Beautiful spaces, thoughtfully managed. All in one place."
      >
        <Button variant="primary" onClick={() => setAdd(true)}>
          <Plus size={16} />
          Add property
        </Button>
      </PageHeading>
      <div className="collection-banner">
        <Building2 size={24} strokeWidth={1.3} />
        <div>
          <strong>
            {filtered.length} unique properties. Endless possibilities.
          </strong>
          <p>
            {roomCount} rooms in your selected collection, ready for their next
            chapter.
          </p>
        </div>
        <span>THE HAVEN COLLECTION</span>
      </div>
      <div className="filter-bar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Find a property…"
        />
        <div className="segmented">
          <button
            aria-label="Grid view"
            aria-pressed={layout === "grid"}
            className={layout === "grid" ? "active" : ""}
            onClick={() => setLayout("grid")}
          >
            <LayoutGrid size={17} />
          </button>
          <button
            aria-label="List view"
            aria-pressed={layout === "list"}
            className={layout === "list" ? "active" : ""}
            onClick={() => setLayout("list")}
          >
            <List size={17} />
          </button>
        </div>
      </div>
      {filtered.length ? (
        layout === "grid" ? (
          <div className="property-grid portfolio-grid">
            {filtered.map((p) => {
              const occ = occupancy(data, p.id);
              return (
                <a
                  key={p.id}
                  className="property-card"
                  href={`#/properties/${p.id}`}
                >
                  <div className="property-image">
                    <img src={p.image} alt={p.name} />
                    <span>{p.type}</span>
                    <span className="image-arrow">
                      <ArrowUpRight size={19} />
                    </span>
                  </div>
                  <div className="property-body">
                    <h3>{p.name}</h3>
                    <p>
                      <MapPin size={13} />
                      {p.city}
                    </p>
                    <div className="property-footer">
                      <span>
                        <BedDouble size={15} />
                        {occ.total} rooms
                      </span>
                      <span>
                        <i />
                        {occ.percent}% occupied
                      </span>
                    </div>
                    <div className="progress-track">
                      <i style={{ width: `${occ.percent}%` }} />
                    </div>
                    <div className="property-link">
                      Explore property <ArrowUpRight size={15} />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <Card>
            <Table
              headings={[
                "Property",
                "Type",
                "Location",
                "Rooms",
                "Occupancy",
                "",
              ]}
            >
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <a className="strong-link" href={`#/properties/${p.id}`}>
                      {p.name}
                    </a>
                  </td>
                  <td>{p.type}</td>
                  <td>{p.city}</td>
                  <td>{occupancy(data, p.id).total}</td>
                  <td>{occupancy(data, p.id).percent}%</td>
                  <td>
                    <TextLink href={`#/properties/${p.id}`}>Explore</TextLink>
                  </td>
                </tr>
              ))}
            </Table>
          </Card>
        )
      ) : (
        <Empty title="No properties found" />
      )}
      {add && <PropertyForm onClose={() => setAdd(false)} />}
    </>
  );
}

export function PropertyDetail({ id }: { id: string }) {
  const { data } = useStore();
  const [tab, setTab] = useState("rooms");
  const [edit, setEdit] = useState(false);
  const [addRoom, setAddRoom] = useState(false);
  const [addRate, setAddRate] = useState(false);
  const [bookRoom, setBookRoom] = useState<string | null>(null);
  const [taskRoom, setTaskRoom] = useState<string | null>(null);
  const p = data.properties.find((entry) => entry.id === id);
  if (!p)
    return (
      <Empty title="Property not found">
        <TextLink href="#/properties">View collection</TextLink>
      </Empty>
    );
  const rooms = data.rooms.filter((r) => r.propertyId === id);
  const bookings = data.bookings
    .filter((b) => rooms.some((r) => r.id === b.roomId))
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  const stats = occupancy(data, id);
  return (
    <>
      <PageHeading
        eyebrow="PART OF YOUR COLLECTION"
        title={p.name}
        description={`${p.address} · ${p.city}`}
        back="#/properties"
      >
        <Button onClick={() => setEdit(true)}>
          <Edit3 size={15} />
          Edit property
        </Button>
        <Button variant="primary" onClick={() => setBookRoom("")}>
          <Plus size={16} />
          New reservation
        </Button>
      </PageHeading>
      <div className="property-hero">
        <img src={p.image} alt={p.name} />
        <div>
          <Badge value="active" />
          <h2>
            A distinctive place.
            <br />
            An exceptional stay.
          </h2>
          <p>
            {p.type} · {p.city}
          </p>
        </div>
      </div>
      <div className="stats-grid three">
        <Stat
          title="Total rooms"
          value={String(rooms.length)}
          caption={`${rooms.filter((r) => r.status === "ready").length} operationally ready`}
          icon={BedDouble}
        />
        <Stat
          title="Today's occupancy"
          value={`${stats.percent}%`}
          caption={`${stats.occupied} rooms reserved`}
          icon={CalendarDays}
          accent="peach"
        />
        <Stat
          title="Open tasks"
          value={String(
            data.tasks.filter(
              (t) =>
                rooms.some((r) => r.id === t.roomId) && t.status !== "done",
            ).length,
          )}
          caption="Maintenance & housekeeping"
          icon={Wrench}
          accent="blue"
        />
      </div>
      <Card>
        <div className="list-toolbar">
          <Tabs
            value={tab}
            onChange={setTab}
            options={[
              { id: "rooms", label: "Room inventory", count: rooms.length },
              {
                id: "reservations",
                label: "Reservations",
                count: bookings.length,
              },
            ]}
          />
          <div className="toolbar-actions">
            <Button onClick={() => setAddRate(true)}>Add rate</Button>
            <Button onClick={() => setAddRoom(true)}>
              <Plus size={15} />
              Add room
            </Button>
          </div>
        </div>
        {tab === "rooms" ? (
          rooms.length ? (
            <Table
              headings={[
                "Room",
                "Type",
                "Capacity",
                "Nightly rate",
                "Room status",
                "",
              ]}
            >
              {rooms.map((r) => {
                const occupied = bookings.some(
                  (b) =>
                    b.roomId === r.id &&
                    activeBooking(b) &&
                    b.checkIn <= today() &&
                    b.checkOut > today(),
                );
                return (
                  <tr key={r.id}>
                    <td className="number">Room {r.number}</td>
                    <td>{r.type}</td>
                    <td>
                      <span className="inline-label">
                        <Users size={14} />
                        {r.capacity} guests
                      </span>
                    </td>
                    <td className="number">
                      {rateFor(data, r, today()) ? (
                        money(rateFor(data, r, today())!.price)
                      ) : (
                        <button
                          className="text-link"
                          onClick={() => setAddRate(true)}
                        >
                          Set a rate
                        </button>
                      )}
                    </td>
                    <td>
                      <Badge
                        value={
                          r.status === "ready" && occupied
                            ? "occupied"
                            : r.status
                        }
                      />
                    </td>
                    <td>
                      <div className="row-actions">
                        <Button
                          onClick={() => setBookRoom(r.id)}
                          disabled={r.status !== "ready"}
                        >
                          Book
                        </Button>
                        <button
                          className="icon-btn"
                          title={`Create task for room ${r.number}`}
                          aria-label={`Create task for room ${r.number}`}
                          onClick={() => setTaskRoom(r.id)}
                        >
                          <Wrench size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Table>
          ) : (
            <Empty
              title="Your first room is waiting"
              description="Add rooms, then a rate plan, to start taking reservations."
            >
              <Button variant="primary" onClick={() => setAddRoom(true)}>
                <Plus size={15} />
                Add room
              </Button>
            </Empty>
          )
        ) : bookings.length ? (
          <ReservationRows bookings={bookings} />
        ) : (
          <Empty title="No stays yet" />
        )}
      </Card>
      {edit && <PropertyForm property={p} onClose={() => setEdit(false)} />}
      {addRoom && (
        <RoomForm propertyId={id} onClose={() => setAddRoom(false)} />
      )}
      {addRate && (
        <RateForm propertyId={id} onClose={() => setAddRate(false)} />
      )}
      {bookRoom !== null && (
        <BookingForm
          roomId={bookRoom}
          propertyId={id}
          onClose={() => setBookRoom(null)}
        />
      )}
      {taskRoom && (
        <TaskForm
          roomId={taskRoom}
          kind="maintenance"
          onClose={() => setTaskRoom(null)}
        />
      )}
    </>
  );
}

export function Guests() {
  const { data } = useStore();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [add, setAdd] = useState(false);
  const filtered = data.guests.filter(
    (g) =>
      (tab !== "vip" || g.vip) &&
      `${g.name} ${g.email} ${g.country}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const { visible, control } = usePagination(filtered, search + tab);
  return (
    <>
      <PageHeading
        eyebrow="PEOPLE, NOT JUST RESERVATIONS"
        title="Your guests"
        description="Remember the details. Build the kind of stays they come back for."
      >
        <Button
          onClick={() =>
            downloadFile(
              "haven-guests.csv",
              csv([
                ["Name", "Email", "Phone", "Country", "VIP"],
                ...filtered.map((g) => [
                  g.name,
                  g.email,
                  g.phone,
                  g.country,
                  g.vip ? "Yes" : "No",
                ]),
              ]),
            )
          }
        >
          <Download size={15} />
          Export guests
        </Button>
        <Button variant="primary" onClick={() => setAdd(true)}>
          <Plus size={16} />
          Add guest
        </Button>
      </PageHeading>
      <div className="stats-grid three">
        <Stat
          title="Guest collection"
          value={String(data.guests.length)}
          caption="Every guest has a story"
          icon={Users}
        />
        <Stat
          title="VIP guests"
          value={String(data.guests.filter((g) => g.vip).length)}
          caption="A little extra attention"
          icon={Star}
          accent="peach"
        />
        <Stat
          title="Countries represented"
          value={String(new Set(data.guests.map((g) => g.country)).size)}
          caption="A world of memorable stays"
          icon={MapPin}
          accent="blue"
        />
      </div>
      <Card>
        <div className="list-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search names, emails or countries…"
          />
          <Tabs
            value={tab}
            onChange={setTab}
            options={[
              { id: "all", label: "All guests" },
              { id: "vip", label: "VIP collection" },
            ]}
          />
        </div>
        {visible.length ? (
          <Table
            headings={[
              "Guest",
              "Contact",
              "Country",
              "Stays",
              "Total booked",
              "",
            ]}
          >
            {visible.map((g, i) => {
              const stays = data.bookings.filter(
                (b) => b.guestId === g.id && b.status !== "cancelled",
              );
              return (
                <tr key={g.id}>
                  <td>
                    <a className="person" href={`#/guests/${g.id}`}>
                      <Avatar name={g.name} index={i} />
                      <span>
                        <strong>{g.name}</strong>
                        <small>{g.vip ? "VIP guest" : "Guest"}</small>
                      </span>
                    </a>
                  </td>
                  <td>
                    {g.email}
                    <small>{g.phone}</small>
                  </td>
                  <td>{g.country}</td>
                  <td>{stays.length}</td>
                  <td className="number">
                    {money(stays.reduce((s, b) => s + b.total, 0))}
                  </td>
                  <td>
                    <TextLink href={`#/guests/${g.id}`}>View profile</TextLink>
                  </td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <Empty title="No guests match your search" />
        )}{" "}
        {control}
      </Card>
      {add && <GuestForm onClose={() => setAdd(false)} />}
    </>
  );
}

export function GuestDetail({ id }: { id: string }) {
  const { data } = useStore();
  const [edit, setEdit] = useState(false);
  const [book, setBook] = useState(false);
  const guest = data.guests.find((g) => g.id === id);
  if (!guest)
    return (
      <Empty title="Guest not found">
        <TextLink href="#/guests">Guest collection</TextLink>
      </Empty>
    );
  const bookings = data.bookings
    .filter((b) => b.guestId === id)
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  return (
    <>
      <PageHeading
        eyebrow="A FAMILIAR FACE"
        title={guest.name}
        description="The details that make every welcome a little more personal."
        back="#/guests"
      >
        <Button onClick={() => setEdit(true)}>
          <Edit3 size={15} />
          Edit profile
        </Button>
        <Button variant="primary" onClick={() => setBook(true)}>
          <Plus size={16} />
          Book a stay
        </Button>
      </PageHeading>
      <div className="guest-profile">
        <Card>
          <div className="guest-profile-card">
            <Avatar name={guest.name} large />
            <h2>{guest.name}</h2>
            {guest.vip && <span className="vip-label">VIP COLLECTION</span>}
            <p>{guest.country}</p>
            <hr />
            <div>
              <span>Email address</span>
              <a href={`mailto:${guest.email}`}>{guest.email}</a>
            </div>
            <div>
              <span>Phone number</span>
              <a href={`tel:${guest.phone}`}>{guest.phone}</a>
            </div>
            <div>
              <span>Preferences & notes</span>
              <p className="preserve-lines">
                {guest.notes || "No preferences added yet."}
              </p>
            </div>
          </div>
        </Card>
        <div>
          <div className="stats-grid two">
            <Stat
              title="Total stays"
              value={String(
                bookings.filter((b) => b.status !== "cancelled").length,
              )}
              caption="Across your collection"
              icon={CalendarDays}
            />
            <Stat
              title="Lifetime booked value"
              value={money(
                bookings
                  .filter((b) => b.status !== "cancelled")
                  .reduce((s, b) => s + b.total, 0),
              )}
              caption="Non-cancelled reservations"
              icon={Star}
              accent="peach"
            />
          </div>
          <Card title="Stay history" subtitle="Past memories and future plans">
            {bookings.length ? (
              <ReservationRows bookings={bookings} />
            ) : (
              <Empty title="Their first stay starts here">
                <Button variant="primary" onClick={() => setBook(true)}>
                  Create reservation
                </Button>
              </Empty>
            )}
          </Card>
        </div>
      </div>
      {edit && <GuestForm guest={guest} onClose={() => setEdit(false)} />}
      {book && (
        <BookingForm guestId={guest.id} onClose={() => setBook(false)} />
      )}
    </>
  );
}

export function Rates({ property }: { property: string }) {
  const { data } = useStore();
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("all");
  const [editing, setEditing] = useState<Rate | "new" | null>(null);
  const filtered = data.rates.filter(
    (r) =>
      (property === "all" || r.propertyId === property) &&
      (active === "all" || r.active === (active === "active")) &&
      `${r.name} ${r.roomType} ${data.properties.find((p) => p.id === r.propertyId)?.name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="THE RIGHT STAY. THE RIGHT PRICE."
        title="Rates & pricing"
        description="Thoughtful pricing for every room, every season, every stay."
      >
        <a className="btn btn-secondary" href="#/activity?category=Rates">
          Rate change history
        </a>
        <Button variant="primary" onClick={() => setEditing("new")}>
          <Plus size={16} />
          Create rate plan
        </Button>
      </PageHeading>
      <div className="info-banner">
        <Star size={19} />
        <div>
          <strong>Confidence for you. Consistency for your guests.</strong>
          <p>
            Rates apply to new reservations only. Existing stays always keep
            their booked price.
          </p>
        </div>
      </div>
      <Card>
        <div className="list-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search rate plans…"
          />
          <Tabs
            value={active}
            onChange={setActive}
            options={[
              { id: "all", label: "All rates" },
              { id: "active", label: "Active" },
              { id: "inactive", label: "Inactive" },
            ]}
          />
        </div>
        {filtered.length ? (
          <Table
            headings={[
              "Rate plan",
              "Property",
              "Room type",
              "Nightly price",
              "Effective period",
              "Status",
              "",
            ]}
          >
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>
                  <strong>{r.name}</strong>
                </td>
                <td>
                  {data.properties.find((p) => p.id === r.propertyId)?.name}
                </td>
                <td>{r.roomType}</td>
                <td className="rate-price">
                  {money(r.price)}
                  <small>/ night</small>
                </td>
                <td>
                  {dateLabel(r.from, "MMM d, yy")}
                  <small>to {dateLabel(r.to, "MMM d, yy")}</small>
                </td>
                <td>
                  <Badge value={r.active ? "active" : "inactive"} />
                </td>
                <td>
                  <Button onClick={() => setEditing(r)}>
                    <Edit3 size={13} />
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty
            title="No rate plans found"
            description="Add rooms to a property, then create a rate for their room type."
          />
        )}
      </Card>
      {editing && (
        <RateForm
          propertyId={property}
          rate={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
