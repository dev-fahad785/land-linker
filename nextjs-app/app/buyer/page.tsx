"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
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
  status: string;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  created_at: string;
};

type Filters = {
  city: string;
  min_price: string;
  max_price: string;
  min_size: string;
  max_size: string;
};

const INITIAL_FILTERS: Filters = {
  city: "",
  min_price: "",
  max_price: "",
  min_size: "",
  max_size: "",
};

export default function BuyerPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const primaryButton = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white bg-[#2B4A3B] hover:bg-[#1E3329]";
  const outlineButton = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border border-[#D1CBBF] hover:bg-[#F5F3ED]";
  const dangerButton = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border border-[#B04A41] text-[#B04A41] hover:bg-[#FBEAE8]";
  const cardClass = "rounded-xl border border-[#E8E3D9] bg-white shadow-sm";
  const inputClass = "w-full rounded-md border border-[#D1CBBF] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4A3B]/30";

  const canSearch = useMemo(() => status === "authenticated" && session?.user?.role === "buyer", [session?.user?.role, status]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "buyer") {
      void fetchListings(INITIAL_FILTERS);
    }
  }, [session?.user?.role, status]);

  async function fetchListings(currentFilters: Filters) {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (currentFilters.city.trim()) params.append("city", currentFilters.city.trim());
      if (currentFilters.min_price.trim()) params.append("min_price", currentFilters.min_price.trim());
      if (currentFilters.max_price.trim()) params.append("max_price", currentFilters.max_price.trim());
      if (currentFilters.min_size.trim()) params.append("min_size", currentFilters.min_size.trim());
      if (currentFilters.max_size.trim()) params.append("max_size", currentFilters.max_size.trim());

      const url = params.toString() ? `/api/listings?${params.toString()}` : "/api/listings";
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to fetch listings");
      }

      const data: Listing[] = await response.json();
      setListings(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSearch) return;
    await fetchListings(filters);
  }

  function onFilterChange(field: keyof Filters, event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSendMessage() {
    if (!selectedListing) return;
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
          listing_id: selectedListing.id,
          message: messageText.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      toast.success("Message sent successfully");
      setMessageText("");
      setSelectedListing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#FDFBF7] grid place-items-center px-4">
        <p className="text-[#59605D]">Loading dashboard...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (session?.user?.role !== "buyer") {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="border-b border-[#E8E3D9] bg-white/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-outfit text-[#1C211F]">Buyer Dashboard</h1>
            <p className="text-[#59605D] text-sm">Welcome, {session.user?.name || "Buyer"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/messages">
              <button type="button" className={outlineButton}>Messages</button>
            </Link>
            <button
              type="button"
              className={dangerButton}
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <section className={cardClass}>
          <div className="p-5 border-b border-[#E8E3D9]"><h2 className="font-semibold">Search Listings</h2></div>
          <div className="p-5">
            <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="space-y-1">
                <label htmlFor="city" className="text-sm">City</label>
                <input id="city" className={inputClass} value={filters.city} onChange={(event) => onFilterChange("city", event)} />
              </div>
              <div className="space-y-1">
                <label htmlFor="min_price" className="text-sm">Min Price</label>
                <input id="min_price" className={inputClass} type="number" value={filters.min_price} onChange={(event) => onFilterChange("min_price", event)} />
              </div>
              <div className="space-y-1">
                <label htmlFor="max_price" className="text-sm">Max Price</label>
                <input id="max_price" className={inputClass} type="number" value={filters.max_price} onChange={(event) => onFilterChange("max_price", event)} />
              </div>
              <div className="space-y-1">
                <label htmlFor="min_size" className="text-sm">Min Size</label>
                <input id="min_size" className={inputClass} type="number" value={filters.min_size} onChange={(event) => onFilterChange("min_size", event)} />
              </div>
              <div className="space-y-1">
                <label htmlFor="max_size" className="text-sm">Max Size</label>
                <input id="max_size" className={inputClass} type="number" value={filters.max_size} onChange={(event) => onFilterChange("max_size", event)} />
              </div>
              <div className="sm:col-span-2 lg:col-span-5 flex gap-2">
                <button type="submit" className={primaryButton}>Apply Filters</button>
                <button
                  type="button"
                  className={outlineButton}
                  onClick={() => {
                    setFilters(INITIAL_FILTERS);
                    void fetchListings(INITIAL_FILTERS);
                  }}
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </section>

        {loading ? (
          <div className="text-center text-[#59605D] py-8">Loading listings...</div>
        ) : listings.length === 0 ? (
          <section className={cardClass}><div className="py-8 text-center text-[#59605D]">No approved listings found.</div></section>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.map((listing) => (
              <section key={listing.id} className={cardClass}>
                <div className="p-5 space-y-3">
                  <div className="aspect-16/10 rounded-lg overflow-hidden bg-[#F5F3ED]">
                    <img
                      src={listing.images[0] || "https://images.unsplash.com/photo-1698154050505-1c8a63425130?auto=format&fit=crop&w=1200&q=80"}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h2 className="text-xl font-outfit text-[#1C211F]">{listing.title}</h2>
                  <p className="text-sm text-[#59605D]">{listing.city}, {listing.location}</p>
                  <p className="text-sm text-[#59605D] line-clamp-2">{listing.description}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[#2B4A3B] font-semibold">${listing.price.toLocaleString()}</p>
                    <p className="text-sm text-[#59605D]">{listing.land_size} acres</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/listings/${listing.id}`}>
                      <button type="button" className={`${outlineButton} w-full`}>
                        View Details
                      </button>
                    </Link>
                    <button type="button" className={`${primaryButton} w-full`} onClick={() => setSelectedListing(listing)}>
                      Contact Seller
                    </button>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {selectedListing && (
        <div className="fixed inset-0 bg-black/35 z-40 grid place-items-center px-4">
          <section className={`${cardClass} w-full max-w-xl`}>
            <div className="p-5 border-b border-[#E8E3D9]"><h2 className="font-semibold">Message Seller</h2></div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-[#59605D]">Listing: <span className="font-medium text-[#1C211F]">{selectedListing.title}</span></p>
              <p className="text-sm text-[#59605D]">Seller: {selectedListing.seller_name} ({selectedListing.seller_email})</p>
              <textarea
                rows={5}
                placeholder="Write your inquiry"
                className={inputClass}
                value={messageText}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setMessageText(event.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button type="button" className={outlineButton} onClick={() => setSelectedListing(null)}>Cancel</button>
                <button type="button" className={primaryButton} disabled={sendingMessage} onClick={handleSendMessage}>
                  {sendingMessage ? "Sending..." : "Send Message"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
