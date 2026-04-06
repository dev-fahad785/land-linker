import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { MapPin, LogOut, CheckCircle, XCircle, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingListing, setViewingListing] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/api/admin/listings`, {
        withCredentials: true
      });
      setListings(data);
      
      const stats = {
        total: data.length,
        pending: data.filter(l => l.status === 'pending').length,
        approved: data.filter(l => l.status === 'approved').length,
        rejected: data.filter(l => l.status === 'rejected').length
      };
      setStats(stats);
    } catch (error) {
      toast.error('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (listingId) => {
    try {
      await axios.put(
        `${API_URL}/api/admin/listings/${listingId}/approve`,
        {},
        { withCredentials: true }
      );
      toast.success('Listing approved successfully!');
      fetchListings();
    } catch (error) {
      toast.error('Failed to approve listing');
    }
  };

  const handleReject = async (listingId) => {
    try {
      await axios.put(
        `${API_URL}/api/admin/listings/${listingId}/reject`,
        {},
        { withCredentials: true }
      );
      toast.success('Listing rejected successfully!');
      fetchListings();
    } catch (error) {
      toast.error('Failed to reject listing');
    }
  };

  const handleDelete = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing permanently?')) return;

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#E5F0EA] text-[#3D684E]" data-testid={`status-badge-approved`}>Approved</span>;
      case 'pending':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FDF2E3] text-[#D9944B]" data-testid={`status-badge-pending`}>Pending</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FBEAE8] text-[#B04A41]" data-testid={`status-badge-rejected`}>Rejected</span>;
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
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#FDFBF7]/80 border-b border-[#E8E3D9]" data-testid="admin-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <MapPin className="w-8 h-8 text-[#2B4A3B]" strokeWidth={1.5} />
              <span className="text-2xl font-medium tracking-tight" style={{fontFamily: 'Outfit, sans-serif', color: '#1C211F'}}>LandDeal Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>
                Welcome, {user?.name}
              </span>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-[#B04A41] hover:bg-[#FBEAE8] rounded-xl px-4 py-2"
                data-testid="admin-logout-button"
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
          <h1 className="text-4xl lg:text-5xl tracking-tighter leading-none font-medium mb-3" style={{fontFamily: 'Outfit, sans-serif', color: '#1C211F'}} data-testid="admin-dashboard-title">
            Listing Management
          </h1>
          <p className="text-lg text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>
            Review and moderate property listings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" data-testid="admin-stats">
          <Card className="border-[#E8E3D9] shadow-sm">
            <CardContent className="p-6">
              <p className="text-xs uppercase tracking-wider text-[#8A918E] mb-2">Total Listings</p>
              <p className="text-3xl font-medium text-[#1C211F]" style={{fontFamily: 'Outfit, sans-serif'}} data-testid="stat-total">
                {stats.total}
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-[#E8E3D9] shadow-sm">
            <CardContent className="p-6">
              <p className="text-xs uppercase tracking-wider text-[#8A918E] mb-2">Pending</p>
              <p className="text-3xl font-medium text-[#D9944B]" style={{fontFamily: 'Outfit, sans-serif'}} data-testid="stat-pending">
                {stats.pending}
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-[#E8E3D9] shadow-sm">
            <CardContent className="p-6">
              <p className="text-xs uppercase tracking-wider text-[#8A918E] mb-2">Approved</p>
              <p className="text-3xl font-medium text-[#3D684E]" style={{fontFamily: 'Outfit, sans-serif'}} data-testid="stat-approved">
                {stats.approved}
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-[#E8E3D9] shadow-sm">
            <CardContent className="p-6">
              <p className="text-xs uppercase tracking-wider text-[#8A918E] mb-2">Rejected</p>
              <p className="text-3xl font-medium text-[#B04A41]" style={{fontFamily: 'Outfit, sans-serif'}} data-testid="stat-rejected">
                {stats.rejected}
              </p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-[#2B4A3B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>Loading listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <Card className="border-[#E8E3D9] shadow-sm p-12 text-center">
            <MapPin className="w-16 h-16 text-[#8A918E] mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-xl font-medium mb-2" style={{fontFamily: 'Outfit, sans-serif', color: '#1C211F'}}>No listings found</h3>
            <p className="text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>Listings will appear here when sellers create them</p>
          </Card>
        ) : (
          <div className="bg-white border border-[#E8E3D9] rounded-xl overflow-hidden" data-testid="admin-listings-table">
            <table className="w-full">
              <thead className="bg-[#F5F3ED] border-b border-[#E8E3D9]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[#59605D]">Property</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[#59605D]">Seller</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[#59605D]">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[#59605D]">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[#59605D]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E3D9]">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-[#FDFBF7] transition-colors" data-testid={`admin-listing-row-${listing.id}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={listing.images[0] || 'https://images.unsplash.com/photo-1762342843162-929a0e96a853'}
                          alt={listing.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-[#1C211F]" style={{fontFamily: 'Manrope, sans-serif'}} data-testid={`admin-listing-title-${listing.id}`}>
                            {listing.title}
                          </p>
                          <p className="text-sm text-[#8A918E]">
                            <MapPin className="w-3 h-3 inline mr-1" strokeWidth={1.5} />
                            {listing.city}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#1C211F]" data-testid={`admin-listing-seller-${listing.id}`}>{listing.seller_name}</p>
                      <p className="text-xs text-[#8A918E]">{listing.seller_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-lg font-medium text-[#2B4A3B]" style={{fontFamily: 'Outfit, sans-serif'}} data-testid={`admin-listing-price-${listing.id}`}>
                        ${listing.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-[#8A918E]">{listing.land_size} acres</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(listing.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => setViewingListing(listing)}
                          size="sm"
                          variant="ghost"
                          className="text-[#59605D] hover:bg-[#F5F3ED] rounded-lg p-2"
                          data-testid={`view-listing-button-${listing.id}`}
                        >
                          <Eye className="w-4 h-4" strokeWidth={1.5} />
                        </Button>
                        {listing.status !== 'approved' && (
                          <Button
                            onClick={() => handleApprove(listing.id)}
                            size="sm"
                            className="bg-[#3D684E] text-white hover:bg-[#2B4A3B] rounded-lg px-3 py-2"
                            data-testid={`approve-listing-button-${listing.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" strokeWidth={1.5} />
                            Approve
                          </Button>
                        )}
                        {listing.status !== 'rejected' && (
                          <Button
                            onClick={() => handleReject(listing.id)}
                            size="sm"
                            variant="outline"
                            className="border-[#D9944B] text-[#D9944B] hover:bg-[#FDF2E3] rounded-lg px-3 py-2"
                            data-testid={`reject-listing-button-${listing.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-1" strokeWidth={1.5} />
                            Reject
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDelete(listing.id)}
                          size="sm"
                          variant="outline"
                          className="border-[#B04A41] text-[#B04A41] hover:bg-[#FBEAE8] rounded-lg p-2"
                          data-testid={`delete-listing-button-${listing.id}`}
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewingListing && (
        <Dialog open={!!viewingListing} onOpenChange={() => setViewingListing(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="admin-listing-details-modal">
            <DialogHeader>
              <DialogTitle className="text-3xl font-medium tracking-tight" style={{fontFamily: 'Outfit, sans-serif'}}>
                {viewingListing.title}
              </DialogTitle>
              <DialogDescription className="text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>
                <MapPin className="w-4 h-4 inline mr-1" strokeWidth={1.5} />
                {viewingListing.city}, {viewingListing.location}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-[#59605D]">Status:</span>
                {getStatusBadge(viewingListing.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {viewingListing.images.map((img, idx) => (
                  <img key={idx} src={img} alt={`Property ${idx + 1}`} className="w-full h-48 object-cover rounded-lg" />
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F5F3ED] p-4 rounded-xl">
                  <p className="text-xs uppercase tracking-wider text-[#8A918E] mb-1">Price</p>
                  <p className="text-3xl font-medium text-[#2B4A3B]" style={{fontFamily: 'Outfit, sans-serif'}}>
                    ${viewingListing.price.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#F5F3ED] p-4 rounded-xl">
                  <p className="text-xs uppercase tracking-wider text-[#8A918E] mb-1">Land Size</p>
                  <p className="text-3xl font-medium text-[#59605D]" style={{fontFamily: 'Outfit, sans-serif'}}>
                    {viewingListing.land_size} acres
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-medium mb-2" style={{fontFamily: 'Outfit, sans-serif', color: '#1C211F'}}>Description</h4>
                <p className="text-[#59605D] leading-relaxed" style={{fontFamily: 'Manrope, sans-serif'}}>
                  {viewingListing.description}
                </p>
              </div>
              
              <div className="border-t border-[#E8E3D9] pt-4">
                <h4 className="text-lg font-medium mb-2" style={{fontFamily: 'Outfit, sans-serif', color: '#1C211F'}}>Seller Information</h4>
                <p className="text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>
                  <strong>Name:</strong> {viewingListing.seller_name}<br />
                  <strong>Email:</strong> {viewingListing.seller_email}
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                {viewingListing.status !== 'approved' && (
                  <Button
                    onClick={() => {
                      handleApprove(viewingListing.id);
                      setViewingListing(null);
                    }}
                    className="flex-1 bg-[#3D684E] text-white hover:bg-[#2B4A3B] rounded-xl py-3"
                    data-testid="modal-approve-button"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Approve Listing
                  </Button>
                )}
                {viewingListing.status !== 'rejected' && (
                  <Button
                    onClick={() => {
                      handleReject(viewingListing.id);
                      setViewingListing(null);
                    }}
                    variant="outline"
                    className="flex-1 border-[#D9944B] text-[#D9944B] hover:bg-[#FDF2E3] rounded-xl py-3"
                    data-testid="modal-reject-button"
                  >
                    <XCircle className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Reject Listing
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
