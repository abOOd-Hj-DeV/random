import { useState } from "react";
import {
  BookOpen,
  Building2,
  CalendarCheck2,
  Database,
  Download,
  FileCheck2,
  HardDrive,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { csv, dateLabel, downloadFile, today } from "./model";
import { useStore } from "./store";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Confirm,
  Empty,
  Field,
  PageHeading,
  SearchInput,
  TextLink,
  usePagination,
} from "./ui";

export function ActivityPage({
  initialCategory = "all",
}: {
  initialCategory?: string;
}) {
  const { data } = useStore();
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState("");
  const events = data.activity.filter(
    (a) =>
      (category === "all" || a.category === category) &&
      `${a.title} ${a.detail}`.toLowerCase().includes(search.toLowerCase()),
  );
  const { visible, control } = usePagination(events, category + search, 12);
  return (
    <>
      <PageHeading
        eyebrow="A CLEAR TRAIL OF THE LITTLE THINGS"
        title="Activity log"
        description="Changes, decisions, and everyday progress across your workspace."
      >
        <Button
          onClick={() =>
            downloadFile(
              "haven-activity.csv",
              csv([
                ["Date", "Category", "Action", "Details"],
                ...events.map((a) => [a.date, a.category, a.title, a.detail]),
              ]),
            )
          }
        >
          <Download size={15} />
          Export log
        </Button>
      </PageHeading>
      <Card>
        <div className="list-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search activity…"
          />
          <select
            aria-label="Activity category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All activity</option>
            {[
              "Workspace",
              "Properties",
              "Reservations",
              "Guests",
              "Rates",
              "Operations",
              "Billing",
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="activity-list">
          {visible.map((event, i) => (
            <div className="activity-event" key={event.id}>
              <div className={`event-icon event-${i % 3}`}>
                <FileCheck2 size={17} />
              </div>
              <div>
                <div className="event-heading">
                  <strong>{event.title}</strong>
                  <span>{dateLabel(event.date, "MMM d · h:mm a")}</span>
                </div>
                <p>{event.detail}</p>
                <Badge value={event.category.toLowerCase()} />
              </div>
            </div>
          ))}
        </div>
        {!visible.length && <Empty title="No matching activity" />} {control}
      </Card>
      <p className="page-footnote">
        The most recent 500 events are kept in this browser. Export the log to
        keep a longer history.
      </p>
    </>
  );
}

export function Settings() {
  const { data, update, reset, storageWarning } = useStore();
  const [form, setForm] = useState(data.settings);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <PageHeading
        eyebrow="MAKE YOURSELF AT HOME"
        title="Workspace settings"
        description="A few personal touches. A workspace that feels like yours."
      />
      <div className="settings-layout">
        <div className="settings-nav">
          <button
            onClick={() =>
              document
                .getElementById("profile")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <Users size={16} />
            Your profile
          </button>
          <button
            onClick={() =>
              document
                .getElementById("workspace")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <Settings2 size={16} />
            Preferences
          </button>
          <button
            onClick={() =>
              document
                .getElementById("data")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <Database size={16} />
            Workspace data
          </button>
        </div>
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update((current) => {
                if (!form.name.trim() || !form.workspace.trim())
                  throw new Error("Enter a name and workspace name.");
                return {
                  ...current,
                  settings: {
                    ...form,
                    name: form.name.trim(),
                    workspace: form.workspace.trim(),
                  },
                };
              }, "Workspace preferences saved");
            }}
          >
            <Card
              title="Your profile"
              subtitle="The person behind the warm welcomes."
              className="settings-card"
            >
              <div id="profile" className="form-body">
                <div className="profile-preview">
                  <Avatar name={form.name || "Alex"} large />
                  <div>
                    <strong>{form.name || "Your name"}</strong>
                    <p>Workspace administrator · local profile</p>
                  </div>
                </div>
                <div className="form-grid">
                  <Field label="Full name">
                    <input
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Email address">
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                  </Field>
                </div>
              </div>
            </Card>
            <Card
              title="Workspace preferences"
              subtitle="Small details that make it yours."
              className="settings-card"
            >
              <div id="workspace" className="form-body">
                <Field label="Workspace name">
                  <input
                    required
                    value={form.workspace}
                    onChange={(e) =>
                      setForm({ ...form, workspace: e.target.value })
                    }
                  />
                </Field>
                <div className="setting-toggle">
                  <div>
                    <strong>Compact tables</strong>
                    <p>Show more records with a little less vertical space.</p>
                  </div>
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label="Compact tables"
                    checked={form.compact}
                    onChange={(e) =>
                      setForm({ ...form, compact: e.target.checked })
                    }
                  />
                </div>
                <div className="modal-actions">
                  <Button variant="primary" type="submit">
                    Save preferences
                  </Button>
                </div>
              </div>
            </Card>
          </form>
          <Card
            title="Your data, in your hands"
            subtitle="This is a frontend workspace with local browser storage."
            className="settings-card"
          >
            <div id="data" className="form-body">
              <div className="storage-note">
                <HardDrive size={23} />
                <div>
                  <strong>
                    {storageWarning
                      ? "Local saving needs attention"
                      : "Saved on this device"}
                  </strong>
                  <p>
                    {storageWarning ||
                      "Changes stay after refresh. They are not shared across devices or users, and clearing browser data removes them."}
                  </p>
                </div>
              </div>
              <div className="setting-row">
                <div>
                  <strong>Export workspace backup</strong>
                  <p>
                    Download all properties, reservations, guests, and activity
                    as JSON.
                  </p>
                </div>
                <Button
                  onClick={() =>
                    downloadFile(
                      `haven-backup-${today()}.json`,
                      JSON.stringify(data, null, 2),
                      "application/json",
                    )
                  }
                >
                  <Download size={15} />
                  Export backup
                </Button>
              </div>
              <div className="setting-row">
                <div>
                  <strong>Start fresh with sample data</strong>
                  <p>
                    Replace this browser's workspace with a fresh demo
                    collection.
                  </p>
                </div>
                <Button variant="danger" onClick={() => setConfirm(true)}>
                  <RotateCcw size={14} />
                  Reset demo
                </Button>
              </div>
            </div>
          </Card>
          <div className="info-banner">
            <ShieldCheck size={20} />
            <div>
              <strong>A thoughtful demo, without a backend.</strong>
              <p>
                Use sample information. This workspace does not provide
                authentication, real payments, email delivery, or cloud storage.
              </p>
            </div>
          </div>
        </div>
      </div>
      {confirm && (
        <Confirm
          title="Reset this workspace?"
          description="All local changes will be replaced with sample data. Export a backup first if you want to keep a copy."
          confirm="Reset workspace"
          danger
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            reset();
            setConfirm(false);
            location.hash = "/overview";
          }}
        />
      )}
    </>
  );
}

