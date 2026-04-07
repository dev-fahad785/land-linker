"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("🔐 Starting login flow with email:", email);
      
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      console.log("🔐 SignIn result:", result);

      if (!result) {
        toast.error("No response from auth server. Please try again.");
        return;
      }

      if (result.error || !result.ok) {
        console.error("❌ SignIn error:", result.error);
        toast.error(result.error || "Login failed. Please check your credentials.");
        return;
      }

      console.log("✅ SignIn successful");

      // Confirm authenticated session before redirecting.
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      console.log("Session response status:", response.status);
      
      const session = await response.json().catch(() => {
        console.error("❌ Failed to parse session JSON");
        return {};
      });

      console.log("📋 Session data:", session);

      if (!session?.user?.role) {
        console.error("❌ No role in session. Full session:", JSON.stringify(session));
        toast.error("Login did not complete. Verify AUTH_SECRET and MONGODB_URI in deployment environment.");
        return;
      }

      console.log("✅ Session valid with role:", session.user.role);

      // Determine redirect path
      let redirectPath = "/buyer";
      if (session.user.role === "admin") {
        redirectPath = "/admin";
        console.log("👤 Routing to admin...");
      } else if (session.user.role === "seller") {
        redirectPath = "/seller";
        console.log("👤 Routing to seller...");
      } else {
        console.log("👤 Routing to buyer...");
      }

      console.log("🚀 Navigating to:", redirectPath);
      // Use window.location for guaranteed navigation
      window.location.href = redirectPath;
    } catch (error) {
      console.error("❌ Unexpected error:", error);
      toast.error("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-[#E8E3D9] shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-medium tracking-tight font-outfit text-[#1C211F]">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-[#59605D]">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#59605D]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white border-[#D1CBBF] rounded-lg focus:border-[#2B4A3B] focus:ring-1 focus:ring-[#2B4A3B]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[#59605D]">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white border-[#D1CBBF] rounded-lg focus:border-[#2B4A3B] focus:ring-1 focus:ring-[#2B4A3B]"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2B4A3B] text-white hover:bg-[#1E3329] rounded-xl px-6 py-3 font-medium"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[#59605D]">
            Do not have an account?{" "}
            <Link href="/register" className="text-[#2B4A3B] font-medium hover:text-[#1E3329]">
              Sign up
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-[#8A918E] hover:text-[#59605D]">
              Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
