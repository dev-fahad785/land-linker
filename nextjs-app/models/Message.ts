import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  messageId: { type: String, required: true, unique: true },
  listingId: { type: String, required: true },
  listingTitle: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderEmail: { type: String, required: true },
  recipientId: { type: String, required: true },
  recipientName: { type: String },
  recipientEmail: { type: String },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

MessageSchema.index({ listingId: 1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ recipientId: 1 });

export const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
