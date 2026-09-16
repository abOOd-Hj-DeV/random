import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Toaster } from "sonner";
import {
  Activity,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  CalendarRange,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CreditCard,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PieChart,
  Search,
  Settings2,
  Sparkles,
  Tag,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { StoreProvider, useStore } from "./store";
import { dateLabel, today } from "./model";
import {
  Avatar,
  Button,
  Empty,
  IconButton,
  Modal,
  SearchInput,
  TextLink,
  useRoute,
} from "./ui";
import { ActivityPage, Help, Settings } from "./Workspace";

const Dashboard = lazy(() => import("./Dashboard"));
const Reports = lazy(() =>
  import("./Dashboard").then((m) => ({ default: m.Reports })),
);
const Reservations = lazy(() => import("./Reservations"));
const Calendar = lazy(() =>
  import("./Reservations").then((m) => ({ default: m.Calendar })),
);
const ReservationDetail = lazy(() =>
  import("./Reservations").then((m) => ({ default: m.ReservationDetail })),
);
const Billing = lazy(() =>
  import("./Reservations").then((m) => ({ default: m.Billing })),
);
const Properties = lazy(() => import("./Portfolio"));
const PropertyDetail = lazy(() =>
  import("./Portfolio").then((m) => ({ default: m.PropertyDetail })),
);
const Guests = lazy(() =>
  import("./Portfolio").then((m) => ({ default: m.Guests })),
);
const GuestDetail = lazy(() =>
  import("./Portfolio").then((m) => ({ default: m.GuestDetail })),
);
const Rates = lazy(() =>
  import("./Portfolio").then((m) => ({ default: m.Rates })),
);
const Operations = lazy(() => import("./Operations"));

const navigation = [
  {
    title: "WORKSPACE",
    entries: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "properties", label: "Properties", icon: Building2 },
      { id: "calendar", label: "Stay calendar", icon: CalendarRange },
      { id: "reservations", label: "Reservations", icon: CalendarDays },
      { id: "guests", label: "Guests", icon: Users },
    ],
  },
  {
    title: "OPERATIONS",
    entries: [
      { id: "rates", label: "Rates & pricing", icon: Tag },
      { id: "housekeeping", label: "Housekeeping", icon: Sparkles },
      { id: "maintenance", label: "Maintenance", icon: Wrench },
      { id: "billing", label: "Billing & payments", icon: CreditCard },
    ],
  },
  {
    title: "INTELLIGENCE",
    entries: [
      { id: "reports", label: "Insights & reports", icon: PieChart },
      { id: "activity", label: "Activity log", icon: Activity },
    ],
  },
];

function GlobalSearch({ onClose }: { onClose: () => void }) {
  const { data } = useStore();
  const [search, setSearch] = useState("");
  const q = search.toLowerCase().trim();
  const results = [
    ...navigation.flatMap((group) =>
      group.entries.map((entry) => ({
        title: entry.label,
        detail: "Workspace page",
        href: `#/${entry.id}`,
        icon: entry.icon,
      })),
    ),
    ...data.properties.map((p) => ({
      title: p.name,
      detail: `Property · ${p.city}`,
      href: `#/properties/${p.id}`,
      icon: Building2,
    })),
    ...data.guests.map((g) => ({
      title: g.name,
      detail: `Guest · ${g.email}`,
      href: `#/guests/${g.id}`,
      icon: Users,
    })),
    ...data.bookings.map((b) => ({
      title: `${b.id} · ${data.guests.find((g) => g.id === b.guestId)?.name}`,
      detail: `Reservation · ${b.checkIn}`,
      href: `#/reservations/${b.id}`,
      icon: CalendarDays,
    })),
  ]
    .filter((r) => !q || `${r.title} ${r.detail}`.toLowerCase().includes(q))
    .slice(0, 12);
  return (
    <Modal
      title="Find your way"
      description="Search pages, properties, guests, and reservations."
      onClose={onClose}
    >
      <div className="command-search">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Where would you like to go?"
        />
      </div>
      <div className="command-results">
        {results.map((r) => (
          <a href={r.href} key={r.href} onClick={onClose}>
            <span>
              <r.icon size={18} />
            </span>
            <div>
              <strong>{r.title}</strong>
              <small>{r.detail}</small>
            </div>
            <ChevronRight size={15} />
          </a>
        ))}
        {!results.length && (
          <Empty
            title="No results found"
            description="Try a name, reservation ID, or page title."
          />
        )}
      </div>
      <div className="command-footer">
        Navigate with Tab · Enter to open · Esc to close
      </div>
    </Modal>
  );
}

