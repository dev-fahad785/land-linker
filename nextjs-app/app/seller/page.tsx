"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  created_at: string;
};

type ListingForm = {
  title: string;
  description: string;
  price: string;
  city: string;
  location: string;
  land_size: string;
  images: string[];
};

const EMPTY_FORM: ListingForm = {
  title: "",
  description: "",
  price: "",
  city: "",
  location: "",
  land_size: "",
  images: [],
};

type CloudinarySignature = {
  signature: string;
  timestamp: number;
  cloud_name: string;
  api_key: string;
  folder: string;
};

export default function SellerPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ListingForm>(EMPTY_FORM);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "seller") {
      void fetchListings();
    }
  }, [session?.user?.role, status]);

  async function fetchListings() {
    try {
      setLoading(true);
      const response = await fetch("/api/seller/listings");
      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch listings");
      }

      setListings(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  }

  async function uploadImages(files: FileList) {
    try {
      setUploading(true);

      const sigResponse = await fetch("/api/cloudinary/signature");
      const signature: CloudinarySignature = await sigResponse.json();

      if (!sigResponse.ok) {
        throw new Error(signature as unknown as string);
      }

      const urls: string[] = [];

      for (const file of Array.from(files)) {
        const payload = new FormData();
        payload.append("file", file);
        payload.append("api_key", signature.api_key);
        payload.append("timestamp", String(signature.timestamp));
        payload.append("signature", signature.signature);
        payload.append("folder", signature.folder);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${signature.cloud_name}/image/upload`,
          { method: "POST", body: payload }
        );

        const uploaded = await response.json().catch(() => ({}));
        if (!response.ok || !uploaded.secure_url) {
          throw new Error("Failed to upload one or more images");
        }

        urls.push(uploaded.secure_url as string);
      }

      setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
      toast.success("Image upload complete");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  }

  function startCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(listing: Listing) {
    setForm({
      title: listing.title,
      description: listing.description,
      price: String(listing.price),
      city: listing.city,
      location: listing.location,
      land_size: String(listing.land_size),
      images: listing.images,
    });
    setEditingId(listing.id);
    setShowForm(true);
  }

  async function handleDelete(listingId: string) {
    if (!window.confirm("Delete this listing permanently?")) {
      return;
    }

    try {
      const response = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete listing");
      }

      toast.success("Listing deleted");
      await fetchListings();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      city: form.city,
      location: form.location,
      land_size: Number(form.land_size),
      images: form.images,
    };

    if (Number.isNaN(payload.price) || Number.isNaN(payload.land_size)) {
      toast.error("Price and land size must be numbers");
      return;
    }

    try {
      setSubmitting(true);

      const url = editingId ? `/api/listings/${editingId}` : "/api/listings";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to save listing");
      }

      toast.success(editingId ? "Listing updated and moved to pending review" : "Listing created and submitted for approval");
      resetForm();
      await fetchListings();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return <div className="min-h-screen bg-[#FDFBF7] grid place-items-center text-[#59605D]">Loading dashboard...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (session?.user?.role !== "seller") {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="border-b border-[#E8E3D9] bg-white/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-outfit text-[#1C211F]">Seller Dashboard</h1>
            <p className="text-[#59605D] text-sm">Welcome, {session.user?.name || "Seller"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/messages"><Button variant="outline">Messages</Button></Link>
            <Button onClick={startCreate} className="bg-[#2B4A3B] hover:bg-[#1E3329]">Add Listing</Button>
            <Button variant="outline" className="border-[#B04A41] text-[#B04A41] hover:bg-[#FBEAE8]" onClick={() => signOut({ callbackUrl: "/login" })}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-5">
        {loading ? (
          <div className="text-[#59605D] text-center py-8">Loading listings...</div>
        ) : listings.length === 0 ? (
          <Card className="border-[#E8E3D9]"><CardContent className="py-8 text-center text-[#59605D]">No listings yet.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.map((listing) => (
              <Card key={listing.id} className="border-[#E8E3D9]">
                <CardContent className="p-5 space-y-3">
                  <div className="aspect-[16/10] rounded-lg overflow-hidden bg-[#F5F3ED]">
                    <img src={listing.images[0] || "https://images.unsplash.com/photo-1698154050505-1c8a63425130?auto=format&fit=crop&w=1200&q=80"} alt={listing.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xl font-outfit text-[#1C211F]">{listing.title}</h2>
                    <span className="text-xs px-2 py-1 rounded bg-[#F5F3ED] capitalize">{listing.status}</span>
                  </div>
                  <p className="text-sm text-[#59605D]">{listing.city}, {listing.location}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[#2B4A3B] font-semibold">${listing.price.toLocaleString()}</p>
                    <p className="text-sm text-[#59605D]">{listing.land_size} acres</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => startEdit(listing)}>Edit</Button>
                    <Button variant="outline" className="flex-1 border-[#B04A41] text-[#B04A41] hover:bg-[#FBEAE8]" onClick={() => handleDelete(listing.id)}>Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black/35 z-40 grid place-items-center px-4 py-8 overflow-y-auto">
          <Card className="w-full max-w-2xl border-[#E8E3D9]">
            <CardHeader><CardTitle>{editingId ? "Edit Listing" : "Create Listing"}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" required value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" required rows={4} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="price">Price</Label>
                    <Input id="price" required type="number" min="0" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="land_size">Land Size (acres)</Label>
                    <Input id="land_size" required type="number" min="0" step="0.01" value={form.land_size} onChange={(e) => setForm((prev) => ({ ...prev, land_size: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" required value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" required value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="images">Images</Label>
                  <Input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      if (e.target.files && e.target.files.length > 0) {
                        void uploadImages(e.target.files);
                      }
                    }}
                  />
                  <p className="text-xs text-[#59605D]">{uploading ? "Uploading images..." : `${form.images.length} image(s) attached`}</p>
                  {form.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {form.images.map((url) => (
                        <div key={url} className="relative rounded overflow-hidden border border-[#E8E3D9]">
                          <img src={url} alt="Uploaded" className="w-full h-20 object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                  <Button type="submit" disabled={submitting || uploading} className="bg-[#2B4A3B] hover:bg-[#1E3329]">
                    {submitting ? "Saving..." : editingId ? "Update Listing" : "Create Listing"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
