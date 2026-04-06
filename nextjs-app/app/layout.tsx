import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "LandDeal - Buy and Sell Land Directly",
  description: "Connect directly with land sellers. No brokers, no commissions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-manrope">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
