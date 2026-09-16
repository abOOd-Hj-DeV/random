import { type Data, type Booking, type Guest, shiftDate, today } from "./model";

export function seedData(): Data {
  const now = today();
  const properties = [
    {
      id: "meridian",
      name: "The Grand Meridian",
      city: "New York, NY",
      address: "128 Madison Avenue",
      type: "Boutique hotel",
      image: "/images/meridian.jpg",
    },
    {
      id: "azure",
      name: "Azure Coast Resort",
      city: "Miami, FL",
      address: "46 Ocean Drive",
      type: "Coastal resort",
      image: "/images/azure.jpg",
    },
    {
      id: "willow",
      name: "The Willow House",
      city: "Hudson Valley, NY",
      address: "12 Willow Lane",
      type: "Country retreat",
      image: "/images/willow.jpg",
    },
  ];
  const rooms = properties.flatMap((p) =>
    Array.from({ length: 8 }, (_, i) => ({
      id: `${p.id}-${i + 1}`,
      propertyId: p.id,
      number: `${Math.floor(i / 2) + 1}0${(i % 2) + 1}`,
      type: i < 4 ? "Deluxe" : i < 6 ? "Suite" : "Penthouse",
      capacity: i < 4 ? 2 : 4,
      status: (i === 7
        ? "maintenance"
        : i === 6
          ? "cleaning"
          : "ready") as Data["rooms"][number]["status"],
    })),
  );
  const guests: Guest[] = [
    [
      "Amelia Bennett",
      "amelia@example.com",
      "+1 212 555 0142",
      "United States",
    ],
    ["Oliver Chen", "oliver@example.com", "+1 415 555 0168", "Singapore"],
    ["Sofia Laurent", "sofia@example.com", "+33 1 55 50 0192", "France"],
    [
      "James Harrison",
      "james@example.com",
      "+44 20 5550 0184",
      "United Kingdom",
    ],
    ["Isabella Rossi", "isabella@example.com", "+39 02 555 0175", "Italy"],
    ["Noah Williams", "noah@example.com", "+1 310 555 0150", "United States"],
    ["Yuki Tanaka", "yuki@example.com", "+81 3 5550 0199", "Japan"],
    ["Emma Andersson", "emma@example.com", "+46 8 555 0142", "Sweden"],
  ].map(([name, email, phone, country], i) => ({
    id: `guest-${i + 1}`,
    name,
    email,
    phone,
    country,
    vip: i === 0 || i === 3,
    notes:
      i === 0 ? "Prefers a quiet room on a high floor. Returning guest." : "",
  }));
  const rates = properties.flatMap((p, i) =>
    ["Deluxe", "Suite", "Penthouse"].map((roomType, j) => ({
      id: `${p.id}-rate-${j}`,
      propertyId: p.id,
      roomType,
      name: `${roomType} flexible rate`,
      price: [185, 295, 480][j] + i * 25,
      from: shiftDate(now, -400),
      to: shiftDate(now, 730),
      active: true,
    })),
  );
  const bookings: Booking[] = [];
  properties.forEach((p, pi) => {
    const specs = [
      [-2, 2, "checked-in"],
      [0, 3, "confirmed"],
      [-3, 0, "checked-in"],
      [1, 4, "confirmed"],
      [-1, 3, "checked-in"],
      [0, 2, "pending"],
    ] as const;
    specs.forEach(([start, end, status], i) => {
      const room = rooms.find((r) => r.id === `${p.id}-${i + 1}`)!;
      const price = rates.find(
        (r) => r.propertyId === p.id && r.roomType === room.type,
      )!.price;
      bookings.push({
        id: `HV-${1042 + pi * 10 + i}`,
        roomId: room.id,
        guestId: guests[(pi * 2 + i) % guests.length].id,
        checkIn: shiftDate(now, start),
        checkOut: shiftDate(now, end),
        status,
        people: 2,
        rateAtBooking: price,
        total: (end - start) * price,
        paid: i % 2 === 0 ? (end - start) * price : 0,
        source: ["Direct", "Booking.com", "Airbnb"][i % 3],
        notes:
          i === 0 ? "Late arrival requested. Welcome amenities prepared." : "",
        createdAt: shiftDate(now, -8) + "T09:00:00Z",
      });
    });
    for (let i = 1; i <= 12; i++) {
      const daysAgo = i * 5 + pi;
      const price = 185 + pi * 25;
      bookings.push({
        id: `HV-${2000 + pi * 100 + i}`,
        roomId: `${p.id}-1`,
        guestId: guests[i % guests.length].id,
        checkIn: shiftDate(now, -daysAgo - 2),
        checkOut: shiftDate(now, -daysAgo),
        status: "checked-out",
        people: 2,
        rateAtBooking: price,
        total: price * 2,
        paid: price * 2,
        source: ["Direct", "Booking.com", "Airbnb"][i % 3],
        notes: "",
        createdAt: shiftDate(now, -daysAgo - 10) + "T09:00:00Z",
      });
    }
  });
  return {
    version: 1,
    properties,
    rooms,
    guests,
    bookings,
    rates,
    tasks: properties.flatMap((p, i) => [
      {
        id: `task-${i}-m`,
        roomId: `${p.id}-8`,
        title: [
          "Air conditioning inspection",
          "Balcony door repair",
          "Bathroom fixture replacement",
        ][i],
        kind: "maintenance" as const,
        priority: "high" as const,
        status: "todo" as const,
        assignee: "Alex Morgan",
        due: now,
        notes: "Please inspect the room before the next arrival.",
      },
      {
        id: `task-${i}-h`,
        roomId: `${p.id}-7`,
        title: "Deep clean & linen refresh",
        kind: "housekeeping" as const,
        priority: "medium" as const,
        status: "in-progress" as const,
        assignee: "Sarah Davis",
        due: now,
        notes: "",
      },
    ]),
    activity: [
      {
        id: "event-1",
        title: "Your workspace is ready",
        detail: "Explore the sample portfolio or add your own properties.",
        date: new Date().toISOString(),
        category: "Workspace",
      },
      {
        id: "event-2",
        title: "Morning operations prepared",
        detail: "3 maintenance tasks and 3 housekeeping tasks need attention.",
        date: now + "T07:30:00",
        category: "Operations",
      },
      {
        id: "event-3",
        title: "Flexible rates are active",
        detail: "Nightly prices are locked when a reservation is created.",
        date: now + "T06:00:00",
        category: "Rates",
      },
    ],
    settings: {
      name: "Alex Morgan",
      email: "alex@example.com",
      workspace: "Haven Collection",
      compact: false,
    },
    readAt: "",
  };
}
