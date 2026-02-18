"use client";

import React from "react";
import { AlertCircle, CalendarDays, Clock3, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import { Booking } from "@/types";
import {
  BookingDisputeWindows,
  BookingModificationOptions,
  DepositDisputeCategory,
  RoomFeeDisputeCategory,
  bookingService,
} from "@/services/bookings";
import { Button, Card } from "@/components/ui";

interface BookingLifecycleActionsProps {
  booking: Booking;
  role: "GUEST" | "REALTOR";
  onRefresh?: () => void | Promise<void>;
}

const LAGOS_TIMEZONE = "Africa/Lagos";

const GUEST_DISPUTE_CATEGORY_OPTIONS: {
  value: RoomFeeDisputeCategory;
  label: string;
}[] = [
  { value: "MINOR_INCONVENIENCE", label: "Minor inconvenience" },
  {
    value: "MISSING_AMENITIES_CLEANLINESS",
    label: "Missing amenities or cleanliness",
  },
  {
    value: "MAJOR_MISREPRESENTATION",
    label: "Major misrepresentation",
  },
  {
    value: "SAFETY_UNINHABITABLE",
    label: "Safety or uninhabitable issue",
  },
];

const REALTOR_DISPUTE_CATEGORY_OPTIONS: {
  value: DepositDisputeCategory;
  label: string;
}[] = [
  { value: "PROPERTY_DAMAGE", label: "Property damage" },
  { value: "MISSING_ITEMS", label: "Missing items" },
  { value: "CLEANING_REQUIRED", label: "Cleaning required" },
  { value: "OTHER_DEPOSIT_CLAIM", label: "Other deposit claim" },
];

const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);

const isBlockedDatesBooking = (specialRequests?: string) => {
  if (!specialRequests) return false;
  return (
    specialRequests.includes("[SYSTEM_BLOCKED_DATES]") ||
    specialRequests.includes("SYSTEM:BLOCKED_DATES")
  );
};

const toInputDate = (value?: string | Date) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const toLagosDateKey = (value?: string | Date) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", {
    timeZone: LAGOS_TIMEZONE,
  });
};

const hasReachedDateInLagos = (target?: string | Date) => {
  const today = toLagosDateKey(new Date());
  const targetDate = toLagosDateKey(target);
  if (!today || !targetDate) return false;
  return today >= targetDate;
};

const isSameDateInLagos = (valueA?: string | Date, valueB?: string | Date) => {
  const dateA = toLagosDateKey(valueA);
  const dateB = toLagosDateKey(valueB);
  return Boolean(dateA && dateB && dateA === dateB);
};

const formatDeadline = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

