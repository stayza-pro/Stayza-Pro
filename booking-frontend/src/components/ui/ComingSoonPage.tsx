import Link from "next/link";
import { ArrowLeft, Clock, Rocket } from "lucide-react";

interface ComingSoonPageProps {
  feature: string;
  description?: string;
  expectedDate?: string;
}

export default function ComingSoonPage({
  feature = "This Feature",
  description = "We're working hard to bring you this amazing feature.",
  expectedDate = "Soon",
}: ComingSoonPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="mb-6">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <Rocket className="w-12 h-12 text-indigo-600" />
            </div>
          </div>

          {/* Content */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {feature} Coming Soon!
            </h1>
            <p className="text-xl text-gray-600 mb-6">{description}</p>

            <div className="flex items-center justify-center space-x-2 text-indigo-600 mb-6">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">Expected: {expectedDate}</span>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                <strong>🚀 MVP Focus:</strong> We're currently focusing on core
                booking functionality. This feature will be available in a
                future update!
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>

            <div className="text-sm text-gray-500">
              <p>Want to be notified when this feature launches?</p>
              <Link
                href="/early-access"
                className="text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Join our early access list →
              </Link>
            </div>
          </div>
        </div>

        {/* MVP Features Available */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ✅ Available MVP Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <Link
              href="/auth/login"
              className="flex items-center space-x-2 text-green-600 hover:text-green-800"
            >
              <span>✓</span>
              <span>User Authentication</span>
            </Link>
            <Link
              href="/properties"
              className="flex items-center space-x-2 text-green-600 hover:text-green-800"
            >
              <span>✓</span>
              <span>Browse Properties</span>
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 text-green-600 hover:text-green-800"
            >
              <span>✓</span>
              <span>Basic Dashboard</span>
            </Link>
            <Link
              href="/booking"
              className="flex items-center space-x-2 text-green-600 hover:text-green-800"
            >
              <span>✓</span>
              <span>Create Bookings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ComingSoonPage };
