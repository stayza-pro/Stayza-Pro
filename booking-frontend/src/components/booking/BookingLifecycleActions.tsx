"use client";

import React from "react";
import { AlertCircle, CalendarDays, Clock3, Film, ImageIcon, RefreshCw, Upload, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { Booking } from "@/types";
import {
  BookingDisputeWindows,
  DepositDisputeCategory,
  RoomFeeDisputeCategory,
  bookingService,
} from "@/services/bookings";
import { disputeService } from "@/services/disputes";
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
  example: string;
}[] = [
  {
    value: "MINOR_INCONVENIENCE",
    label: "Minor inconvenience",
    example:
      "e.g. Minor noise disturbance, slightly late check-in, minor temperature issue",
  },
  {
    value: "MISSING_AMENITIES_CLEANLINESS",
    label: "Missing amenities or cleanliness",
    example:
      "e.g. Advertised WiFi not working, unclean bathroom on arrival, missing promised toiletries",
  },
  {
    value: "MAJOR_MISREPRESENTATION",
    label: "Major misrepresentation",
    example:
      "e.g. Property looks nothing like photos, advertised features or rooms don't exist, wrong location",
  },
  {
    value: "SAFETY_UNINHABITABLE",
    label: "Safety or uninhabitable issue",
    example:
      "e.g. Structural damage, broken locks, pest infestation, no running water or electricity",
  },
];

const REALTOR_DISPUTE_CATEGORY_OPTIONS: {
  value: DepositDisputeCategory;
  label: string;
  example: string;
}[] = [
  {
    value: "PROPERTY_DAMAGE",
    label: "Property damage",
    example:
      "e.g. Broken furniture, holes in walls, stained carpets or mattresses",
  },
  {
    value: "MISSING_ITEMS",
    label: "Missing items",
    example:
      "e.g. TV remote, kitchen utensils, artwork, or other listed items missing after guest leaves",
  },
  {
    value: "CLEANING_REQUIRED",
    label: "Cleaning required",
    example:
      "e.g. Excessive mess, biohazardous waste, or significant cleaning beyond normal use",
  },
  {
    value: "OTHER_DEPOSIT_CLAIM",
    label: "Other deposit claim",
    example:
      "e.g. Unauthorised pets, smoking in a non-smoking property, extra guests not on booking",
  },
];

