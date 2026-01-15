import { WaitlistForm } from "../components/WaitlistForm";
import { Rocket, Bell, Users } from "lucide-react";

export function WaitlistSection() {
  return (
    <section id="waitlist" className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-full text-blue-200 text-sm font-medium mb-6">
            <Rocket className="w-4 h-4" />
            Coming Soon
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Be First to Experience
            <br />
            <span className="text-blue-300">Property Booking, Reimagined</span>
          </h2>
          
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Join the waitlist and get exclusive early access when we launch. 
            Plus, special founding member benefits!
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Bell className="w-6 h-6 text-blue-300" />
            </div>
            <h3 className="text-white font-semibold mb-2">Early Access</h3>
            <p className="text-blue-200 text-sm">
              Be among the first to use Stayza Pro before public launch
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-blue-300" />
            </div>
            <h3 className="text-white font-semibold mb-2">Founding Member</h3>
            <p className="text-blue-200 text-sm">
              Special pricing and exclusive features for early adopters
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Rocket className="w-6 h-6 text-blue-300" />
            </div>
            <h3 className="text-white font-semibold mb-2">Shape the Future</h3>
            <p className="text-blue-200 text-sm">
              Your feedback will directly influence product features
            </p>
          </div>
        </div>

        {/* Waitlist Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <WaitlistForm />
        </div>

        {/* Social Proof */}
        <div className="text-center mt-8">
          <p className="text-blue-200 text-sm">
            Join <span className="font-bold text-white">500+</span> property professionals already on the waitlist
          </p>
        </div>
      </div>
    </section>
  );
}
