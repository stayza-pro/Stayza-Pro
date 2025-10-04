"use client";

import { useEffect, useMemo } from "react";
import { useMutation, useQuery } from "react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

import { ModernDashboardLayout } from "@/components/layout/ModernDashboardLayout";
import { useAuthStore } from "@/store/authStore";
import { Button, Card, Loading } from "@/components/ui";
import { realtorService } from "@/services";
import { StripeAccountStatus } from "@/types";

const EMPTY_REQUIREMENTS: string[] = [];

const statusItems = (
  status: StripeAccountStatus | undefined
): Array<{ label: string; value: boolean; helper?: string }> => [
  {
    label: "Stripe account created",
    value: Boolean(status?.connected),
  },
  {
    label: "Business details submitted",
    value: Boolean(status?.detailsSubmitted),
    helper: status?.requiresOnboarding
      ? "Additional business details are still required."
      : undefined,
  },
  {
    label: "Charges enabled",
    value: Boolean(status?.chargesEnabled),
  },
  {
    label: "Payouts enabled",
    value: Boolean(status?.payoutsEnabled),
  },
];

const getReleaseDelayCopy = (hours?: number) => {
  if (!hours || hours <= 0) {
    return "Funds are released immediately after a guest checks out when no disputes are raised.";
  }

  const wholeDays = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  const parts: string[] = [];

  if (wholeDays > 0) {
    parts.push(`${wholeDays} day${wholeDays > 1 ? "s" : ""}`);
  }

  if (remainingHours > 0) {
    parts.push(`${remainingHours} hour${remainingHours > 1 ? "s" : ""}`);
  }

  const delayDescription = parts.join(" and ");
  return `We hold payouts for ${delayDescription} after checkout to protect against last-minute disputes.`;
};

const formatErrorMessage = (error: unknown): string => {
  if (!error) return "Something went wrong";
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Unable to complete the request";
};

