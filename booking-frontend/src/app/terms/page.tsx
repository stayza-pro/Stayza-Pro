"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, Scale, FileText, AlertCircle } from "lucide-react";

export default function TermsOfServicePage() {
  const lastUpdated = "December 31, 2025";

  const sections = [
    { id: "acceptance", title: "1. Acceptance of Terms" },
    { id: "definitions", title: "2. Definitions" },
    { id: "eligibility", title: "3. Eligibility and Account Registration" },
    { id: "services", title: "4. Services Provided" },
    { id: "realtor-obligations", title: "5. Realtor Obligations" },
    { id: "guest-obligations", title: "6. Guest Obligations" },
    { id: "bookings", title: "7. Bookings and Payments" },
    { id: "cancellations", title: "8. Cancellations and Refunds" },
    { id: "escrow", title: "9. Escrow and Payment Protection" },
    { id: "fees", title: "10. Platform Fees and Commission" },
    { id: "content", title: "11. User-Generated Content" },
    { id: "prohibited", title: "12. Prohibited Activities" },
    { id: "liability", title: "13. Limitation of Liability" },
    { id: "indemnification", title: "14. Indemnification" },
    { id: "termination", title: "15. Account Termination" },
    { id: "disputes", title: "16. Dispute Resolution" },
    { id: "changes", title: "17. Changes to Terms" },
    { id: "contact", title: "18. Contact Information" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Scale className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Terms of Service
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Last updated: {lastUpdated}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents - Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Contents
              </h2>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 p-8 prose prose-blue max-w-none">
              {/* Important Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 not-prose">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-amber-900 mb-1">
                      Important Notice
                    </h3>
                    <p className="text-sm text-amber-800">
                      Please read these Terms of Service carefully before using
                      the Stayza platform. By accessing or using our services,
                      you agree to be bound by these terms.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 1: Acceptance of Terms */}
              <section id="acceptance" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  1. Acceptance of Terms
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Welcome to Stayza ("Platform", "we", "us", or "our"). By
                  accessing or using the Stayza platform, you agree to be bound
                  by these Terms of Service ("Terms"). If you do not agree to
                  these Terms, you may not access or use our services.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  These Terms constitute a legally binding agreement between you
                  and Stayza. We reserve the right to modify these Terms at any
                  time, and your continued use of the Platform after such
                  modifications constitutes your acceptance of the updated
                  Terms.
                </p>
              </section>

              {/* Section 2: Definitions */}
              <section id="definitions" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  2. Definitions
                </h2>
                <ul className="space-y-2 text-gray-700">
                  <li>
                    <strong>"Platform"</strong> refers to the Stayza website,
                    mobile applications, and all related services.
                  </li>
                  <li>
                    <strong>"Realtor"</strong> refers to property owners or
                    managers who list properties on the Platform.
                  </li>
                  <li>
                    <strong>"Guest"</strong> refers to users who book properties
                    through the Platform.
                  </li>
                  <li>
                    <strong>"Listing"</strong> refers to a property advertised
                    for rental on the Platform.
                  </li>
                  <li>
                    <strong>"Booking"</strong> refers to a confirmed reservation
                    made by a Guest for a Listing.
                  </li>
                  <li>
                    <strong>"Escrow"</strong> refers to the secure holding of
                    payment funds until booking completion.
                  </li>
                </ul>
              </section>

              {/* Section 3: Eligibility */}
              <section id="eligibility" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  3. Eligibility and Account Registration
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  To use the Platform, you must:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li>Be at least 18 years of age</li>
                  <li>
                    Have the legal capacity to enter into binding contracts
                  </li>
                  <li>
                    Provide accurate, current, and complete information during
                    registration
                  </li>
                  <li>
                    Maintain the security of your account credentials and be
                    responsible for all activities under your account
                  </li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  You agree to notify us immediately of any unauthorized use of
                  your account. We reserve the right to suspend or terminate
                  accounts that violate these Terms or engage in fraudulent
                  activity.
                </p>
              </section>

              {/* Section 4: Services Provided */}
              <section id="services" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  4. Services Provided
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Stayza provides an online marketplace connecting Realtors with
                  Guests for short-term property rentals. Our services include:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Property listing and discovery tools</li>
                  <li>Booking and payment processing</li>
                  <li>Escrow payment protection</li>
                  <li>Review and rating systems</li>
                  <li>Communication tools between Realtors and Guests</li>
                  <li>Dispute resolution assistance</li>
                  <li>Multi-tenant custom subdomain websites for Realtors</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  Stayza acts as an intermediary and is not a party to the
                  rental agreement between Realtors and Guests. We do not own,
                  operate, or control any properties listed on the Platform.
                </p>
              </section>

              {/* Section 5: Realtor Obligations */}
              <section id="realtor-obligations" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  5. Realtor Obligations
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  As a Realtor, you agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    Provide accurate and complete information about your
                    properties
                  </li>
                  <li>
                    Maintain your properties in safe and habitable condition
                  </li>
                  <li>
                    Comply with all applicable laws, regulations, and local
                    ordinances
                  </li>
                  <li>
                    Respond promptly to booking requests and Guest inquiries
                  </li>
                  <li>
                    Honor confirmed bookings and provide agreed-upon services
                  </li>
                  <li>
                    Maintain liability insurance for your properties
                    (recommended)
                  </li>
                  <li>Complete CAC verification for business legitimacy</li>
                  <li>
                    Update property availability calendars to reflect accurate
                    availability
                  </li>
                </ul>
              </section>

              {/* Section 6: Guest Obligations */}
              <section id="guest-obligations" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  6. Guest Obligations
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  As a Guest, you agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    Treat properties with respect and leave them in good
                    condition
                  </li>
                  <li>
                    Comply with house rules and property-specific policies
                  </li>
                  <li>
                    Pay all fees associated with your booking in a timely manner
                  </li>
                  <li>
                    Report any issues or damages to the Realtor and Stayza
                    promptly
                  </li>
                  <li>
                    Use properties only for their intended purpose and comply
                    with maximum occupancy limits
                  </li>
                  <li>Not engage in illegal activities or disturb neighbors</li>
                </ul>
              </section>

              {/* Section 7: Bookings and Payments */}
              <section id="bookings" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  7. Bookings and Payments
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  When you make a booking:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li>
                    You authorize Stayza to charge the full booking amount to
                    your payment method
                  </li>
                  <li>
                    Payment is processed through our secure payment gateway
                    (Paystack)
                  </li>
                  <li>
                    Funds are held in escrow until the booking is completed
                  </li>
                  <li>
                    A platform commission is deducted before payment to the
                    Realtor
                  </li>
                  <li>
                    You are responsible for all charges, including taxes and
                    fees
                  </li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  All payments are final and non-refundable except as outlined
                  in our Cancellation Policy (Section 8).
                </p>
              </section>

              {/* Section 8: Cancellations and Refunds */}
              <section id="cancellations" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  8. Cancellations and Refunds
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Guest Cancellations:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li>
                    Cancellations made 48+ hours before check-in: Full refund
                    minus processing fees
                  </li>
                  <li>
                    Cancellations made 24-48 hours before check-in: 50% refund
                  </li>
                  <li>
                    Cancellations made less than 24 hours before check-in: No
                    refund
                  </li>
                </ul>
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Realtor Cancellations:</strong>
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If a Realtor cancels a confirmed booking, the Guest receives a
                  full refund, and the Realtor may face penalties including
                  account suspension.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Refunds are processed within 5-10 business days to the
                  original payment method.
                </p>
              </section>

              {/* Section 9: Escrow */}
              <section id="escrow" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  9. Escrow and Payment Protection
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Stayza uses an escrow system to protect both Guests and
                  Realtors:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    Funds are held securely until the Guest checks in
                    successfully
                  </li>
                  <li>
                    Realtors receive payment after the booking period begins
                  </li>
                  <li>
                    Disputed funds are held pending resolution of the dispute
                  </li>
                  <li>
                    Stayza may hold funds for up to 14 days after check-out to
                    address potential issues
                  </li>
                </ul>
              </section>

              {/* Section 10: Fees */}
              <section id="fees" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  10. Platform Fees and Commission
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Stayza charges the following fees:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    <strong>Realtor Commission:</strong> A percentage of each
                    booking is deducted as platform commission (amount varies by
                    platform settings)
                  </li>
                  <li>
                    <strong>Payment Processing Fee:</strong> Paystack
                    transaction fees apply to all payments
                  </li>
                  <li>
                    <strong>Cancellation Fee:</strong> A small processing fee
                    may apply to refunds
                  </li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  All fees are clearly displayed before booking confirmation. We
                  reserve the right to modify our fee structure with 30 days'
                  notice.
                </p>
              </section>

              {/* Section 11: User Content */}
              <section id="content" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  11. User-Generated Content
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  By posting content on the Platform (including property
                  listings, photos, reviews, and messages), you grant Stayza a
                  non-exclusive, worldwide, royalty-free license to use,
                  display, and distribute such content.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You represent that:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    You own or have permission to use all content you post
                  </li>
                  <li>
                    Your content does not violate any third-party rights or
                    applicable laws
                  </li>
                  <li>
                    Your content is accurate, not misleading, and not defamatory
                  </li>
                </ul>
              </section>

              {/* Section 12: Prohibited Activities */}
              <section id="prohibited" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  12. Prohibited Activities
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You may not:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    Use the Platform for illegal purposes or to facilitate
                    illegal activities
                  </li>
                  <li>
                    Circumvent the Platform by completing transactions outside
                    of Stayza
                  </li>
                  <li>Create fake accounts, listings, or reviews</li>
                  <li>
                    Scrape, data mine, or use automated tools to access the
                    Platform
                  </li>
                  <li>Harass, threaten, or discriminate against other users</li>
                  <li>Transmit viruses, malware, or other harmful code</li>
                  <li>Impersonate Stayza staff, other users, or entities</li>
                </ul>
              </section>

              {/* Section 13: Liability */}
              <section id="liability" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  13. Limitation of Liability
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, STAYZA SHALL NOT BE
                  LIABLE FOR:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    Indirect, incidental, consequential, or punitive damages
                  </li>
                  <li>
                    Loss of profits, revenue, data, or business opportunities
                  </li>
                  <li>
                    Property damage, personal injury, or death arising from
                    property stays
                  </li>
                  <li>Disputes between Realtors and Guests</li>
                  <li>
                    Acts or omissions of third-party service providers (e.g.,
                    payment processors)
                  </li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  Our total liability shall not exceed the fees paid by you in
                  the 12 months preceding the claim.
                </p>
              </section>

              {/* Section 14: Indemnification */}
              <section id="indemnification" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  14. Indemnification
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  You agree to indemnify, defend, and hold harmless Stayza, its
                  officers, directors, employees, and agents from any claims,
                  liabilities, damages, losses, and expenses (including legal
                  fees) arising from: (a) your use of the Platform; (b) your
                  violation of these Terms; (c) your violation of any
                  third-party rights; or (d) your content posted on the
                  Platform.
                </p>
              </section>

              {/* Section 15: Termination */}
              <section id="termination" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  15. Account Termination
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We reserve the right to suspend or terminate your account at
                  any time for:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Violation of these Terms</li>
                  <li>Fraudulent or suspicious activity</li>
                  <li>Multiple cancellations or poor performance (Realtors)</li>
                  <li>Abuse of the Platform or other users</li>
                  <li>Non-payment of fees</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  You may close your account at any time through your account
                  settings. Upon termination, you remain liable for any
                  outstanding obligations.
                </p>
              </section>

              {/* Section 16: Disputes */}
              <section id="disputes" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  16. Dispute Resolution
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  In the event of a dispute:
                </p>
                <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                  <li>
                    First, contact our support team to attempt informal
                    resolution
                  </li>
                  <li>
                    If unresolved, disputes shall be resolved through binding
                    arbitration under Nigerian law
                  </li>
                  <li>
                    Arbitration shall be conducted in Lagos, Nigeria, unless
                    otherwise agreed
                  </li>
                  <li>
                    You waive your right to participate in class action lawsuits
                  </li>
                </ol>
              </section>

              {/* Section 17: Changes */}
              <section id="changes" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  17. Changes to Terms
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update these Terms from time to time. Material changes
                  will be communicated via email or Platform notification at
                  least 30 days before taking effect. Your continued use of the
                  Platform after changes become effective constitutes acceptance
                  of the revised Terms.
                </p>
              </section>

              {/* Section 18: Contact */}
              <section id="contact" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  18. Contact Information
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  For questions about these Terms, please contact us:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                  <p className="mb-2">
                    <strong>Stayza</strong>
                  </p>
                  <p>Email: legal@stayza.pro</p>
                  <p>Phone: +234 (0) XXX XXX XXXX</p>
                  <p>Address: Lagos, Nigeria</p>
                </div>
              </section>

              {/* Footer */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                  By using Stayza, you acknowledge that you have read,
                  understood, and agree to be bound by these Terms of Service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
