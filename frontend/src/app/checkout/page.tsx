'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowLeft, CreditCard, DollarSign, Gift, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/lib/api';
import { useApp } from '@/context/AppContext';

export default function Checkout() {
  const router = useRouter();
  const { cart, cartTotals, coupon, applyCoupon, removeCoupon, clearCart, user, sessionId } = useApp();

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0) {
      router.push('/shop');
    }
  }, [cart]);

  // Shipping form state
  const [shippingName, setShippingName] = useState(user?.name || '');
  const [shippingEmail, setShippingEmail] = useState(user?.email || '');
  const [shippingPhone, setShippingPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');

  // Saved Addresses functionality states
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string>('new');
  const [saveAddressToProfile, setSaveAddressToProfile] = useState<boolean>(true);


  // Payment choice
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Simulated Razorpay Modal State
  const [simulatedOrder, setSimulatedOrder] = useState<any | null>(null);
  const [isSimulatingRzp, setIsSimulatingRzp] = useState(false);

  // Successful Checkout State
  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  // OTP Verification States
  const [otpStep, setOtpStep] = useState<'details' | 'verify'>('details');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [realSmsSent, setRealSmsSent] = useState(false);
  const [otpNotification, setOtpNotification] = useState('');

  // Coupon input state
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Sync shipping inputs when user auth loads/changes
  useEffect(() => {
    if (user) {
      setShippingName(user.name || '');
      setShippingEmail(user.email || '');
      setShippingPhone(user.phone || '');
    }
  }, [user]);

  // Fetch saved addresses if logged in
  useEffect(() => {
    if (user) {
      api.getAddresses()
        .then((res) => {
          setSavedAddresses(res || []);
        })
        .catch((err) => {
          console.error("Failed to load saved addresses", err);
        });
    }
  }, [user]);

  const handleSelectSavedAddress = (addr: any) => {
    setSelectedAddrId(addr.id);
    setShippingName(addr.name || '');
    setShippingPhone(addr.phone || '');
    setAddressLine1(addr.address_line1 || '');
    setAddressLine2(addr.address_line2 || '');
    setCity(addr.city || '');
    setState(addr.state || '');
    setPostalCode(addr.postal_code || '');
    setCountry(addr.country || 'India');
  };

  const handleSelectNewAddress = () => {
    setSelectedAddrId('new');
    setShippingName(user?.name || '');
    setShippingPhone(user?.phone || '');
    setAddressLine1('');
    setAddressLine2('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry('India');
  };

  const isAddressNew = () => {
    if (!user) return false;
    return !savedAddresses.some((addr) => 
      addr.address_line1.trim().toLowerCase() === addressLine1.trim().toLowerCase() &&
      (addr.address_line2 || '').trim().toLowerCase() === (addressLine2 || '').trim().toLowerCase() &&
      addr.city.trim().toLowerCase() === city.trim().toLowerCase() &&
      addr.state.trim().toLowerCase() === state.trim().toLowerCase() &&
      addr.postal_code.trim().toLowerCase() === postalCode.trim().toLowerCase() &&
      addr.country.trim().toLowerCase() === country.trim().toLowerCase() &&
      addr.name.trim().toLowerCase() === shippingName.trim().toLowerCase() &&
      addr.phone.trim().toLowerCase() === shippingPhone.trim().toLowerCase()
    );
  };

  // Track checkout initiated for logged-in users automatically
  useEffect(() => {
    if (user && cart.length > 0 && sessionId) {
      api.trackCartState(sessionId, cart, 'checkout_initiated', user.name, user.email, shippingPhone || user.phone || '').catch(() => {});
    }
  }, [user, cart, sessionId, shippingPhone]);

  // Track checkout initiated for guest users when they land or type details
  useEffect(() => {
    if (!user && cart.length > 0 && sessionId) {
      const timer = setTimeout(() => {
        if (clientName || clientEmail || clientPhone) {
          api.trackCartState(
            sessionId,
            cart,
            'checkout_initiated',
            clientName || undefined,
            clientEmail || undefined,
            clientPhone || undefined
          ).catch(() => {});
        } else {
          api.trackCartState(sessionId, cart, 'checkout_initiated').catch(() => {});
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, cart, sessionId, clientName, clientEmail, clientPhone]);

  // Handle countdown for resending code
  useEffect(() => {
    if (otpTimer > 0) {
      const t = setTimeout(() => setOtpTimer(prev => prev - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);
    setOtpNotification('');
    try {
      const res = await api.sendOtp({
        phone: clientPhone
      });
      // Track details on OTP send!
      api.trackCartState(sessionId, cart, 'checkout_initiated', clientName, clientEmail, clientPhone).catch(() => {});
      setOtpCode(res.simulatedOtp);
      setRealSmsSent(res.realSmsSent);
      setOtpStep('verify');
      setOtpTimer(60);
      console.log("[Paree Dev Helper] OTP Code:", res.simulatedOtp);
      if (res.realSmsSent) {
        setOtpNotification('OTP sent to mobile number.');
      } else {
        setOtpNotification('OTP sent to mobile number.');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Failed to request verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setOtpError('');
    setOtpLoading(true);
    setOtpNotification('');
    try {
      const res = await api.sendOtp({
        phone: clientPhone
      });
      setOtpCode(res.simulatedOtp);
      setRealSmsSent(res.realSmsSent);
      setOtpTimer(60);
      console.log("[Paree Dev Helper] Resent OTP Code:", res.simulatedOtp);
      if (res.realSmsSent) {
        setOtpNotification('OTP sent to mobile number.');
      } else {
        setOtpNotification('OTP sent to mobile number.');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Failed to resend code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);
    try {
      const res = await api.verifyOtp({
        phone: clientPhone,
        otp: otpInput
      });
      localStorage.setItem('paree_token', res.token);
      localStorage.setItem('paree_user', JSON.stringify(res.user));
      // Reload page to re-initialize AppContext with the logged-in user
      window.location.reload();
    } catch (err: any) {
      setOtpError(err.message || 'Incorrect OTP code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const addressData = {
      name: shippingName,
      phone: shippingPhone,
      address_line1: addressLine1,
      address_line2: addressLine2,
      city,
      state,
      postal_code: postalCode,
      country
    };

    const checkoutData = {
      guestName: !user ? shippingName : undefined,
      guestEmail: !user ? shippingEmail : undefined,
      guestPhone: !user ? shippingPhone : undefined,
      items: cart.map(i => ({
        product_id: i.product_id,
        product_name: i.product_name,
        sku: i.sku,
        quantity: i.quantity,
        price: i.price,
        size: i.size,
        color: i.color
      })),
      couponCode: coupon?.code,
      shippingAddress: addressData,
      billingAddress: addressData,
      paymentMethod,
      sessionId: sessionId || undefined
    };

    try {
      if (user && saveAddressToProfile && isAddressNew()) {
        await api.createAddress({
          name: shippingName,
          phone: shippingPhone,
          address_line1: addressLine1,
          address_line2: addressLine2,
          city,
          state,
          postal_code: postalCode,
          country
        }).catch(err => console.error("Failed to auto-save checkout address:", err));
      }
      const res = await api.createOrder(checkoutData);

      if (paymentMethod === 'cod') {
        setSuccessOrder(res.order);
        clearCart();
      } else {
        // Razorpay flow
        if (res.isMockMode) {
          // Trigger offline local simulation
          setSimulatedOrder(res.order);
          setIsSimulatingRzp(true);
        } else {
          // Trigger real Razorpay SDK if scripts are loaded
          openRealRazorpay(res.order, res.razorpayKeyId);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Checkout failed. Please verify item stock and inputs.');
    } finally {
      setLoading(false);
    }
  };

  const openRealRazorpay = (order: any, keyId: string) => {
    const runRazorpay = () => {
      const options = {
        key: keyId,
        amount: order.final_amount * 100,
        currency: 'INR',
        name: 'Paree Bridal Boutique',
        description: 'Luxury Bridal Ensemble Checkout',
        order_id: order.razorpay_order_id,
        handler: async function (response: any) {
          try {
            const verifyRes = await api.verifyPayment({
              orderId: order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            if (verifyRes.success) {
              setSuccessOrder(order);
              clearCart();
            } else {
              setErrorMsg('Payment verification failed.');
            }
          } catch (err: any) {
            setErrorMsg('Error confirming transaction signature.');
          }
        },
        prefill: {
          name: shippingName,
          email: shippingEmail,
          contact: shippingPhone
        },
        theme: {
          color: '#063C21'
        }
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    };

    if ((window as any).Razorpay) {
      runRazorpay();
    } else {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = runRazorpay;
      document.body.appendChild(script);
    }
  };

  const handleSimulatePayment = async (status: 'success' | 'failure') => {
    setIsSimulatingRzp(false);
    if (!simulatedOrder) return;

    if (status === 'failure') {
      setErrorMsg('Simulated transaction was declined by the cardholder.');
      return;
    }

    setLoading(true);
    try {
      // Simulate confirmation webhook trigger
      const verifyRes = await api.verifyPayment({
        orderId: simulatedOrder.id,
        razorpayOrderId: simulatedOrder.razorpay_order_id,
        razorpayPaymentId: 'mock_pay_id_' + Math.random().toString(36).substr(2, 5)
      });

      if (verifyRes.success) {
        setSuccessOrder(simulatedOrder);
        clearCart();
      } else {
        setErrorMsg('Simulated verification failed on backend validation check.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed validating mock webhook response.');
    } finally {
      setLoading(false);
      setSimulatedOrder(null);
    }
  };



  if (successOrder) {
    return (
      <div className="flex flex-col min-h-screen bg-brand-beige">
        <Header />
        <main className="max-w-xl mx-auto w-full py-24 px-6 text-center space-y-6 flex-1">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-brand-gold p-8 rounded-sm shadow-xl space-y-4"
          >
            <CheckCircle className="text-brand-green mx-auto" size={48} />
            <h2 className="font-serif-cinzel text-xl font-bold uppercase tracking-widest text-brand-green">Order Placed Successfully</h2>
            <p className="font-serif-cormorant italic text-sm text-neutral-600">
              "Every stitch tells the story of her day. Thank you for making us part of yours."
            </p>
            <div className="bg-brand-cream/35 p-4 text-xs border border-brand-gold/10 space-y-1.5 text-left text-neutral-700">
              <p><strong>Order ID:</strong> {successOrder.id}</p>
              <p><strong>Total Amount:</strong> ₹{successOrder.final_amount?.toLocaleString('en-IN')}</p>
              <p><strong>Payment Status:</strong> {paymentMethod === 'cod' ? 'PENDING (COD)' : 'PAID (RAZORPAY)'}</p>
              <p><strong>Shipping Status:</strong> Confirmed. Custom draping initiated.</p>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => window.open(api.getInvoiceUrl(successOrder.id), '_blank')}
                className="flex-1 border border-brand-gold text-brand-green hover:bg-brand-gold hover:text-brand-green font-bold text-xs uppercase py-3.5 tracking-widest transition-all"
              >
                Download PDF Receipt
              </button>
              <button
                onClick={() => router.push('/shop')}
                className="flex-1 bg-brand-green hover:bg-brand-gold text-brand-beige hover:text-brand-green font-bold text-xs uppercase py-3.5 tracking-widest transition-all"
              >
                Continue Shop
              </button>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-brand-beige">
      <Header />

      <main className="max-w-7xl mx-auto w-full py-12 px-6 md:px-12 flex-1">
        <button
          onClick={() => router.push('/shop')}
          className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-neutral-500 hover:text-brand-gold transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Back to Catalog
        </button>

        <h1 className="font-serif-cinzel text-2xl tracking-widest text-brand-green uppercase font-bold mb-8">Secure Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Identification (OTP) or Shipping Form (7 cols) */}
          {!user ? (
            <div className="lg:col-span-7 space-y-8">
              {otpStep === 'details' ? (
                <form onSubmit={handleSendOtp} className="bg-white border border-brand-gold/15 p-8 space-y-6">
                  <div className="border-b border-brand-gold/20 pb-4">
                    <span className="text-[9px] tracking-widest text-brand-gold uppercase font-bold">Royal Atelier</span>
                    <h2 className="font-serif-cinzel text-lg font-bold text-brand-green uppercase tracking-wide mt-1">Client Identification</h2>
                    <p className="text-xs text-neutral-500 mt-1 font-light leading-relaxed">
                      Please enter your contact details to receive a secure login verification code. This helps save your order details in the system.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] tracking-widest text-neutral-500 uppercase font-semibold mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="ENTER YOUR FULL NAME"
                        className="w-full bg-brand-beige/20 border border-brand-gold/30 px-3 py-2 text-xs tracking-widest uppercase focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] tracking-widest text-neutral-500 uppercase font-semibold mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="yourname@domain.com"
                        className="w-full bg-brand-beige/20 border border-brand-gold/30 px-3 py-2 text-xs focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] tracking-widest text-neutral-500 uppercase font-semibold mb-1">Mobile Number (Receive OTP)</label>
                      <input
                        type="tel"
                        required
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full bg-brand-beige/20 border border-brand-gold/30 px-3 py-2 text-xs tracking-widest focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                  </div>

                  {otpError && <p className="text-xs text-brand-crimson font-medium">{otpError}</p>}

                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full bg-brand-green hover:bg-brand-gold text-brand-beige hover:text-brand-green font-semibold py-4 text-xs tracking-widest uppercase border border-brand-gold transition-all duration-300 disabled:opacity-50"
                  >
                    {otpLoading ? 'Generating Verification...' : 'Send Verification OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="bg-white border border-brand-gold/15 p-8 space-y-6">
                  <div className="border-b border-brand-gold/20 pb-4">
                    <span className="text-[9px] tracking-widest text-brand-gold uppercase font-bold">Secure Authentication</span>
                    <h2 className="font-serif-cinzel text-lg font-bold text-brand-green uppercase tracking-wide mt-1">Enter OTP Code</h2>
                    <p className="text-xs text-neutral-500 mt-1 font-light leading-relaxed">
                      We have sent a verification code to your mobile number <strong className="text-brand-green">{clientPhone}</strong> and email <strong className="text-brand-green">{clientEmail}</strong>.
                    </p>
                  </div>

                  {otpNotification && (
                    <div className="bg-brand-gold/10 border border-brand-gold/20 p-4 text-xs text-neutral-700 space-y-1">
                      <p className="font-semibold uppercase text-brand-green text-[9px] tracking-widest">Verification Dispatch</p>
                      <p>{otpNotification}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] tracking-widest text-neutral-500 uppercase font-semibold mb-1">Enter 6-Digit OTP</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 123456"
                      className="w-full bg-brand-beige/20 border border-brand-gold/30 px-3 py-2 text-xs tracking-widest text-center font-bold focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  {otpError && <p className="text-xs text-brand-crimson font-medium">{otpError}</p>}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      type="submit"
                      disabled={otpLoading || otpInput.length !== 6}
                      className="flex-1 bg-brand-green hover:bg-brand-gold text-brand-beige hover:text-brand-green font-semibold py-3.5 text-xs tracking-widest uppercase border border-brand-gold transition-all duration-300 disabled:opacity-50"
                    >
                      {otpLoading ? 'Verifying...' : 'Verify & Access Checkout'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setOtpStep('details')}
                      className="border border-neutral-300 text-neutral-600 hover:border-brand-gold hover:text-brand-green py-3.5 px-6 text-xs tracking-widest uppercase font-semibold transition-all"
                    >
                      Change Details
                    </button>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      disabled={otpTimer > 0 || otpLoading}
                      onClick={handleResendOtp}
                      className={`text-xs uppercase tracking-widest font-bold ${
                        otpTimer > 0 ? 'text-neutral-400 cursor-not-allowed' : 'text-brand-gold hover:text-brand-green underline'
                      }`}
                    >
                      {otpTimer > 0 ? `Resend Code in ${otpTimer}s` : 'Resend Verification Code'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleCheckoutSubmit} className="lg:col-span-7 space-y-8">
              {/* Guest / User Info */}
              <div className="bg-white border border-brand-gold/15 p-6 space-y-4">
                <h3 className="font-serif-cinzel text-xs font-bold tracking-widest text-brand-gold uppercase border-b border-brand-gold/20 pb-2">Client Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] tracking-widest text-neutral-500 uppercase font-semibold mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={shippingName}
                      onChange={(e) => { setShippingName(e.target.value); setSelectedAddrId('new'); }}
                      className="w-full bg-brand-beige/20 border border-brand-gold/30 px-3 py-2 text-xs tracking-widest uppercase focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-widest text-neutral-500 uppercase font-semibold mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      disabled
                      value={shippingEmail}
                      className="w-full bg-neutral-100 border border-brand-gold/20 px-3 py-2 text-xs text-neutral-500 focus:outline-none cursor-not-allowed"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] tracking-widest text-neutral-500 uppercase font-semibold mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={shippingPhone}
                      onChange={(e) => { setShippingPhone(e.target.value); setSelectedAddrId('new'); }}
                      className="w-full bg-brand-beige/20 border border-brand-gold/30 px-3 py-2 text-xs tracking-widest focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white border border-brand-gold/15 p-6 space-y-4">
                <h3 className="font-serif-cinzel text-xs font-bold tracking-widest text-brand-gold uppercase border-b border-brand-gold/20 pb-2">Shipping Address</h3>
                
                {user && savedAddresses.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <label className="block text-[10px] tracking-widest text-brand-gold uppercase font-bold mb-1">Select from Saved Addresses</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {savedAddresses.map((addr) => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={`p-4 border cursor-pointer text-left transition-all ${
                            selectedAddrId === addr.id
                              ? 'border-brand-green bg-brand-green/5 text-brand-green'
                              : 'border-brand-gold/20 hover:border-brand-gold/50 bg-neutral-50/50 text-neutral-800'
                          }`}
                        >
                          <p className="font-semibold text-xs tracking-wider uppercase">{addr.name}</p>
                          <p className="text-[10px] text-neutral-500 mt-1 line-clamp-2">
                            {addr.address_line1}, {addr.address_line2 ? `${addr.address_line2}, ` : ''}{addr.city}, {addr.state} - {addr.postal_code}
                          </p>
                          <p className="text-[9px] tracking-wider text-brand-gold mt-1 font-medium">{addr.phone}</p>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleSelectNewAddress()}
                        className={`p-4 border cursor-pointer text-center flex flex-col justify-center items-center transition-all ${
                          selectedAddrId === 'new'
                            ? 'border-brand-green bg-brand-green/5 text-brand-green'
                            : 'border-brand-gold/20 hover:border-brand-gold/50 bg-neutral-50/50 text-neutral-800'
                        }`}
                      >
                        <p className="font-semibold text-xs tracking-wider uppercase text-brand-green">+ Enter New Address</p>
                        <p className="text-[9px] text-neutral-400 mt-1">Provide different shipping info</p>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] tracking-widest text-neutral-500 uppercase font-semibold mb-1">Address Line 1</label>
                    <input
                      type="text"
                      required
                      placeholder="HOUSE / FLAT / SUITE NO."
                      value={addressLine1}
                      onChange={(e) => { setAddressLine1(e.target.value); setSelectedAddrId('new'); }}
                      className="w-full bg-brand-beige/20 border border-brand-gold/30 px-3 py-2 text-xs tracking-widest focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] tracking-widest text-neutral-500 uppercase font-semibold mb-1">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      placeholder="LANDMARK / REGION / STREET"
                      value={addressLine2}
                      onChange={(e) => { setAddressLine2(e.target.value); setSelectedAddrId('new'); }}
                      className="w-full bg-brand-beige/20 border border-brand-gold/30 px-3 py-2 text-xs tracking-widest focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-widest text-neutral-500 uppercase font-semibold mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => { setCity(e.target.value); setSelectedAddrId('new'); }}
                      className="w-full bg-brand-beige/20 border border-brand-gold/30 px-3 py-2 text-xs tracking-widest focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-widest text-neutral-500 uppercase font-semibold mb-1">State / Province</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => { setState(e.target.value); setSelectedAddrId('new'); }}
                      className="w-full bg-brand-beige/20 border border-brand-gold/30 px-3 py-2 text-xs tracking-widest focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-widest text-neutral-500 uppercase font-semibold mb-1">Postal Code (PIN)</label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => { setPostalCode(e.target.value); setSelectedAddrId('new'); }}
                      className="w-full bg-brand-beige/20 border border-brand-gold/30 px-3 py-2 text-xs tracking-widest focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-widest text-neutral-500 uppercase font-semibold mb-1">Country</label>
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={(e) => { setCountry(e.target.value); setSelectedAddrId('new'); }}
                      className="w-full bg-brand-beige/20 border border-brand-gold/30 px-3 py-2 text-xs tracking-widest focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                </div>

                {user && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-brand-gold/10">
                    <input
                      type="checkbox"
                      id="saveAddressToProfile"
                      checked={saveAddressToProfile}
                      onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                      className="accent-brand-green h-4 w-4"
                    />
                    <label htmlFor="saveAddressToProfile" className="text-[10px] tracking-widest text-neutral-500 uppercase font-semibold cursor-pointer select-none">
                      + Save this address for future orders
                    </label>
                  </div>
                )}
              </div>

              {/* Payment Selection */}
              <div className="bg-white border border-brand-gold/15 p-6 space-y-4">
                <h3 className="font-serif-cinzel text-xs font-bold tracking-widest text-brand-gold uppercase border-b border-brand-gold/20 pb-2">Payment Method</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-4 border flex flex-col items-center gap-2 transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-brand-green bg-brand-green/5 text-brand-green'
                        : 'border-brand-gold/30 hover:border-brand-gold text-neutral-500'
                    }`}
                  >
                    <DollarSign size={20} />
                    <span className="text-[10px] tracking-widest uppercase font-bold">Cash on Delivery</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`p-4 border flex flex-col items-center gap-2 transition-all ${
                      paymentMethod === 'razorpay'
                        ? 'border-brand-green bg-brand-green/5 text-brand-green'
                        : 'border-brand-gold/30 hover:border-brand-gold text-neutral-500'
                    }`}
                  >
                    <CreditCard size={20} />
                    <span className="text-[10px] tracking-widest uppercase font-bold">Razorpay Card/UPI</span>
                  </button>
                </div>
              </div>

              {errorMsg && <p className="text-xs text-brand-crimson font-medium">{errorMsg}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-green hover:bg-brand-gold text-brand-beige hover:text-brand-green font-semibold py-4 text-xs tracking-widest uppercase border border-brand-gold transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Processing Atelier Order...' : `Complete Order — ₹${cartTotals.final?.toLocaleString('en-IN')}`}
              </button>
            </form>
          )}

          {/* Right: Order Summary (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-brand-gold/15 p-6 h-fit space-y-6">
            <h3 className="font-serif-cinzel text-xs font-bold tracking-widest text-brand-gold uppercase border-b border-brand-gold/20 pb-2">Order Summary</h3>

            {/* Cart Items list */}
            <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={`${item.product_id}-${item.size}-${item.color}`} className="flex gap-4 border-b border-neutral-100 pb-3">
                  <div className="w-12 h-16 bg-brand-beige border border-brand-gold/15 overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 text-xs">
                    <h4 className="font-serif-cinzel font-bold text-brand-green uppercase tracking-wide line-clamp-1">{item.product_name}</h4>
                    <p className="text-[9px] text-brand-gold tracking-widest uppercase font-medium mt-0.5">Size: {item.size} | Qty: {item.quantity}</p>
                    <p className="text-neutral-500 mt-1">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon input form */}
            {!coupon ? (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setCouponError('');
                if (!couponInput.trim()) return;
                setCouponLoading(true);
                try {
                  await applyCoupon(couponInput.trim().toUpperCase());
                  setCouponInput('');
                } catch (err: any) {
                  setCouponError(err.message || 'Invalid coupon code.');
                } finally {
                  setCouponLoading(false);
                }
              }} className="flex gap-2">
                <input
                  type="text"
                  placeholder="ENTER COUPON CODE"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 bg-brand-beige/20 border border-brand-gold/30 px-3 py-2 text-[10px] tracking-widest uppercase focus:outline-none focus:border-brand-gold"
                />
                <button
                  type="submit"
                  disabled={couponLoading}
                  className="bg-brand-green hover:bg-brand-gold text-brand-beige hover:text-brand-green font-bold text-[10px] px-4 py-2 uppercase tracking-widest border border-brand-gold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between bg-brand-green/5 p-3 border border-brand-green/20 rounded-sm text-xs">
                <div className="flex items-center gap-2">
                  <Gift className="text-brand-green" size={16} />
                  <div className="text-[10px] tracking-wide text-brand-green uppercase">
                    <strong>{coupon.code}</strong> Applied successfully
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-[10px] uppercase font-bold text-brand-crimson hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}

            {couponError && <p className="text-xs text-brand-crimson font-medium">{couponError}</p>}

            {/* Financial breakdown */}
            <div className="space-y-2 text-xs border-t border-brand-gold/20 pt-4">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal</span>
                <span>₹{cartTotals.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {cartTotals.discount > 0 && (
                <div className="flex justify-between text-brand-crimson font-medium">
                  <span>Discount</span>
                  <span>- ₹{cartTotals.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-500">
                <span>GST (18%)</span>
                <span>₹{cartTotals.tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>White-Glove Shipping</span>
                <span>{cartTotals.shipping === 0 ? 'Complimentary' : `₹${cartTotals.shipping}`}</span>
              </div>
              <div className="flex justify-between border-t border-brand-gold/30 pt-3 text-sm font-bold text-brand-green">
                <span>Final Pay Amount</span>
                <span>₹{cartTotals.final.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-[10px] text-neutral-400 tracking-widest uppercase border-t border-neutral-100 pt-4 justify-center">
              <ShieldCheck size={14} className="text-brand-gold" />
              <span>SSL Protected Couture Checkout</span>
            </div>
          </div>
        </div>
      </main>

      {/* OFFLINE RAZORPAY PAYMENT SIMULATION SHEETS */}
      <AnimatePresence>
        {isSimulatingRzp && simulatedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-neutral-900/90 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white border-2 border-brand-gold shadow-2xl p-6 rounded-sm text-center"
            >
              <div className="bg-brand-green p-4 -mx-6 -mt-6 mb-6 text-white flex items-center justify-between border-b border-brand-gold">
                <span className="font-serif-cinzel tracking-widest text-xs uppercase">Razorpay Sandbox Gateway</span>
                <span className="text-[10px] tracking-wide text-brand-gold uppercase">Test Order Mode</span>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-neutral-600 leading-relaxed">
                  We detected the application is running in an offline local development sandbox environment. Simulate the secure client card signature callback below:
                </p>

                <div className="bg-brand-beige border border-brand-gold/25 p-4 rounded-sm space-y-1 text-xs text-left">
                  <p><strong>Merchant:</strong> Paree Luxury Bridal Boutique</p>
                  <p><strong>Amount:</strong> ₹{simulatedOrder.final_amount?.toLocaleString('en-IN')}</p>
                  <p><strong>Gateway ID:</strong> {simulatedOrder.razorpay_order_id}</p>
                </div>

                <div className="flex flex-col gap-2.5 pt-4">
                  <button
                    onClick={() => handleSimulatePayment('success')}
                    className="w-full bg-brand-green hover:bg-brand-gold text-brand-beige hover:text-brand-green py-3 text-xs tracking-widest uppercase font-bold border border-brand-green transition-colors"
                  >
                    Simulate Success (Complete Order)
                  </button>
                  <button
                    onClick={() => handleSimulatePayment('failure')}
                    className="w-full border border-brand-crimson text-brand-crimson hover:bg-brand-crimson/5 py-3 text-xs tracking-widest uppercase font-bold transition-colors"
                  >
                    Simulate Decline (Decline Payment)
                  </button>
                  <button
                    onClick={() => { setIsSimulatingRzp(false); setSimulatedOrder(null); }}
                    className="text-xs text-neutral-400 hover:text-neutral-600 underline"
                  >
                    Cancel Transaction
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
