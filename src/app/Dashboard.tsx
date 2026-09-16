import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  CalendarCheck2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Download,
  MapPin,
  Plus,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import {
  type Data,
  csv,
  dateLabel,
  downloadFile,
  money,
  occupancy,
  shiftDate,
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
  Stat,
  Table,
  Tabs,
  TextLink,
} from "./ui";
import { BookingForm } from "./forms";

export function revenueSeries(data: Data, property: string, days: number) {
  const rooms = new Set(
    data.rooms
      .filter((r) => property === "all" || r.propertyId === property)
      .map((r) => r.id),
  );
  return Array.from({ length: days }, (_, i) => {
    const day = shiftDate(today(), i - days + 1);
    const stays = data.bookings.filter(
      (b) =>
        rooms.has(b.roomId) &&
        b.status !== "cancelled" &&
        b.checkIn <= day &&
        b.checkOut > day,
    );
    return {
      day,
      name: dateLabel(day, "MMM d"),
      revenue: Math.round(stays.reduce((sum, b) => sum + b.rateAtBooking, 0)),
      occupancy: occupancy(data, property, day).percent,
    };
  });
}

export function RevenueChart({
  property,
  days = 30,
}: {
  property: string;
  days?: number;
}) {
  const { data } = useStore();
  const series = revenueSeries(data, property, days);
  return (
    <div
      className="revenue-chart"
      role="img"
      aria-label={`Nightly booked revenue for the last ${days} days. Total ${money(series.reduce((s, d) => s + d.revenue, 0))}.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={series}
          margin={{ top: 15, right: 8, left: -15, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#316959" stopOpacity={0.23} />
              <stop offset="100%" stopColor="#316959" stopOpacity={0.015} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="#eaece8"
            strokeDasharray="3 4"
          />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            minTickGap={36}
            tick={{ fill: "#8b918e", fontSize: 10 }}
            dy={10}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#8b918e", fontSize: 10 }}
            tickFormatter={(v) => `$${v >= 1000 ? `${v / 1000}k` : v}`}
          />
          <Tooltip
            contentStyle={{
              border: "1px solid #e3e8e1",
              borderRadius: 10,
              fontSize: 12,
            }}
            formatter={(v: number) => [money(v), "Booked revenue"]}
          />
          <Area
            dataKey="revenue"
            type="monotone"
            stroke="#376b56"
            fill="url(#revenue-fill)"
            strokeWidth={2.5}
            activeDot={{
              r: 5,
              fill: "#376b56",
              stroke: "white",
              strokeWidth: 3,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Dashboard({ property }: { property: string }) {
  const { data } = useStore();
  const [days, setDays] = useState(30);
  const [view, setView] = useState("arrivals");
  const [booking, setBooking] = useState(false);
  const rooms = data.rooms.filter(
    (r) => property === "all" || r.propertyId === property,
  );
  const reservations = data.bookings.filter((b) =>
    rooms.some((r) => r.id === b.roomId),
  );
  const arrivals = reservations.filter(
    (b) => b.checkIn === today() && ["confirmed", "pending"].includes(b.status),
  );
  const departures = reservations.filter(
    (b) => b.checkOut === today() && b.status === "checked-in",
  );
  const staying = reservations.filter(
    (b) => b.status === "checked-in" && b.checkOut > today(),
  );
  const visible =
    view === "arrivals"
      ? arrivals
      : view === "departures"
        ? departures
        : staying;
  const occ = occupancy(data, property);
  const series = revenueSeries(data, property, days);
  const revenue = series.reduce((s, d) => s + d.revenue, 0);
  const previousRevenue = reservations
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => {
      let value = 0;
      for (let i = days; i < days * 2; i++) {
        const date = shiftDate(today(), -i);
        if (b.checkIn <= date && b.checkOut > date) value += b.rateAtBooking;
      }
      return sum + value;
    }, 0);
  const change = previousRevenue
    ? Math.round(((revenue - previousRevenue) / previousRevenue) * 100)
    : 0;
  const tasks = data.tasks.filter(
    (t) => rooms.some((r) => r.id === t.roomId) && t.status !== "done",
  );
  const unavailable = rooms.filter((r) => r.status !== "ready").length;
  const exportSummary = () =>
    downloadFile(
      "haven-revenue.csv",
      csv([
        ["Date", "Booked revenue (USD)", "Occupancy (%)"],
        ...series.map((d) => [d.day, d.revenue, d.occupancy]),
      ]),
    );
  const hour = new Date().getHours();
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE CLARITY. A LOT OF POSSIBILITY."
        title={`Good ${hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"}, ${data.settings.name.split(" ")[0]}.`}
        description="Here's what's happening across your collection today."
      >
        <Button onClick={exportSummary}>
          <Download size={15} />
          Export report
        </Button>
        <Button variant="primary" onClick={() => setBooking(true)}>
          <Plus size={17} />
          New reservation
        </Button>
      </PageHeading>
      <div className="welcome-banner">
        <div className="welcome-icon">
          <Sparkles size={21} strokeWidth={1.4} />
        </div>
        <div>
          <strong>Great stays begin with the little things.</strong>
          <p>
            You have {arrivals.length} arrivals to welcome and {tasks.length}{" "}
            tasks to take care of today.
          </p>
        </div>
        <a href="#/calendar">
          Let’s make it a good day <ArrowUpRight size={16} />
        </a>
        <div className="banner-art" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className="stats-grid">
        <Stat
          title="Booked revenue"
          value={money(revenue)}
          caption={`Nightly value · Last ${days} days`}
          icon={CircleDollarSign}
        />
        <Stat
          title="Occupancy rate"
          value={`${occ.percent}%`}
          caption={`${occ.occupied} of ${occ.total} rooms reserved today`}
          icon={BedDouble}
          accent="peach"
        />
        <Stat
          title="Expected arrivals"
          value={String(arrivals.length).padStart(2, "0")}
          caption="A new chapter starts today"
          icon={ArrowDownLeft}
          accent="blue"
        />
        <Stat
          title="Expected departures"
          value={String(departures.length).padStart(2, "0")}
          caption="Send them off with a smile"
          icon={ArrowUpRight}
          accent="purple"
        />
      </div>
      <div className="dashboard-charts">
        <Card
          title="Revenue overview"
          subtitle="A closer look at your collection's performance."
          action={
            <select
              aria-label="Revenue period"
              className="small-select"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          }
        >
          <div className="chart-summary">
            <strong>{money(revenue)}</strong>
            <span className={change >= 0 ? "trend" : "trend negative"}>
              {change >= 0 ? (
                <ArrowUpRight size={13} />
              ) : (
                <ArrowDownLeft size={13} />
              )}
              {Math.abs(change)}%
            </span>
            <small>vs. previous {days} days</small>
            <span className="chart-key">
              <i />
              Booked revenue
            </span>
          </div>
          <RevenueChart property={property} days={days} />
        </Card>
        <Card
          title="Your rooms, at a glance"
          subtitle="Today's portfolio availability"
        >
          <div
            className="occupancy-ring"
            style={{
              background: `conic-gradient(#315e4d 0% ${occ.percent}%, #e9ede6 ${occ.percent}% 100%)`,
            }}
          >
            <div>
              <span>Occupancy</span>
              <strong>
                {occ.percent}
                <small>%</small>
              </strong>
              <span>{occ.occupied} rooms reserved</span>
            </div>
          </div>
          <div className="occupancy-legend">
            <p>
              <i className="green-dot" />
              Reserved today <strong>{occ.occupied}</strong>
            </p>
            <p>
              <i className="pale-dot" />
              Not reserved <strong>{occ.total - occ.occupied}</strong>
            </p>
            <p>
              <i className="orange-dot" />
              Cleaning / maintenance <strong>{unavailable}</strong>
            </p>
          </div>
          <a className="card-bottom-link" href="#/properties">
            Manage room inventory <ArrowRight size={15} />
          </a>
        </Card>
      </div>
      <div className="section-heading">
        <div>
          <h2>
            Your collection{" "}
            <span>
              {
                data.properties.filter(
                  (p) => property === "all" || p.id === property,
                ).length
              }{" "}
              properties
            </span>
          </h2>
          <p>Distinct places. One beautifully connected view.</p>
        </div>
        <TextLink href="#/properties">View all properties</TextLink>
      </div>
      <div className="property-grid">
        {data.properties
          .filter((p) => property === "all" || p.id === property)
          .map((p) => {
            const stats = occupancy(data, p.id);
            return (
              <a
                className="property-card"
                href={`#/properties/${p.id}`}
                key={p.id}
              >
                <div className="property-image">
                  <img src={p.image} alt={p.name} loading="lazy" />
                  <span>{p.type}</span>
                  <span className="image-arrow">
                    <ArrowUpRight size={19} />
                  </span>
                </div>
                <div className="property-body">
                  <h3>{p.name}</h3>
                  <p>
                    <MapPin size={12} />
                    {p.city}
                  </p>
                  <div className="property-footer">
                    <span>
                      <BedDouble size={14} />
                      {stats.total} rooms
                    </span>
                    <span>
                      <i />
                      {stats.percent}% occupied
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
      </div>
      <div className="dashboard-bottom">
        <Card
          title="The daily check-in"
          subtitle={dateLabel(today(), "EEEE, MMMM d")}
          action={<TextLink href="#/reservations">All reservations</TextLink>}
        >
          <Tabs
            value={view}
            onChange={setView}
            options={[
              { id: "arrivals", label: "Arrivals", count: arrivals.length },
              {
                id: "departures",
                label: "Departures",
                count: departures.length,
              },
              { id: "in-house", label: "In-house", count: staying.length },
            ]}
          />
          {visible.length ? (
            <Table headings={["Guest", "Room / property", "Status", ""]}>
              {visible.slice(0, 4).map((b, i) => {
                const guest = data.guests.find((g) => g.id === b.guestId)!;
                const room = data.rooms.find((r) => r.id === b.roomId)!;
                return (
                  <tr key={b.id}>
                    <td>
                      <a className="person" href={`#/guests/${guest.id}`}>
                        <Avatar name={guest.name} index={i} />
                        <span>
                          <strong>{guest.name}</strong>
                          <small>{b.id}</small>
                        </span>
                      </a>
                    </td>
                    <td>
                      <strong>
                        {room.type} · {room.number}
                      </strong>
                      <small>
                        {
                          data.properties.find((p) => p.id === room.propertyId)
                            ?.name
                        }
                      </small>
                    </td>
                    <td>
                      <Badge value={b.status} />
                    </td>
                    <td>
                      <a
                        className="table-arrow"
                        href={`#/reservations/${b.id}`}
                        aria-label={`View reservation for ${guest.name}`}
                      >
                        <ChevronRight size={17} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </Table>
          ) : (
            <Empty
              title={`No ${view} to show`}
              description="You're all caught up for today."
            />
          )}
        </Card>
        <Card
          title="A little heads-up"
          subtitle="Keep your day running smoothly"
          action={<span className="live-dot" />}
        >
          <a className="attention-row" href="#/maintenance">
            <span className="attention-icon peach">
              <Wrench size={17} />
            </span>
            <div>
              <strong>
                {tasks.filter((t) => t.kind === "maintenance").length} work
                orders need attention
              </strong>
              <p>Keep every room at its best</p>
            </div>
            <ChevronRight size={15} />
          </a>
          <a className="attention-row" href="#/housekeeping">
            <span className="attention-icon sage">
              <Sparkles size={17} />
            </span>
            <div>
              <strong>
                {tasks.filter((t) => t.kind === "housekeeping").length} rooms to
                refresh
              </strong>
              <p>A fresh start for the next guest</p>
            </div>
            <ChevronRight size={15} />
          </a>
          <a className="attention-row" href="#/billing">
            <span className="attention-icon lavender">
              <CalendarCheck2 size={17} />
            </span>
            <div>
              <strong>
                {
                  reservations.filter(
                    (b) => b.status !== "cancelled" && b.paid < b.total,
                  ).length
                }{" "}
                outstanding invoices
              </strong>
              <p>Review your payment records</p>
            </div>
            <ChevronRight size={15} />
          </a>
          <div className="daily-note">
            <Check size={16} />
            <p>
              Small details. Memorable stays.
              <br />
              <strong>You've got this.</strong>
            </p>
          </div>
        </Card>
      </div>
      {booking && (
        <BookingForm propertyId={property} onClose={() => setBooking(false)} />
      )}
    </>
  );
}

export function Reports({ property }: { property: string }) {
  const { data } = useStore();
  const [days, setDays] = useState(30);
  const series = revenueSeries(data, property, days);
  const revenue = series.reduce((s, d) => s + d.revenue, 0);
  const bookings = data.bookings.filter(
    (b) =>
      b.status !== "cancelled" &&
      b.checkIn >= shiftDate(today(), -days + 1) &&
      b.checkIn <= today() &&
      data.rooms.some(
        (r) =>
          r.id === b.roomId &&
          (property === "all" || r.propertyId === property),
      ),
  );
  const sourceCounts = [
    "Direct",
    "Booking.com",
    "Airbnb",
    "Expedia",
    "Travel agent",
  ].map((source) => ({
    source,
    count: bookings.filter((b) => b.source === source).length,
  }));
  return (
    <>
      <PageHeading
        eyebrow="THE BIGGER PICTURE"
        title="Insights & reports"
        description="Turn your collection's daily activity into a clearer perspective."
      >
        <Button
          onClick={() =>
            downloadFile(
              "haven-report.csv",
              csv([
                ["Date", "Nightly booked revenue", "Occupancy %"],
                ...series.map((s) => [s.day, s.revenue, s.occupancy]),
              ]),
            )
          }
        >
          <Download size={15} />
          Download CSV
        </Button>
      </PageHeading>
      <div className="filter-bar">
        <div className="inline-label">
          <CalendarDays size={16} />
          Reporting period
        </div>
        <select
          aria-label="Reporting period"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        <span className="muted">
          {dateLabel(shiftDate(today(), -days + 1))} – {dateLabel(today())}
        </span>
      </div>
      <div className="stats-grid">
        <Stat
          title="Booked revenue"
          value={money(revenue)}
          caption="Nightly value in selected period"
          icon={CircleDollarSign}
        />
        <Stat
          title="Average occupancy"
          value={`${Math.round(series.reduce((s, d) => s + d.occupancy, 0) / days)}%`}
          caption="Reserved rooms / total rooms"
          icon={BedDouble}
          accent="peach"
        />
        <Stat
          title="Reservations"
          value={String(bookings.length)}
          caption="Stays starting in selected period"
          icon={CalendarCheck2}
          accent="blue"
        />
        <Stat
          title="Unique guests"
          value={String(new Set(bookings.map((b) => b.guestId)).size)}
          caption="Across selected reservations"
          icon={Users}
          accent="purple"
        />
      </div>
      <div className="dashboard-charts">
        <Card
          title="Nightly booked revenue"
          subtitle="Value allocated across each night of a stay"
        >
          <RevenueChart property={property} days={days} />
        </Card>
        <Card
          title="Where guests find you"
          subtitle="Booking sources for selected stays"
        >
          <div className="source-list">
            {sourceCounts.map((s) => (
              <div key={s.source}>
                <p>
                  {s.source}
                  <strong>{s.count}</strong>
                </p>
                <div className="progress-track">
                  <i
                    style={{
                      width: `${bookings.length ? (s.count / bookings.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card
        title="Property performance"
        subtitle="Compare your collection within the selected period"
      >
        <Table
          headings={[
            "Property",
            "Rooms",
            "Occupancy today",
            "Booked revenue",
            "",
          ]}
        >
          {data.properties
            .filter((p) => property === "all" || p.id === property)
            .map((p) => (
              <tr key={p.id}>
                <td>
                  <a className="strong-link" href={`#/properties/${p.id}`}>
                    {p.name}
                  </a>
                  <small>{p.city}</small>
                </td>
                <td>{occupancy(data, p.id).total}</td>
                <td>{occupancy(data, p.id).percent}%</td>
                <td className="number">
                  {money(
                    revenueSeries(data, p.id, days).reduce(
                      (s, d) => s + d.revenue,
                      0,
                    ),
                  )}
                </td>
                <td>
                  <TextLink href={`#/properties/${p.id}`}>Details</TextLink>
                </td>
              </tr>
            ))}
        </Table>
      </Card>
      <p className="page-footnote">
        Reports use locally stored reservations, including sample data. Booked
        revenue is stay value, not a bank settlement or accounting statement.
      </p>
    </>
  );
}
