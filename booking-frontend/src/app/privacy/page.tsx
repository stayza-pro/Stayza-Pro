"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, Shield, Lock, Eye, AlertCircle } from "lucide-react";

export default function PrivacyPolicyPage() {
  const lastUpdated = "December 31, 2025";

  const sections = [
    { id: "introduction", title: "1. Introduction" },
    { id: "information-collected", title: "2. Information We Collect" },
    { id: "how-we-use", title: "3. How We Use Your Information" },
    { id: "sharing", title: "4. Information Sharing and Disclosure" },
    { id: "data-security", title: "5. Data Security" },
    { id: "data-retention", title: "6. Data Retention" },
    { id: "your-rights", title: "7. Your Privacy Rights" },
    { id: "cookies", title: "8. Cookies and Tracking Technologies" },
    { id: "third-party", title: "9. Third-Party Services" },
    { id: "children", title: "10. Children's Privacy" },
    { id: "international", title: "11. International Data Transfers" },
    { id: "changes", title: "12. Changes to This Policy" },
    { id: "contact", title: "13. Contact Us" },
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
            <div className="p-3 bg-green-100 rounded-lg">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Privacy Policy
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
                <Eye className="h-4 w-4 mr-2" />
                Contents
              </h2>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 px-2 py-1 rounded transition-colors"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 p-8 prose prose-green max-w-none">
              {/* Important Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 not-prose">
                <div className="flex items-start">
                  <Lock className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">
                      Your Privacy Matters
                    </h3>
                    <p className="text-sm text-blue-800">
                      At Stayza, we are committed to protecting your privacy and
                      ensuring the security of your personal information. This
                      policy explains how we collect, use, and safeguard your
                      data.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 1: Introduction */}
              <section id="introduction" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  1. Introduction
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Stayza ("we", "us", or "our") respects your privacy and is
                  committed to protecting your personal data. This Privacy
                  Policy describes how we collect, use, disclose, and protect
                  information when you use our platform, website, and services.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  By using Stayza, you agree to the collection and use of
                  information in accordance with this Privacy Policy. If you do
                  not agree with our policies and practices, please do not use
                  our services.
                </p>
              </section>

              {/* Section 2: Information Collected */}
              <section id="information-collected" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  2. Information We Collect
                </h2>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  2.1 Information You Provide
                </h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We collect information you voluntarily provide when using our
                  services:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li>
                    <strong>Account Information:</strong> Name, email address,
                    phone number, password
                  </li>
                  <li>
                    <strong>Profile Information:</strong> Profile photo, bio,
                    business name (for Realtors)
                  </li>
                  <li>
                    <strong>Verification Information:</strong> Government-issued
                    ID, business registration (CAC for Realtors)
                  </li>
                  <li>
                    <strong>Payment Information:</strong> Credit card details,
                    bank account information (processed securely via Paystack)
                  </li>
                  <li>
                    <strong>Property Listings:</strong> Property details,
                    photos, amenities, availability
                  </li>
                  <li>
                    <strong>Communication Data:</strong> Messages, reviews,
                    support inquiries
                  </li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
                  2.2 Information Automatically Collected
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    <strong>Usage Data:</strong> Pages viewed, features used,
                    time spent on platform
                  </li>
                  <li>
                    <strong>Device Information:</strong> IP address, browser
                    type, device type, operating system
                  </li>
                  <li>
                    <strong>Location Data:</strong> Approximate geographic
                    location based on IP address
                  </li>
                  <li>
                    <strong>Cookies:</strong> Session cookies, preference
                    cookies, analytics cookies
                  </li>
                </ul>
              </section>

              {/* Section 3: How We Use */}
              <section id="how-we-use" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  3. How We Use Your Information
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We use collected information for the following purposes:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    <strong>Provide Services:</strong> Process bookings, manage
                    listings, facilitate payments
                  </li>
                  <li>
                    <strong>Account Management:</strong> Create and maintain
                    your account, authenticate users
                  </li>
                  <li>
                    <strong>Communications:</strong> Send booking confirmations,
                    updates, notifications
                  </li>
                  <li>
                    <strong>Customer Support:</strong> Respond to inquiries,
                    resolve disputes, provide assistance
                  </li>
                  <li>
                    <strong>Safety and Security:</strong> Detect fraud, prevent
                    abuse, ensure platform integrity
                  </li>
                  <li>
                    <strong>Personalization:</strong> Customize your experience,
                    recommend properties
                  </li>
                  <li>
                    <strong>Analytics:</strong> Analyze usage patterns, improve
                    services, develop new features
                  </li>
                  <li>
                    <strong>Marketing:</strong> Send promotional materials (with
                    your consent, opt-out available)
                  </li>
                  <li>
                    <strong>Legal Compliance:</strong> Comply with laws,
                    regulations, and legal requests
                  </li>
                </ul>
              </section>

              {/* Section 4: Sharing */}
              <section id="sharing" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  4. Information Sharing and Disclosure
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We do not sell your personal information. We share information
                  only in the following circumstances:
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  4.1 With Other Users
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li>
                    When you book a property, your name and contact information
                    are shared with the Realtor
                  </li>
                  <li>
                    Realtors' business information and property details are
                    visible to Guests
                  </li>
                  <li>Reviews and ratings you post are publicly visible</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  4.2 With Service Providers
                </h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We share information with third-party vendors who help us
                  operate:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li>
                    <strong>Paystack:</strong> Payment processing and
                    transaction management
                  </li>
                  <li>
                    <strong>Resend:</strong> Email delivery and transactional
                    emails
                  </li>
                  <li>
                    <strong>Cloud Hosting:</strong> Data storage and server
                    infrastructure
                  </li>
                  <li>
                    <strong>Analytics Tools:</strong> Usage analytics and
                    performance monitoring
                  </li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  4.3 Legal Requirements
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  We may disclose information to comply with legal obligations,
                  respond to lawful requests from authorities, protect our
                  rights, or investigate fraud and security issues.
                </p>
              </section>

              {/* Section 5: Data Security */}
              <section id="data-security" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  5. Data Security
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We implement industry-standard security measures to protect
                  your data:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    <strong>Encryption:</strong> Data transmitted over
                    HTTPS/TLS, sensitive data encrypted at rest
                  </li>
                  <li>
                    <strong>Access Controls:</strong> Role-based permissions,
                    limited employee access
                  </li>
                  <li>
                    <strong>Secure Payments:</strong> PCI-DSS compliant payment
                    processing via Paystack
                  </li>
                  <li>
                    <strong>Regular Audits:</strong> Security assessments and
                    vulnerability scanning
                  </li>
                  <li>
                    <strong>Password Security:</strong> Passwords hashed using
                    bcrypt
                  </li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  While we strive to protect your information, no security
                  system is 100% secure. We cannot guarantee absolute security
                  of data transmitted over the internet.
                </p>
              </section>

              {/* Section 6: Data Retention */}
              <section id="data-retention" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  6. Data Retention
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We retain your information for as long as necessary to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Provide our services to you</li>
                  <li>Comply with legal obligations</li>
                  <li>Resolve disputes and enforce agreements</li>
                  <li>Maintain business records and analytics</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  When you close your account, we may retain certain information
                  for legal, regulatory, or legitimate business purposes. You
                  can request deletion of your data (subject to legal
                  requirements).
                </p>
              </section>

              {/* Section 7: Your Rights */}
              <section id="your-rights" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  7. Your Privacy Rights
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You have the following rights regarding your personal data:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    <strong>Access:</strong> Request a copy of the personal data
                    we hold about you
                  </li>
                  <li>
                    <strong>Correction:</strong> Update or correct inaccurate
                    information
                  </li>
                  <li>
                    <strong>Deletion:</strong> Request deletion of your personal
                    data (subject to legal requirements)
                  </li>
                  <li>
                    <strong>Portability:</strong> Receive your data in a
                    structured, machine-readable format
                  </li>
                  <li>
                    <strong>Opt-Out:</strong> Unsubscribe from marketing emails
                    (link provided in emails)
                  </li>
                  <li>
                    <strong>Object:</strong> Object to certain processing
                    activities
                  </li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  To exercise these rights, contact us at privacy@stayza.pro. We
                  will respond within 30 days.
                </p>
              </section>

              {/* Section 8: Cookies */}
              <section id="cookies" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  8. Cookies and Tracking Technologies
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We use cookies and similar technologies to enhance your
                  experience:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    <strong>Essential Cookies:</strong> Required for platform
                    functionality (login, sessions)
                  </li>
                  <li>
                    <strong>Preference Cookies:</strong> Remember your settings
                    and preferences
                  </li>
                  <li>
                    <strong>Analytics Cookies:</strong> Track usage and
                    performance (Google Analytics, etc.)
                  </li>
                  <li>
                    <strong>Marketing Cookies:</strong> Deliver relevant ads and
                    measure campaign effectiveness
                  </li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  You can control cookies through your browser settings.
                  Disabling cookies may affect platform functionality.
                </p>
              </section>

              {/* Section 9: Third-Party Services */}
              <section id="third-party" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  9. Third-Party Services
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Our platform integrates with third-party services:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    <strong>Paystack:</strong> Payment processing (see
                    Paystack's privacy policy)
                  </li>
                  <li>
                    <strong>Resend:</strong> Email delivery service
                  </li>
                  <li>
                    <strong>Social Media:</strong> Links to social media
                    platforms
                  </li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  These services have their own privacy policies. We are not
                  responsible for their privacy practices. Please review their
                  policies before using these services.
                </p>
              </section>

              {/* Section 10: Children */}
              <section id="children" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  10. Children's Privacy
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Stayza is not intended for users under 18 years of age. We do
                  not knowingly collect personal information from children. If
                  you believe we have collected information from a child, please
                  contact us immediately, and we will delete it.
                </p>
              </section>

              {/* Section 11: International Transfers */}
              <section id="international" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  11. International Data Transfers
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Your information may be transferred to and processed in
                  countries other than Nigeria. We ensure appropriate safeguards
                  are in place to protect your data in accordance with this
                  Privacy Policy and applicable data protection laws.
                </p>
              </section>

              {/* Section 12: Changes */}
              <section id="changes" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  12. Changes to This Policy
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Policy from time to time. Material
                  changes will be communicated via email or platform
                  notification. The "Last Updated" date at the top indicates
                  when the policy was last revised. Your continued use after
                  changes indicates acceptance.
                </p>
              </section>

              {/* Section 13: Contact */}
              <section id="contact" className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  13. Contact Us
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  For questions about this Privacy Policy or to exercise your
                  rights, contact us:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                  <p className="mb-2">
                    <strong>Stayza Data Protection Officer</strong>
                  </p>
                  <p>Email: privacy@stayza.pro</p>
                  <p>Support Email: support@stayza.pro</p>
                  <p>Phone: +234 (0) XXX XXX XXXX</p>
                  <p>Address: Lagos, Nigeria</p>
                </div>
              </section>

              {/* Footer */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                  By using Stayza, you acknowledge that you have read and
                  understood this Privacy Policy and consent to the collection
                  and use of your information as described.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
