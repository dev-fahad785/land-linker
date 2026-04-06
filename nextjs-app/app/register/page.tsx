"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("buyer");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }

      // Auto login after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Registration successful but login failed. Please login manually.");
        router.push("/login");
      } else {
        toast.success("Account created successfully!");
        if (role === "seller") {
          router.push("/seller");
        } else {
          router.push("/buyer");
        }
        router.refresh();
      }
    } catch (error) {
      toast.error("An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=\"min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4 py-12\">
      <Card className=\"w-full max-w-md border-[#E8E3D9] shadow-sm\">
        <CardHeader className=\"space-y-2\">
          <CardTitle className=\"text-3xl font-medium tracking-tight font-outfit text-[#1C211F]\">
            Create Account
          </CardTitle>
          <CardDescription className=\"text-[#59605D]\">
            Join our land dealing platform today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className=\"space-y-4\">
            <div className=\"space-y-2\">
              <Label htmlFor=\"name\" className=\"text-sm font-medium text-[#59605D]\">
                Full Name
              </Label>
              <Input
                id=\"name\"
                type=\"text\"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className=\"bg-white border-[#D1CBBF] rounded-lg focus:border-[#2B4A3B] focus:ring-1 focus:ring-[#2B4A3B]\"
              />
            </div>

            <div className=\"space-y-2\">
              <Label htmlFor=\"email\" className=\"text-sm font-medium text-[#59605D]\">
                Email
              </Label>
              <Input
                id=\"email\"
                type=\"email\"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className=\"bg-white border-[#D1CBBF] rounded-lg focus:border-[#2B4A3B] focus:ring-1 focus:ring-[#2B4A3B]\"
              />
            </div>

            <div className=\"space-y-2\">
              <Label htmlFor=\"password\" className=\"text-sm font-medium text-[#59605D]\">
                Password
              </Label>
              <Input
                id=\"password\"
                type=\"password\"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className=\"bg-white border-[#D1CBBF] rounded-lg focus:border-[#2B4A3B] focus:ring-1 focus:ring-[#2B4A3B]\"
              />
            </div>

            <div className=\"space-y-2\">
              <Label className=\"text-sm font-medium text-[#59605D]\">I want to</Label>
              <RadioGroup value={role} onValueChange={setRole}>
                <div className=\"flex items-center space-x-2\">
                  <RadioGroupItem value=\"buyer\" id=\"buyer\" />
                  <Label htmlFor=\"buyer\" className=\"text-sm font-normal cursor-pointer\">
                    Buy Land
                  </Label>
                </div>
                <div className=\"flex items-center space-x-2\">
                  <RadioGroupItem value=\"seller\" id=\"seller\" />
                  <Label htmlFor=\"seller\" className=\"text-sm font-normal cursor-pointer\">
                    Sell Land
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              type=\"submit\"
              disabled={loading}
              className=\"w-full bg-[#2B4A3B] text-white hover:bg-[#1E3329] rounded-xl px-6 py-3 font-medium\"
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className=\"mt-6 text-center text-sm text-[#59605D]\">
            Already have an account?{" "}
            <Link href=\"/login\" className=\"text-[#2B4A3B] font-medium hover:text-[#1E3329]\">
              Sign in
            </Link>
          </div>

          <div className=\"mt-4 text-center\">
            <Link href=\"/\" className=\"text-sm text-[#8A918E] hover:text-[#59605D]\">
              Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
