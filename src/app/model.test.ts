import assert from "node:assert/strict";
import { test } from "node:test";
import {
  type BookingInput,
  completeTask,
  createBooking,
  csv,
  money,
  occupancy,
  quote,
  recordPayment,
  saveRate,
  shiftDate,
  today,
  transitionBooking,
} from "./model";
import { seedData } from "./seed";
import { isData } from "./store";

function input(overrides: Partial<BookingInput> = {}): BookingInput {
  return {
    roomId: "meridian-1",
    guestId: "guest-1",
    checkIn: shiftDate(today(), 10),
    checkOut: shiftDate(today(), 12),
    people: 2,
    source: "Direct",
    notes: "",
    ...overrides,
  };
}

test("valid booking locks its total and nightly price against subsequent rate edits", () => {
  const data = seedData();
  const booking = createBooking(data, input());
  const changed = saveRate(
    { ...data, bookings: [booking, ...data.bookings] },
    { ...data.rates[0], price: 399 },
  );
  assert.equal(booking.total, 370);
  assert.equal(changed.bookings[0].total, 370);
  assert.equal(changed.bookings[0].rateAtBooking, 185);
  assert.equal(
    createBooking(
      changed,
      input({
        checkIn: shiftDate(today(), 20),
        checkOut: shiftDate(today(), 22),
      }),
    ).total,
    798,
  );
});

test("overlapping bookings are rejected, including a stay surrounding an existing stay", () => {
  const data = seedData();
  data.bookings.unshift(createBooking(data, input()));
  for (const [start, end] of [
    [10, 12],
    [9, 11],
    [11, 13],
    [9, 13],
  ]) {
    assert.throws(
      () =>
        createBooking(
          data,
          input({
            checkIn: shiftDate(today(), start),
            checkOut: shiftDate(today(), end),
          }),
        ),
      /already has a booking/,
    );
  }
  assert.doesNotThrow(() =>
    createBooking(
      data,
      input({
        checkIn: shiftDate(today(), 12),
        checkOut: shiftDate(today(), 14),
      }),
    ),
  );
});

test("room readiness, capacity, identities and invalid dates are enforced", () => {
  const data = seedData();
  for (const override of [
    { roomId: "missing" },
    { guestId: "missing" },
    { roomId: "meridian-8" },
    { people: 3 },
    { people: 1.5 },
    { checkIn: shiftDate(today(), -1) },
    { checkIn: "2026-02-30" },
    { checkOut: "" },
    { checkOut: shiftDate(today(), 10) },
    { checkOut: shiftDate(today(), 400) },
  ])
    assert.throws(() => createBooking(data, input(override)));
});

test("quotes require coverage for every night and sum separate seasonal rates", () => {
  const data = seedData();
  data.rates[0] = { ...data.rates[0], to: shiftDate(today(), 10) };
  assert.throws(
    () =>
      quote(
        data,
        data.rooms[0],
        shiftDate(today(), 10),
        shiftDate(today(), 12),
      ),
    /No active rate/,
  );
  const next = saveRate(data, {
    ...data.rates[0],
    id: "summer",
    from: shiftDate(today(), 11),
    to: shiftDate(today(), 30),
    price: 220.25,
  });
  const pricing = quote(
    next,
    next.rooms[0],
    shiftDate(today(), 10),
    shiftDate(today(), 12),
  );
  assert.equal(pricing.total, 405.25);
  assert.equal(pricing.nights, 2);
  assert.equal(pricing.average, 202.625);
});

test("active rate periods cannot overlap, while inactive plans can", () => {
  const data = seedData();
  const rate = { ...data.rates[0], id: "duplicate" };
  assert.throws(() => saveRate(data, rate), /already covers/);
  assert.doesNotThrow(() => saveRate(data, { ...rate, active: false }));
  assert.throws(
    () => saveRate(data, { ...rate, roomType: "Unknown" }),
    /existing property and room type/,
  );
  assert.throws(
    () => saveRate(data, { ...rate, price: -1 }),
    /positive nightly price/,
  );
});

test("payments accept decimal amounts, cap balances and support bounded refunds", () => {
  const data = seedData();
  const booking = createBooking(data, input());
  data.bookings.unshift(booking);
  const next = recordPayment(data, booking.id, 19.99);
  assert.equal(next.bookings[0].paid, 19.99);
  assert.equal(recordPayment(next, booking.id, -19.99).bookings[0].paid, 0);
  assert.throws(() => recordPayment(next, booking.id, -20), /exceeds/);
  assert.throws(() => recordPayment(next, booking.id, 370), /exceeds/);
  for (const amount of [NaN, Infinity, 0, 1.001])
    assert.throws(
      () => recordPayment(next, booking.id, amount),
      /valid amount/,
    );
  assert.equal(money(19.99), "$19.99");
});

