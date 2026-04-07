import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp, Shield, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#FDFBF7]/80 border-b border-[#E8E3D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <MapPin className="w-8 h-8 text-[#2B4A3B]" strokeWidth={1.5} />
              <span className="text-2xl font-medium tracking-tight font-outfit text-[#1C211F]">
                LandDeal
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-[#1C211F] hover:bg-[#F5F3ED] rounded-xl px-5 py-2"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-[#2B4A3B] text-white hover:bg-[#1E3329] rounded-xl px-6 py-2 font-medium">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1698154050505-1c8a63425130?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MTJ8MHwxfHNlYXJjaHw0fHxlbXB0eSUyMGdyZWVuJTIwbGFuZCUyMGxhbmRzY2FwZXxlbnwwfHx8fDE3NzU0ODg3NDd8MA&ixlib=rb-4.1.0&q=85"
            alt="Land landscape"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl lg:text-6xl tracking-tighter leading-none font-medium mb-6 font-outfit text-[#1C211F]">
              Find Your Perfect Land, Directly
            </h1>
            <p className="text-lg leading-relaxed text-[#59605D] mb-8 max-w-2xl">
              Connect directly with land sellers. No brokers, no commissions. Browse verified listings, compare properties, and make informed decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button className="bg-[#2B4A3B] text-white hover:bg-[#1E3329] rounded-xl px-8 py-4 text-lg font-medium">
                  Start Exploring
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="border border-[#D1CBBF] text-[#1C211F] hover:bg-[#F5F3ED] rounded-xl px-8 py-4 text-lg font-medium"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl tracking-tight leading-tight font-medium mb-4 font-outfit text-[#1C211F]">
              Why Choose LandDeal?
            </h2>
            <p className="text-lg leading-relaxed text-[#59605D]">
              The smarter way to buy and sell land
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-[#E8E3D9] rounded-2xl p-8 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-[#E5F0EA] rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-[#2B4A3B]" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl tracking-tight font-medium mb-3 font-outfit text-[#1C211F]">
                Verified Listings
              </h3>
              <p className="text-base leading-relaxed text-[#59605D]">
                Every listing is verified by our admin team before going live, ensuring authenticity and peace of mind.
              </p>
            </div>

            <div className="bg-white border border-[#E8E3D9] rounded-2xl p-8 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-[#FDF2E3] rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-[#C77963]" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl tracking-tight font-medium mb-3 font-outfit text-[#1C211F]">
                Direct Communication
              </h3>
              <p className="text-base leading-relaxed text-[#59605D]">
                Chat directly with sellers to ask questions, negotiate, and make informed decisions without intermediaries.
              </p>
            </div>

            <div className="bg-white border border-[#E8E3D9] rounded-2xl p-8 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-[#E5F0EA] rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-[#2B4A3B]" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl tracking-tight font-medium mb-3 font-outfit text-[#1C211F]">
                Smart Search
              </h3>
              <p className="text-base leading-relaxed text-[#59605D]">
                Filter by location, price range, and land size to find exactly what you are looking for in seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#F5F3ED]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl tracking-tight leading-tight font-medium mb-6 font-outfit text-[#1C211F]">
            Ready to Get Started?
          </h2>
          <p className="text-lg leading-relaxed text-[#59605D] mb-8">
            Join thousands of buyers and sellers on our platform today
          </p>
          <Link href="/register">
            <Button className="bg-[#2B4A3B] text-white hover:bg-[#1E3329] rounded-xl px-10 py-4 text-lg font-medium">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-white border-t border-[#E8E3D9] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <MapPin className="w-6 h-6 text-[#2B4A3B]" strokeWidth={1.5} />
              <span className="text-xl font-medium tracking-tight font-outfit text-[#1C211F]">
                LandDeal
              </span>
            </div>
            <p className="text-sm text-[#8A918E]">
              © 2026 LandDeal. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
