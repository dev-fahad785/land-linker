"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  status: "pending" | "approved" | "rejected";
  seller_id: string;
  seller_name: string;
  seller_email: string;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const primaryButton = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white bg-[#2B4A3B] hover:bg-[#1E3329]";
  const outlineButton = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border border-[#D1CBBF] hover:bg-[#F5F3ED]";
  const dangerButton = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border border-[#B04A41] text-[#B04A41] hover:bg-[#FBEAE8]";
  const cardClass = "rounded-xl border border-[#E8E3D9] bg-white shadow-sm";

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      void fetchListings();
    }
  }, [session?.user?.role, status]);

  const stats = useMemo(
    () => ({
      total: listings.length,
      pending: listings.filter((item) => item.status === "pending").length,
      approved: listings.filter((item) => item.status === "approved").length,
      rejected: listings.filter((item) => item.status === "rejected").length,
    }),
    [listings]
  );

  async function fetchListings() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/listings");
      const data = (await response.json().catch(() => [])) as Listing[] | { error?: string };
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Failed to fetch listings");
      }
      setListings(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, action: "approve" | "reject") {
    try {
      setBusyId(id);
      const response = await fetch(`/api/admin/listings/${id}/${action}`, { method: "PUT" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} listing`);
      }
      toast.success(action === "approve" ? "Listing approved" : "Listing rejected");
      await fetchListings();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteListing(id: string) {
    if (!window.confirm("Delete this listing permanently?")) {
      return;
    }

    try {
      setBusyId(id);
      const response = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete listing");
      }
      toast.success("Listing deleted");
      await fetchListings();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  if (status === "loading") {
    return <div className="min-h-screen bg-[#FDFBF7] grid place-items-center text-[#59605D]">Loading dashboard...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (session?.user?.role !== "admin") {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="border-b border-[#E8E3D9] bg-white/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-outfit text-[#1C211F]">Admin Dashboard</h1>
            <p className="text-[#59605D] text-sm">Welcome, {session.user?.name || "Admin"}</p>
          </div>
          <button type="button" className={dangerButton} onClick={() => signOut({ callbackUrl: "/login" })}>
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <section className={cardClass}><div className="p-4"><p className="text-sm text-[#59605D]">Total</p><p className="text-2xl font-semibold">{stats.total}</p></div></section>
          <section className={cardClass}><div className="p-4"><p className="text-sm text-[#59605D]">Pending</p><p className="text-2xl font-semibold text-amber-600">{stats.pending}</p></div></section>
          <section className={cardClass}><div className="p-4"><p className="text-sm text-[#59605D]">Approved</p><p className="text-2xl font-semibold text-emerald-700">{stats.approved}</p></div></section>
          <section className={cardClass}><div className="p-4"><p className="text-sm text-[#59605D]">Rejected</p><p className="text-2xl font-semibold text-rose-700">{stats.rejected}</p></div></section>
        </div>

        {loading ? (
          <div className="text-[#59605D] text-center py-8">Loading listings...</div>
        ) : listings.length === 0 ? (
          <section className={cardClass}><div className="py-8 text-center text-[#59605D]">No listings found.</div></section>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <section key={listing.id} className={cardClass}>
                <div className="p-4 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <h2 className="font-semibold text-[#1C211F]">{listing.title}</h2>
                      <p className="text-sm text-[#59605D]">{listing.city}, {listing.location} • Seller: {listing.seller_name}</p>
                      <p className="text-sm text-[#59605D]">${listing.price.toLocaleString()} • {listing.land_size} acres</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded w-fit capitalize bg-[#F5F3ED]">{listing.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={primaryButton}
                      disabled={busyId === listing.id || listing.status === "approved"}
                      onClick={() => updateStatus(listing.id, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className={outlineButton}
                      disabled={busyId === listing.id || listing.status === "rejected"}
                      onClick={() => updateStatus(listing.id, "reject")}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className={dangerButton}
                      disabled={busyId === listing.id}
                      onClick={() => deleteListing(listing.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
