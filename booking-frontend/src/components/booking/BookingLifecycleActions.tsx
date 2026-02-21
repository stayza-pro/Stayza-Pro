"use client";

import React from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  Clock3,
  Film,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
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
  refundImpact: string;
  severity: "high" | "medium";
}[] = [
  {
    value: "MINOR_INCONVENIENCE",
    label: "Minor Inconvenience",
    example:
      "e.g. Minor noise disturbance, slightly late check-in, minor temperature issue",
    refundImpact: "Up to 30% refund",
    severity: "medium",
  },
  {
    value: "MISSING_AMENITIES_CLEANLINESS",
    label: "Missing Amenities / Cleanliness",
    example:
      "e.g. Advertised WiFi not working, unclean bathroom on arrival, missing promised toiletries",
    refundImpact: "Up to 30% refund",
    severity: "medium",
  },
  {
    value: "MAJOR_MISREPRESENTATION",
    label: "Major Misrepresentation",
    example:
      "e.g. Property looks nothing like photos, advertised features or rooms don't exist, wrong location",
    refundImpact: "Up to 100% refund",
    severity: "high",
  },
  {
    value: "SAFETY_UNINHABITABLE",
    label: "Safety / Uninhabitable",
    example:
      "e.g. Structural damage, broken locks, pest infestation, no running water or electricity",
    refundImpact: "Up to 100% refund",
    severity: "high",
  },
];

