import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { MapPin, LogOut, MessageSquare, ArrowLeft, User, Mail } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const Messages = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedMessages, setGroupedMessages] = useState({});
  const [replyText, setReplyText] = useState({});
  const [sendingReply, setSendingReply] = useState({});

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/api/messages`, {
        withCredentials: true
      });
      setMessages(data);
      
      // Group messages by listing
      const grouped = data.reduce((acc, msg) => {
        const key = msg.listing_id;
        if (!acc[key]) {
          acc[key] = {
            listing_title: msg.listing_title,
            listing_id: msg.listing_id,
            messages: [],
            participants: new Set()
          };
        }
        acc[key].messages.push(msg);
        acc[key].participants.add(msg.sender_id);
        acc[key].participants.add(msg.recipient_id);
        return acc;
      }, {});
      
      // Sort messages within each conversation by date
      Object.values(grouped).forEach(conv => {
        conv.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      });
      
      setGroupedMessages(grouped);
    } catch (error) {
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (listingId, recipientId) => {
    const messageText = replyText[listingId]?.trim();
    if (!messageText) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setSendingReply({ ...sendingReply, [listingId]: true });
      await axios.post(
        `${API_URL}/api/messages`,
        {
          listing_id: listingId,
          recipient_id: recipientId,
          message: messageText
        },
        { withCredentials: true }
      );
      toast.success('Reply sent successfully!');
      setReplyText({ ...replyText, [listingId]: '' });
      fetchMessages(); // Refresh messages
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send reply');
    } finally {
      setSendingReply({ ...sendingReply, [listingId]: false });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleBack = () => {
    if (user?.role === 'buyer') {
      navigate('/buyer');
    } else if (user?.role === 'seller') {
      navigate('/seller');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#FDFBF7]/80 border-b border-[#E8E3D9]" data-testid="messages-nav">
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
                data-testid="messages-logout-button"
              >
                <LogOut className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center mb-8">
          <Button
            onClick={handleBack}
            variant="ghost"
            className="mr-4 text-[#59605D] hover:bg-[#F5F3ED] rounded-xl"
            data-testid="back-to-dashboard-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl tracking-tighter leading-none font-medium mb-3" style={{fontFamily: 'Outfit, sans-serif', color: '#1C211F'}} data-testid="messages-title">
            <MessageSquare className="w-10 h-10 inline mr-3 mb-2" strokeWidth={1.5} />
            Messages
          </h1>
          <p className="text-lg text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>
            {user?.role === 'buyer' ? 'Your inquiries about properties' : 'Inquiries from buyers'}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-[#2B4A3B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <Card className="border-[#E8E3D9] shadow-sm p-12 text-center">
            <MessageSquare className="w-16 h-16 text-[#8A918E] mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-xl font-medium mb-2" style={{fontFamily: 'Outfit, sans-serif', color: '#1C211F'}}>No messages yet</h3>
            <p className="text-[#59605D]" style={{fontFamily: 'Manrope, sans-serif'}}>
              {user?.role === 'buyer' 
                ? 'Messages you send to sellers will appear here'
                : 'Messages from interested buyers will appear here'}
            </p>
          </Card>
        ) : (
          <div className="space-y-6" data-testid="messages-list">
            {Object.values(groupedMessages).map((conversation) => (
              <Card key={conversation.listing_id} className="border-[#E8E3D9] shadow-sm overflow-hidden" data-testid={`conversation-${conversation.listing_id}`}>
                <div className="bg-[#F5F3ED] px-6 py-4 border-b border-[#E8E3D9]">
                  <h3 className="text-xl font-medium tracking-tight" style={{fontFamily: 'Outfit, sans-serif', color: '#1C211F'}}>
                    {conversation.listing_title}
                  </h3>
                  <p className="text-sm text-[#8A918E] mt-1">
                    {conversation.messages.length} message{conversation.messages.length > 1 ? 's' : ''}
                  </p>
                </div>
                
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {conversation.messages.map((msg, idx) => {
                      const isSender = msg.sender_id === user?.id;
                      const isReceiver = msg.recipient_id === user?.id;
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                          data-testid={`message-${msg.id}`}
                        >
                          <div className={`max-w-2xl ${isSender ? 'ml-12' : 'mr-12'}`}>
                            <div className="flex items-start space-x-3">
                              {!isSender && (
                                <div className="flex-shrink-0">
                                  <div className="w-10 h-10 bg-[#E5F0EA] rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-[#2B4A3B]" strokeWidth={1.5} />
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex-1">
                                <div className="flex items-baseline space-x-2 mb-1">
                                  <span className="text-sm font-medium text-[#1C211F]" style={{fontFamily: 'Manrope, sans-serif'}}>
                                    {msg.sender_name}
                                  </span>
                                  <span className="text-xs text-[#8A918E]">
                                    {formatDate(msg.created_at)}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <Mail className="w-3 h-3 text-[#8A918E]" strokeWidth={1.5} />
                                  <span className="text-xs text-[#8A918E]">{msg.sender_email}</span>
                                </div>
                                <div
                                  className={`p-4 rounded-xl ${
                                    isSender
                                      ? 'bg-[#2B4A3B] text-white'
                                      : 'bg-white border border-[#E8E3D9]'
                                  }`}
                                  data-testid={`message-content-${msg.id}`}
                                >
                                  <p className={`text-base leading-relaxed ${isSender ? 'text-white' : 'text-[#1C211F]'}`} style={{fontFamily: 'Manrope, sans-serif'}}>
                                    {msg.message}
                                  </p>
                                </div>
                              </div>
                              
                              {isSender && (
                                <div className="flex-shrink-0">
                                  <div className="w-10 h-10 bg-[#2B4A3B] rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" strokeWidth={1.5} />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Reply form for sellers */}
                  {user?.role === 'seller' && conversation.messages.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-[#E8E3D9]">
                      <h4 className="text-sm font-medium text-[#59605D] mb-3" style={{fontFamily: 'Manrope, sans-serif'}}>
                        Reply to buyer
                      </h4>
                      <div className="flex gap-3">
                        <textarea
                          value={replyText[conversation.listing_id] || ''}
                          onChange={(e) => setReplyText({ ...replyText, [conversation.listing_id]: e.target.value })}
                          placeholder="Type your reply..."
                          rows={3}
                          className="flex-1 bg-white border border-[#D1CBBF] rounded-lg px-4 py-3 focus:border-[#2B4A3B] focus:ring-1 focus:ring-[#2B4A3B] outline-none resize-none"
                          style={{fontFamily: 'Manrope, sans-serif'}}
                          data-testid={`reply-textarea-${conversation.listing_id}`}
                        />
                      </div>
                      <div className="flex justify-end mt-3">
                        <Button
                          onClick={() => {
                            // Get the buyer ID from the first message where user is recipient
                            const buyerMessage = conversation.messages.find(m => m.recipient_id === user?.id);
                            const buyerId = buyerMessage ? buyerMessage.sender_id : conversation.messages[0].sender_id;
                            handleSendReply(conversation.listing_id, buyerId);
                          }}
                          disabled={sendingReply[conversation.listing_id] || !replyText[conversation.listing_id]?.trim()}
                          className="bg-[#2B4A3B] text-white hover:bg-[#1E3329] rounded-xl px-6 py-2"
                          data-testid={`send-reply-button-${conversation.listing_id}`}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" strokeWidth={1.5} />
                          {sendingReply[conversation.listing_id] ? 'Sending...' : 'Send Reply'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
