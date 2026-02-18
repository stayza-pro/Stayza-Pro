import api from "./api";

export const EMAIL_TEMPLATE_OPTIONS = [
  "welcome",
  "realtor-welcome",
  "email-verification",
  "password-reset",
  "realtor-approved",
] as const;

export type EmailTemplateName = (typeof EMAIL_TEMPLATE_OPTIONS)[number];

export const emailService = {
  async getTemplatePreview(templateName: EmailTemplateName): Promise<string> {
    const response = await api.get(`/email/preview/${templateName}`, {
      responseType: "text",
    });

    if (typeof response.data === "string") {
      return response.data;
    }

    return String(response.data || "");
  },
};
