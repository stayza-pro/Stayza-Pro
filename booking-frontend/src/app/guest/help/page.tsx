"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  MessageCircle,
  Phone,
  Mail,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { Input, Card, Button } from "@/components/ui";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    brandColor: primaryColor,
    secondaryColor,
    accentColor,
  } = useRealtorBranding();

  const categories = useMemo(
    () => [
      {
        title: "Booking & Viewings",
        icon: "📅",
        faqs: [
          {
            question: "How do I book a property viewing?",
            answer:
              "Browse available properties, open details, choose your preferred date and time, then continue to checkout to complete your booking.",
          },
          {
            question: "Can I reschedule or cancel my viewing?",
            answer:
              "Yes. Open your booking details page and use reschedule or cancel actions based on your booking status.",
          },
        ],
      },
      {
        title: "Account & Profile",
        icon: "👤",
        faqs: [
          {
            question: "How do I update my profile information?",
            answer:
              "Go to your profile page, update your personal information, and click Save Changes.",
          },
          {
            question: "How do I delete my account?",
            answer:
              "Use the Delete Account section in your profile. We send an OTP to your email before account deletion is confirmed.",
          },
        ],
      },
      {
        title: "Messages & Support",
        icon: "💬",
        faqs: [
          {
            question: "Can I send photos and voice notes in chat?",
            answer:
              "Yes. In Messages, you can attach files and record voice notes before sending.",
          },
          {
            question: "How do I contact support quickly?",
            answer:
              "Use the contact options below to start chat, call support, or send an email.",
          },
        ],
      },
    ],
    [],
  );

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();

    return categories
      .map((category) => ({
        ...category,
        faqs: category.faqs.filter(
          (faq) =>
            faq.question.toLowerCase().includes(query) ||
            faq.answer.toLowerCase().includes(query),
        ),
      }))
      .filter((category) => category.faqs.length > 0);
  }, [categories, searchQuery]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#f8fafc" }}
    >
      <GuestHeader currentPage="help" searchPlaceholder="Search help..." />

      <div className="border-b bg-white border-gray-200">
        <div className="max-w-[1200px] mx-auto px-6 py-16 text-center">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}14` }}
          >
            <HelpCircle className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
          <h1 className="font-semibold mb-4 text-[40px] text-gray-900">
            How Can We Help?
          </h1>
          <p className="text-lg mb-8 max-w-2xl mx-auto text-gray-600">
            Search our help center or contact support for direct assistance.
          </p>

          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              type="search"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 h-14 rounded-2xl border-2 text-base bg-white border-gray-200"
            />
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6 mb-14">
          <Link href="/guest/messages">
            <Card className="p-8 rounded-2xl border text-center hover:shadow-lg transition-all bg-white border-gray-200">
              <div
                className="w-16 h-16 rounded-xl mx-auto mb-6 flex items-center justify-center"
                style={{ backgroundColor: `${accentColor || primaryColor}20` }}
              >
                <MessageCircle
                  className="w-8 h-8"
                  style={{ color: accentColor || primaryColor }}
                />
              </div>
              <h3 className="font-semibold mb-2 text-[20px] text-gray-900">
                Live Chat
              </h3>
              <p className="text-sm text-gray-600">
                Chat with our support team
              </p>
            </Card>
          </Link>

          <a href="tel:+2340000000000">
            <Card className="p-8 rounded-2xl border text-center hover:shadow-lg transition-all bg-white border-gray-200">
              <div
                className="w-16 h-16 rounded-xl mx-auto mb-6 flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Phone className="w-8 h-8" style={{ color: primaryColor }} />
              </div>
              <h3 className="font-semibold mb-2 text-[20px] text-gray-900">
                Phone Support
              </h3>
              <p className="text-sm text-gray-600">+234 000 000 0000</p>
            </Card>
          </a>

          <a href="mailto:support@stayza.pro">
            <Card className="p-8 rounded-2xl border text-center hover:shadow-lg transition-all bg-white border-gray-200">
              <div
                className="w-16 h-16 rounded-xl mx-auto mb-6 flex items-center justify-center"
                style={{
                  backgroundColor: `${secondaryColor || primaryColor}20`,
                }}
              >
                <Mail
                  className="w-8 h-8"
                  style={{ color: secondaryColor || primaryColor }}
                />
              </div>
              <h3 className="font-semibold mb-2 text-[20px] text-gray-900">
                Email Support
              </h3>
              <p className="text-sm text-gray-600">support@stayza.pro</p>
            </Card>
          </a>
        </div>

        <h2 className="font-semibold mb-8 text-[32px] text-gray-900">
          Frequently Asked Questions
        </h2>

        <div className="space-y-8">
          {filteredCategories.map((category) => (
            <Card
              key={category.title}
              className="rounded-2xl border overflow-hidden bg-white border-gray-200"
            >
              <div className="p-6 border-b flex items-center gap-3 bg-gray-50 border-gray-200">
                <span className="text-3xl">{category.icon}</span>
                <h3 className="font-semibold text-xl text-gray-900">
                  {category.title}
                </h3>
              </div>

              <div className="px-6 py-2">
                {category.faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="group border-b last:border-b-0 border-gray-100"
                  >
                    <summary className="cursor-pointer list-none py-5 font-medium text-gray-900">
                      {faq.question}
                    </summary>
                    <p className="pb-5 text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div
          className="mt-14 p-10 rounded-2xl text-center"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor || primaryColor} 100%)`,
          }}
        >
          <h3 className="text-3xl font-semibold text-white mb-4">
            Still Need Help?
          </h3>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Our support team is available to guide you through booking, payment,
            and account issues.
          </p>
          <Link href="/guest/messages">
            <Button
              size="lg"
              className="h-14 px-8 rounded-xl font-semibold text-white"
              style={{ backgroundColor: accentColor || primaryColor }}
            >
              Contact Support
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
