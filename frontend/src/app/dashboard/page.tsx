'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, ShoppingBag, Heart, MapPin, LogOut, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/lib/api';
import { useApp } from '@/context/AppContext';

function UserDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, logout, wishlist, toggleWishlist, addToCart, updateUser } = useApp();

  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'wishlist' | 'addresses'>('orders');

  // Sync activeTab from URL query params
  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab === 'profile' || tab === 'orders' || tab === 'wishlist' || tab === 'addresses') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Redirect if guest/unauthorized
  useEffect(() => {
    const token = localStorage.getItem('paree_token');
    if (!token) {
      router.push('/');
    }
  }, [user]);

  // Profile forms state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');



  // Address forms state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [newAddrName, setNewAddrName] = useState('');
  const [newAddrPhone, setNewAddrPhone] = useState('');
  const [newAddrLine1, setNewAddrLine1] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('');
  const [newAddrState, setNewAddrState] = useState('');
  const [newAddrPin, setNewAddrPin] = useState('');
  const [isAddingAddr, setIsAddingAddr] = useState(false);

  const fetchAddresses = async () => {
    if (!user) return;
    setAddressesLoading(true);
    try {
      const data = await api.getAddresses();
      setAddresses(data || []);
    } catch (err) {
      console.error("Error loading user addresses:", err);
    } finally {
      setAddressesLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  // Sync profile details once user context resolves
  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
    }
  }, [user]);

  // Fetch Order History
  const { data: myOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: api.getMyOrders,
    enabled: !!user
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    try {
      const res = await api.updateProfile({ name: profileName, email: profileEmail, phone: profilePhone });
      updateUser(res);
      setProfileSuccess('Profile updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    } catch (err: any) {
      setProfileError(err.message || 'Failed updating profile details.');
    }
  };


  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAddress({
        name: newAddrName,
        phone: newAddrPhone,
        address_line1: newAddrLine1,
        city: newAddrCity,
        state: newAddrState,
        postal_code: newAddrPin,
        country: 'India',
        is_default: false
      });
      setIsAddingAddr(false);
      setNewAddrName('');
      setNewAddrPhone('');
      setNewAddrLine1('');
      setNewAddrCity('');
      setNewAddrState('');
      setNewAddrPin('');
      await fetchAddresses();
    } catch (err: any) {
      console.error("Error creating address:", err);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await api.deleteAddress(id);
      await fetchAddresses();
    } catch (err: any) {
      console.error("Error deleting address:", err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-beige">
      <Header />

      <main className="max-w-7xl mx-auto w-full py-12 px-6 md:px-12 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Dashboard Sidebar Navigation */}
          <div className="bg-white border border-brand-gold/15 p-6 h-fit space-y-6">
            <div className="space-y-1.5 text-center sm:text-left">
              <span className="text-[9px] tracking-widest text-brand-gold uppercase font-bold">Client Dashboard</span>
              <h2 className="font-serif-cinzel text-md font-bold text-brand-green uppercase tracking-wide">{user?.name}</h2>
              <span className="text-xs text-neutral-400 font-light block">{user?.email}</span>
            </div>

            <hr className="border-brand-gold/15" />

            <div className="flex flex-row lg:flex-col flex-wrap gap-2 text-xs uppercase tracking-widest font-semibold text-neutral-500">
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-3 py-2 w-full text-left rounded-sm transition-all ${
                  activeTab === 'orders' ? 'bg-brand-green text-brand-beige font-bold border-l-2 border-brand-gold' : 'hover:text-brand-green hover:bg-brand-green/5'
                }`}
              >
                <ShoppingBag size={14} /> Orders
              </button>
              
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-3 py-2 w-full text-left rounded-sm transition-all ${
                  activeTab === 'profile' ? 'bg-brand-green text-brand-beige font-bold border-l-2 border-brand-gold' : 'hover:text-brand-green hover:bg-brand-green/5'
                }`}
              >
                <User size={14} /> Profile
              </button>

              <button
                onClick={() => setActiveTab('wishlist')}
                className={`flex items-center gap-2 px-3 py-2 w-full text-left rounded-sm transition-all ${
                  activeTab === 'wishlist' ? 'bg-brand-green text-brand-beige font-bold border-l-2 border-brand-gold' : 'hover:text-brand-green hover:bg-brand-green/5'
                }`}
              >
                <Heart size={14} /> Wishlist
              </button>

              <button
                onClick={() => setActiveTab('addresses')}
                className={`flex items-center gap-2 px-3 py-2 w-full text-left rounded-sm transition-all ${
                  activeTab === 'addresses' ? 'bg-brand-green text-brand-beige font-bold border-l-2 border-brand-gold' : 'hover:text-brand-green hover:bg-brand-green/5'
                }`}
              >
                <MapPin size={14} /> Addresses
              </button>

              <button
                onClick={() => { logout(); router.push('/'); }}
                className="flex items-center gap-2 px-3 py-2 w-full text-left rounded-sm hover:text-brand-crimson transition-all text-neutral-400 mt-4 border-t border-brand-gold/10 pt-4"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>

          {/* Dashboard Main Content Panel */}
          <div className="lg:col-span-3 bg-white border border-brand-gold/15 p-6 md:p-8 min-h-[500px]">
            
            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <h3 className="font-serif-cinzel text-sm font-bold tracking-widest text-brand-gold uppercase border-b border-brand-gold/20 pb-2">Order History</h3>
                
                {ordersLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-16 bg-neutral-100 rounded-sm" />
                    <div className="h-16 bg-neutral-100 rounded-sm" />
                  </div>
                ) : myOrders.length === 0 ? (
                  <div className="text-center py-20">
                    <ShoppingBag className="mx-auto text-brand-gold/30 mb-4" size={40} />
                    <p className="font-serif-cormorant italic text-lg text-neutral-600">No bridal orders placed yet.</p>
                    <button onClick={() => router.push('/shop')} className="mt-6 border border-brand-gold text-brand-green hover:bg-brand-gold hover:text-brand-green font-bold text-xs uppercase px-6 py-3 tracking-widest transition-all">
                      Browse Designs
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {myOrders.map((order: any) => (
                      <div key={order.id} className="border border-brand-gold/15 p-4 rounded-sm space-y-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row justify-between border-b border-neutral-100 pb-3 gap-2 text-xs">
                          <div>
                            <p className="font-bold text-brand-green uppercase tracking-wide">Order ID: {order.id}</p>
                            <p className="text-neutral-400 mt-0.5">Date: {new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="sm:text-right">
                            <span className="inline-block bg-brand-green/10 text-brand-green text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm border border-brand-green/20">
                              Status: {order.order_status}
                            </span>
                          </div>
                        </div>

                        {/* Order Items list */}
                        <div className="space-y-2">
                          {order.items?.map((item: any) => (
                            <div key={item.product_id} className="flex justify-between items-center text-xs">
                              <span className="text-brand-green font-medium uppercase tracking-wide">{item.product_name} x {item.quantity}</span>
                              <span className="text-neutral-600 font-semibold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-center pt-3 border-t border-neutral-100 gap-4">
                          <div>
                            <span className="text-xs text-brand-green font-bold">Total Amount paid: ₹{order.final_amount?.toLocaleString('en-IN') || order.total_amount?.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-neutral-400 block mt-0.5">
                              {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                              {' • '}
                              {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                          </div>
                          <button
                            onClick={() => window.open(api.getInvoiceUrl(order.id), '_blank')}
                            className="text-[10px] tracking-widest font-bold uppercase text-brand-gold hover:text-brand-green border border-brand-gold/30 hover:border-brand-gold px-4 py-2 transition-all"
                          >
                            Download PDF Receipt
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                {/* General Info */}
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <h3 className="font-serif-cinzel text-sm font-bold tracking-widest text-brand-gold uppercase border-b border-brand-gold/20 pb-2">Profile Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] tracking-widest text-neutral-500 uppercase font-semibold mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full bg-brand-beige/20 border border-brand-gold/30 px-3 py-2.5 text-xs tracking-widest uppercase focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-widest text-neutral-500 uppercase font-semibold mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full bg-brand-beige/20 border border-brand-gold/30 px-3 py-2.5 text-xs tracking-widest focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                  </div>

                  {profileError && <p className="text-xs text-brand-crimson font-medium">{profileError}</p>}
                  {profileSuccess && <p className="text-xs text-brand-green font-medium">{profileSuccess}</p>}

                  <button
                    type="submit"
                    className="bg-brand-green hover:bg-brand-gold text-brand-beige hover:text-brand-green font-semibold py-3 px-6 text-xs tracking-widest uppercase border border-brand-gold transition-all duration-300"
                  >
                    Save Changes
                  </button>
                </form>


              </div>
            )}

            {/* WISHLIST TAB */}
            {activeTab === 'wishlist' && (
              <div className="space-y-6">
                <h3 className="font-serif-cinzel text-sm font-bold tracking-widest text-brand-gold uppercase border-b border-brand-gold/20 pb-2">Your Wishlist</h3>
                
                {wishlist.length === 0 ? (
                  <div className="text-center py-20">
                    <Heart className="mx-auto text-brand-gold/30 mb-4" size={40} />
                    <p className="font-serif-cormorant italic text-lg text-neutral-600">Your wishlist is empty.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlist.map(item => (
                      <div key={item.id} className="border border-brand-gold/15 p-5 flex gap-6 rounded-sm">
                        <div className="w-24 h-32 bg-brand-beige border border-brand-gold/10 overflow-hidden flex-shrink-0">
                          <img src={item.images?.[0] || item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between text-sm">
                          <div>
                            <h4 className="font-serif-cinzel text-sm font-bold text-brand-green uppercase tracking-wide line-clamp-1 sm:text-base">{item.name}</h4>
                            <p className="text-neutral-500 mt-1.5 font-bold">₹{item.price.toLocaleString('en-IN')}</p>
                            {(item.size || item.color) && (
                              <p className="text-xs text-brand-gold tracking-widest uppercase font-medium mt-1">
                                {item.size ? `Size: ${item.size}` : ''}
                                {item.size && item.color ? ' | ' : ''}
                                {item.color ? `Color: ${item.color}` : ''}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={() => {
                                addToCart({
                                  product_id: item.id,
                                  product_name: item.name,
                                  sku: item.sku,
                                  price: item.price,
                                  image: item.images?.[0] || item.image,
                                  size: item.size || 'M',
                                  color: item.color || 'Default',
                                  category_id: item.category_id,
                                  collection: item.collection
                                }, 1);
                                toggleWishlist(item);
                              }}
                              className="text-xs tracking-widest uppercase font-bold text-brand-green hover:underline"
                            >
                              Move to Bag
                            </button>
                            <span className="text-neutral-300">|</span>
                            <button
                              onClick={() => toggleWishlist(item)}
                              className="text-xs tracking-widest uppercase font-bold text-brand-crimson hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-brand-gold/20 pb-2">
                  <h3 className="font-serif-cinzel text-sm font-bold tracking-widest text-brand-gold uppercase">Stored Addresses</h3>
                  {!isAddingAddr && (
                    <button
                      onClick={() => setIsAddingAddr(true)}
                      className="text-[10px] tracking-widest uppercase font-bold text-brand-green hover:text-brand-gold"
                    >
                      + Add New
                    </button>
                  )}
                </div>

                {/* Add address form */}
                {isAddingAddr && (
                  <form onSubmit={handleAddAddress} className="bg-brand-cream/30 border border-brand-gold/15 p-4 rounded-sm space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] tracking-widest uppercase font-bold text-neutral-500 mb-1">Receiver Name</label>
                        <input
                          type="text"
                          required
                          value={newAddrName}
                          onChange={(e) => setNewAddrName(e.target.value)}
                          className="w-full bg-white border border-brand-gold/30 px-3 py-1.5 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] tracking-widest uppercase font-bold text-neutral-500 mb-1">Contact Phone</label>
                        <input
                          type="text"
                          required
                          value={newAddrPhone}
                          onChange={(e) => setNewAddrPhone(e.target.value)}
                          className="w-full bg-white border border-brand-gold/30 px-3 py-1.5 focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[9px] tracking-widest uppercase font-bold text-neutral-500 mb-1">Address Line</label>
                        <input
                          type="text"
                          required
                          value={newAddrLine1}
                          onChange={(e) => setNewAddrLine1(e.target.value)}
                          className="w-full bg-white border border-brand-gold/30 px-3 py-1.5 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] tracking-widest uppercase font-bold text-neutral-500 mb-1">City</label>
                        <input
                          type="text"
                          required
                          value={newAddrCity}
                          onChange={(e) => setNewAddrCity(e.target.value)}
                          className="w-full bg-white border border-brand-gold/30 px-3 py-1.5 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] tracking-widest uppercase font-bold text-neutral-500 mb-1">State</label>
                        <input
                          type="text"
                          required
                          value={newAddrState}
                          onChange={(e) => setNewAddrState(e.target.value)}
                          className="w-full bg-white border border-brand-gold/30 px-3 py-1.5 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] tracking-widest uppercase font-bold text-neutral-500 mb-1">Postal Code</label>
                        <input
                          type="text"
                          required
                          value={newAddrPin}
                          onChange={(e) => setNewAddrPin(e.target.value)}
                          className="w-full bg-white border border-brand-gold/30 px-3 py-1.5 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button type="submit" className="bg-brand-green hover:bg-brand-gold text-brand-beige hover:text-brand-green font-bold px-4 py-2 uppercase tracking-widest text-[10px]">
                        Save Address
                      </button>
                      <button type="button" onClick={() => setIsAddingAddr(false)} className="border border-neutral-300 text-neutral-500 px-4 py-2 uppercase tracking-widest text-[10px]">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
                             {/* Stored Addresses List */}
                {addressesLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-16 bg-neutral-100 rounded-sm" />
                    <div className="h-16 bg-neutral-100 rounded-sm" />
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-brand-gold/20 p-6">
                    <p className="text-xs text-neutral-500 font-light">No saved shipping addresses found. Feel free to add one.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map(addr => (
                      <div key={addr.id} className="border border-brand-gold/15 p-4 rounded-sm text-xs relative space-y-1">
                        <p className="font-bold text-brand-green uppercase tracking-wide">{addr.name}</p>
                        <p className="text-neutral-500">Phone: {addr.phone}</p>
                        <p className="text-neutral-600 mt-2">{addr.address_line1}</p>
                        {addr.address_line2 && <p className="text-neutral-600">{addr.address_line2}</p>}
                        <p className="text-neutral-600">{addr.city}, {addr.state} - {addr.postal_code}</p>
                        <p className="text-neutral-600 font-semibold">{addr.country}</p>
                        
                        {addr.is_default && (
                          <span className="inline-block mt-3 bg-brand-gold/10 text-brand-gold font-bold text-[9px] tracking-widest uppercase px-2 py-0.5 border border-brand-gold/25">
                            Default Shipping
                          </span>
                        )}

                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="absolute top-4 right-4 text-[10px] font-bold text-brand-crimson hover:underline uppercase tracking-widest"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function UserDashboard() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-brand-beige flex items-center justify-center"><p className="font-serif-cinzel text-xs text-brand-gold uppercase tracking-widest animate-pulse">Loading Atelier Dashboard...</p></div>}>
      <UserDashboardContent />
    </React.Suspense>
  );
}

