"use client";

import React from "react";
import { AlertCircle, CalendarDays, Clock3, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import { Booking } from "@/types";
import {
  BookingDisputeWindows,
  BookingModificationOptions,
  bookingService,
} from "@/services/bookings";
import { Button, Card } from "@/components/ui";

interface BookingLifecycleActionsProps {
  booking: Booking;
  role: "GUEST" | "REALTOR";
  onRefresh?: () => void | Promise<void>;
}

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
  const [newCheckInDate, setNewCheckInDate] = React.useState(
    toInputDate(booking.checkInDate),
  );
  const [newCheckOutDate, setNewCheckOutDate] = React.useState(
    toInputDate(booking.checkOutDate),
  );
  const [newGuestCount, setNewGuestCount] = React.useState(
    booking.totalGuests || 1,
  );
  const [modifyReason, setModifyReason] = React.useState("");
  const [additionalNights, setAdditionalNights] = React.useState(1);
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [modificationPreview, setModificationPreview] =
    React.useState<BookingModificationOptions | null>(null);
  const [disputeWindows, setDisputeWindows] =
    React.useState<BookingDisputeWindows | null>(null);
  const isBlockedBooking = isBlockedDatesBooking(booking.specialRequests);

  const canModify =
    !isBlockedBooking &&
    (booking.status === "PENDING" || booking.status === "ACTIVE");
  const canExtend = role === "GUEST" && booking.status === "ACTIVE";
  const canCheckIn =
    !isBlockedBooking &&
    booking.status === "ACTIVE" &&
    booking.stayStatus !== "CHECKED_IN" &&
    booking.stayStatus !== "CHECKED_OUT";
  const canCheckOut =
    role === "GUEST" &&
    booking.status === "ACTIVE" &&
    booking.stayStatus === "CHECKED_IN";

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
      // keep silent for optional panel
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

  const handlePreviewModification = async () => {
    await runAction("preview-modification", async () => {
      if (!newCheckInDate || !newCheckOutDate) {
        throw new Error("Select new check-in and check-out dates.");
      }
      const preview = await bookingService.getModificationOptions(
        booking.id,
        newCheckInDate,
        newCheckOutDate,
      );
      setModificationPreview(preview);
    }, { refreshAfterSuccess: false });
  };

  const handleModifyBooking = async () => {
    await runAction("modify-booking", async () => {
      await bookingService.modifyBooking(booking.id, {
        newCheckInDate,
        newCheckOutDate,
        newGuestCount,
        reason: modifyReason.trim() || undefined,
      });
      toast.success("Modification request submitted.");
    });
  };

  const handleExtendBooking = async () => {
    await runAction("extend-booking", async () => {
      await bookingService.extendBooking(booking.id, additionalNights);
      toast.success(`Booking extended by ${additionalNights} night(s).`);
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
          </div>
        )}

        {canModify && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">
              Modify Booking
            </h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-sm text-gray-600">
                New Check-in
                <input
                  type="date"
                  value={newCheckInDate}
                  onChange={(event) => setNewCheckInDate(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
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
              New Guest Count
              <input
                type="number"
                min={1}
                value={newGuestCount}
                onChange={(event) =>
                  setNewGuestCount(Math.max(1, Number(event.target.value || 1)))
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>

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
                onClick={() => void handlePreviewModification()}
                loading={loadingAction === "preview-modification"}
                variant="secondary"
                size="sm"
              >
                Preview Cost
              </Button>
              <Button
                onClick={() => void handleModifyBooking()}
                loading={loadingAction === "modify-booking"}
                size="sm"
              >
                Submit Modification
              </Button>
            </div>

            {modificationPreview && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                <p>Old subtotal: {formatNaira(modificationPreview.oldSubtotal)}</p>
                <p>New subtotal: {formatNaira(modificationPreview.newSubtotal)}</p>
                <p>Difference: {formatNaira(modificationPreview.difference)}</p>
                {modificationPreview.refundAmount > 0 ? (
                  <p>
                    Estimated refund:{" "}
                    {formatNaira(modificationPreview.refundAmount)}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        )}

        {canExtend && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">Extend Stay</h4>
            <label className="text-sm text-gray-600 block">
              Additional Nights
              <input
                type="number"
                min={1}
                value={additionalNights}
                onChange={(event) =>
                  setAdditionalNights(Math.max(1, Number(event.target.value || 1)))
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <Button
              onClick={() => void handleExtendBooking()}
              loading={loadingAction === "extend-booking"}
              disabled={booking.paymentStatus !== "HELD"}
              size="sm"
            >
              Extend Booking
            </Button>
            {booking.paymentStatus !== "HELD" ? (
              <p className="text-xs text-gray-500">
                Extensions are available while payment is in escrow hold.
              </p>
            ) : null}
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
          </div>
        )}

        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-500 flex items-start gap-2">
          <CalendarDays className="w-4 h-4 mt-0.5" />
          <span>
            Modification and extension availability depends on booking timeline,
            payment state, and role permissions enforced by backend rules.
          </span>
        </div>
      </div>
    </Card>
  );
}

export default BookingLifecycleActions;