export function Help() {
  const guides = [
    {
      icon: Building2,
      title: "Build your collection",
      detail:
        "Add a property, create its rooms, then set an active nightly rate for each room type.",
      href: "#/properties",
      action: "Manage properties",
    },
    {
      icon: CalendarCheck2,
      title: "Welcome your next guest",
      detail:
        "Choose a room, dates, and guest. Availability is checked and the price is locked at booking.",
      href: "#/reservations",
      action: "Explore reservations",
    },
    {
      icon: Users,
      title: "Remember the little things",
      detail:
        "Save guest preferences and contact details. Mark VIP guests and see their complete stay history.",
      href: "#/guests",
      action: "Meet your guests",
    },
    {
      icon: Sparkles,
      title: "Keep every room at its best",
      detail:
        "Create tasks, assign a teammate, and track progress. Completing all room tasks returns it to ready inventory.",
      href: "#/housekeeping",
      action: "Open housekeeping",
    },
    {
      icon: FileCheck2,
      title: "Stay on top of payments",
      detail:
        "Record offline payments or refunds against an invoice. Print a stay summary or export your invoice list.",
      href: "#/billing",
      action: "Review billing",
    },
    {
      icon: Database,
      title: "Understand your workspace",
      detail:
        "Your changes are saved in this browser. Download a JSON backup before clearing data or resetting the demo.",
      href: "#/settings",
      action: "Workspace settings",
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE GUIDANCE GOES A LONG WAY"
        title="Welcome to Haven"
        description="Your guide to a calmer, more connected way to manage your collection."
      />
      <div className="help-hero">
        <BookOpen size={34} strokeWidth={1.3} />
        <div>
          <h2>Less busywork. More hospitality.</h2>
          <p>
            Everything you need to explore the workspace, one thoughtful step at
            a time.
          </p>
        </div>
      </div>
      <div className="help-grid">
        {guides.map((g) => (
          <Card key={g.title}>
            <div className="help-card">
              <span>
                <g.icon size={23} strokeWidth={1.5} />
              </span>
              <h2>{g.title}</h2>
              <p>{g.detail}</p>
              <TextLink href={g.href}>{g.action}</TextLink>
            </div>
          </Card>
        ))}
      </div>
      <Card title="Good to know">
        <div className="faq-list">
          <details>
            <summary>
              Does this connect to booking platforms or send emails?
            </summary>
            <p>
              No. Booking sources are labels for local records. This frontend
              has no external booking integration or email service.
            </p>
          </details>
          <details>
            <summary>Can I use the workspace on another device?</summary>
            <p>
              The interface works on phones and tablets, but each browser has
              its own data. There is no cloud sync or team access.
            </p>
          </details>
          <details>
            <summary>What happens when I check a guest out?</summary>
            <p>
              The room is marked for cleaning and a departure-clean task is
              created. Complete all open tasks for that room to make it ready
              again.
            </p>
          </details>
          <details>
            <summary>How are reports calculated?</summary>
            <p>
              Booked revenue allocates each reservation's locked average nightly
              price across the nights in the reporting window. Cancelled stays
              are excluded. Occupancy uses active reservations per day.
            </p>
          </details>
        </div>
      </Card>
    </>
  );
}
