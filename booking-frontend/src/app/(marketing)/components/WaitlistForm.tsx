"use client";

import { useState } from "react";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";

export function WaitlistForm() {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    companyName: "",
    phone: "",
    source: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/waitlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

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
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-marketing-foreground mb-2">
            You're on the list!
          </h3>
          <p className="text-marketing-muted">{message}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-marketing-foreground mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-marketing-foreground mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-marketing-foreground mb-2">
                Phone (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+234 XXX XXX XXXX"
              />
            </div>
          </div>

          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-marketing-foreground mb-2">
              Company/Business Name
            </label>
            <input
              type="text"
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your Company"
            />
          </div>

          <div>
            <label htmlFor="source" className="block text-sm font-medium text-marketing-foreground mb-2">
              How did you hear about us?
            </label>
            <select
              id="source"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          <p className="text-xs text-center text-marketing-muted">
            We'll notify you when we launch. No spam, ever.
          </p>
        </form>
      )}
    </div>
  );
}
