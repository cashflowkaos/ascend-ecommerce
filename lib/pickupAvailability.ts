import { prisma } from "@/lib/prisma";

export async function ensurePickupAvailability() {
  const PACIFIC_TIME_ZONE = "America/Los_Angeles";
  const SLOT_MINUTES = 30;
  const DAYS_AHEAD = 7;

  function pacificDateTimeToUtc(
    dateValue: string,
    timeValue: string
  ) {
    const [year, month, day] = dateValue.split("-").map(Number);
    const [hour, minute] = timeValue.split(":").map(Number);

    const desiredAsUtc = Date.UTC(
      year,
      month - 1,
      day,
      hour,
      minute,
      0
    );

    let guess = desiredAsUtc;

    for (let i = 0; i < 3; i += 1) {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: PACIFIC_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(new Date(guess));

      const values = Object.fromEntries(
        parts.map((part) => [part.type, part.value])
      );

      const representedAsUtc = Date.UTC(
        Number(values.year),
        Number(values.month) - 1,
        Number(values.day),
        Number(values.hour),
        Number(values.minute),
        0
      );

      guess += desiredAsUtc - representedAsUtc;
    }

    return new Date(guess);
  }

  const now = new Date();

  const todayParts = new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const todayValues = Object.fromEntries(
    todayParts.map((part) => [part.type, part.value])
  );

  const calendarStart = new Date(
    Date.UTC(
      Number(todayValues.year),
      Number(todayValues.month) - 1,
      Number(todayValues.day)
    )
  );

  const desiredSlots: {
    startsAt: Date;
    endsAt: Date;
  }[] = [];

  for (
    let dayOffset = 0;
    dayOffset < DAYS_AHEAD;
    dayOffset += 1
  ) {
    const calendarDate = new Date(
      calendarStart.getTime() +
        dayOffset * 24 * 60 * 60 * 1000
    );

    const year = calendarDate.getUTCFullYear();
    const month = String(
      calendarDate.getUTCMonth() + 1
    ).padStart(2, "0");
    const day = String(
      calendarDate.getUTCDate()
    ).padStart(2, "0");

    const dateValue = `${year}-${month}-${day}`;

    const dayOfWeek = calendarDate.getUTCDay();
    const isWeekend =
      dayOfWeek === 0 || dayOfWeek === 6;

    const startTime = isWeekend
      ? "12:00"
      : "10:00";

    const endTime = isWeekend
      ? "18:00"
      : "22:00";

    const windowStart = pacificDateTimeToUtc(
      dateValue,
      startTime
    );

    const windowEnd = pacificDateTimeToUtc(
      dateValue,
      endTime
    );

    let startsAt = windowStart;

    while (startsAt < windowEnd) {
      const endsAt = new Date(
        startsAt.getTime() +
          SLOT_MINUTES * 60 * 1000
      );

      if (endsAt > windowEnd) {
        break;
      }

      if (startsAt > now) {
        desiredSlots.push({
          startsAt,
          endsAt,
        });
      }

      startsAt = endsAt;
    }
  }

  if (desiredSlots.length === 0) {
    return;
  }

  const windowStart = desiredSlots[0].startsAt;
  const windowEnd =
    desiredSlots[desiredSlots.length - 1].endsAt;

  const existingSlots =
    await prisma.pickupAvailability.findMany({
      where: {
        startsAt: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
      select: {
        startsAt: true,
        endsAt: true,
      },
    });

  const existingKeys = new Set(
    existingSlots.map(
      (slot) =>
        `${slot.startsAt.getTime()}-${slot.endsAt.getTime()}`
    )
  );

  const missingSlots = desiredSlots.filter(
    (slot) =>
      !existingKeys.has(
        `${slot.startsAt.getTime()}-${slot.endsAt.getTime()}`
      )
  );

  if (missingSlots.length > 0) {
    await prisma.pickupAvailability.createMany({
      data: missingSlots.map((slot) => ({
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
      })),
    });
  }
}
