import { SectionTitle } from "../components/SectionTitle";
import { CreditCard, Mail, Cloud, Database, Shield, Zap } from "lucide-react";

const integrations = [
  {
    name: "Paystack",
    description: "Secure payment processing for African markets",
    icon: CreditCard,
    color: "#00C3F7",
    category: "Payments",
  },
  {
    name: "Stripe",
    description: "Global payment infrastructure",
    icon: CreditCard,
    color: "#635BFF",
    category: "Payments",
  },
  {
    name: "Resend",
    description: "Transactional email delivery",
    icon: Mail,
    color: "#000000",
    category: "Communication",
  },
  {
    name: "Cloudinary",
    description: "Image & media management",
    icon: Cloud,
    color: "#3448C5",
    category: "Media",
  },
  {
    name: "PostgreSQL",
    description: "Reliable database infrastructure",
    icon: Database,
    color: "#336791",
    category: "Database",
  },
  {
    name: "Prisma ORM",
    description: "Type-safe database toolkit",
    icon: Database,
    color: "#2D3748",
    category: "Database",
  },
];

const features = [
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level encryption and compliance built-in",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized performance for instant bookings",
  },
  {
    icon: Cloud,
    title: "Cloud Native",
    description: "Scalable infrastructure that grows with you",
  },
];

export function IntegrationsSection() {
  return (
    <section id="integrations" className="py-24 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Built with Industry Leaders"
          title="Powered by Best-in-Class Technology"
          description="We've integrated the most reliable tools so you don't have to worry about the tech stack"
        />

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {features.map((feature) => (
            <div key={feature.title} className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Integrations Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${integration.color}15` }}
                >
                  <integration.icon
                    className="w-6 h-6"
                    style={{ color: integration.color }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {integration.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{integration.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badge */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 mb-4">Trusted by industry standards</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-2 text-gray-400">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">PCI DSS Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">GDPR Ready</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">SOC 2 Type II</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
