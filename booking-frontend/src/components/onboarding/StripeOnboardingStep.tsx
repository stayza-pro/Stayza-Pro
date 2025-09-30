import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { OnboardingData } from "@/app/onboarding/page";

interface StripeOnboardingStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

interface StripeAccount {
  id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
  };
}

export const StripeOnboardingStep: React.FC<StripeOnboardingStepProps> = ({
  data,
  onUpdate,
  onNext,
  onBack,
  isSubmitting,
}) => {
  const [stripeAccount, setStripeAccount] = useState<StripeAccount | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock Stripe account status - In real app, this would come from API
  useEffect(() => {
    // Simulate checking existing Stripe account
    if (data.stripeAccountId) {
      setStripeAccount({
        id: data.stripeAccountId,
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        requirements: {
          currently_due: [],
          eventually_due: [],
          past_due: [],
        },
      });
    }
  }, [data.stripeAccountId]);

  const handleCreateStripeAccount = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call to create Stripe Connect account
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock successful account creation
      const accountId = `acct_${Math.random().toString(36).substr(2, 9)}`;

      setStripeAccount({
        id: accountId,
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
        requirements: {
          currently_due: [
            "business_profile.url",
            "external_account",
            "tos_acceptance.date",
          ],
          eventually_due: ["business_profile.product_description"],
          past_due: [],
        },
      });

      onUpdate({ stripeAccountId: accountId });
    } catch (err) {
      setError("Failed to create Stripe account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteStripeOnboarding = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call to get Stripe onboarding URL
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, this would redirect to Stripe's onboarding flow
      window.open("https://connect.stripe.com/express/onboarding", "_blank");

      // Simulate completed onboarding after a delay
      setTimeout(() => {
        setStripeAccount((prev) =>
          prev
            ? {
                ...prev,
                charges_enabled: true,
                payouts_enabled: true,
                details_submitted: true,
                requirements: {
                  currently_due: [],
                  eventually_due: [],
                  past_due: [],
                },
              }
            : null
        );
        setIsLoading(false);
      }, 3000);
    } catch (err) {
      setError("Failed to start Stripe onboarding. Please try again.");
      setIsLoading(false);
    }
  };

  const getAccountStatus = () => {
    if (!stripeAccount) return "not_started";

    if (stripeAccount.charges_enabled && stripeAccount.payouts_enabled) {
      return "complete";
    }

    if (stripeAccount.details_submitted) {
      return "pending";
    }

    return "incomplete";
  };

  const accountStatus = getAccountStatus();

  const canProceed = accountStatus === "complete";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CreditCard className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Payment Setup</h2>
        <p className="text-gray-600 mt-2">
          Set up your Stripe account to receive payments from bookings
        </p>
      </div>

      <div className="bg-white border rounded-lg p-6">
        {!stripeAccount && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
              <CreditCard className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Connect Your Stripe Account
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              We use Stripe to handle secure payments. You&apos;ll need to
              create or connect your Stripe account to start receiving payments.
            </p>
            <Button
              onClick={handleCreateStripeAccount}
              loading={isLoading}
              className="px-8"
            >
              Create Stripe Account
            </Button>
          </div>
        )}

        {stripeAccount && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {accountStatus === "complete" ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-yellow-500" />
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Stripe Account Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Account ID
                    </span>
                    <span className="text-sm text-gray-900 font-mono">
                      {stripeAccount.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">
                        Accept Payments
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          stripeAccount.charges_enabled
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {stripeAccount.charges_enabled
                          ? "✓ Enabled"
                          : "✗ Disabled"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">
                        Receive Payouts
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          stripeAccount.payouts_enabled
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {stripeAccount.payouts_enabled
                          ? "✓ Enabled"
                          : "✗ Disabled"}
                      </span>
                    </div>
                  </div>

                  {stripeAccount.requirements.currently_due.length > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="text-sm font-medium text-yellow-800 mb-1">
                        Action Required
                      </h4>
                      <p className="text-sm text-yellow-700">
                        Complete your Stripe onboarding to start accepting
                        payments.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {accountStatus !== "complete" && (
              <div className="text-center">
                <Button
                  onClick={handleCompleteStripeOnboarding}
                  loading={isLoading}
                  className="px-8"
                  rightIcon={<ExternalLink className="w-4 h-4" />}
                >
                  Complete Stripe Setup
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  This will open Stripe&apos;s secure onboarding flow in a new
                  window
                </p>
              </div>
            )}

            {accountStatus === "complete" && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h4 className="text-sm font-medium text-green-800">
                    Payment Setup Complete!
                  </h4>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your Stripe account is fully set up and ready to accept
                  payments.
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">
          💡 About Stripe Connect
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>
            • Secure payment processing with industry-leading fraud protection
          </li>
          <li>• Automatic payouts to your bank account (daily or weekly)</li>
          <li>
            • Comprehensive dashboard for tracking earnings and transactions
          </li>
          <li>
            • Support for credit cards, digital wallets, and local payment
            methods
          </li>
        </ul>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <Button onClick={onBack} variant="outline" disabled={isSubmitting}>
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed || isSubmitting}
          className="px-8"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
