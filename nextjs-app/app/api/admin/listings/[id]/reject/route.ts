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
      { $set: { status: 'rejected' } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Listing rejected" });
  } catch (error) {
    console.error("Reject listing error:", error);
    return NextResponse.json({ error: "Failed to reject listing" }, { status: 500 });
  }
}
