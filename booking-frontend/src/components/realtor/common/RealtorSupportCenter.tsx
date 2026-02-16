"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  ExternalLink,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { buildMainDomainUrl } from "@/utils/domains";

export default function RealtorSupportCenter() {
  const router = useRouter();

  const supportActions = [
    {
      title: "Help Center",
      description: "Browse guides and FAQs built for realtors.",
      icon: HelpCircle,
      action: () => window.open(buildMainDomainUrl("/guest/help"), "_blank"),
      cta: "Open Help Center",
    },
    {
      title: "Message Support",
      description: "Reach our team directly from your dashboard.",
      icon: MessageCircle,
      action: () => router.push("/messages"),
      cta: "Start a Message",
    },
    {
      title: "Email Support",
      description: "support@stayza.pro",
      icon: Mail,
      action: () => {
        window.location.href = "mailto:support@stayza.pro";
      },
      cta: "Send Email",
    },
    {
      title: "Call Us",
      description: "+234 901 234 5678",
      icon: Phone,
      action: () => {
        window.location.href = "tel:+2349012345678";
      },
      cta: "Call Support",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
              <HelpCircle className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Realtor Support
              </h1>
              <p className="text-gray-600 mt-1">
                Get the help you need to keep bookings running smoothly.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {supportActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.title}
                className="p-6 border border-gray-200 shadow-sm flex flex-col justify-between"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {action.title}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {action.description}
                    </p>
                  </div>
                </div>
                <Button
                  className="mt-2 flex items-center justify-center gap-2"
                  onClick={action.action}
                >
                  {action.cta}
                  {action.title === "Help Center" && (
                    <ExternalLink className="w-4 h-4" />
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