const isBlockedDatesBooking = (specialRequests?: string) => {
  if (!specialRequests) return false;
  return (
    specialRequests.includes("[SYSTEM_BLOCKED_DATES]") ||
    specialRequests.includes("SYSTEM:BLOCKED_DATES")
  );
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

const formatDeadline = (value?: string | Date) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export function BookingLifecycleActions({
  booking,
  role,
  onRefresh,
}: BookingLifecycleActionsProps) {
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
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

  type EvidenceFile = {
    id: string;
    file: File;
    url: string | null;
    uploading: boolean;
    error: string | null;
  };
  const [evidenceFiles, setEvidenceFiles] = React.useState<EvidenceFile[]>([]);
  const evidenceInputRef = React.useRef<HTMLInputElement>(null);
  const isBlockedBooking = isBlockedDatesBooking(booking.specialRequests);

  React.useEffect(() => {
    setClaimedAmount(Number(booking.securityDeposit || 0));
    setError(null);
  }, [booking.id, booking.securityDeposit]);

  const checkInBaseReady =
    !isBlockedBooking &&
    booking.status === "ACTIVE" &&
    booking.stayStatus !== "CHECKED_IN" &&
    booking.stayStatus !== "CHECKED_OUT";

  const canGuestCheckInToday = isSameDateInLagos(
    new Date(),
    booking.checkInDate,
  );
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

  const hasCheckedIn =
    booking.stayStatus === "CHECKED_IN" || booking.stayStatus === "CHECKED_OUT";
  const hasCheckedOut = booking.stayStatus === "CHECKED_OUT";

  const guestDeadlineText = React.useMemo(() => {
    const window = disputeWindows?.guestDisputeWindow;
    if (window?.deadline) {
      const formatted = formatDeadline(window.deadline);
      return `${formatted} (${window.expired ? "Expired" : "Open"})`;
    }

    if (!hasCheckedIn) {
      return "Available after check-in confirmation";
    }

    return "Window unavailable";
  }, [disputeWindows?.guestDisputeWindow, hasCheckedIn]);

  const realtorDeadlineText = React.useMemo(() => {
    const window = disputeWindows?.realtorDisputeWindow;
    if (window?.deadline) {
      const formatted = formatDeadline(window.deadline);
      return `${formatted} (${window.expired ? "Expired" : "Open"})`;
    }

    if (!hasCheckedOut) {
      return "Available after checkout";
    }

    return "Window unavailable";
  }, [disputeWindows?.realtorDisputeWindow, hasCheckedOut]);

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

  const handleEvidenceSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    event.target.value = "";
    const incoming = files.slice(0, Math.max(0, 5 - evidenceFiles.length));
    const newEntries: EvidenceFile[] = incoming.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      url: null,
      uploading: true,
      error: null,
    }));
    setEvidenceFiles((prev) => [...prev, ...newEntries]);
    await Promise.all(
      newEntries.map(async (entry) => {
        try {
          const url = await disputeService.uploadDisputeAttachment(entry.file);
          setEvidenceFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id ? { ...f, url, uploading: false } : f,
            ),
          );
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Upload failed";
          setEvidenceFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? { ...f, uploading: false, error: message }
                : f,
            ),
          );
        }
      }),
    );
  };

  const removeEvidence = (id: string) => {
    setEvidenceFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const guestCategoryExample = React.useMemo(
    () =>
      GUEST_DISPUTE_CATEGORY_OPTIONS.find(
        (o) => o.value === guestDisputeCategory,
      )?.example ?? "",
    [guestDisputeCategory],
  );

  const realtorCategoryExample = React.useMemo(
    () =>
      REALTOR_DISPUTE_CATEGORY_OPTIONS.find(
        (o) => o.value === realtorDisputeCategory,
      )?.example ?? "",
    [realtorDisputeCategory],
  );

  const handleOpenDispute = async () => {
    await runAction("open-dispute", async () => {
      if (!canOpenDispute) {
        throw new Error("Dispute window is closed.");
      }

      const writeup = disputeWriteup.trim();
      if (writeup.length < 20) {
        throw new Error("Provide at least 20 characters for dispute details.");
      }

      const uploadedUrls = evidenceFiles
        .filter((f) => f.url)
        .map((f) => f.url as string);

      if (uploadedUrls.length === 0) {
        throw new Error(
          "At least one photo or video evidence is required to submit a dispute.",
        );
      }

      if (role === "GUEST") {
        await bookingService.openRoomFeeDispute(
          booking.id,
          guestDisputeCategory,
          writeup,
          uploadedUrls,
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
          uploadedUrls,
        );
      }

      setShowDisputeForm(false);
      setDisputeWriteup("");
      setEvidenceFiles([]);
      toast.success("Dispute opened.");
    });
  };

  return (
    <Card className="p-6 rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Lifecycle Actions
        </h3>
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
            <h4 className="text-sm font-semibold text-gray-900">
              Stay Progress
            </h4>
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

        {disputeWindows && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Clock3 className="w-4 h-4" />
              Dispute Windows
            </h4>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="font-medium text-gray-800 mb-1">Guest Window</p>
                <p className="text-gray-600">Deadline: {guestDeadlineText}</p>
                <p className="text-gray-600">
                  Can open:{" "}
                  {disputeWindows.guestDisputeWindow?.canOpen ? "Yes" : "No"}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="font-medium text-gray-800 mb-1">Realtor Window</p>
                <p className="text-gray-600">Deadline: {realtorDeadlineText}</p>
                <p className="text-gray-600">
                  Can open:{" "}
                  {disputeWindows.realtorDisputeWindow?.canOpen ? "Yes" : "No"}
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
                  <div className="space-y-4">
                    {role === "GUEST" ? (
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Dispute Category
                        </label>
                        <select
                          value={guestDisputeCategory}
                          onChange={(event) =>
                            setGuestDisputeCategory(
                              event.target.value as RoomFeeDisputeCategory,
                            )
                          }
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                          {GUEST_DISPUTE_CATEGORY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {guestCategoryExample && (
                          <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                            {guestCategoryExample}
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">
                            Dispute Category
                          </label>
                          <select
                            value={realtorDisputeCategory}
                            onChange={(event) =>
                              setRealtorDisputeCategory(
                                event.target.value as DepositDisputeCategory,
                              )
                            }
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          >
                            {REALTOR_DISPUTE_CATEGORY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {realtorCategoryExample && (
                            <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                              {realtorCategoryExample}
                            </p>
                          )}
                        </div>
                        <label className="text-sm font-medium text-gray-700 block">
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
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </label>
                      </>
                    )}

                    <label className="text-sm font-medium text-gray-700 block">
                      Dispute Details
                      <textarea
                        rows={3}
                        value={disputeWriteup}
                        onChange={(event) =>
                          setDisputeWriteup(event.target.value)
                        }
                        placeholder="Describe the issue in detail (minimum 20 characters)..."
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </label>

                    {/* Evidence upload — required */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Evidence{" "}
                        <span className="text-red-500">*</span>
                        <span className="font-normal text-gray-500">
                          {" "}(required — photo or video, up to 5 files)
                        </span>
                      </p>

                      {evidenceFiles.length > 0 && (
                        <ul className="mb-2 space-y-1.5">
                          {evidenceFiles.map((ef) => (
                            <li
                              key={ef.id}
                              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs"
                            >
                              {ef.file.type.startsWith("video/") ? (
                                <Film className="w-4 h-4 text-gray-500 shrink-0" />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-gray-500 shrink-0" />
                              )}
                              <span className="flex-1 truncate text-gray-700">
                                {ef.file.name}
                              </span>
                              {ef.uploading && (
                                <span className="text-gray-400">Uploading…</span>
                              )}
                              {ef.error && (
                                <span className="text-red-500">{ef.error}</span>
                              )}
                              {ef.url && (
                                <span className="text-green-600">Uploaded</span>
                              )}
                              <button
                                type="button"
                                onClick={() => removeEvidence(ef.id)}
                                className="ml-auto text-gray-400 hover:text-red-500"
                                aria-label="Remove file"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {evidenceFiles.length < 5 && (
                        <>
                          <input
                            ref={evidenceInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            className="sr-only"
                            onChange={(e) => void handleEvidenceSelect(e)}
                            aria-label="Upload evidence"
                          />
                          <button
                            type="button"
                            onClick={() => evidenceInputRef.current?.click()}
                            className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Add photo or video
                          </button>
                        </>
                      )}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => void handleOpenDispute()}
                      loading={loadingAction === "open-dispute"}
                      disabled={evidenceFiles.some((f) => f.uploading)}
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
