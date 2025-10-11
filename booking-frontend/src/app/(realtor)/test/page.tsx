export default function TestPage() {
  return (
    <div className="min-h-screen bg-red-100 flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Test Page Works!
        </h1>
        <p className="text-gray-600">
          If you can see this, routing is working.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          URL: {typeof window !== "undefined" ? window.location.href : "SSR"}
        </p>
      </div>
    </div>
  );
}
