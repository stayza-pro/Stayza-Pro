"use client";

import { useState } from "react";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { palette } from "@/app/(marketing)/content";

export function WaitlistForm() {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    companyName: "",
    phone: "",
    source: "",
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/waitlist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setMessage(data.message);
        setFormData({
          email: "",
          fullName: "",
          companyName: "",
          phone: "",
          source: "",
        });
      } else {
        setStatus("error");
        setMessage(data.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Failed to join waitlist. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {status === "success" ? (
        <div className="text-center py-12">
          <CheckCircle2
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: palette.secondary }}
          />
          <h3
            className="text-2xl font-bold mb-2"
            style={{ color: palette.primary }}
          >
            You're on the list!
          </h3>
          <p className="text-gray-600">{message}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-2"
              style={{ color: palette.primary }}
            >
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:border-transparent transition-all"
              style={
                {
                  "--tw-ring-color": palette.primary,
                } as React.CSSProperties
              }
              placeholder="your@email.com"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium mb-2"
                style={{ color: palette.primary }}
              >
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:border-transparent transition-all"
                style={
                  {
                    "--tw-ring-color": palette.primary,
                  } as React.CSSProperties
                }
                placeholder="John Doe"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium mb-2"
                style={{ color: palette.primary }}
              >
                Phone (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:border-transparent transition-all"
                style={
                  {
                    "--tw-ring-color": palette.primary,
                  } as React.CSSProperties
                }
                placeholder="+234 XXX XXX XXXX"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="companyName"
              className="block text-sm font-medium mb-2"
              style={{ color: palette.primary }}
            >
              Company/Business Name
            </label>
            <input
              type="text"
              id="companyName"
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:border-transparent transition-all"
              style={
                {
                  "--tw-ring-color": palette.primary,
                } as React.CSSProperties
              }
              placeholder="Your Company"
            />
          </div>

          <div>
            <label
              htmlFor="source"
              className="block text-sm font-medium mb-2"
              style={{ color: palette.primary }}
            >
              How did you hear about us?
            </label>
            <select
              id="source"
              value={formData.source}
              onChange={(e) =>
                setFormData({ ...formData, source: e.target.value })
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:border-transparent transition-all"
              style={
                {
                  "--tw-ring-color": palette.primary,
                } as React.CSSProperties
              }
            >
              <option value="">Select an option</option>
              <option value="search">Search Engine</option>
              <option value="social">Social Media</option>
              <option value="friend">Friend/Colleague</option>
              <option value="ad">Advertisement</option>
              <option value="other">Other</option>
            </select>
          </div>

          {status === "error" && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full px-6 py-4 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              backgroundColor: palette.primary,
            }}
            onMouseEnter={(e) => {
              if (status !== "loading") {
                e.currentTarget.style.backgroundColor = palette.secondary;
              }
            }}
            onMouseLeave={(e) => {
              if (status !== "loading") {
                e.currentTarget.style.backgroundColor = palette.primary;
              }
            }}
          >
            {status === "loading" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Joining Waitlist...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                Join Waitlist
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            We'll notify you when we launch. No spam, ever.
          </p>
        </form>
      )}
    </div>
  );
}