test("cancellation requires a refund and releases dates for a new reservation", () => {
  const data = seedData();
  const booking = createBooking(data, input());
  data.bookings.unshift(booking);
  const paid = recordPayment(data, booking.id, 100);
  assert.throws(
    () => transitionBooking(paid, booking.id, "cancelled"),
    /Refund/,
  );
  const cancelled = transitionBooking(
    recordPayment(paid, booking.id, -100),
    booking.id,
    "cancelled",
  );
  assert.doesNotThrow(() => createBooking(cancelled, input()));
  assert.throws(
    () => recordPayment(cancelled, booking.id, 10),
    /active invoice/,
  );
  assert.throws(
    () => transitionBooking(cancelled, booking.id, "confirmed"),
    /cannot move/,
  );
});

test("check-in rejects future stays and rooms that are not ready", () => {
  const data = seedData();
  const booking = createBooking(data, input());
  data.bookings.unshift(booking);
  assert.throws(
    () => transitionBooking(data, booking.id, "checked-in"),
    /reserved stay/,
  );
  data.rooms[1].status = "maintenance";
  assert.throws(
    () => transitionBooking(data, "HV-1043", "checked-in"),
    /must be ready/,
  );
});

test("checkout creates a departure clean and task completion restores readiness", () => {
  const data = seedData();
  const checked = transitionBooking(data, "HV-1043", "checked-in");
  const out = transitionBooking(checked, "HV-1043", "checked-out");
  assert.equal(out.rooms[1].status, "cleaning");
  assert.equal(out.tasks[0].roomId, "meridian-2");
  assert.equal(out.tasks[0].kind, "housekeeping");
  const complete = completeTask(out, out.tasks[0].id, "done");
  assert.equal(complete.rooms[1].status, "ready");
  assert.equal(
    completeTask(complete, out.tasks[0].id, "todo").rooms[1].status,
    "cleaning",
  );
  assert.throws(
    () => transitionBooking(out, "HV-1043", "checked-out"),
    /cannot move/,
  );
});

test("an overdue in-house guest must check out before the next arrival checks in", () => {
  const data = seedData();
  data.bookings.unshift({
    ...data.bookings[0],
    id: "overdue",
    roomId: "meridian-2",
    checkIn: shiftDate(today(), -3),
    checkOut: today(),
    status: "checked-in",
  });
  assert.throws(
    () => transitionBooking(data, "HV-1043", "checked-in"),
    /Check out the current guest/,
  );
});

test("checkout and cleaning completion preserve an outstanding maintenance block", () => {
  const data = seedData();
  data.rooms[0].status = "maintenance";
  data.tasks.unshift({
    ...data.tasks[0],
    id: "active-repair",
    roomId: "meridian-1",
  });
  const out = transitionBooking(data, "HV-1042", "checked-out");
  assert.equal(out.rooms[0].status, "maintenance");
  const clean = completeTask(out, out.tasks[0].id, "done");
  assert.equal(clean.rooms[0].status, "maintenance");
  assert.equal(
    completeTask(clean, "active-repair", "done").rooms[0].status,
    "ready",
  );
});

test("historical occupancy includes completed stays and excludes cancellations", () => {
  const data = seedData();
  const historical = data.bookings.find((b) => b.status === "checked-out")!;
  assert.ok(occupancy(data, "meridian", historical.checkIn).occupied > 0);
  const none = {
    ...data,
    bookings: data.bookings.map((b) => ({
      ...b,
      status: "cancelled" as const,
    })),
  };
  assert.equal(occupancy(none).occupied, 0);
  assert.equal(occupancy(data, "missing").percent, 0);
});

test("saved data validation rejects broken references, dates and states", () => {
  const data = seedData();
  assert.ok(isData(data));
  assert.equal(isData({ ...data, version: 2 }), false);
  assert.equal(
    isData({
      ...data,
      bookings: [{ ...data.bookings[0], guestId: "missing" }],
    }),
    false,
  );
  assert.equal(
    isData({
      ...data,
      bookings: [{ ...data.bookings[0], checkIn: "bad date" }],
    }),
    false,
  );
  assert.equal(
    isData({ ...data, bookings: [{ ...data.bookings[0], status: "unknown" }] }),
    false,
  );
  assert.equal(
    isData({ ...data, rooms: [...data.rooms, data.rooms[0]] }),
    false,
  );
  assert.equal(
    isData({ ...data, tasks: [{ ...data.tasks[0], kind: "unknown" }] }),
    false,
  );
  assert.equal(
    isData({ ...data, activity: [{ ...data.activity[0], date: "invalid" }] }),
    false,
  );
  assert.equal(isData(null), false);
});

test("CSV quotes multiline data and neutralizes spreadsheet formulas", () => {
  const result = csv([
    ["Guest", "Note"],
    ["A, B", 'A "warm" welcome\nBack again'],
    ["=1+1", "+value"],
  ]);
  assert.equal(
    result,
    '"Guest","Note"\r\n"A, B","A ""warm"" welcome\nBack again"\r\n"\'=1+1","\'+value"',
  );
});
