import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { type Data, uid, validDate } from "./model";
import { seedData } from "./seed";

const STORAGE_KEY = "haven-workspace-v1";
type FieldType = "string" | "number" | "boolean";
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function fields(value: unknown, schema: Record<string, FieldType>) {
  return (
    record(value) &&
    Object.entries(schema).every(
      ([key, type]) =>
        typeof value[key] === type &&
        (type !== "number" || Number.isFinite(value[key])),
    )
  );
}
function collection(value: unknown, schema: Record<string, FieldType>) {
  return Array.isArray(value) && value.every((item) => fields(item, schema));
}
function isShape(value: unknown): value is Data {
  if (!record(value) || value.version !== 1) return false;
  return (
    collection(value.properties, {
      id: "string",
      name: "string",
      city: "string",
      address: "string",
      type: "string",
      image: "string",
    }) &&
    collection(value.rooms, {
      id: "string",
      propertyId: "string",
      number: "string",
      type: "string",
      capacity: "number",
      status: "string",
    }) &&
    collection(value.guests, {
      id: "string",
      name: "string",
      email: "string",
      phone: "string",
      country: "string",
      vip: "boolean",
      notes: "string",
    }) &&
    collection(value.bookings, {
      id: "string",
      roomId: "string",
      guestId: "string",
      checkIn: "string",
      checkOut: "string",
      status: "string",
      people: "number",
      rateAtBooking: "number",
      total: "number",
      paid: "number",
      source: "string",
      notes: "string",
      createdAt: "string",
    }) &&
    collection(value.rates, {
      id: "string",
      propertyId: "string",
      roomType: "string",
      name: "string",
      price: "number",
      from: "string",
      to: "string",
      active: "boolean",
    }) &&
    collection(value.tasks, {
      id: "string",
      roomId: "string",
      title: "string",
      kind: "string",
      priority: "string",
      status: "string",
      assignee: "string",
      due: "string",
      notes: "string",
    }) &&
    collection(value.activity, {
      id: "string",
      title: "string",
      detail: "string",
      date: "string",
      category: "string",
    }) &&
    fields(value.settings, {
      name: "string",
      email: "string",
      workspace: "string",
      compact: "boolean",
    }) &&
    typeof value.readAt === "string"
  );
}

export function isData(value: unknown): value is Data {
  if (!isShape(value)) return false;
  const { properties, rooms, guests, bookings, rates, tasks, activity } = value;
  const unique = (items: { id: string }[]) =>
    new Set(items.map((item) => item.id)).size === items.length;
  return (
    [properties, rooms, guests, bookings, rates, tasks, activity].every(
      unique,
    ) &&
    rooms.every(
      (r) =>
        properties.some((p) => p.id === r.propertyId) &&
        ["ready", "cleaning", "maintenance"].includes(r.status) &&
        Number.isInteger(r.capacity) &&
        r.capacity > 0,
    ) &&
    bookings.every(
      (b) =>
        rooms.some((r) => r.id === b.roomId) &&
        guests.some((g) => g.id === b.guestId) &&
        [
          "pending",
          "confirmed",
          "checked-in",
          "checked-out",
          "cancelled",
        ].includes(b.status) &&
        validDate(b.checkIn) &&
        validDate(b.checkOut) &&
        b.checkIn < b.checkOut &&
        Number.isFinite(Date.parse(b.createdAt)) &&
        b.total > 0 &&
        b.rateAtBooking > 0 &&
        b.paid >= 0 &&
        b.paid <= b.total &&
        Number.isInteger(b.people) &&
        b.people > 0,
    ) &&
    rates.every(
      (r) =>
        properties.some((p) => p.id === r.propertyId) &&
        r.price > 0 &&
        validDate(r.from) &&
        validDate(r.to) &&
        r.from <= r.to,
    ) &&
    tasks.every(
      (t) =>
        rooms.some((r) => r.id === t.roomId) &&
        ["maintenance", "housekeeping"].includes(t.kind) &&
        ["low", "medium", "high"].includes(t.priority) &&
        ["todo", "in-progress", "done"].includes(t.status) &&
        validDate(t.due),
    ) &&
    activity.every((a) => Number.isFinite(Date.parse(a.date))) &&
    (value.readAt === "" || Number.isFinite(Date.parse(value.readAt)))
  );
}

function load(): { data: Data; warning: string } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { data: seedData(), warning: "" };
    const parsed: unknown = JSON.parse(saved);
    if (isData(parsed)) return { data: parsed, warning: "" };
    return {
      data: seedData(),
      warning:
        "Saved data could not be loaded. The sample workspace is shown; your previous data has not been overwritten.",
    };
  } catch {
    return {
      data: seedData(),
      warning:
        "Local storage is unavailable or unreadable. Changes will last for this tab only. Export a backup before closing.",
    };
  }
}

interface Store {
  data: Data;
  update: (
    change: (current: Data) => Data,
    title: string,
    detail?: string,
    category?: string,
  ) => boolean;
  markRead: () => void;
  reset: () => void;
  storageWarning: string;
}
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(load);
  const [data, setData] = useState(initial.data);
  const currentData = useRef(data);
  const [canSave, setCanSave] = useState(!initial.warning);
  const [storageWarning, setStorageWarning] = useState(initial.warning);
  useEffect(() => {
    if (!canSave) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setStorageWarning("");
    } catch {
      setStorageWarning(
        "Your browser could not save changes. Export a backup from Settings before closing this tab.",
      );
    }
  }, [data, canSave]);
  const update: Store["update"] = (
    change,
    title,
    detail = "",
    category = "Workspace",
  ) => {
    try {
      const next = change(currentData.current);
      currentData.current = {
        ...next,
        activity: [
          {
            id: uid("event"),
            title,
            detail,
            date: new Date().toISOString(),
            category,
          },
          ...next.activity,
        ].slice(0, 500),
      };
      setData(currentData.current);
      toast.success(title);
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "We couldn't save that change.",
      );
      return false;
    }
  };
  return (
    <Context.Provider
      value={{
        data,
        update,
        storageWarning,
        markRead: () => {
          currentData.current = {
            ...currentData.current,
            readAt: new Date().toISOString(),
          };
          setData(currentData.current);
        },
        reset: () => {
          const next = seedData();
          currentData.current = next;
          setData(next);
          setCanSave(true);
          toast.success("Sample workspace reset");
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const store = useContext(Context);
  if (!store) throw new Error("StoreProvider is required.");
  return store;
}
