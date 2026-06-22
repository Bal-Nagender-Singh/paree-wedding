'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, Search, X, User as UserIcon, LogOut, Minus, Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { api } from '@/lib/api';

export default function Header() {
  const {
    cart,
    wishlist,
    toggleWishlist,
    addToCart,
    user,
    logout,
    updateCartQty,
    removeFromCart,
    cartTotals,
    coupon,
    applyCoupon,
    removeCoupon
  } = useApp();

  const pathname = usePathname();
  const router = useRouter();

  // Drawer States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishOpen, setIsWishOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Account Dropdown Menu State
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  // OTP Login Drawer States
  const [otpStep, setOtpStep] = useState<'phone' | 'verify' | 'register'>('phone');
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [otpName, setOtpName] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const showAuth = sessionStorage.getItem('open_auth_drawer');
      if (showAuth) {
        setIsAuthOpen(true);
        sessionStorage.removeItem('open_auth_drawer');
      }
    }
  }, []);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };



  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');
    setOtpLoading(true);
    try {
      const res = await api.sendOtp({ phone: otpPhone });
      setOtpStep('verify');
      setOtpSuccess(res.realSmsSent ? 'OTP sent to your phone.' : `Dev OTP: ${res.simulatedOtp}`);
      console.log('[Paree Dev] OTP Code:', res.simulatedOtp);
    } catch (err: any) {
      setOtpError(err.message || 'Failed to send OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');
    setOtpLoading(true);
    try {
      const res = await api.verifyOtp({ phone: otpPhone, otp: otpCodeInput });
      if (res.newUser) {
        // New user - ask for their name
        setOtpStep('register');
        setOtpSuccess('');
      } else {
        // Existing user - log them in
        localStorage.setItem('paree_token', res.token);
        localStorage.setItem('paree_user', JSON.stringify(res.user));
        setOtpSuccess('Welcome back! Logging you in...');
        setTimeout(() => {
          setIsAuthOpen(false);
          window.location.reload();
        }, 800);
      }
    } catch (err: any) {
      setOtpError(err.message || 'Incorrect OTP code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');
    setOtpLoading(true);
    try {
      const res = await api.completeRegistration({ phone: otpPhone, name: otpName });
      localStorage.setItem('paree_token', res.token);
      localStorage.setItem('paree_user', JSON.stringify(res.user));
      setOtpSuccess('Account created! Welcome to Paree.');
      setTimeout(() => {
        setIsAuthOpen(false);
        window.location.reload();
      }, 800);
    } catch (err: any) {
      setOtpError(err.message || 'Failed to create account.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    try {
      const res = await applyCoupon(couponInput);
      setCouponSuccess(`Coupon applied! Saved ₹${res.discount_type === 'percentage' ? `${res.value}%` : `₹${res.value}`}`);
      setCouponInput('');
    } catch (err: any) {
      setCouponError(err.message || 'Invalid or expired coupon');
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>


      {/* 2. Main Navigation Header */}
      <header className="sticky top-0 z-40 w-full bg-brand-beige/95 backdrop-blur-md border-b border-brand-gold/15 py-3 px-6 md:px-12 flex items-center justify-between">
        
        {/* Left: Brand Identity */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-brand-gold bg-white flex items-center justify-center p-0.5">
            {/* Logo image copied in public folder */}
            <img src="/logo.jpg" alt="Paree Logo" className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif-cinzel text-xl font-bold tracking-widest text-brand-green uppercase group-hover:text-brand-gold transition-colors duration-300">
              Paree
            </span>
            <span className="font-serif-cormorant italic text-[10px] tracking-wider text-brand-gold -mt-0.5">
              Fashion for angels...
            </span>
          </div>
        </Link>

        {/* Center: Navigation Menus */}
        <nav className="hidden md:flex items-center gap-8 font-sans-montserrat text-xs tracking-widest font-medium uppercase text-brand-green-light">
          <Link href="/" className={`hover:text-brand-gold transition-colors ${pathname === '/' ? 'text-brand-gold font-semibold border-b border-brand-gold pb-1' : ''}`}>
            Home
          </Link>
          <Link href="/shop" className={`hover:text-brand-gold transition-colors ${pathname === '/shop' && !pathname.includes('category') ? 'text-brand-gold font-semibold border-b border-brand-gold pb-1' : ''}`}>
            Collection
          </Link>
          <Link href="/shop/category/cat-1" className={`hover:text-brand-gold transition-colors ${pathname.includes('category/cat-1') ? 'text-brand-gold font-semibold border-b border-brand-gold pb-1' : ''}`}>
            Bridal
          </Link>
          <Link href="/shop/category/cat-2" className={`hover:text-brand-gold transition-colors ${pathname.includes('category/cat-2') ? 'text-brand-gold font-semibold border-b border-brand-gold pb-1' : ''}`}>
            Sarees
          </Link>
          <Link href="/shop/category/cat-3" className={`hover:text-brand-gold transition-colors ${pathname.includes('category/cat-3') ? 'text-brand-gold font-semibold border-b border-brand-gold pb-1' : ''}`}>
            Atelier
          </Link>
        </nav>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-4 text-brand-green-light">
          {/* Search Trigger */}
          <button onClick={() => setIsSearchOpen(true)} className="p-1.5 hover:text-brand-gold transition-colors" title="Search Catalogue">
            <Search size={18} />
          </button>

          {/* Wishlist Trigger */}
          <button onClick={() => setIsWishOpen(true)} className="p-1.5 hover:text-brand-gold transition-colors relative" title="Your Wishlist">
            <Heart size={18} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-crimson text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart Trigger */}
          <button onClick={() => setIsCartOpen(true)} className="p-1.5 hover:text-brand-gold transition-colors relative" title="Shopping Cart">
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-green text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Auth Control */}
          {user ? (
            <div className="relative border-l border-brand-gold/30 pl-4 flex items-center">
              <button 
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="text-xs uppercase tracking-widest hover:text-brand-gold font-medium flex items-center gap-1 focus:outline-none cursor-pointer"
              >
                <UserIcon size={14} />
                <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
              </button>

              {/* Account Dropdown Menu */}
              <AnimatePresence>
                {isAccountMenuOpen && (
                  <>
                    {/* Invisible backdrop to capture clicks to close dropdown */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsAccountMenuOpen(false)} />
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 z-20 w-48 bg-white border border-brand-gold/20 shadow-xl rounded-sm p-2 text-[10px] uppercase tracking-widest font-semibold text-neutral-600 flex flex-col"
                    >
                      {user.role === 'admin' ? (
                        <Link 
                          href="/admin" 
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="px-3 py-2 hover:bg-brand-green/5 hover:text-brand-green transition-colors rounded-sm text-left font-bold text-brand-green"
                        >
                          Admin Panel
                        </Link>
                      ) : (
                        <>
                          <Link 
                            href="/dashboard" 
                            onClick={() => setIsAccountMenuOpen(false)}
                            className="px-3 py-2 hover:bg-brand-green/5 hover:text-brand-green transition-colors rounded-sm text-left"
                          >
                            My Dashboard
                          </Link>
                          <Link 
                            href="/dashboard?tab=orders" 
                            onClick={() => setIsAccountMenuOpen(false)}
                            className="px-3 py-2 hover:bg-brand-green/5 hover:text-brand-green transition-colors rounded-sm text-left"
                          >
                            My Orders
                          </Link>
                          <Link 
                            href="/dashboard?tab=profile" 
                            onClick={() => setIsAccountMenuOpen(false)}
                            className="px-3 py-2 hover:bg-brand-green/5 hover:text-brand-green transition-colors rounded-sm text-left"
                          >
                            Edit Profile
                          </Link>
                        </>
                      )}
                      <hr className="border-brand-gold/15 my-1" />
                      <button 
                        onClick={() => { logout(); setIsAccountMenuOpen(false); router.push('/'); }}
                        className="px-3 py-2 hover:bg-brand-crimson/5 text-brand-crimson hover:text-brand-crimson transition-colors rounded-sm text-left flex items-center gap-1.5 cursor-pointer font-bold"
                      >
                        <LogOut size={12} /> Sign Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthOpen(true)} 
              className="text-xs uppercase tracking-widest hover:text-brand-gold font-medium flex items-center gap-1.5 border-l border-brand-gold/30 pl-4 cursor-pointer focus:outline-none" 
              title="Login / Register"
            >
              <UserIcon size={16} />
              <span className="hidden sm:inline font-semibold">Login</span>
            </button>
          )}
        </div>
      </header>

      {/* 3. Sliding Drawers and Modals (AnimatePresence) */}
      <AnimatePresence>
        {/* Drawers backdrop */}
        {(isCartOpen || isWishOpen || isSearchOpen || isAuthOpen) && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsCartOpen(false);
              setIsWishOpen(false);
              setIsSearchOpen(false);
              setIsAuthOpen(false);
            }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
        )}

        {/* CART DRAWER */}
        {isCartOpen && (
          <motion.div
            key="cart-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.4 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg bg-brand-beige border-l border-brand-gold shadow-2xl p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-brand-gold/20 pb-4 mb-6">
                <h2 className="font-serif-cinzel text-lg tracking-widest text-brand-green uppercase font-bold">Shopping Bag ({cartCount})</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-brand-green hover:text-brand-gold p-1">
                  <X size={20} />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingBag className="mx-auto text-brand-gold/40 mb-4" size={48} />
                  <p className="font-serif-cormorant italic text-lg text-brand-green/80">Your bag is empty.</p>
                  <p className="text-xs text-neutral-500 mt-2 tracking-widest uppercase">Adorn it with designer bridalwear</p>
                  <button
                    onClick={() => { setIsCartOpen(false); router.push('/shop'); }}
                    className="mt-8 bg-brand-green text-brand-beige text-xs font-semibold tracking-widest uppercase py-3 px-6 hover:bg-brand-gold hover:text-brand-green transition-all duration-300 border border-brand-gold"
                  >
                    Browse Collections
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                  {cart.map((item) => (
                    <div key={`${item.product_id}-${item.size}-${item.color}`} className="flex gap-6 border-b border-brand-gold/10 pb-6 mb-2">
                      <div className="w-28 h-36 bg-white border border-brand-gold/10 overflow-hidden relative flex-shrink-0">
                        <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-serif-cinzel text-sm font-bold text-brand-green uppercase tracking-wide line-clamp-1">{item.product_name}</h4>
                          <p className="text-xs text-brand-gold tracking-widest uppercase font-medium mt-1">Size: {item.size} | Color: {item.color}</p>
                          <p className="text-sm font-bold text-brand-green mt-1.5">₹{item.price.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-brand-gold/30">
                            <button onClick={() => updateCartQty(item.product_id, item.size, item.color, item.quantity - 1)} className="p-1 hover:text-brand-gold text-brand-green">
                              <Minus size={12} />
                            </button>
                            <span className="px-3 text-xs font-semibold">{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.product_id, item.size, item.color, item.quantity + 1)} className="p-1 hover:text-brand-gold text-brand-green">
                              <Plus size={12} />
                            </button>
                          </div>
                          <button onClick={() => removeFromCart(item.product_id, item.size, item.color)} className="text-neutral-400 hover:text-brand-crimson p-1">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-brand-gold/20 pt-4 bg-brand-beige">
                {/* Coupon form */}
                <form onSubmit={handleApplyCoupon} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Enter Coupon (e.g. PAREE10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 bg-white border border-brand-gold/30 px-3 py-2 text-xs uppercase tracking-widest focus:outline-none focus:border-brand-gold"
                  />
                  <button type="submit" className="bg-brand-green hover:bg-brand-gold hover:text-brand-green text-brand-beige px-4 py-2 text-xs uppercase tracking-widest font-semibold border border-brand-gold transition-colors duration-300">
                    Apply
                  </button>
                </form>

                {couponError && <p className="text-[11px] text-brand-crimson mb-2">{couponError}</p>}
                {couponSuccess && <p className="text-[11px] text-brand-green font-medium mb-2">{couponSuccess}</p>}

                {coupon && (
                  <div className="flex items-center justify-between bg-brand-green/5 px-3 py-1.5 border border-brand-green/20 mb-4 rounded-sm">
                    <span className="text-[10px] text-brand-green uppercase tracking-widest font-semibold">Active Code: {coupon.code}</span>
                    <button type="button" onClick={removeCoupon} className="text-brand-crimson hover:underline text-[10px] uppercase font-semibold">Remove</button>
                  </div>
                )}

                <div className="space-y-1.5 text-xs text-brand-green mb-6">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{cartTotals.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {cartTotals.discount > 0 && (
                    <div className="flex justify-between text-brand-crimson font-medium">
                      <span>Discount</span>
                      <span>- ₹{cartTotals.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST (18%)</span>
                    <span>₹{cartTotals.tax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{cartTotals.shipping === 0 ? 'Free' : `₹${cartTotals.shipping}`}</span>
                  </div>
                  <div className="flex justify-between border-t border-brand-gold/30 pt-2 font-bold text-sm">
                    <span>Total Amount</span>
                    <span className="text-brand-green">₹{cartTotals.final.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="block text-center w-full bg-brand-green hover:bg-brand-gold text-brand-beige hover:text-brand-green font-semibold py-4 text-xs tracking-widest uppercase border border-brand-gold transition-all duration-300"
                >
                  Proceed to Checkout
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {/* WISHLIST DRAWER */}
        {isWishOpen && (
          <motion.div
            key="wishlist-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.4 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg bg-brand-beige border-l border-brand-gold shadow-2xl p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-brand-gold/20 pb-4 mb-6">
                <h2 className="font-serif-cinzel text-lg tracking-widest text-brand-green uppercase font-bold">Your Wishlist ({wishlist.length})</h2>
                <button onClick={() => setIsWishOpen(false)} className="text-brand-green hover:text-brand-gold p-1">
                  <X size={20} />
                </button>
              </div>

              {wishlist.length === 0 ? (
                <div className="text-center py-20">
                  <Heart className="mx-auto text-brand-gold/40 mb-4" size={48} />
                  <p className="font-serif-cormorant italic text-lg text-brand-green/80">Your wishlist is empty.</p>
                  <p className="text-xs text-neutral-500 mt-2 tracking-widest uppercase">Save items you adore for later</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  {wishlist.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex gap-6 border-b border-brand-gold/10 pb-6 mb-2">
                      {/* Clickable product image */}
                      <button
                        onClick={() => {
                          setIsWishOpen(false);
                          router.push(`/shop/${item.id}`);
                        }}
                        className="w-28 h-36 bg-white border border-brand-gold/10 overflow-hidden relative flex-shrink-0 hover:border-brand-gold/40 transition-colors"
                      >
                        <img src={item.images?.[0] || item.image} alt={item.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      </button>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          {/* Clickable product name */}
                          <button
                            onClick={() => {
                              setIsWishOpen(false);
                              router.push(`/shop/${item.id}`);
                            }}
                            className="font-serif-cinzel text-sm font-bold text-brand-green uppercase tracking-wide line-clamp-1 hover:text-brand-gold transition-colors text-left w-full"
                          >
                            {item.name}
                          </button>
                          <p className="text-sm font-bold text-brand-green mt-1.5">₹{item.price.toLocaleString('en-IN')}</p>
                          {(item.size || item.color) && (
                            <p className="text-xs text-brand-gold tracking-widest uppercase font-medium mt-1">
                              {item.size ? `Size: ${item.size}` : ''}
                              {item.size && item.color ? ' | ' : ''}
                              {item.color ? `Color: ${item.color}` : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <button
                            onClick={() => {
                              toggleWishlist(item);
                            }}
                            className="text-xs text-brand-crimson hover:underline uppercase tracking-widest"
                          >
                            Remove
                          </button>
                          <span className="text-neutral-300">|</span>
                          <button
                            onClick={() => {
                              addToCart({
                                product_id: item.id,
                                product_name: item.name,
                                sku: item.sku,
                                price: item.price,
                                image: item.images?.[0] || item.image,
                                size: item.size || item.sizes?.[0] || 'M',
                                color: item.color || item.colors?.[0] || 'Default',
                                category_id: item.category_id,
                                collection: item.collection
                              }, 1);
                              toggleWishlist(item);
                              setIsWishOpen(false);
                              setIsCartOpen(true);
                            }}
                            className="text-xs text-brand-green hover:underline uppercase tracking-widest font-semibold"
                          >
                            Move to Bag
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* SEARCH OVERLAY */}
        {isSearchOpen && (
          <motion.div
            key="search-overlay"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-50 bg-brand-beige border-b border-brand-gold p-8 shadow-2xl"
          >
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center border-b-2 border-brand-gold pb-2 mr-6">
                <Search size={22} className="text-brand-gold mr-3" />
                <input
                  type="text"
                  placeholder="SEARCH DRESSES, SAREES, LEHENGAS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-brand-green font-serif-cinzel text-lg tracking-widest uppercase focus:outline-none w-full placeholder:text-neutral-400"
                  autoFocus
                />
              </form>
              <button onClick={() => setIsSearchOpen(false)} className="text-brand-green hover:text-brand-gold p-1">
                <X size={24} />
              </button>
            </div>
            <div className="max-w-4xl mx-auto mt-4 text-[10px] text-neutral-400 tracking-widest uppercase flex gap-4">
              <span>Trending:</span>
              <Link href="/shop?search=lehenga" onClick={() => setIsSearchOpen(false)} className="hover:text-brand-gold underline">Lehengas</Link>
              <Link href="/shop?search=saree" onClick={() => setIsSearchOpen(false)} className="hover:text-brand-gold underline">Sarees</Link>
              <Link href="/shop?search=velvet" onClick={() => setIsSearchOpen(false)} className="hover:text-brand-gold underline">Velvet</Link>
            </div>
          </motion.div>
        )}

        {/* AUTH LOGIN DRAWER */}
        {isAuthOpen && (
          <motion.div
            key="auth-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.4 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-brand-beige border-l border-brand-gold shadow-2xl p-8 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-brand-gold/20 pb-4 mb-8">
                <h2 className="font-serif-cinzel text-lg tracking-widest text-brand-green uppercase font-bold">
                  Atelier Sign In
                </h2>
                <button onClick={() => { setIsAuthOpen(false); setOtpStep('phone'); setOtpPhone(''); setOtpCodeInput(''); setOtpName(''); setOtpError(''); setOtpSuccess(''); }} className="text-brand-green hover:text-brand-gold p-1">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                {/* STEP 1: Enter phone */}
                {otpStep === 'phone' && (
                  <form onSubmit={handleSendOtp} className="space-y-6">
                    <p className="text-[11px] text-neutral-500 leading-relaxed italic">
                      Enter your mobile number. We'll check if you have an account, or help you create one.
                    </p>
                    <div>
                      <label className="block text-[10px] tracking-widest text-neutral-500 uppercase font-semibold mb-2">Mobile Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 98765 43210"
                        value={otpPhone}
                        onChange={(e) => setOtpPhone(e.target.value)}
                        className="w-full bg-white border border-brand-gold/30 px-4 py-3 text-sm tracking-widest focus:outline-none focus:border-brand-gold"
                        autoFocus
                      />
                    </div>

                    {otpError && <p className="text-xs text-brand-crimson font-medium">{otpError}</p>}
                    {otpSuccess && <p className="text-xs text-brand-green font-medium">{otpSuccess}</p>}

                    <button
                      type="submit"
                      disabled={otpLoading || otpPhone.trim().length < 10}
                      className="w-full bg-brand-green hover:bg-brand-gold text-brand-beige hover:text-brand-green font-semibold py-3.5 text-xs tracking-widest uppercase border border-brand-gold transition-all duration-300 disabled:opacity-50 cursor-pointer"
                    >
                      {otpLoading ? 'Sending OTP...' : 'Send Verification OTP'}
                    </button>
                  </form>
                )}

                {/* STEP 2: Verify OTP */}
                {otpStep === 'verify' && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      We sent a code to <strong className="text-brand-green">{otpPhone}</strong>. Enter it below.
                    </p>
                    <div>
                      <label className="block text-[10px] tracking-widest text-neutral-500 uppercase font-semibold mb-1">6-Digit OTP</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={otpCodeInput}
                        onChange={(e) => setOtpCodeInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white border border-brand-gold/30 px-3 py-2.5 text-xs tracking-widest text-center font-bold focus:outline-none focus:border-brand-gold"
                        autoFocus
                      />
                    </div>

                    {otpError && <p className="text-xs text-brand-crimson font-medium">{otpError}</p>}
                    {otpSuccess && <p className="text-xs text-brand-green font-medium">{otpSuccess}</p>}

                    <div className="flex gap-4">
                      <button
                        type="submit"
                        disabled={otpLoading || otpCodeInput.length !== 6}
                        className="flex-1 bg-brand-green hover:bg-brand-gold text-brand-beige hover:text-brand-green font-semibold py-3 text-xs tracking-widest uppercase border border-brand-gold transition-all duration-300 disabled:opacity-50 cursor-pointer"
                      >
                        {otpLoading ? 'Verifying...' : 'Verify OTP'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setOtpStep('phone'); setOtpCodeInput(''); setOtpError(''); setOtpSuccess(''); }}
                        className="border border-neutral-300 text-neutral-600 hover:border-brand-gold hover:text-brand-green py-3 px-4 text-xs tracking-widest uppercase font-semibold transition-all cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 3: New user — collect name */}
                {otpStep === 'register' && (
                  <form onSubmit={handleCompleteRegistration} className="space-y-5">
                    <div className="bg-brand-green/5 border border-brand-green/20 px-4 py-3 rounded-sm">
                      <p className="text-[11px] text-brand-green font-semibold tracking-wide">
                        ✓ Phone verified: {otpPhone}
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-1">
                        No account found. Please enter your name to create one.
                      </p>
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-widest text-neutral-500 uppercase font-semibold mb-2">Your Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Priya Sharma"
                        value={otpName}
                        onChange={(e) => setOtpName(e.target.value)}
                        className="w-full bg-white border border-brand-gold/30 px-4 py-3 text-sm focus:outline-none focus:border-brand-gold"
                        autoFocus
                      />
                    </div>

                    {otpError && <p className="text-xs text-brand-crimson font-medium">{otpError}</p>}
                    {otpSuccess && <p className="text-xs text-brand-green font-medium">{otpSuccess}</p>}

                    <button
                      type="submit"
                      disabled={otpLoading || otpName.trim().length < 2}
                      className="w-full bg-brand-green hover:bg-brand-gold text-brand-beige hover:text-brand-green font-semibold py-3.5 text-xs tracking-widest uppercase border border-brand-gold transition-all duration-300 disabled:opacity-50 cursor-pointer"
                    >
                      {otpLoading ? 'Creating Account...' : 'Create Account & Login'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
