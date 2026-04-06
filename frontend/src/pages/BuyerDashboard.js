import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { MapPin, Home, LogOut, Search, DollarSign, Maximize2, MessageSquare, X } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const BuyerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minSize, setMinSize] = useState('');
  const [maxSize, setMaxSize] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [viewingListing, setViewingListing] = useState(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      if (filters.min_size) params.append('min_size', filters.min_size);
      if (filters.max_size) params.append('max_size', filters.max_size);

      const { data } = await axios.get(`${API_URL}/api/listings?${params.toString()}`);
      setListings(data);
    } catch (error) {
      toast.error('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchListings({
      city: searchCity,
      min_price: minPrice,
      max_price: maxPrice,
      min_size: minSize,
      max_size: maxSize
    });
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setSendingMessage(true);
      await axios.post(
        `${API_URL}/api/messages`,
        {
          listing_id: selectedListing.id,
          message: message.trim()
        },
        { withCredentials: true }
      );
      toast.success('Message sent successfully!');
      setMessage('');
      setSelectedListing(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#FDFBF7]/80 border-b border-[#E8E3D9]" data-testid="buyer-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <MapPin className="w-8 h-8 text-[#2B4A3B]" strokeWidth={1.5} />
              <span className="text-2xl font-medium tracking-tight" style={{fontFamily: 'Outfit, sans-serif', color: '#1C211F'}}>LandDeal</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>
                Welcome, {user?.name}
              </span>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-[#B04A41] hover:bg-[#FBEAE8] rounded-xl px-4 py-2"
                data-testid="buyer-logout-button"
              >
                <LogOut className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl tracking-tighter leading-none font-medium mb-3" style={{fontFamily: 'Outfit, sans-serif', color: '#1C211F'}} data-testid="buyer-dashboard-title">
            Browse Properties
          </h1>
          <p className="text-lg text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>
            Find your perfect land from verified listings
          </p>
        </div>

        <Card className="border-[#E8E3D9] shadow-sm mb-8" data-testid="search-filter-card">
          <CardContent className="p-6">
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#59605D]">City</Label>
                  <Input
                    placeholder="Enter city"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="bg-white border-[#D1CBBF] rounded-lg"
                    data-testid="search-city-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#59605D]">Min Price</Label>
                  <Input
                    type="number"
                    placeholder="Min price"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="bg-white border-[#D1CBBF] rounded-lg"
                    data-testid="search-min-price-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#59605D]">Max Price</Label>
                  <Input
                    type="number"
                    placeholder="Max price"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="bg-white border-[#D1CBBF] rounded-lg"
                    data-testid="search-max-price-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#59605D]">Min Size (acres)</Label>
                  <Input
                    type="number"
                    placeholder="Min size"
                    value={minSize}
                    onChange={(e) => setMinSize(e.target.value)}
                    className="bg-white border-[#D1CBBF] rounded-lg"
                    data-testid="search-min-size-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#59605D]">Max Size (acres)</Label>
                  <Input
                    type="number"
                    placeholder="Max size"
                    value={maxSize}
                    onChange={(e) => setMaxSize(e.target.value)}
                    className="bg-white border-[#D1CBBF] rounded-lg"
                    data-testid="search-max-size-input"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    className="w-full bg-[#2B4A3B] text-white hover:bg-[#1E3329] rounded-xl px-6 py-3"
                    data-testid="search-button"
                  >
                    <Search className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Search
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-[#2B4A3B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>Loading listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <Home className="w-16 h-16 text-[#8A918E] mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-lg text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>No listings found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="listings-grid">
            {listings.map((listing) => (
              <Card
                key={listing.id}
                className="border-[#E8E3D9] rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer"
                data-testid={`listing-card-${listing.id}`}
              >
                <div className="aspect-[4/3] overflow-hidden" onClick={() => setViewingListing(listing)}>
                  <img
                    src={listing.images[0] || 'https://images.unsplash.com/photo-1762342843162-929a0e96a853'}
                    alt={listing.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl tracking-tight font-medium mb-2" style={{fontFamily: 'Outfit, sans-serif', color: '#1C211F'}} data-testid={`listing-title-${listing.id}`}>
                    {listing.title}
                  </h3>
                  <p className="text-sm text-[#8A918E] mb-3 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" strokeWidth={1.5} />
                    {listing.city}, {listing.location}
                  </p>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#8A918E] mb-1">Price</p>
                      <p className="text-2xl font-medium text-[#2B4A3B]" style={{fontFamily: 'Outfit, sans-serif'}} data-testid={`listing-price-${listing.id}`}>
                        ${listing.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider text-[#8A918E] mb-1">Size</p>
                      <p className="text-lg font-medium text-[#59605D]" data-testid={`listing-size-${listing.id}`}>
                        {listing.land_size} acres
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setViewingListing(listing)}
                      variant="outline"
                      className="flex-1 border-[#D1CBBF] text-[#1C211F] hover:bg-[#F5F3ED] rounded-xl py-2"
                      data-testid={`view-details-button-${listing.id}`}
                    >
                      View Details
                    </Button>
                    <Button
                      onClick={() => setSelectedListing(listing)}
                      className="flex-1 bg-[#2B4A3B] text-white hover:bg-[#1E3329] rounded-xl py-2"
                      data-testid={`contact-seller-button-${listing.id}`}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" strokeWidth={1.5} />
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {viewingListing && (
        <Dialog open={!!viewingListing} onOpenChange={() => setViewingListing(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="listing-details-modal">
            <DialogHeader>
              <DialogTitle className="text-3xl font-medium tracking-tight" style={{fontFamily: 'Outfit, sans-serif'}} data-testid="modal-listing-title">
                {viewingListing.title}
              </DialogTitle>
              <DialogDescription className="text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>
                <MapPin className="w-4 h-4 inline mr-1" strokeWidth={1.5} />
                {viewingListing.city}, {viewingListing.location}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {viewingListing.images.map((img, idx) => (
                  <img key={idx} src={img} alt={`Property ${idx + 1}`} className="w-full h-48 object-cover rounded-lg" />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F5F3ED] p-4 rounded-xl">
                  <p className="text-xs uppercase tracking-wider text-[#8A918E] mb-1">Price</p>
                  <p className="text-3xl font-medium text-[#2B4A3B]" style={{fontFamily: 'Outfit, sans-serif'}} data-testid="modal-listing-price">
                    ${viewingListing.price.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#F5F3ED] p-4 rounded-xl">
                  <p className="text-xs uppercase tracking-wider text-[#8A918E] mb-1">Land Size</p>
                  <p className="text-3xl font-medium text-[#59605D]" style={{fontFamily: 'Outfit, sans-serif'}} data-testid="modal-listing-size">
                    {viewingListing.land_size} acres
                  </p>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-medium mb-2" style={{fontFamily: 'Outfit, sans-serif', color: '#1C211F'}}>Description</h4>
                <p className="text-[#59605D] leading-relaxed" style={{fontFamily: 'Manrope, sans-serif'}} data-testid="modal-listing-description">
                  {viewingListing.description}
                </p>
              </div>
              <div className="border-t border-[#E8E3D9] pt-4">
                <h4 className="text-lg font-medium mb-2" style={{fontFamily: 'Outfit, sans-serif', color: '#1C211F'}}>Seller Information</h4>
                <p className="text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}} data-testid="modal-seller-info">
                  <strong>Name:</strong> {viewingListing.seller_name}<br />
                  <strong>Email:</strong> {viewingListing.seller_email}
                </p>
              </div>
              <Button
                onClick={() => {
                  setSelectedListing(viewingListing);
                  setViewingListing(null);
                }}
                className="w-full bg-[#2B4A3B] text-white hover:bg-[#1E3329] rounded-xl py-3"
                data-testid="modal-contact-seller-button"
              >
                <MessageSquare className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Contact Seller
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedListing && (
        <Dialog open={!!selectedListing} onOpenChange={() => setSelectedListing(null)}>
          <DialogContent data-testid="send-message-modal">
            <DialogHeader>
              <DialogTitle className="text-2xl font-medium tracking-tight" style={{fontFamily: 'Outfit, sans-serif'}}>
                Contact Seller
              </DialogTitle>
              <DialogDescription className="text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>
                Send a message to {selectedListing.seller_name} about {selectedListing.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#59605D]">Your Message</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="I'm interested in this property..."
                  rows={5}
                  className="bg-white border-[#D1CBBF] rounded-lg resize-none"
                  data-testid="message-textarea"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={sendingMessage}
                className="w-full bg-[#2B4A3B] text-white hover:bg-[#1E3329] rounded-xl py-3"
                data-testid="send-message-button"
              >
                {sendingMessage ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
