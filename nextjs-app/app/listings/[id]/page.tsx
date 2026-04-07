"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  city: string;
  location: string;
  land_size: number;
  images: string[];
  seller_id: string;
  seller_name: string;
  seller_email: string;
  created_at: string;
};

export default function ListingDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const primaryButton = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white bg-[#2B4A3B] hover:bg-[#1E3329]";
  const outlineButton = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border border-[#D1CBBF] hover:bg-[#F5F3ED]";
  const dangerButton = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border border-[#B04A41] text-[#B04A41] hover:bg-[#FBEAE8]";
  const cardClass = "rounded-xl border border-[#E8E3D9] bg-white shadow-sm";
  const inputClass = "w-full rounded-md border border-[#D1CBBF] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4A3B]/30";

  useEffect(() => {
    if (!params?.id) return;
    void fetchListing(params.id);
  }, [params?.id]);

  async function fetchListing(id: string) {
    try {
      setLoading(true);
      const response = await fetch(`/api/listings/${id}`);
      const data = (await response.json().catch(() => ({}))) as Listing | { error?: string };

      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Failed to fetch listing details");
      }

      setListing(data as Listing);
      setSelectedImage(0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch listing details");
      router.push("/buyer");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!listing) return;
    if (!messageText.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      setSendingMessage(true);
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listing.id,
          message: messageText.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      toast.success("Message sent successfully");
      setMessageText("");
      router.push("/messages");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  }

  if (status === "loading" || loading) {
    return <div className="min-h-screen bg-[#FDFBF7] grid place-items-center text-[#59605D]">Loading property details...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (session?.user?.role !== "buyer") {
    router.push("/");
    return null;
  }

  if (!listing) {
    return <div className="min-h-screen bg-[#FDFBF7] grid place-items-center text-[#59605D]">Listing not found.</div>;
  }

  const images = listing.images.length > 0 ? listing.images : ["https://images.unsplash.com/photo-1698154050505-1c8a63425130?auto=format&fit=crop&w=1200&q=80"];

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="border-b border-[#E8E3D9] bg-white/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-outfit text-[#1C211F]">Property Details</h1>
            <p className="text-[#59605D] text-sm">Welcome, {session?.user?.name || "Buyer"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/buyer"><button type="button" className={outlineButton}>Back to Buyer</button></Link>
            <Link href="/messages"><button type="button" className={outlineButton}>Messages</button></Link>
            <button type="button" className={dangerButton} onClick={() => signOut({ callbackUrl: "/login" })}>Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className={`lg:col-span-2 ${cardClass}`}>
          <div className="p-5 space-y-4">
            <div className="aspect-16/10 rounded-lg overflow-hidden bg-[#F5F3ED]">
              <img
                src={images[selectedImage]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={`aspect-4/3 rounded-md overflow-hidden border ${selectedImage === index ? "border-[#2B4A3B]" : "border-[#E8E3D9]"}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={image} alt={`${listing.title} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <h2 className="text-2xl font-outfit text-[#1C211F]">{listing.title}</h2>
            <p className="text-[#59605D]">{listing.city}, {listing.location}</p>
            <p className="text-[#59605D] leading-relaxed">{listing.description}</p>
          </div>
        </section>

        <aside className={`${cardClass} h-fit`}>
          <div className="p-5 space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-[#59605D]">Price</p>
              <p className="text-2xl font-semibold text-[#2B4A3B]">${listing.price.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-[#59605D]">Land Size</p>
              <p className="text-lg text-[#1C211F]">{listing.land_size} acres</p>
            </div>

            <div className="pt-2 border-t border-[#E8E3D9] space-y-2">
              <p className="text-sm text-[#59605D]">Seller</p>
              <p className="text-sm text-[#1C211F]">{listing.seller_name}</p>
              <p className="text-sm text-[#59605D]">{listing.seller_email}</p>
            </div>

            <div className="pt-2 border-t border-[#E8E3D9] space-y-2">
              <label htmlFor="message" className="text-sm text-[#59605D]">Message seller</label>
              <textarea
                id="message"
                rows={4}
                className={inputClass}
                placeholder="Write your inquiry"
                value={messageText}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setMessageText(event.target.value)}
              />
              <button type="button" className={`${primaryButton} w-full`} disabled={sendingMessage} onClick={handleSendMessage}>
                {sendingMessage ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
