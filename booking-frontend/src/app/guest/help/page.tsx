"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { HelpCircle, Search, MessageSquare, Phone, Mail } from "lucide-react";
import { Input, Card } from "@/components/ui";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Footer } from "@/components/guest/sections/Footer";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    brandColor: primaryColor,
    secondaryColor,
    accentColor,
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();

  const faqs = useMemo(
    () => [
      {
        question: "How do I book a property?",
        answer:
          "Browse our properties, select one you like, choose your dates, and click Request to Book. You need to provide payment information and agree to terms.",
      },
      {
        question: "What is your cancellation policy?",
        answer:
          "Cancellation and refund eligibility depends on how close check-in is. You can preview your refund from the booking details page before cancelling.",
      },
      {
        question: "How do I contact my realtor?",
        answer:
          "You can message your realtor directly through the Messages page for booking updates or property questions.",
      },
      {
        question: "When will I be charged?",
        answer:
          "Your payment method is charged when the booking is confirmed and you receive a receipt immediately.",
      },
      {
        question: "Can I modify my booking?",
        answer:
          "You can request booking changes through messages with your realtor. Changes depend on availability and may update pricing.",
      },
      {
        question: "What if I have issues during my stay?",
        answer:
          "Contact your realtor right away through messaging, or reach support for urgent assistance.",
      },
    ],
    [],
  );

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) {
      return faqs;
    }

    const query = searchQuery.toLowerCase();
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query),
    );
  }, [searchQuery, faqs]);

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col"
      style={{ colorScheme: "light" }}
    >
      <GuestHeader currentPage="help" searchPlaceholder="Search help..." />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="text-center mb-12">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">
            How can we help?
          </h1>
          <p className="text-gray-600">
            Find answers to common questions or contact our support team
          </p>
        </div>

        <div className="relative mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            type="text"
            placeholder="Search for help..."
            className="pl-12 h-14 text-lg"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <div className="mb-12 space-y-3">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">
            Frequently Asked Questions
          </h2>
          {filteredFaqs.map((faq) => (
            <Card
              key={faq.question}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <h3 className="font-semibold text-gray-900 mb-2">
                {faq.question}
              </h3>
              <p className="text-gray-600">{faq.answer}</p>
            </Card>
          ))}
        </div>

        <Card className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
            Still need help?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/guest/messages"
              className="flex flex-col items-center text-center p-6 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3 text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-1 text-gray-900">Live Chat</h3>
              <p className="text-sm text-gray-600">
                Chat with our support team
              </p>
            </Link>

            <a
              href="tel:+2340000000000"
              className="flex flex-col items-center text-center p-6 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3 text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-1 text-gray-900">Call Us</h3>
              <p className="text-sm text-gray-600">+234 000 000 0000</p>
            </a>

            <a
              href="mailto:support@stayza.com"
              className="flex flex-col items-center text-center p-6 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3 text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-1 text-gray-900">Email</h3>
              <p className="text-sm text-gray-600">support@stayza.com</p>
            </a>
          </div>
        </Card>
      </main>

      <Footer
        realtorName={realtorName}
        tagline={tagline}
        logo={logoUrl}
        description={description}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        accentColor={accentColor}
      />
    </div>
  );
}