const REALTOR_DISPUTE_CATEGORY_OPTIONS: {
  value: DepositDisputeCategory;
  label: string;
  example: string;
  refundImpact: string;
  severity: "high" | "medium";
}[] = [
  {
    value: "PROPERTY_DAMAGE",
    label: "Property Damage",
    example:
      "e.g. Broken furniture, holes in walls, stained carpets or mattresses",
    refundImpact: "Up to full deposit",
    severity: "high",
  },
  {
    value: "MISSING_ITEMS",
    label: "Missing Items",
    example:
      "e.g. TV remote, kitchen utensils, artwork, or other listed items missing after guest leaves",
    refundImpact: "Up to full deposit",
    severity: "medium",
  },
  {
    value: "CLEANING_REQUIRED",
    label: "Cleaning Required",
    example:
      "e.g. Excessive mess, biohazardous waste, or significant cleaning beyond normal use",
    refundImpact: "Up to full deposit",
    severity: "medium",
  },
  {
    value: "OTHER_DEPOSIT_CLAIM",
    label: "Other Deposit Claim",
    example:
      "e.g. Unauthorised pets, smoking in a non-smoking property, extra guests not on booking",
    refundImpact: "Up to full deposit",
    severity: "medium",
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
    preview: string | null;
    uploading: boolean;
    error: string | null;
  };
  const [evidenceFiles, setEvidenceFiles] = React.useState<EvidenceFile[]>([]);
  const [dragOver, setDragOver] = React.useState(false);
  const dragCounterRef = React.useRef(0);
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

  const processFiles = React.useCallback(
    async (rawFiles: FileList | File[]) => {
      const files = Array.from(rawFiles);
      if (!files.length) return;
      const incoming = files.slice(0, Math.max(0, 5 - evidenceFiles.length));
      if (!incoming.length) return;
      const newEntries: EvidenceFile[] = incoming.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        url: null,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
        uploading: true,
        error: null,
      }));
      setEvidenceFiles((prev) => [...prev, ...newEntries]);
      await Promise.all(
        newEntries.map(async (entry) => {
          try {
            const url = await disputeService.uploadDisputeAttachment(
              entry.file,
            );
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
    },
    [evidenceFiles.length],
  );

  const handleEvidenceSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = "";
    if (files.length) await processFiles(files);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragCounterRef.current = 0;
    setDragOver(false);
    await processFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragCounterRef.current += 1;
    setDragOver(true);
  };

  const handleDragLeave = () => {
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) setDragOver(false);
  };

  const removeEvidence = (id: string) => {
    setEvidenceFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((f) => f.id !== id);
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
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800">
                    Guest Window
                  </p>
                  {disputeWindows.guestDisputeWindow?.canOpen ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Open
                    </span>
                  ) : disputeWindows.guestDisputeWindow?.expired ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                      Expired
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                      Unavailable
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{guestDeadlineText}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800">
                    Realtor Window
                  </p>
                  {disputeWindows.realtorDisputeWindow?.canOpen ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Open
                    </span>
                  ) : disputeWindows.realtorDisputeWindow?.expired ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                      Expired
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                      Unavailable
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{realtorDeadlineText}</p>
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
                  <div className="space-y-5 pt-1">
                    {/* Category cards */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Dispute Category
                      </p>
                      {role === "GUEST" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {GUEST_DISPUTE_CATEGORY_OPTIONS.map((option) => {
                            const selected =
                              guestDisputeCategory === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                  setGuestDisputeCategory(option.value)
                                }
                                className={`relative text-left rounded-xl border-2 p-3 transition-all ${
                                  selected
                                    ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <span
                                    className={`text-xs font-semibold leading-tight ${
                                      selected
                                        ? "text-indigo-900"
                                        : "text-gray-800"
                                    }`}
                                  >
                                    {option.label}
                                  </span>
                                  <span
                                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                      option.severity === "high"
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-sky-100 text-sky-700"
                                    }`}
                                  >
                                    {option.refundImpact}
                                  </span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-gray-500">
                                  {option.example}
                                </p>
                                {selected && (
                                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500">
                                    <Check className="h-2.5 w-2.5 text-white" />
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {REALTOR_DISPUTE_CATEGORY_OPTIONS.map((option) => {
                            const selected =
                              realtorDisputeCategory === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                  setRealtorDisputeCategory(option.value)
                                }
                                className={`relative text-left rounded-xl border-2 p-3 transition-all ${
                                  selected
                                    ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <span
                                    className={`text-xs font-semibold leading-tight ${
                                      selected
                                        ? "text-indigo-900"
                                        : "text-gray-800"
                                    }`}
                                  >
                                    {option.label}
                                  </span>
                                  <span
                                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                      option.severity === "high"
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-sky-100 text-sky-700"
                                    }`}
                                  >
                                    {option.refundImpact}
                                  </span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-gray-500">
                                  {option.example}
                                </p>
                                {selected && (
                                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500">
                                    <Check className="h-2.5 w-2.5 text-white" />
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Claimed amount — realtor only */}
                    {role === "REALTOR" && (
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
                    )}

                    {/* Dispute details with character counter */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Dispute Details
                      </label>
                      <textarea
                        rows={3}
                        value={disputeWriteup}
                        onChange={(event) =>
                          setDisputeWriteup(event.target.value)
                        }
                        placeholder="Describe the issue in detail..."
                        className="block w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                      <div className="mt-1 flex justify-between">
                        <span className="text-xs text-gray-400">
                          Minimum 20 characters
                        </span>
                        <span
                          className={`text-xs ${
                            disputeWriteup.trim().length >= 20
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          {disputeWriteup.trim().length} chars
                        </span>
                      </div>
                    </div>

                    {/* Evidence upload */}
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-700">
                        Evidence <span className="text-red-500">*</span>
                        <span className="font-normal text-gray-500">
                          {" "}
                          &mdash; photo or video required (up to 5)
                        </span>
                      </p>

                      {/* Thumbnail grid */}
                      {evidenceFiles.length > 0 && (
                        <div className="mb-2 grid grid-cols-3 gap-2">
                          {evidenceFiles.map((ef) => (
                            <div
                              key={ef.id}
                              className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                            >
                              {ef.preview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={ef.preview}
                                  alt={ef.file.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Film className="h-5 w-5 text-gray-400" />
                              )}
                              {ef.uploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                                </div>
                              )}
                              {ef.error && (
                                <div className="absolute inset-0 flex items-end bg-red-400/20">
                                  <span className="w-full truncate bg-red-600 px-1 py-0.5 text-[9px] text-white">
                                    {ef.error}
                                  </span>
                                </div>
                              )}
                              {ef.url && (
                                <span className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                                  <Check className="h-2.5 w-2.5 text-white" />
                                </span>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-0.5">
                                <p className="truncate text-[9px] text-white">
                                  {ef.file.name}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeEvidence(ef.id)}
                                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 transition-colors hover:bg-black/70"
                                aria-label="Remove file"
                              >
                                <X className="h-3 w-3 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Drag-and-drop zone */}
                      {evidenceFiles.length < 5 && (
                        <div
                          onDragEnter={handleDragEnter}
                          onDragLeave={handleDragLeave}
                          onDragOver={handleDragOver}
                          onDrop={(e) => void handleDrop(e)}
                          onClick={() => evidenceInputRef.current?.click()}
                          className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${
                            dragOver
                              ? "border-indigo-400 bg-indigo-50"
                              : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                          }`}
                        >
                          <Upload className="mx-auto mb-1.5 h-5 w-5 text-gray-400" />
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-indigo-600">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            Photos and videos
                          </p>
                          <input
                            ref={evidenceInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            className="sr-only"
                            onChange={(e) => void handleEvidenceSelect(e)}
                            aria-label="Upload evidence"
                          />
                        </div>
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