export function BookingLifecycleActions({
  booking,
  role,
  onRefresh,
}: BookingLifecycleActionsProps) {
  const [newCheckOutDate, setNewCheckOutDate] = React.useState(
    toInputDate(booking.checkOutDate),
  );
  const [modifyReason, setModifyReason] = React.useState("");
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [modificationPreview, setModificationPreview] =
    React.useState<BookingModificationOptions | null>(null);
  const [disputeWindows, setDisputeWindows] =
    React.useState<BookingDisputeWindows | null>(null);
  const [showDisputeForm, setShowDisputeForm] = React.useState(false);
  const [disputeWriteup, setDisputeWriteup] = React.useState("");
  const [guestDisputeCategory, setGuestDisputeCategory] =
    React.useState<RoomFeeDisputeCategory>("MINOR_INCONVENIENCE");
  const [realtorDisputeCategory, setRealtorDisputeCategory] =
    React.useState<DepositDisputeCategory>("PROPERTY_DAMAGE");
  const [claimedAmount, setClaimedAmount] = React.useState(
    Number(booking.securityDeposit || 0),
  );
  const isBlockedBooking = isBlockedDatesBooking(booking.specialRequests);

  React.useEffect(() => {
    setNewCheckOutDate(toInputDate(booking.checkOutDate));
    setClaimedAmount(Number(booking.securityDeposit || 0));
    setModificationPreview(null);
    setError(null);
  }, [booking.id, booking.checkOutDate, booking.securityDeposit]);

  const canModify =
    !isBlockedBooking &&
    (booking.status === "PENDING" || booking.status === "ACTIVE");

  const checkInBaseReady =
    !isBlockedBooking &&
    booking.status === "ACTIVE" &&
    booking.stayStatus !== "CHECKED_IN" &&
    booking.stayStatus !== "CHECKED_OUT";

  const canGuestCheckInToday = isSameDateInLagos(new Date(), booking.checkInDate);
  const canRealtorCheckIn = hasReachedDateInLagos(booking.checkInDate);

  const canCheckIn =
    checkInBaseReady &&
    ((role === "GUEST" && canGuestCheckInToday) ||
      (role === "REALTOR" && canRealtorCheckIn));

  const canCheckOut =
    role === "GUEST" &&
    booking.status === "ACTIVE" &&
    booking.stayStatus === "CHECKED_IN";

  const activeWindow =
    role === "GUEST"
      ? disputeWindows?.guestDisputeWindow
      : disputeWindows?.realtorDisputeWindow;
  const canOpenDispute = Boolean(activeWindow?.canOpen);
  const disputeAlreadyOpened = Boolean(activeWindow?.opened);

  const refreshParent = React.useCallback(async () => {
    if (!onRefresh) return;
    await Promise.resolve(onRefresh());
  }, [onRefresh]);

  const loadDisputeWindows = React.useCallback(async () => {
    if (!booking?.id) return;
    try {
      const windows = await bookingService.getDisputeWindows(booking.id);
      setDisputeWindows(windows);
    } catch {
      // Optional panel only
    }
  }, [booking?.id]);

  React.useEffect(() => {
    void loadDisputeWindows();
  }, [loadDisputeWindows]);

  const runAction = async (
    actionKey: string,
    callback: () => Promise<void>,
    options?: { refreshAfterSuccess?: boolean },
  ) => {
    try {
      setError(null);
      setLoadingAction(actionKey);
      await callback();
      if (options?.refreshAfterSuccess !== false) {
        await refreshParent();
        await loadDisputeWindows();
      }
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : "Action failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePreviewReduction = async () => {
    await runAction(
      "preview-modification",
      async () => {
        const currentCheckIn = toInputDate(booking.checkInDate);
        if (!currentCheckIn || !newCheckOutDate) {
          throw new Error("Select the reduced check-out date.");
        }

        const preview = await bookingService.getModificationOptions(
          booking.id,
          currentCheckIn,
          newCheckOutDate,
        );
        setModificationPreview(preview);
      },
      { refreshAfterSuccess: false },
    );
  };

  const handleReduceStay = async () => {
    await runAction("modify-booking", async () => {
      await bookingService.modifyBooking(booking.id, {
        newCheckInDate: toInputDate(booking.checkInDate),
        newCheckOutDate,
        reason: modifyReason.trim() || undefined,
      });
      toast.success("Date-reduction request submitted.");
    });
  };

  const handleCheckIn = async () => {
    await runAction("check-in", async () => {
      await bookingService.checkIn(booking.id);
      toast.success("Check-in confirmed.");
    });
  };

  const handleCheckOut = async () => {
    await runAction("check-out", async () => {
      await bookingService.checkOut(booking.id);
      toast.success("Checkout completed.");
    });
  };

  const handleOpenDispute = async () => {
    await runAction("open-dispute", async () => {
      if (!canOpenDispute) {
        throw new Error("Dispute window is closed.");
      }

      const writeup = disputeWriteup.trim();
      if (writeup.length < 20) {
        throw new Error("Provide at least 20 characters for dispute details.");
      }

      if (role === "GUEST") {
        await bookingService.openRoomFeeDispute(
          booking.id,
          guestDisputeCategory,
          writeup,
        );
      } else {
        if (!Number.isFinite(claimedAmount) || claimedAmount <= 0) {
          throw new Error("Enter a valid claimed amount.");
        }
        await bookingService.openDepositDispute(
          booking.id,
          realtorDisputeCategory,
          claimedAmount,
          writeup,
        );
      }

      setShowDisputeForm(false);
      setDisputeWriteup("");
      toast.success("Dispute opened.");
    });
  };

  return (
    <Card className="p-6 rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Lifecycle Actions</h3>
        <button
          type="button"
          onClick={() => void loadDisputeWindows()}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Refresh windows"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid gap-6">
        {(canCheckIn || canCheckOut) && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">Stay Progress</h4>
            <div className="flex flex-wrap gap-2">
              {canCheckIn && (
                <Button
                  onClick={() => void handleCheckIn()}
                  loading={loadingAction === "check-in"}
                  variant="outline"
                  size="sm"
                >
                  Confirm Check-in
                </Button>
              )}
              {canCheckOut && (
                <Button
                  onClick={() => void handleCheckOut()}
                  loading={loadingAction === "check-out"}
                  variant="outline"
                  size="sm"
                >
                  Checkout
                </Button>
              )}
            </div>
            {role === "GUEST" && checkInBaseReady && !canGuestCheckInToday ? (
              <p className="text-xs text-gray-500">
                Guest check-in is only available on the official check-in day.
              </p>
            ) : null}
          </div>
        )}

        {canModify && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">Reduce Stay</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-sm text-gray-600">
                Check-in (fixed)
                <input
                  type="date"
                  value={toInputDate(booking.checkInDate)}
                  disabled
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
                />
              </label>
              <label className="text-sm text-gray-600">
                New Check-out
                <input
                  type="date"
                  value={newCheckOutDate}
                  onChange={(event) => setNewCheckOutDate(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
            </div>

            <label className="text-sm text-gray-600 block">
              Reason (optional)
              <textarea
                rows={2}
                value={modifyReason}
                onChange={(event) => setModifyReason(event.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => void handlePreviewReduction()}
                loading={loadingAction === "preview-modification"}
                variant="secondary"
                size="sm"
              >
                Preview Refund
              </Button>
              <Button
                onClick={() => void handleReduceStay()}
                loading={loadingAction === "modify-booking"}
                size="sm"
              >
                Submit Date Reduction
              </Button>
            </div>

            {modificationPreview && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                <p>Old subtotal: {formatNaira(modificationPreview.oldSubtotal)}</p>
                <p>New subtotal: {formatNaira(modificationPreview.newSubtotal)}</p>
                <p>Difference: {formatNaira(modificationPreview.difference)}</p>
                <p>
                  Estimated refund:{" "}
                  {formatNaira(Math.max(modificationPreview.refundAmount, 0))}
                </p>
              </div>
            )}

            <p className="text-xs text-gray-500">
              Stay extension is disabled. To stay longer, create a new booking.
            </p>
          </div>
        )}

        {disputeWindows && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Clock3 className="w-4 h-4" />
              Dispute Windows
            </h4>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="font-medium text-gray-800 mb-1">Guest Window</p>
                <p className="text-gray-600">
                  Deadline: {formatDeadline(disputeWindows.guestDisputeWindow?.deadline)}
                </p>
                <p className="text-gray-600">
                  Can open: {disputeWindows.guestDisputeWindow?.canOpen ? "Yes" : "No"}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="font-medium text-gray-800 mb-1">Realtor Window</p>
                <p className="text-gray-600">
                  Deadline: {formatDeadline(disputeWindows.realtorDisputeWindow?.deadline)}
                </p>
                <p className="text-gray-600">
                  Can open: {disputeWindows.realtorDisputeWindow?.canOpen ? "Yes" : "No"}
                </p>
              </div>
            </div>

            {activeWindow ? (
              <div className="rounded-lg border border-gray-200 p-3 space-y-3">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <p className="text-sm text-gray-700">
                    {disputeAlreadyOpened
                      ? "Dispute already opened for this window."
                      : canOpenDispute
                        ? "Dispute window is open."
                        : "Dispute window is closed."}
                  </p>
                  {canOpenDispute && !disputeAlreadyOpened ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowDisputeForm((value) => !value)}
                    >
                      {showDisputeForm ? "Close Form" : "Open Dispute"}
                    </Button>
                  ) : null}
                </div>

                {showDisputeForm && canOpenDispute ? (
                  <div className="space-y-3">
                    {role === "GUEST" ? (
                      <label className="text-sm text-gray-600 block">
                        Dispute Category
                        <select
                          value={guestDisputeCategory}
                          onChange={(event) =>
                            setGuestDisputeCategory(
                              event.target.value as RoomFeeDisputeCategory,
                            )
                          }
                          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                        >
                          {GUEST_DISPUTE_CATEGORY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <>
                        <label className="text-sm text-gray-600 block">
                          Dispute Category
                          <select
                            value={realtorDisputeCategory}
                            onChange={(event) =>
                              setRealtorDisputeCategory(
                                event.target.value as DepositDisputeCategory,
                              )
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                          >
                            {REALTOR_DISPUTE_CATEGORY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-sm text-gray-600 block">
                          Claimed Amount
                          <input
                            type="number"
                            min={0}
                            value={claimedAmount}
                            onChange={(event) =>
                              setClaimedAmount(
                                Math.max(0, Number(event.target.value || 0)),
                              )
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                          />
                        </label>
                      </>
                    )}

                    <label className="text-sm text-gray-600 block">
                      Dispute Details
                      <textarea
                        rows={3}
                        value={disputeWriteup}
                        onChange={(event) => setDisputeWriteup(event.target.value)}
                        placeholder="Describe the issue in detail..."
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </label>

                    <Button
                      size="sm"
                      onClick={() => void handleOpenDispute()}
                      loading={loadingAction === "open-dispute"}
                    >
                      Submit Dispute
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}

        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-500 flex items-start gap-2">
          <CalendarDays className="w-4 h-4 mt-0.5" />
          <span>
            Actions are controlled by booking timeline, role permissions, and
            backend policy checks.
          </span>
        </div>
      </div>
    </Card>
  );
}

export default BookingLifecycleActions;