const StripePayoutsPage = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  // Redirect if not authenticated or not a REAlTOR
  useEffect(() => {
    if (
      !authLoading &&
      (!isAuthenticated || !user || user.role !== "REALTOR")
    ) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, authLoading, user, router]);

  if (authLoading) {
    return <Loading />;
  }

  if (!isAuthenticated || !user || user.role !== "REALTOR") {
    return null;
  }

  const statusQuery = useQuery<StripeAccountStatus>(
    ["realtor-stripe-status"],
    () => realtorService.getStripeAccountStatus(),
    {
      refetchOnWindowFocus: true,
    }
  );

  const { data: status, isLoading, isError, isFetching, refetch } = statusQuery;

  const onboardingMutation = useMutation(realtorService.startStripeOnboarding, {
    onSuccess: (data) => {
      if (data?.url) {
        toast.success("Redirecting you to Stripe to finish onboarding...");
        window.location.href = data.url;
      } else {
        toast.error("Unable to start Stripe onboarding. Please try again.");
      }
    },
    onError: (error) => {
      toast.error(formatErrorMessage(error));
    },
  });

  const dashboardMutation = useMutation(realtorService.getStripeDashboardLink, {
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error("Unable to open Stripe dashboard. Please try again.");
      }
    },
    onError: (error) => {
      toast.error(formatErrorMessage(error));
    },
  });

  const outstandingRequirements =
    status?.outstandingRequirements ?? EMPTY_REQUIREMENTS;

  const requiresAction = useMemo(() => {
    if (!status) return true;
    if (!status.connected) return true;
    if (!status.detailsSubmitted) return true;
    if (!status.payoutsEnabled || !status.chargesEnabled) return true;
    if (outstandingRequirements.length > 0) return true;
    return false;
  }, [status, outstandingRequirements]);

  const shouldOpenDashboard = Boolean(
    status?.connected && status?.detailsSubmitted
  );

  const primaryButtonLabel = shouldOpenDashboard
    ? status?.payoutsEnabled
      ? "Open Stripe Dashboard"
      : "Review Stripe Tasks"
    : status?.connected
    ? "Continue Stripe Onboarding"
    : "Start Stripe Onboarding";

  const primaryButtonLoading = shouldOpenDashboard
    ? dashboardMutation.isLoading
    : onboardingMutation.isLoading;

  const handlePrimaryAction = () => {
    if (shouldOpenDashboard) {
      dashboardMutation.mutate();
    } else {
      onboardingMutation.mutate();
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);
    const completed = params.get("completed");
    const refresh = params.get("refresh");
    const error = params.get("error");

    if (completed) {
      toast.success(
        "Stripe onboarding completed. We are refreshing your status."
      );
      refetch();
      router.replace("/dashboard/payments");
      return;
    }

    if (error) {
      toast.error(decodeURIComponent(error));
      router.replace("/dashboard/payments");
      return;
    }

    if (refresh) {
      toast("Please finish your Stripe onboarding to enable payouts.");
      router.replace("/dashboard/payments");
    }
  }, [router, searchParamsString, refetch]);

  useEffect(() => {
    if (isError) {
      toast.error("Unable to load Stripe account status. Please try again.");
    }
  }, [isError]);

  const releaseDelayCopy = useMemo(
    () => getReleaseDelayCopy(status?.releaseOffsetHours),
    [status?.releaseOffsetHours]
  );

  return (
    <ModernDashboardLayout
      currentUser={user}
      activeRoute="payments"
      onRouteChange={() => {}}
    >
      <div className="px-4 py-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-gray-900">
              Stripe payouts & escrow
            </h1>
            <p className="text-gray-600">
              Connect your Stripe account to receive payouts from completed
              bookings. We keep funds in escrow until your guest checks out and
              no disputes are present.
            </p>
          </div>

          <Card>
            <Card.Header
              title="Stripe Connect status"
              subtitle="Your payouts are routed through Stripe Connect with safeguards for disputes and chargebacks."
              actions={
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="primary"
                    onClick={handlePrimaryAction}
                    loading={primaryButtonLoading}
                    disabled={isFetching}
                  >
                    {primaryButtonLabel}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleRefresh}
                    disabled={isFetching}
                  >
                    Refresh status
                  </Button>
                </div>
              }
            />
            <Card.Content>
              {isLoading && (
                <div className="flex min-h-[180px] items-center justify-center">
                  <Loading text="Checking your Stripe account" />
                </div>
              )}

              {!isLoading && isError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  We couldn&#39;t fetch your Stripe account details. Please try
                  again shortly.
                </div>
              )}

              {!isLoading && status && (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {statusItems(status).map((item) => (
                      <div
                        key={item.label}
                        className="flex items-start justify-between rounded-lg border border-gray-200 bg-gray-50 p-4"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.label}
                          </p>
                          {item.helper && (
                            <p className="mt-1 text-sm text-amber-600">
                              {item.helper}
                            </p>
                          )}
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                            item.value
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.value ? "Complete" : "Action needed"}
                        </span>
                      </div>
                    ))}
                  </div>

                  {status.disabledReason && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      <p className="font-medium">Account notice from Stripe</p>
                      <p className="mt-1">{status.disabledReason}</p>
                    </div>
                  )}

                  {outstandingRequirements.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <p className="font-semibold text-amber-800">
                        Outstanding requirements
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
                        {outstandingRequirements.map((requirement) => (
                          <li key={requirement}>{requirement}</li>
                        ))}
                      </ul>
                      <p className="mt-3 text-sm text-amber-700">
                        Open the Stripe dashboard to resolve these items. Once
                        cleared, refresh your status here to unlock payouts.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card.Content>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card shadow="none">
              <Card.Header
                title="Escrow release timeline"
                subtitle="We delay payouts slightly to ensure guests have a smooth stay."
              />
              <Card.Content className="space-y-3 text-sm text-gray-700">
                <p>{releaseDelayCopy}</p>
                <p>
                  If a booking is marked as disputed, we automatically place the
                  payout on hold until the dispute is resolved. Once cleared,
                  future runs of the payout job will release any held funds
                  immediately.
                </p>
                <p>
                  You can monitor upcoming releases from your dashboard once
                  Stripe confirms payouts are enabled.
                </p>
              </Card.Content>
            </Card>

            <Card shadow="none">
              <Card.Header
                title="Disputes & safeguards"
                subtitle="Chargebacks automatically pause payouts so you stay protected."
              />
              <Card.Content className="space-y-3 text-sm text-gray-700">
                <p>
                  When Stripe notifies us of a dispute, we mark the related
                  booking as disputed and stop payouts until Stripe closes the
                  case. If the dispute is won, the payout resumes on the next
                  release cycle.
                </p>
                <p>
                  You can raise manual payout holds from support as well. Any
                  hold reason and release date will appear in your booking
                  detail view for transparency.
                </p>
                <p>
                  Need help resolving a dispute? Use the Stripe dashboard link
                  above to submit evidence and track its status in real time.
                </p>
              </Card.Content>
            </Card>
          </div>

          <Card shadow="none">
            <Card.Header
              title="Tips for smooth payouts"
              subtitle="Keep these best practices in mind once your account is live."
            />
            <Card.Content className="grid gap-4 md:grid-cols-2">
              {[
                "Keep your business profile up to date in Stripe, especially payout bank details and contact email.",
                "Respond quickly to Stripe notifications about verification requirements to avoid payout delays.",
                "Encourage guests to reach out before filing disputes—fast resolutions help keep funds flowing.",
                "Download payout reports from Stripe regularly for your accounting records.",
              ].map((tip) => (
                <div
                  key={tip}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4"
                >
                  <span className="mt-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    •
                  </span>
                  <p className="text-sm text-gray-700">{tip}</p>
                </div>
              ))}
            </Card.Content>
          </Card>

          {requiresAction && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              Finish the steps above to unlock automated payouts. Once your
              Stripe account is fully verified, this page will show real-time
              payout status and any held bookings.
            </div>
          )}
        </div>
      </div>
    </ModernDashboardLayout>
  );
};

export default StripePayoutsPage;
