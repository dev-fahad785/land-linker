import mongoose from 'mongoose';

const ListingSchema = new mongoose.Schema({
  listingId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  city: { type: String, required: true },
  location: { type: String, required: true },
  landSize: { type: Number, required: true },
  images: [{ type: String }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  sellerId: { type: String, required: true },
  sellerName: { type: String, required: true },
  sellerEmail: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

ListingSchema.index({ city: 1 });
ListingSchema.index({ status: 1 });
ListingSchema.index({ sellerId: 1 });

export const Listing = mongoose.models.Listing || mongoose.model('Listing', ListingSchema);
