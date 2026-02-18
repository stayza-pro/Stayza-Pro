"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-hot-toast";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
} from "lucide-react";
import {
  PropertyBlockedBooking,
  bookingService,
} from "@/services/bookings";
import { Button, Card } from "@/components/ui";

type ActionMode = "block" | "unblock";

interface PropertyCalendarManagerProps {
  propertyId: string;
}

interface OptimisticBlockRange {
  id: string;
  start: string;
  end: string; // inclusive
  reason: string;
}

const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MAX_MONTHS_AHEAD = 11;

const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateKey = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

const normalizeDateKey = (value: string | Date): string => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  return toDateKey(date);
};

const addDays = (dateKey: string, amount: number): string => {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
};

const getInclusiveDateRange = (start: string, end: string): string[] => {
  const startDate = parseDateKey(start);
  const endDate = parseDateKey(end);
  const result: string[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    result.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
};

const isBlockedDatesSpecialRequest = (specialRequests?: string | null) => {
  if (!specialRequests) return false;
  return (
    specialRequests.includes("[SYSTEM_BLOCKED_DATES]") ||
    specialRequests.includes("SYSTEM:BLOCKED_DATES")
  );
};

const extractBlockedReason = (specialRequests?: string | null) => {
  if (!specialRequests) return "";
  return specialRequests
    .replace("[SYSTEM_BLOCKED_DATES]", "")
    .replace("SYSTEM:BLOCKED_DATES", "")
    .trim();
};

const formatRange = (start: string, end: string) => {
  const startDate = parseDateKey(start);
  const endDate = parseDateKey(end);
  return `${startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${endDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
};

const isPastDate = (dateKey: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseDateKey(dateKey) < today;
};

export default function PropertyCalendarManager({
  propertyId,
}: PropertyCalendarManagerProps) {
  const queryClient = useQueryClient();
  const [monthOffset, setMonthOffset] = React.useState(0);
  const [mode, setMode] = React.useState<ActionMode>("block");
  const [selectedStart, setSelectedStart] = React.useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = React.useState<string | null>(null);
  const [selectedBlockedId, setSelectedBlockedId] = React.useState<
    string | null
  >(null);
  const [blockReason, setBlockReason] = React.useState("Maintenance");
  const [inlineError, setInlineError] = React.useState<string | null>(null);
  const [optimisticBlocks, setOptimisticBlocks] = React.useState<
    OptimisticBlockRange[]
  >([]);
  const [optimisticUnblockedIds, setOptimisticUnblockedIds] = React.useState<
    Set<string>
  >(new Set());

  const { data: calendarData, isLoading: isCalendarLoading } = useQuery({
    queryKey: ["property-calendar", propertyId],
    queryFn: () => bookingService.getPropertyCalendar(propertyId, 12),
    enabled: Boolean(propertyId),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const { data: blockedBookings = [], isLoading: isBlockedLoading } = useQuery({
    queryKey: ["property-blocked-bookings", propertyId],
    queryFn: () => bookingService.getPropertyBlockedBookings(propertyId),
    enabled: Boolean(propertyId),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const normalizedBlockedBookings = React.useMemo(() => {
    return blockedBookings
      .filter(
        (booking) =>
          !optimisticUnblockedIds.has(booking.id) &&
          isBlockedDatesSpecialRequest(booking.specialRequests),
      )
      .map((booking) => {
        const start = normalizeDateKey(booking.checkInDate);
        const endExclusive = normalizeDateKey(booking.checkOutDate);
        const endInclusive = addDays(endExclusive, -1);
        return {
          ...booking,
          start,
          endInclusive,
          endExclusive,
          reason: extractBlockedReason(booking.specialRequests) || booking.reason,
        };
      })
      .filter((booking) => parseDateKey(booking.endInclusive) >= parseDateKey(booking.start));
  }, [blockedBookings, optimisticUnblockedIds]);

  const blockedDateMap = React.useMemo(() => {
    const map = new Map<
      string,
      (PropertyBlockedBooking & {
        start: string;
        endInclusive: string;
        endExclusive: string;
      })
    >();

    normalizedBlockedBookings.forEach((booking) => {
      getInclusiveDateRange(booking.start, booking.endInclusive).forEach((date) => {
        map.set(date, booking);
      });
    });

    optimisticBlocks.forEach((range) => {
      getInclusiveDateRange(range.start, range.end).forEach((date) => {
        map.set(date, {
          id: range.id,
          checkInDate: range.start,
          checkOutDate: addDays(range.end, 1),
          status: "ACTIVE",
          start: range.start,
          endInclusive: range.end,
          endExclusive: addDays(range.end, 1),
          reason: range.reason,
        });
      });
    });

    return map;
  }, [normalizedBlockedBookings, optimisticBlocks]);

  const calendarAvailabilityMap = React.useMemo(() => {
    const map = new Map<string, boolean>();
    (calendarData?.calendar || []).forEach((day) => {
      map.set(day.date, day.available);
    });
    return map;
  }, [calendarData?.calendar]);

  const activeMonth = React.useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  }, [monthOffset]);

  const monthLabel = activeMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const calendarGrid = React.useMemo(() => {
    const firstDayOfMonth = new Date(
      activeMonth.getFullYear(),
      activeMonth.getMonth(),
      1,
    );
    const lastDayOfMonth = new Date(
      activeMonth.getFullYear(),
      activeMonth.getMonth() + 1,
      0,
    );
    const daysInMonth = lastDayOfMonth.getDate();
    const firstWeekday = firstDayOfMonth.getDay();

    const cells: Array<{ key: string; dateKey?: string }> = [];
    for (let index = 0; index < firstWeekday; index += 1) {
      cells.push({ key: `empty-${index}` });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(
        activeMonth.getFullYear(),
        activeMonth.getMonth(),
        day,
      );
      cells.push({
        key: `day-${day}`,
        dateKey: toDateKey(date),
      });
    }

    return cells;
  }, [activeMonth]);

  const selectedRangeDates = React.useMemo(() => {
    if (!selectedStart) return new Set<string>();
    if (!selectedEnd) return new Set<string>([selectedStart]);
    return new Set(getInclusiveDateRange(selectedStart, selectedEnd));
  }, [selectedEnd, selectedStart]);

  const selectedBlockedBooking = React.useMemo(() => {
    if (!selectedBlockedId) return null;
    return normalizedBlockedBookings.find((booking) => booking.id === selectedBlockedId) || null;
  }, [normalizedBlockedBookings, selectedBlockedId]);

  const resetSelection = React.useCallback(() => {
    setSelectedStart(null);
    setSelectedEnd(null);
    setSelectedBlockedId(null);
    setInlineError(null);
  }, []);

  React.useEffect(() => {
    resetSelection();
  }, [mode, resetSelection]);

  const refetchCalendarData = React.useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries(["property-calendar", propertyId]),
      queryClient.invalidateQueries(["property-blocked-bookings", propertyId]),
      queryClient.invalidateQueries(["realtor-bookings"]),
    ]);
  }, [propertyId, queryClient]);

  const blockMutation = useMutation({
    mutationFn: async (payload: { start: string; end: string; reason: string }) =>
      bookingService.blockDates(propertyId, {
        startDate: payload.start,
        endDate: addDays(payload.end, 1),
        reason: payload.reason,
      }),
    onMutate: async (payload) => {
      const optimisticId = `optimistic-${Date.now()}`;
      setOptimisticBlocks((prev) => [
        ...prev,
        {
          id: optimisticId,
          start: payload.start,
          end: payload.end,
          reason: payload.reason,
        },
      ]);
      return { optimisticId };
    },
    onError: (error, _payload, context) => {
      if (context?.optimisticId) {
        setOptimisticBlocks((prev) =>
          prev.filter((range) => range.id !== context.optimisticId),
        );
      }
      setInlineError(
        error instanceof Error ? error.message : "Unable to block selected dates.",
      );
    },
    onSuccess: async () => {
      setOptimisticBlocks([]);
      resetSelection();
      toast.success("Dates blocked successfully.");
      await refetchCalendarData();
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (payload: { id: string }) =>
      bookingService.unblockDates(payload.id, "Dates unblocked by realtor"),
    onMutate: async (payload) => {
      setOptimisticUnblockedIds((prev) => {
        const next = new Set(prev);
        next.add(payload.id);
        return next;
      });
      return { id: payload.id };
    },
    onError: (error, _payload, context) => {
      if (context?.id) {
        setOptimisticUnblockedIds((prev) => {
          const next = new Set(prev);
          next.delete(context.id);
          return next;
        });
      }
      setInlineError(
        error instanceof Error ? error.message : "Unable to unblock selected dates.",
      );
    },
    onSuccess: async (_data, payload) => {
      setOptimisticUnblockedIds((prev) => {
        const next = new Set(prev);
        next.delete(payload.id);
        return next;
      });
      resetSelection();
      toast.success("Dates unblocked successfully.");
      await refetchCalendarData();
    },
  });

  const handleDateSelect = (dateKey: string) => {
    setInlineError(null);
    const isBlockedDay = blockedDateMap.has(dateKey);
    const isAvailable = calendarAvailabilityMap.get(dateKey) ?? true;

    if (mode === "unblock") {
      if (!isBlockedDay) {
        setSelectedBlockedId(null);
        setInlineError("Select a blocked date to unblock.");
        return;
      }
      const blockedBooking = blockedDateMap.get(dateKey);
      if (blockedBooking) {
        setSelectedBlockedId(blockedBooking.id);
      }
      return;
    }

    if (!isAvailable || isBlockedDay || isPastDate(dateKey)) {
      return;
    }

    if (!selectedStart || selectedEnd) {
      setSelectedStart(dateKey);
      setSelectedEnd(null);
      return;
    }

    if (parseDateKey(dateKey) < parseDateKey(selectedStart)) {
      setSelectedStart(dateKey);
      setSelectedEnd(selectedStart);
      return;
    }

    setSelectedEnd(dateKey);
  };

  const handleBlockSubmit = () => {
    if (!selectedStart || !selectedEnd) {
      setInlineError("Select a start and end date to block.");
      return;
    }
    if (!blockReason.trim()) {
      setInlineError("Provide a reason for blocking the selected dates.");
      return;
    }

    blockMutation.mutate({
      start: selectedStart,
      end: selectedEnd,
      reason: blockReason.trim(),
    });
  };

  const handleUnblockSubmit = () => {
    if (!selectedBlockedBooking) {
      setInlineError("Select a blocked date range to unblock.");
      return;
    }
    unblockMutation.mutate({ id: selectedBlockedBooking.id });
  };

  return (
    <Card className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Availability Calendar
          </h3>
          <p className="text-sm text-gray-600">
            Block or unblock dates to control when guests can book this property.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => setMode("block")}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === "block"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Lock className="h-4 w-4" />
            Block
          </button>
          <button
            type="button"
            onClick={() => setMode("unblock")}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === "unblock"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Unlock className="h-4 w-4" />
            Unblock
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonthOffset((prev) => Math.max(0, prev - 1))}
          disabled={monthOffset <= 0}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="inline-flex items-center gap-2 text-gray-900">
          <CalendarDays className="h-4 w-4" />
          <span className="text-sm font-semibold">{monthLabel}</span>
        </div>

        <button
          type="button"
          onClick={() =>
            setMonthOffset((prev) => Math.min(MAX_MONTHS_AHEAD, prev + 1))
          }
          disabled={monthOffset >= MAX_MONTHS_AHEAD}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {isCalendarLoading || isBlockedLoading ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
          Loading availability calendar...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-7 gap-2">
            {DAY_HEADERS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-semibold uppercase text-gray-500"
              >
                {day}
              </div>
            ))}

            {calendarGrid.map((cell) => {
              if (!cell.dateKey) {
                return <div key={cell.key} className="h-11 rounded-lg bg-transparent" />;
              }

              const dateKey = cell.dateKey;
              const date = parseDateKey(dateKey);
              const day = date.getDate();
              const isBlocked = blockedDateMap.has(dateKey);
              const isAvailable = calendarAvailabilityMap.get(dateKey) ?? true;
              const isBooked = !isBlocked && !isAvailable;
              const isPast = isPastDate(dateKey);
              const isInSelection = selectedRangeDates.has(dateKey);
              const blockedBooking = blockedDateMap.get(dateKey);
              const isSelectedBlocked =
                Boolean(selectedBlockedId) && blockedBooking?.id === selectedBlockedId;

              const buttonClass = [
                "h-11 w-full rounded-lg border text-sm font-medium transition",
                isPast && "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300",
                !isPast &&
                  isAvailable &&
                  !isBlocked &&
                  !isInSelection &&
                  "border-gray-200 bg-white text-gray-800 hover:bg-gray-50",
                isBooked && "cursor-not-allowed border-red-200 bg-red-50 text-red-500",
                isBlocked &&
                  !isSelectedBlocked &&
                  "border-amber-200 bg-amber-50 text-amber-700",
                isInSelection && "border-blue-400 bg-blue-50 text-blue-700",
                isSelectedBlocked && "border-amber-400 bg-amber-100 text-amber-800",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={cell.key}
                  type="button"
                  className={buttonClass}
                  onClick={() => handleDateSelect(dateKey)}
                  disabled={isPast || (mode === "block" && (isBlocked || isBooked))}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 text-xs text-gray-600 sm:grid-cols-4">
            <div className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-gray-300 bg-white" />
              Available
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-red-300 bg-red-100" />
              Booked
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-amber-300 bg-amber-100" />
              Blocked by you
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-blue-300 bg-blue-100" />
              Selected range
            </div>
          </div>

          {mode === "block" ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-sm font-medium text-gray-900">
                Block selected dates
              </p>
              <p className="mb-3 text-xs text-gray-600">
                {selectedStart && selectedEnd
                  ? `Selected: ${formatRange(selectedStart, selectedEnd)}`
                  : "Pick start and end dates from the calendar."}
              </p>
              <input
                type="text"
                value={blockReason}
                onChange={(event) => setBlockReason(event.target.value)}
                placeholder="Reason (e.g. maintenance)"
                className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              />
              <Button
                onClick={handleBlockSubmit}
                loading={blockMutation.isLoading}
                disabled={!selectedStart || !selectedEnd}
                size="sm"
              >
                Block Selected Dates
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-sm font-medium text-gray-900">
                Unblock selected dates
              </p>
              {selectedBlockedBooking ? (
                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <p className="font-semibold">
                    {formatRange(
                      selectedBlockedBooking.start,
                      selectedBlockedBooking.endInclusive,
                    )}
                  </p>
                  <p className="mt-1">
                    Reason: {selectedBlockedBooking.reason || "No reason provided"}
                  </p>
                </div>
              ) : (
                <p className="mb-3 text-xs text-gray-600">
                  Click any blocked date on the calendar to select the range.
                </p>
              )}
              <Button
                onClick={handleUnblockSubmit}
                loading={unblockMutation.isLoading}
                disabled={!selectedBlockedBooking}
                variant="outline"
                size="sm"
              >
                Unblock Selected Dates
              </Button>
            </div>
          )}

          {inlineError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {inlineError}
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}
