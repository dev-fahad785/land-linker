import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Listing } from "@/models/Listing";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'seller') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    const listings = await Listing.find({ sellerId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();
    
    const formattedListings = listings.map(listing => ({
      id: listing.listingId,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      city: listing.city,
      location: listing.location,
      land_size: listing.landSize,
      images: listing.images,
      status: listing.status,
      seller_id: listing.sellerId,
      seller_name: listing.sellerName,
      seller_email: listing.sellerEmail,
      created_at: listing.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedListings);
  } catch (error) {
    console.error("Get seller listings error:", error);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}