function Shell() {
  const { data, storageWarning, markRead } = useStore();
  const route = useRoute();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  const property = data.properties.some((p) => p.id === selectedProperty)
    ? selectedProperty
    : "all";
  const pageName =
    navigation.flatMap((n) => n.entries).find((n) => n.id === route.page)
      ?.label ||
    (route.page === "settings"
      ? "Settings"
      : route.page === "help"
        ? "Help & getting started"
        : "Page not found");
  const unread = data.activity.filter((a) => a.date > data.readAt).length;
  useEffect(() => {
    document.title = `${pageName} · Haven`;
    setMobileOpen(false);
  }, [route.path, pageName]);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const sync = () => {
      if (sidebar.current) sidebar.current.inert = media.matches && !mobileOpen;
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [mobileOpen]);
  const content = () => {
    switch (route.page) {
      case "overview":
        return <Dashboard property={property} />;
      case "properties":
        return route.id ? (
          <PropertyDetail key={route.id} id={route.id} />
        ) : (
          <Properties property={property} />
        );
      case "calendar":
        return <Calendar property={property} />;
      case "reservations":
        return route.id ? (
          <ReservationDetail key={route.id} id={route.id} />
        ) : (
          <Reservations property={property} />
        );
      case "guests":
        return route.id ? (
          <GuestDetail key={route.id} id={route.id} />
        ) : (
          <Guests />
        );
      case "rates":
        return <Rates property={property} />;
      case "housekeeping":
        return (
          <Operations
            key="housekeeping"
            kind="housekeeping"
            property={property}
          />
        );
      case "maintenance":
        return (
          <Operations
            key="maintenance"
            kind="maintenance"
            property={property}
          />
        );
      case "billing":
        return route.id ? (
          <ReservationDetail key={route.id} id={route.id} invoice />
        ) : (
          <Billing property={property} />
        );
      case "reports":
        return <Reports property={property} />;
      case "activity":
        return (
          <ActivityPage
            key={route.path}
            initialCategory={route.query.get("category") || "all"}
          />
        );
      case "settings":
        return <Settings />;
      case "help":
        return <Help />;
      default:
        return (
          <Empty
            title="A little off the beaten path"
            description="This page doesn't exist. Let's get you somewhere familiar."
          >
            <TextLink href="#/overview">Back to overview</TextLink>
          </Empty>
        );
    }
  };
  return (
    <div
      className={`app-shell ${collapsed ? "sidebar-collapsed" : ""} ${mobileOpen ? "mobile-open" : ""} ${data.settings.compact ? "compact" : ""}`}
    >
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to main content
      </a>
      {mobileOpen && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        ref={sidebar}
        className="sidebar"
        aria-label="Main navigation"
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a"))
            setMobileOpen(false);
        }}
      >
        <div className="brand-row">
          <a href="#/overview" className="brand" aria-label="Haven overview">
            <span className="brand-symbol">
              <i />
              <i />
              <i />
            </span>
            <span>
              haven<span className="brand-period">.</span>
            </span>
          </a>
          <button
            className="mobile-close icon-btn"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            <X size={19} />
          </button>
        </div>
        <a
          className="workspace-switch"
          href="#/settings"
          title={data.settings.workspace}
        >
          <span className="workspace-symbol">HC</span>
          <div>
            <strong>{data.settings.workspace}</strong>
            <small>Property workspace</small>
          </div>
          <ChevronDown size={13} />
        </a>
        <nav>
          {navigation.map((group) => (
            <div className="nav-group" key={group.title}>
              <p>{group.title}</p>
              {group.entries.map((entry) => (
                <a
                  key={entry.id}
                  title={entry.label}
                  href={`#/${entry.id}`}
                  className={route.page === entry.id ? "active" : ""}
                  aria-current={route.page === entry.id ? "page" : undefined}
                >
                  <entry.icon size={18} strokeWidth={1.6} />
                  <span>{entry.label}</span>
                  {entry.id === "reservations" && (
                    <b>
                      {
                        data.bookings.filter((b) => b.status === "pending")
                          .length
                      }
                    </b>
                  )}
                  {route.page === entry.id && <i />}
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a href="#/help" className="sidebar-help">
            <div className="help-spark">
              <Sparkles size={18} />
            </div>
            <strong>A little help along the way</strong>
            <p>Make the most of your workspace.</p>
            <span>
              Explore the guide <ArrowUpRight size={14} />
            </span>
          </a>
          <a
            className={
              route.page === "settings"
                ? "sidebar-settings active"
                : "sidebar-settings"
            }
            href="#/settings"
            title="Settings"
          >
            <Settings2 size={18} />
            <span>Settings</span>
          </a>
          <div className="sidebar-profile">
            <a href="#/settings" title="Your profile">
              <Avatar name={data.settings.name} />
              <div>
                <strong>{data.settings.name}</strong>
                <small>Workspace admin</small>
              </div>
            </a>
            <button
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setCollapsed((v) => !v)}
            >
              {collapsed ? (
                <PanelLeftOpen size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-btn"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{pageName}</strong>
          </div>
          <div className="topbar-right">
            <button
              className="global-search-trigger"
              onClick={() => setSearchOpen(true)}
              aria-label="Search workspace"
            >
              <Search size={17} />
              <span>Search anything…</span>
              <kbd>⌘ K</kbd>
            </button>
            <span className="topbar-divider" />
            <IconButton
              icon={CircleHelp}
              title="Help & guide"
              onClick={() => {
                location.hash = "/help";
              }}
            />
            <button
              className="notification-button icon-btn"
              title="Notifications"
              aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
              onClick={() => setNotifications(true)}
            >
              <Bell size={18} />
              {unread > 0 && <i />}
            </button>
            <a
              href="#/settings"
              className="topbar-avatar"
              aria-label="Your profile"
            >
              <Avatar name={data.settings.name} />
            </a>
          </div>
        </header>
        <div className="contextbar">
          <div className="context-left">
            <span className="live-dot" />
            <span>Your collection, connected</span>
          </div>
          <div className="context-right">
            {!route.id &&
              !["guests", "settings", "help", "activity"].includes(
                route.page,
              ) && (
                <label className="property-select">
                  <Building2 size={14} />
                  <span className="sr-only">Filter by property</span>
                  <select
                    value={property}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                  >
                    <option value="all">All properties</option>
                    {data.properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            <span className="context-date">
              <CalendarDays size={14} />
              {dateLabel(today(), "EEE, MMM d, yyyy")}
            </span>
          </div>
        </div>
        {storageWarning && (
          <div className="storage-warning" role="alert">
            {storageWarning} <a href="#/settings">Export your data</a>
          </div>
        )}
        <main id="main-content" tabIndex={-1}>
          <Suspense
            fallback={
              <div className="page-loading" role="status">
                <span className="loading-dot" />
                Preparing your workspace…
              </div>
            }
          >
            {content()}
          </Suspense>
        </main>
        <footer className="app-footer">
          <span>Made for the art of hospitality.</span>
          <span>
            <i />
            Local demo workspace <span className="footer-separator">/</span>
            <a href="#/help">A little help</a>
          </span>
        </footer>
      </div>
      <Toaster position="bottom-right" richColors closeButton />
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      {notifications && (
        <Modal
          title="Your workspace, in the loop"
          description={`${unread} unread updates · Latest workspace activity`}
          onClose={() => setNotifications(false)}
        >
          <div className="notification-actions">
            <Button variant="ghost" onClick={markRead}>
              <CheckCheck size={15} />
              Mark all as read
            </Button>
            <a
              className="text-link"
              href="#/activity"
              onClick={() => setNotifications(false)}
            >
              Full activity log
              <ArrowUpRight size={14} />
            </a>
          </div>
          <div className="notification-list">
            {data.activity.slice(0, 7).map((event) => (
              <a
                href="#/activity"
                key={event.id}
                onClick={() => setNotifications(false)}
                className={event.date > data.readAt ? "unread" : ""}
              >
                <span>
                  <Activity size={16} />
                </span>
                <div>
                  <strong>{event.title}</strong>
                  <p>{event.detail}</p>
                  <small>{dateLabel(event.date, "MMM d · h:mm a")}</small>
                </div>
              </a>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
