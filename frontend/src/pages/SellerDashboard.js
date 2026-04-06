import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { MapPin, LogOut, Plus, Edit, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const SellerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    city: '',
    location: '',
    land_size: '',
    images: []
  });

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/api/seller/listings`, {
        withCredentials: true
      });
      setListings(data);
    } catch (error) {
      toast.error('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    setUploadingImages(true);
    const uploadedUrls = [];

    try {
      const { data: sigData } = await axios.get(`${API_URL}/api/cloudinary/signature`, {
        withCredentials: true
      });

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', sigData.api_key);
        formData.append('timestamp', sigData.timestamp);
        formData.append('signature', sigData.signature);
        formData.append('folder', sigData.folder);

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${sigData.cloud_name}/image/upload`,
          {
            method: 'POST',
            body: formData
          }
        );

        const uploadData = await uploadResponse.json();
        uploadedUrls.push(uploadData.secure_url);
      }

      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      toast.success('Images uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    try {
      if (editingListing) {
        await axios.put(
          `${API_URL}/api/listings/${editingListing.id}`,
          formData,
          { withCredentials: true }
        );
        toast.success('Listing updated successfully!');
      } else {
        await axios.post(
          `${API_URL}/api/listings`,
          formData,
          { withCredentials: true }
        );
        toast.success('Listing created successfully!');
      }
      
      resetForm();
      fetchListings();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save listing');
    }
  };

  const handleDelete = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      await axios.delete(`${API_URL}/api/listings/${listingId}`, {
        withCredentials: true
      });
      toast.success('Listing deleted successfully!');
      fetchListings();
    } catch (error) {
      toast.error('Failed to delete listing');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      city: '',
      location: '',
      land_size: '',
      images: []
    });
    setShowAddModal(false);
    setEditingListing(null);
  };

  const openEditModal = (listing) => {
    setEditingListing(listing);
    setFormData({
      title: listing.title,
      description: listing.description,
      price: listing.price,
      city: listing.city,
      location: listing.location,
      land_size: listing.land_size,
      images: listing.images
    });
    setShowAddModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#E5F0EA] text-[#3D684E]"><CheckCircle className="w-3 h-3 mr-1" />Approved</span>;
      case 'pending':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FDF2E3] text-[#D9944B]"><Clock className="w-3 h-3 mr-1" />Pending</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FBEAE8] text-[#B04A41]"><XCircle className="w-3 h-3 mr-1" />Rejected</span>;
      default:
        return null;
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#FDFBF7]/80 border-b border-[#E8E3D9]" data-testid="seller-nav">
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
                data-testid="seller-logout-button"
              >
                <LogOut className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl lg:text-5xl tracking-tighter leading-none font-medium mb-3" style={{fontFamily: 'Outfit, sans-serif', color: '#1C211F'}} data-testid="seller-dashboard-title">
              My Listings
            </h1>
            <p className="text-lg text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>
              Manage your property listings
            </p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-[#2B4A3B] text-white hover:bg-[#1E3329] rounded-xl px-6 py-3"
            data-testid="add-listing-button"
          >
            <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Add Listing
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-[#2B4A3B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>Loading listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <Card className="border-[#E8E3D9] shadow-sm p-12 text-center">
            <Plus className="w-16 h-16 text-[#8A918E] mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-xl font-medium mb-2" style={{fontFamily: 'Outfit, sans-serif', color: '#1C211F'}}>No listings yet</h3>
            <p className="text-[#59605D] mb-6" style={{fontFamily: 'Manrope, sans-serif'}}>Create your first listing to start selling</p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-[#2B4A3B] text-white hover:bg-[#1E3329] rounded-xl px-6 py-3"
              data-testid="add-first-listing-button"
            >
              Create Listing
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="seller-listings-grid">
            {listings.map((listing) => (
              <Card key={listing.id} className="border-[#E8E3D9] rounded-2xl overflow-hidden" data-testid={`seller-listing-card-${listing.id}`}>
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={listing.images[0] || 'https://images.unsplash.com/photo-1762342843162-929a0e96a853'}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl tracking-tight font-medium" style={{fontFamily: 'Outfit, sans-serif', color: '#1C211F'}} data-testid={`seller-listing-title-${listing.id}`}>
                      {listing.title}
                    </h3>
                    {getStatusBadge(listing.status)}
                  </div>
                  <p className="text-sm text-[#8A918E] mb-3">
                    <MapPin className="w-4 h-4 inline mr-1" strokeWidth={1.5} />
                    {listing.city}
                  </p>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#8A918E] mb-1">Price</p>
                      <p className="text-2xl font-medium text-[#2B4A3B]" style={{fontFamily: 'Outfit, sans-serif'}} data-testid={`seller-listing-price-${listing.id}`}>
                        ${listing.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider text-[#8A918E] mb-1">Size</p>
                      <p className="text-lg font-medium text-[#59605D]">
                        {listing.land_size} acres
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => openEditModal(listing)}
                      variant="outline"
                      className="flex-1 border-[#D1CBBF] text-[#1C211F] hover:bg-[#F5F3ED] rounded-xl py-2"
                      data-testid={`edit-listing-button-${listing.id}`}
                    >
                      <Edit className="w-4 h-4 mr-2" strokeWidth={1.5} />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(listing.id)}
                      variant="outline"
                      className="flex-1 border-[#B04A41] text-[#B04A41] hover:bg-[#FBEAE8] rounded-xl py-2"
                      data-testid={`delete-listing-button-${listing.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" strokeWidth={1.5} />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showAddModal} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="add-listing-modal">
          <DialogHeader>
            <DialogTitle className="text-2xl font-medium tracking-tight" style={{fontFamily: 'Outfit, sans-serif'}}>
              {editingListing ? 'Edit Listing' : 'Add New Listing'}
            </DialogTitle>
            <DialogDescription className="text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>
              {editingListing ? 'Update your property details' : 'Fill in the details of your property'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#59605D]">Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="bg-white border-[#D1CBBF] rounded-lg"
                data-testid="listing-title-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#59605D]">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="bg-white border-[#D1CBBF] rounded-lg resize-none"
                data-testid="listing-description-input"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#59605D]">Price ($)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  min="0"
                  className="bg-white border-[#D1CBBF] rounded-lg"
                  data-testid="listing-price-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#59605D]">Land Size (acres)</Label>
                <Input
                  type="number"
                  value={formData.land_size}
                  onChange={(e) => setFormData({ ...formData, land_size: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  className="bg-white border-[#D1CBBF] rounded-lg"
                  data-testid="listing-size-input"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#59605D]">City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  className="bg-white border-[#D1CBBF] rounded-lg"
                  data-testid="listing-city-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#59605D]">Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  className="bg-white border-[#D1CBBF] rounded-lg"
                  data-testid="listing-location-input"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#59605D]">Images</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e.target.files)}
                disabled={uploadingImages}
                className="bg-white border-[#D1CBBF] rounded-lg"
                data-testid="listing-images-input"
              />
              {uploadingImages && <p className="text-sm text-[#D9944B]">Uploading images...</p>}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {formData.images.map((url, idx) => (
                    <div key={idx} className="relative">
                      <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-20 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, images: formData.images.filter((_, i) => i !== idx) })}
                        className="absolute -top-2 -right-2 bg-[#B04A41] text-white rounded-full p-1"
                        data-testid={`remove-image-button-${idx}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={resetForm}
                variant="outline"
                className="flex-1 border-[#D1CBBF] text-[#1C211F] hover:bg-[#F5F3ED] rounded-xl py-3"
                data-testid="cancel-listing-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#2B4A3B] text-white hover:bg-[#1E3329] rounded-xl py-3"
                data-testid="save-listing-button"
              >
                {editingListing ? 'Update Listing' : 'Create Listing'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
