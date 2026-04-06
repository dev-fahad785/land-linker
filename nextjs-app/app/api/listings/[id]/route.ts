import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Listing } from "@/models/Listing";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    
    const listing = await Listing.findOne({ listingId: id, status: 'approved' }).lean();
    
    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Get listing error:", error);
    return NextResponse.json(
      { error: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'seller') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    
    const listing = await Listing.findOne({ listingId: id });
    
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const updates: any = {};
    
    if (body.title) updates.title = body.title;
    if (body.description) updates.description = body.description;
    if (body.price) updates.price = body.price;
    if (body.city) updates.city = body.city;
    if (body.location) updates.location = body.location;
    if (body.land_size) updates.landSize = body.land_size;
    if (body.images) updates.images = body.images;
    
    if (Object.keys(updates).length > 0) {
      updates.status = 'pending';
    }

    const updated = await Listing.findOneAndUpdate(
      { listingId: id },
      { $set: updates },
      { new: true }
    ).lean();

    return NextResponse.json({
      id: updated!.listingId,
      title: updated!.title,
      description: updated!.description,
      price: updated!.price,
      city: updated!.city,
      location: updated!.location,
      land_size: updated!.landSize,
      images: updated!.images,
      status: updated!.status,
      seller_id: updated!.sellerId,
      seller_name: updated!.sellerName,
      seller_email: updated!.sellerEmail,
      created_at: updated!.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Update listing error:", error);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    
    const listing = await Listing.findOne({ listingId: id });
    
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (session.user.role !== 'admin' && listing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await Listing.deleteOne({ listingId: id });

    return NextResponse.json({ message: "Listing deleted successfully" });
  } catch (error) {
    console.error("Delete listing error:", error);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}
