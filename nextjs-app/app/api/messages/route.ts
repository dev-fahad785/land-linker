import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Message } from "@/models/Message";
import { Listing } from "@/models/Listing";
import { User } from "@/models/User";
import { v4 as uuidv4 } from 'uuid';

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    const messages = await Message.find({
      $or: [
        { senderId: session.user.id },
        { recipientId: session.user.id }
      ]
    }).sort({ createdAt: -1 }).lean();

    const formattedMessages = messages.map(msg => ({
      id: msg.messageId,
      listing_id: msg.listingId,
      listing_title: msg.listingTitle,
      sender_id: msg.senderId,
      sender_name: msg.senderName,
      sender_email: msg.senderEmail,
      recipient_id: msg.recipientId,
      recipient_name: msg.recipientName,
      recipient_email: msg.recipientEmail,
      message: msg.message,
      created_at: msg.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    const body = await request.json();
    const { listing_id, message, recipient_id } = body;

    if (!listing_id || !message) {
      return NextResponse.json({ error: "Listing ID and message are required" }, { status: 400 });
    }

    const listing = await Listing.findOne({ listingId: listing_id }).lean();
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    let recipientUserId: string;
    let recipientName: string;
    let recipientEmail: string;

    if (session.user.role === 'buyer') {
      if (listing.status !== 'approved') {
        return NextResponse.json({ error: "Listing not found" }, { status: 404 });
      }
      recipientUserId = listing.sellerId;
      recipientName = listing.sellerName;
      recipientEmail = listing.sellerEmail;
    } else if (session.user.role === 'seller') {
      if (!recipient_id) {
        return NextResponse.json({ error: "Recipient ID required for seller replies" }, { status: 400 });
      }
      if (listing.sellerId !== session.user.id) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }
      const buyer = await User.findById(recipient_id).lean();
      if (!buyer) {
        return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
      }
      recipientUserId = buyer._id.toString();
      recipientName = buyer.name;
      recipientEmail = buyer.email;
    } else {
      return NextResponse.json({ error: "Only buyers and sellers can send messages" }, { status: 403 });
    }

    const newMessage = await Message.create({
      messageId: uuidv4(),
      listingId: listing_id,
      listingTitle: listing.title,
      senderId: session.user.id,
      senderName: session.user.name!,
      senderEmail: session.user.email!,
      recipientId: recipientUserId,
      recipientName,
      recipientEmail,
      message,
    });

    return NextResponse.json({
      id: newMessage.messageId,
      listing_id: newMessage.listingId,
      listing_title: newMessage.listingTitle,
      sender_id: newMessage.senderId,
      sender_name: newMessage.senderName,
      sender_email: newMessage.senderEmail,
      recipient_id: newMessage.recipientId,
      message: newMessage.message,
      created_at: newMessage.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
