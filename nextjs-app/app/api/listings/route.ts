import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Listing } from "@/models/Listing";
import { v4 as uuidv4 } from 'uuid';

// GET - Get approved listings with optional filters
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const minSize = searchParams.get('min_size');
    const maxSize = searchParams.get('max_size');

    const query: any = { status: 'approved' };

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    if (minSize || maxSize) {
      query.landSize = {};
      if (minSize) query.landSize.$gte = parseFloat(minSize);
      if (maxSize) query.landSize.$lte = parseFloat(maxSize);
    }

    const listings = await Listing.find(query).sort({ createdAt: -1 }).lean();
    
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
    console.error("Get listings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}

// POST - Create new listing (seller only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'seller') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    const { title, description, price, city, location, land_size, images } = body;

    if (!title || !description || !price || !city || !location || !land_size || !images || images.length === 0) {
      return NextResponse.json(
        { error: "All fields are required including at least one image" },
        { status: 400 }
      );
    }

    const listing = await Listing.create({
      listingId: uuidv4(),
      title,
      description,
      price,
      city,
      location,
      landSize: land_size,
      images,
      status: 'pending',
      sellerId: session.user.id,
      sellerName: session.user.name!,
      sellerEmail: session.user.email!,
    });

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
    console.error("Create listing error:", error);
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
  }
}
