'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface CartItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  price: number;
  image: string;
  size: string;
  color: string;
  category_id?: string;
  collection?: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  phone?: string;
}

interface AppContextType {
  // Auth
  user: User | null;
  token: string | null;
  authLoading: boolean;
  login: (email: string, password?: string) => Promise<any>;
  register: (name: string, email: string, password?: string, phone?: string) => Promise<any>;
  logout: () => void;
  updateUser: (updated: User) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateCartQty: (productId: string, size: string, color: string, qty: number) => void;
  clearCart: () => void;
  cartTotals: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    final: number;
  };
  coupon: any | null;
  applyCoupon: (code: string) => Promise<any>;
  removeCoupon: () => void;

  // Wishlist
  wishlist: any[];
  toggleWishlist: (product: any) => void;
  isWishlisted: (productId: string) => boolean;

  // Checkout info
  sessionId: string;
  trackCheckoutStep: (step: 'added_to_cart' | 'checkout_initiated' | 'abandoned' | 'recovered') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [coupon, setCoupon] = useState<any | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  // 1. Initial State Load
  useEffect(() => {
    // Generate or fetch Session ID for Cart Abandonment
    let sId = sessionStorage.getItem('paree_session_id');
    if (!sId) {
      sId = 'sess_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('paree_session_id', sId);
    }
    setSessionId(sId);

    // Load Cart & Wishlist
    const savedCart = localStorage.getItem('paree_cart');
    const savedWish = localStorage.getItem('paree_wishlist');
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedWish) setWishlist(JSON.parse(savedWish));

    // Load & validate stored token against the real backend
    const savedToken = localStorage.getItem('paree_token');
    const savedUser = localStorage.getItem('paree_user');
    if (savedToken && savedUser) {
      // Optimistically set user first for fast page render
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      // Then validate the token with the backend
      fetch(`http://localhost:5000/api/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
        .then(res => {
          if (res.status === 401) {
            // Token is invalid/expired/mock — clear it
            localStorage.removeItem('paree_token');
            localStorage.removeItem('paree_user');
            setToken(null);
            setUser(null);
          }
        })
        .catch(() => {
          // Backend unreachable — keep the stored session as-is
        })
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  // Save Cart to local storage & track Cart Abandonment
  useEffect(() => {
    if (authLoading) return; // Wait for initial load
    localStorage.setItem('paree_cart', JSON.stringify(cart));
    
    // Auto-track abandonment state when items are in cart
    if (sessionId) {
      if (cart.length > 0) {
        api.trackCartState(sessionId, cart, 'added_to_cart', user?.name, user?.email, user?.phone).catch(() => {});
      } else {
        // Clear abandonment state/items
        api.trackCartState(sessionId, [], 'added_to_cart').catch(() => {});
      }
    }
  }, [cart, sessionId, authLoading, user]);

  // Save Wishlist to local storage
  useEffect(() => {
    if (authLoading) return;
    localStorage.setItem('paree_wishlist', JSON.stringify(wishlist));
  }, [wishlist, authLoading]);

  // 2. Auth methods
  const login = async (email: string, password?: string) => {
    setAuthLoading(true);
    try {
      const res = await api.login({ email, password: password || 'admin123' });
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('paree_token', res.token);
      localStorage.setItem('paree_user', JSON.stringify(res.user));
      return res;
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (name: string, email: string, password?: string, phone?: string) => {
    setAuthLoading(true);
    try {
      const res = await api.register({ name, email, password: password || 'bride123', phone });
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('paree_token', res.token);
      localStorage.setItem('paree_user', JSON.stringify(res.user));
      return res;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('paree_token');
    localStorage.removeItem('paree_user');
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    localStorage.setItem('paree_user', JSON.stringify(updated));
  };

  // 3. Cart methods
  const addToCart = (item: Omit<CartItem, 'quantity'>, qty = 1) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.product_id === item.product_id && i.size === item.size && i.color === item.color);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx].quantity += qty;
        return copy;
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCart(prev => prev.filter(i => !(i.product_id === productId && i.size === size && i.color === color)));
  };

  const updateCartQty = (productId: string, size: string, color: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    setCart(prev => prev.map(i => {
      if (i.product_id === productId && i.size === size && i.color === color) {
        return { ...i, quantity: qty };
      }
      return i;
    }));
  };

  const clearCart = () => {
    setCart([]);
    setCoupon(null);
  };

  // Calculate totals
  const getTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    let discount = 0;
    if (coupon) {
      let qualifyingSubtotal = subtotal;
      let qualifies = false;

      if (!coupon.applicable_type || coupon.applicable_type === 'all') {
        qualifyingSubtotal = subtotal;
        qualifies = subtotal >= coupon.min_cart_value;
      } else if (coupon.applicable_type === 'category') {
        const categoryItems = cart
          .filter(item => item.category_id === coupon.applicable_id)
          .filter(item => !coupon.applicable_product_id || item.product_id === coupon.applicable_product_id);
        const categorySubtotal = categoryItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        qualifyingSubtotal = categorySubtotal;
        qualifies = categorySubtotal > 0 && categorySubtotal >= coupon.min_cart_value;
      } else if (coupon.applicable_type === 'collection') {
        const collectionItems = cart.filter(item => item.collection && item.collection.toLowerCase() === (coupon.applicable_id || '').toLowerCase());
        const collectionSubtotal = collectionItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        qualifyingSubtotal = collectionSubtotal;
        qualifies = collectionSubtotal > 0 && collectionSubtotal >= coupon.min_cart_value;
      } else {
        // Unknown applicability, do not qualify
        qualifies = false;
      }

      if (qualifies) {
        if (coupon.discount_type === 'percentage') {
          discount = Math.round(qualifyingSubtotal * (coupon.value / 100));
        } else {
          discount = Math.min(coupon.value, qualifyingSubtotal);
        }
      }
    }

    const taxable = Math.max(0, subtotal - discount);
    const tax = Math.round(taxable * 0.18); // 18% wedding coutures GST
    const shipping = taxable > 50000 || taxable === 0 ? 0 : 500; // Free above ₹50,000
    const final = taxable + tax + shipping;

    return { subtotal, discount, tax, shipping, final };
  };

  const applyCoupon = async (code: string) => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    try {
      const res = await api.validateCoupon(code, subtotal, cart);
      setCoupon(res);
      return res;
    } catch (err: any) {
      throw err;
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  // 4. Wishlist methods
  const toggleWishlist = (product: any) => {
    setWishlist(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      const color = product.color || (product.colors && product.colors.length > 0 ? product.colors[0] : 'Default');
      const size = product.size || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'M');
      return [...prev, { ...product, color, size }];
    });
  };

  const isWishlisted = (productId: string) => {
    return wishlist.some(p => p.id === productId);
  };

  // Manual trigger for cart abandonment tracking (e.g. checkout initiation)
  const trackCheckoutStep = (step: 'added_to_cart' | 'checkout_initiated' | 'abandoned' | 'recovered') => {
    if (sessionId) {
      api.trackCartState(sessionId, cart, step).catch(() => {});
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        authLoading,
        login,
        register,
        logout,
        updateUser,
        cart,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        cartTotals: getTotals(),
        coupon,
        applyCoupon,
        removeCoupon,
        wishlist,
        toggleWishlist,
        isWishlisted,
        sessionId,
        trackCheckoutStep
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside an AppProvider');
  return context;
};
