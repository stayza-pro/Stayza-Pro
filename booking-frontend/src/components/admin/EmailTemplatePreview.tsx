"use client";

import React from "react";
import { Eye, Mail, RefreshCw } from "lucide-react";
import { Button, Card } from "@/components/ui";
import {
  EMAIL_TEMPLATE_OPTIONS,
  EmailTemplateName,
  emailService,
} from "@/services/email";

type PreviewInputs = {
  fullName: string;
  businessName: string;
  dashboardUrl: string;
  verificationUrl: string;
  resetPasswordUrl: string;
};

const TEMPLATE_SUBJECTS: Record<EmailTemplateName, string> = {
  welcome: "Welcome to Stayza",
  "realtor-welcome": "Welcome to Stayza Pro",
  "email-verification": "Verify your email address",
  "password-reset": "Reset your password",
  "realtor-approved": "Your realtor account is approved",
};

const DEFAULT_INPUTS: PreviewInputs = {
  fullName: "Ada Nwosu",
  businessName: "Urban Nest Realty",
  dashboardUrl: "https://app.stayza.pro/dashboard",
  verificationUrl: "https://app.stayza.pro/verify-email?token=sample-token",
  resetPasswordUrl:
    "https://app.stayza.pro/realtor/reset-password?token=sample-token",
};

const applyInputValues = (html: string, inputs: PreviewInputs) => {
  return html
    .split("John Doe")
    .join(inputs.fullName)
    .split("Jane Smith")
    .join(inputs.fullName)
    .split("Smith Properties")
    .join(inputs.businessName)
    .split("http://localhost:3000/dashboard")
    .join(inputs.dashboardUrl)
    .split(
      "http://localhost:3000/verify-email?token=sample-token&email=jane@example.com",
    )
    .join(inputs.verificationUrl)
    .split(
      "http://localhost:3000/verify-email?token=sample-token&email=john@example.com",
    )
    .join(inputs.verificationUrl)
    .split(
      "http://localhost:3000/realtor/reset-password?token=sample-token&email=john@example.com",
    )
    .join(inputs.resetPasswordUrl);
};

export default function EmailTemplatePreview() {
  const [templateName, setTemplateName] = React.useState<EmailTemplateName>(
    "welcome",
  );
  const [inputs, setInputs] = React.useState<PreviewInputs>(DEFAULT_INPUTS);
  const [rawHtml, setRawHtml] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadTemplate = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const html = await emailService.getTemplatePreview(templateName);
      setRawHtml(html);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load email template preview.",
      );
    } finally {
      setLoading(false);
    }
  }, [templateName]);

  React.useEffect(() => {
    void loadTemplate();
  }, [loadTemplate]);

  const previewHtml = React.useMemo(
    () => applyInputValues(rawHtml, inputs),
    [inputs, rawHtml],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      <Card className="h-fit p-5">
        <div className="mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Template Controls</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Template
            </label>
            <select
              value={templateName}
              onChange={(event) =>
                setTemplateName(event.target.value as EmailTemplateName)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {EMAIL_TEMPLATE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Subject Preview
            </label>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
              {TEMPLATE_SUBJECTS[templateName]}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Full Name
            </label>
            <input
              type="text"
              value={inputs.fullName}
              onChange={(event) =>
                setInputs((prev) => ({ ...prev, fullName: event.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Business Name
            </label>
            <input
              type="text"
              value={inputs.businessName}
              onChange={(event) =>
                setInputs((prev) => ({
                  ...prev,
                  businessName: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Dashboard URL
            </label>
            <input
              type="text"
              value={inputs.dashboardUrl}
              onChange={(event) =>
                setInputs((prev) => ({ ...prev, dashboardUrl: event.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Verification URL
            </label>
            <input
              type="text"
              value={inputs.verificationUrl}
              onChange={(event) =>
                setInputs((prev) => ({
                  ...prev,
                  verificationUrl: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
              Reset Password URL
            </label>
            <input
              type="text"
              value={inputs.resetPasswordUrl}
              onChange={(event) =>
                setInputs((prev) => ({
                  ...prev,
                  resetPasswordUrl: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadTemplate()}
            loading={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Template
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Rendered Preview</h3>
          </div>
        </div>

        {error ? (
          <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : loading ? (
          <div className="m-5 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            Loading template preview...
          </div>
        ) : (
          <iframe
            title="Email template preview"
            srcDoc={previewHtml}
            className="h-[72vh] w-full bg-white"
          />
        )}
      </Card>
    </div>
  );
}
