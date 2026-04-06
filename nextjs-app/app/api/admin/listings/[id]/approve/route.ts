import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Listing } from "@/models/Listing";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    
    const result = await Listing.updateOne(
      { listingId: id },
      { $set: { status: 'approved' } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Listing approved" });
  } catch (error) {
    console.error("Approve listing error:", error);
    return NextResponse.json({ error: "Failed to approve listing" }, { status: 500 });
  }
}
