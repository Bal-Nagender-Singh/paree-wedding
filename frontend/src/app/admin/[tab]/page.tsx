'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingBag, FolderTree, Tag, ShoppingCart, Users, Trash2, Edit,
  Plus, X, RefreshCw, AlertTriangle, AlertCircle, FileText, CheckCircle, Search, Mail
} from 'lucide-react';
import { api } from '@/lib/api';
import { useApp } from '@/context/AppContext';

export default function AdminPanel() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { user, logout } = useApp();

  const rawTab = params?.tab as string;
  const activeTab = rawTab === 'coupon-rules' ? 'coupons' : (rawTab || 'dashboard');

  const navigateToTab = (tabName: string) => {
    router.push(`/admin/${tabName === 'coupons' ? 'coupon-rules' : tabName}`);
  };

  const [mounted, setMounted] = useState(false);

  // Protected route check
  useEffect(() => {
    const token = localStorage.getItem('paree_token');
    const u = localStorage.getItem('paree_user') ? JSON.parse(localStorage.getItem('paree_user')!) : null;
    const ADMIN_EMAIL = 'admin@paree.com';
    
    if (!token || !u || u.role !== 'admin' || u.email !== ADMIN_EMAIL) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('open_auth_drawer', 'true');
      }
      router.push('/');
    } else {
      setMounted(true);
    }
  }, [user]);

  // Fetch Dashboard Stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: api.getDashboardStats,
    enabled: mounted
  });

  // Fetch Products
  const { data: productsData, isLoading: prodsLoading, refetch: refetchProds } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => api.getProducts({ limit: 100 }),
    enabled: mounted
  });

  // Fetch Categories
  const { data: categories = [], refetch: refetchCats } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: api.getCategories,
    enabled: mounted
  });

  // Fetch Coupons
  const { data: coupons = [], refetch: refetchCoupons } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: api.getCoupons,
    enabled: mounted
  });

  // Fetch Users
  const { data: userAccounts = [], refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: api.getUsers,
    enabled: mounted
  });

  // Fetch Real Database Orders
  const { data: adminOrders = [], isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['admin-orders-list'],
    queryFn: api.getAdminOrders,
    enabled: mounted
  });


  const productsList = productsData?.products || [];
  const metrics = stats?.metrics || {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    cartAbandonmentRate: 0,
    conversionRate: 0,
    lostRevenue: 0,
    abandonedCount: 0
  };
  const charts = stats?.charts || { salesTimeline: [], topCategories: [], topProducts: [] };
  const abandonedSessions = stats?.abandonedSessions || [];

  // Form configurations
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodSub, setProdSub] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodSale, setProdSale] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodFabric, setProdFabric] = useState('');
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [prodSizes, setProdSizes] = useState<string[]>([]);
  const [prodSizeInput, setProdSizeInput] = useState('');
  const [prodColors, setProdColors] = useState<string[]>([]);
  const [prodColorInput, setProdColorInput] = useState('');
  const [prodColorImages, setProdColorImages] = useState<Record<string, string[]>>({});
  const [prodColorStock, setProdColorStock] = useState<Record<string, number>>({});
  const [prodColorSizes, setProdColorSizes] = useState<Record<string, string[]>>({});  // sizes per color
  const [imgInput, setImgInput] = useState('');

  // Category Form
  const [catName, setCatName] = useState('');
  const [catImage, setCatImage] = useState('');
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  // Coupon Form
  const [cpnCode, setCpnCode] = useState('');
  const [cpnType, setCpnType] = useState<'percentage' | 'flat'>('percentage');
  const [cpnValue, setCpnValue] = useState('');
  const [cpnMin, setCpnMin] = useState('');
  const [cpnApplicableType, setCpnApplicableType] = useState<'all' | 'category'>('all');
  const [cpnApplicableId, setCpnApplicableId] = useState('');
  const [cpnApplicableProductId, setCpnApplicableProductId] = useState('');

  const handleCouponTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextType = e.target.value as 'percentage' | 'flat';
    setCpnType(nextType);
    if (nextType === 'percentage' && cpnValue && parseFloat(cpnValue) >= 100) {
      setCpnValue('');
    }
  };

  const handleCouponValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    if (nextValue === '') {
      setCpnValue('');
      return;
    }

    const numericValue = parseFloat(nextValue);
    if (Number.isNaN(numericValue)) return;

    if (cpnType === 'percentage' && numericValue >= 100) {
      setCpnValue('99.99');
      return;
    }

    setCpnValue(nextValue);
  };

  // Derived state: active display coupon IDs from backend coupon list
  const displayCouponIds = (coupons as any[]).filter((c: any) => c.display_on_site).map((c: any) => c.id);

  // Search queries
  const [prodSearch, setProdSearch] = useState('');

  const getDefaultColorImages = (colors: string[], images: string[] = []) => (
    colors.reduce((acc, color, index) => {
      acc[color] = index === 0 ? images : [];
      return acc;
    }, {} as Record<string, string[]>)
  );

  const handleAddProductColor = () => {
    const color = prodColorInput.trim();
    if (!color || prodColors.some((existing) => existing.toLowerCase() === color.toLowerCase())) return;
    setProdColors((prev) => [...prev, color]);
    setProdColorImages((prev) => ({ ...prev, [color]: [] }));
    setProdColorStock((prev) => ({ ...prev, [color]: 0 }));
    setProdColorSizes((prev) => ({ ...prev, [color]: [] }));
    setProdColorInput('');
  };

  const handleRemoveProductColor = (color: string) => {
    setProdColors((prev) => prev.filter((item) => item !== color));
    setProdColorImages((prev) => {
      const next = { ...prev };
      delete next[color];
      return next;
    });
    setProdColorStock((prev) => {
      const next = { ...prev };
      delete next[color];
      return next;
    });
    setProdColorSizes((prev) => {
      const next = { ...prev };
      delete next[color];
      return next;
    });
  };

  const handleColorImageUpload = (color: string, files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProdColorImages((prev) => ({
          ...prev,
          [color]: [...(prev[color] || []), reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveColorImage = (color: string, index: number) => {
    setProdColorImages((prev) => ({
      ...prev,
      [color]: (prev[color] || []).filter((_, imgIndex) => imgIndex !== index)
    }));
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdSku('');
    setProdCategory(categories[0]?.id || '');
    setProdSub('Royal Collection');
    setProdDesc('');
    setProdPrice('');
    setProdSale('');
    setProdStock('');
    setProdFabric('Raw Silk');
    setProdImages([]);
    setProdSizes([]);
    setProdSizeInput('');
    setProdColors([]);
    setProdColorInput('');
    setProdColorImages({});
    setProdColorStock({});
    setProdColorSizes({});
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: any) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdSku(p.sku);
    setProdCategory(p.category_id);
    setProdSub(p.sub_category || '');
    setProdDesc(p.description);
    setProdPrice(String(p.price));
    setProdSale(String(p.sale_price || ''));
    setProdStock(String(p.stock));
    setProdFabric(p.fabric || '');
    setProdImages(p.images || []);
    setProdSizes(p.sizes || []);
    setProdSizeInput('');
    const colors = p.colors?.length ? p.colors : [];
    setProdColors(colors);
    setProdColorInput('');
    setProdColorImages(p.color_images || getDefaultColorImages(colors, p.images || []));
    setProdColorStock(p.color_stock || {});
    // Build per-color sizes from saved color_sizes, fallback to global sizes
    const savedColorSizes = p.color_sizes || {};
    const colorSizesInit: Record<string, string[]> = {};
    colors.forEach((c: string) => {
      colorSizesInit[c] = savedColorSizes[c] || p.sizes || [];
    });
    setProdColorSizes(colorSizesInit);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeColors = prodColors.filter((color) => color.trim());
    const colorImages = activeColors.reduce((acc, color) => {
      acc[color] = prodColorImages[color] || [];
      return acc;
    }, {} as Record<string, string[]>);
    const galleryImages = Object.values(colorImages).flat();
    const fallbackImages = galleryImages.length > 0 ? galleryImages : prodImages;

    // Build color_sizes: sizes available per color
    const colorSizes = activeColors.reduce((acc, color) => {
      acc[color] = prodColorSizes[color] || prodSizes;
      return acc;
    }, {} as Record<string, string[]>);

    const colorStock = activeColors.reduce((acc, color) => {
      const selectedSizes = prodColorSizes[color] || [];
      selectedSizes.forEach((sz) => {
        const key = `${color}-${sz}`;
        acc[key] = prodColorStock[key] ?? 0;
      });
      return acc;
    }, {} as Record<string, number>);

    const totalStock = Object.values(colorStock).reduce((sum, qty) => sum + qty, 0);

    // Global sizes = union of all color sizes (or the direct prodSizes if no colors)
    const allSizes = activeColors.length > 0
      ? [...new Set(Object.values(colorSizes).flat())]
      : prodSizes;

    const payload = {
      name: prodName,
      sku: prodSku,
      category_id: prodCategory,
      sub_category: prodSub,
      description: prodDesc,
      price: parseFloat(prodPrice),
      sale_price: prodSale ? parseFloat(prodSale) : null,
      stock: activeColors.length > 0 ? totalStock : (parseInt(prodStock, 10) || 0),
      fabric: prodFabric,
      images: fallbackImages,
      color_images: colorImages,
      color_stock: colorStock,
      color_sizes: colorSizes,
      sizes: allSizes.length > 0 ? allSizes : ['S', 'M', 'L'],
      colors: activeColors
    };

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
      } else {
        await api.createProduct(payload);
      }
      setIsProductModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      refetchStats();
    } catch (err: any) {
      alert(err.message || 'Error saving product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this design?')) {
      await api.deleteProduct(id);
      refetchProds();
      refetchStats();
    }
  };

  const handleToggleFlag = async (product: any, flag: 'is_bestseller' | 'is_premium') => {
    await api.updateProduct(product.id, { [flag]: !product[flag] });
    refetchProds();
    queryClient.invalidateQueries({ queryKey: ['featured-products'] });
    queryClient.invalidateQueries({ queryKey: ['bestseller-products'] });
    queryClient.invalidateQueries({ queryKey: ['premium-products'] });
  };

  const handleOpenEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatImage(cat.image || '');
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (catName.trim()) {
      try {
        if (editingCategory) {
          await api.updateCategory(editingCategory.id, {
            name: catName,
            image: catImage.trim() || 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&q=80&w=600'
          });
          setEditingCategory(null);
        } else {
          await api.createCategory({
            name: catName,
            image: catImage.trim() || 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&q=80&w=600'
          });
        }
        setCatName('');
        setCatImage('');
        refetchCats();
      } catch (err: any) {
        const msg = err?.message || 'Failed to save category';
        if (msg.includes('401') || msg.toLowerCase().includes('token') || msg.toLowerCase().includes('authorization')) {
          alert('Session expired or invalid. Please log out and log back in with your admin credentials (admin@paree.com / admin123).');
        } else {
          alert(msg);
        }
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        await api.deleteCategory(id);
        refetchCats();
      } catch (err: any) {
        alert(err?.message || 'Failed to delete category');
      }
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cpnCode.trim() && cpnValue) {
      const discountValue = parseFloat(cpnValue);
      if (cpnType === 'percentage' && (discountValue <= 0 || discountValue >= 100)) {
        alert('Percentage discount must be greater than 0 and below 100');
        return;
      }
      if (cpnType === 'flat' && discountValue <= 0) {
        alert('Flat discount value must be greater than 0');
        return;
      }
      if (cpnApplicableType === 'category' && !cpnApplicableId) {
        alert('Please select a category');
        return;
      }
      try {
        await api.createCoupon({
          code: cpnCode.toUpperCase(),
          discount_type: cpnType,
          value: discountValue,
          min_cart_value: parseFloat(cpnMin || '0'),
          applicable_type: cpnApplicableType,
          applicable_id: cpnApplicableType === 'all' ? null : cpnApplicableId,
          applicable_product_id: cpnApplicableProductId || null,
          display_on_site: false
        });
        setCpnCode('');
        setCpnValue('');
        setCpnMin('');
        setCpnApplicableType('all');
        setCpnApplicableId('');
        setCpnApplicableProductId('');
        refetchCoupons();
        queryClient.invalidateQueries({ queryKey: ['active-coupons'] });
      } catch (err: any) {
        alert(err.message || 'Error creating coupon');
      }
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      try {
        await api.deleteCoupon(id);
        refetchCoupons();
        queryClient.invalidateQueries({ queryKey: ['active-coupons'] });
      } catch (err: any) {
        alert(err.message || 'Error deleting coupon');
      }
    }
  };

  const handleSetDisplayCoupon = async (cpn: any) => {
    try {
      await api.updateCoupon(cpn.id, { display_on_site: !cpn.display_on_site });
      refetchCoupons();
      queryClient.invalidateQueries({ queryKey: ['active-coupons'] });
    } catch (err: any) {
      alert(err.message || 'Error toggling coupon display');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    await api.updateOrderStatus(orderId, status);
    queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    refetchStats();
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to remove this user profile?')) {
      await api.deleteUser(id);
      refetchUsers();
    }
  };

  const handleDeleteAbandonedSession = async (id: string) => {
    if (confirm('Remove this abandoned cart session? This action cannot be undone.')) {
      try {
        // Optimistically update the react-query cache for instant UI feedback
        queryClient.setQueryData(['admin-stats'], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            abandonedSessions: oldData.abandonedSessions.filter((s: any) => s.id !== id)
          };
        });
        await api.deleteAbandonedSession(id);
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      } catch (err: any) {
        alert(err.message || 'Error deleting session');
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      }
    }
  };

  // Filter products by search input
  const filteredProducts = productsList.filter(
    (p: any) =>
      p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(prodSearch.toLowerCase())
  );

  const COLORS = ['#063C21', '#c5a880', '#58111A', '#e6dfd5', '#FF8042'];

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-brand-beige">
      <header className="w-full bg-brand-green text-brand-beige px-6 md:px-12 py-4 flex items-center justify-between border-b border-brand-gold/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-brand-gold bg-white flex items-center justify-center p-0.5">
            <img src="/logo.jpg" alt="Paree Logo" className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif-cinzel text-lg font-bold tracking-widest uppercase">Paree Admin Control</span>
            <span className="font-serif-cormorant italic text-[9px] tracking-wider text-brand-gold -mt-0.5">Royal Atelier Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs uppercase tracking-widest font-semibold text-brand-beige">
          <span className="text-brand-gold hidden sm:inline">{user?.email}</span>
          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="border border-brand-gold/45 px-3 py-1.5 hover:bg-brand-gold hover:text-brand-green transition-colors font-bold text-[10px]"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full py-12 px-6 md:px-12 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Admin Navigation Sidebar (3 cols) */}
          <div className="lg:col-span-3 bg-white border border-brand-gold/15 p-6 h-fit space-y-6">
            <div className="text-center sm:text-left space-y-1">
              <span className="text-[9px] tracking-widest text-brand-gold uppercase font-bold">Royal Atelier</span>
              <h2 className="font-serif-cinzel text-md font-bold text-brand-green uppercase tracking-wide">Paree Admin Control</h2>
            </div>

            <hr className="border-brand-gold/15" />

            <div className="flex flex-row lg:flex-col flex-wrap gap-2 text-xs uppercase tracking-widest font-semibold text-neutral-500">
              <button
                onClick={() => { navigateToTab('dashboard'); refetchStats(); }}
                className={`flex items-center gap-2 px-3 py-2 w-full text-left rounded-sm transition-all ${
                  activeTab === 'dashboard' ? 'bg-brand-green text-brand-beige font-bold border-l-2 border-brand-gold' : 'hover:text-brand-green hover:bg-brand-green/5'
                }`}
              >
                <LayoutDashboard size={14} /> Analytics Dashboard
              </button>

              <button
                onClick={() => { navigateToTab('products'); refetchProds(); }}
                className={`flex items-center gap-2 px-3 py-2 w-full text-left rounded-sm transition-all ${
                  activeTab === 'products' ? 'bg-brand-green text-brand-beige font-bold border-l-2 border-brand-gold' : 'hover:text-brand-green hover:bg-brand-green/5'
                }`}
              >
                <ShoppingBag size={14} /> Product Catalog
              </button>

              <button
                onClick={() => { navigateToTab('categories'); refetchCats(); }}
                className={`flex items-center gap-2 px-3 py-2 w-full text-left rounded-sm transition-all ${
                  activeTab === 'categories' ? 'bg-brand-green text-brand-beige font-bold border-l-2 border-brand-gold' : 'hover:text-brand-green hover:bg-brand-green/5'
                }`}
              >
                <FolderTree size={14} /> Category Management
              </button>

              <button
                onClick={() => { navigateToTab('coupons'); refetchCoupons(); }}
                className={`flex items-center gap-2 px-3 py-2 w-full text-left rounded-sm transition-all ${
                  activeTab === 'coupons' ? 'bg-brand-green text-brand-beige font-bold border-l-2 border-brand-gold' : 'hover:text-brand-green hover:bg-brand-green/5'
                }`}
              >
                <Tag size={14} /> Coupon Rules
              </button>

              <button
                onClick={() => { navigateToTab('orders'); refetchOrders(); }}
                className={`flex items-center gap-2 px-3 py-2 w-full text-left rounded-sm transition-all ${
                  activeTab === 'orders' ? 'bg-brand-green text-brand-beige font-bold border-l-2 border-brand-gold' : 'hover:text-brand-green hover:bg-brand-green/5'
                }`}
              >
                <ShoppingCart size={14} /> Orders Management
              </button>

              <button
                onClick={() => { navigateToTab('users'); refetchUsers(); }}
                className={`flex items-center gap-2 px-3 py-2 w-full text-left rounded-sm transition-all ${
                  activeTab === 'users' ? 'bg-brand-green text-brand-beige font-bold border-l-2 border-brand-gold' : 'hover:text-brand-green hover:bg-brand-green/5'
                }`}
              >
                <Users size={14} /> User Accounts
              </button>

              <button
                onClick={() => { navigateToTab('abandonment'); refetchStats(); }}
                className={`flex items-center gap-2 px-3 py-2 w-full text-left rounded-sm transition-all ${
                  activeTab === 'abandonment' ? 'bg-brand-green text-brand-beige font-bold border-l-2 border-brand-gold' : 'hover:text-brand-green hover:bg-brand-green/5'
                }`}
              >
                <AlertCircle size={14} /> Cart Abandonment
              </button>
            </div>
          </div>

          {/* Admin Panels View (9 cols) */}
          <div className="lg:col-span-9 bg-white border border-brand-gold/15 p-6 md:p-8 min-h-[600px]">
            
            {/* 1. DASHBOARD ANALYTICS PANEL */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center border-b border-brand-gold/20 pb-2">
                  <h3 className="font-serif-cinzel text-sm font-bold tracking-widest text-brand-gold uppercase">Analytics Insights</h3>
                  <button onClick={() => refetchStats()} className="p-1 text-brand-green hover:text-brand-gold transition-colors">
                    <RefreshCw size={14} />
                  </button>
                </div>

                {statsLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-20 bg-neutral-100" />
                      <div className="h-20 bg-neutral-100" />
                      <div className="h-20 bg-neutral-100" />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="border border-brand-gold/15 p-4 rounded-sm bg-brand-beige/15 text-center">
                        <span className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold mb-1">Total Revenue</span>
                        <span className="font-serif-cinzel text-lg sm:text-xl font-bold text-brand-green">₹{metrics.totalRevenue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="border border-brand-gold/15 p-4 rounded-sm bg-brand-beige/15 text-center">
                        <span className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold mb-1">Total Orders</span>
                        <span className="font-serif-cinzel text-lg sm:text-xl font-bold text-brand-green">{metrics.totalOrders}</span>
                      </div>
                      <div className="border border-brand-gold/15 p-4 rounded-sm bg-brand-beige/15 text-center">
                        <span className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold mb-1">Avg Order Value</span>
                        <span className="font-serif-cinzel text-lg sm:text-xl font-bold text-brand-green">₹{metrics.averageOrderValue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="border border-brand-gold/15 p-4 rounded-sm bg-brand-beige/15 text-center">
                        <span className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold mb-1">Conversion Rate</span>
                        <span className="font-serif-cinzel text-lg sm:text-xl font-bold text-brand-green">{metrics.conversionRate}%</span>
                      </div>
                      <div className="border border-brand-gold/15 p-4 rounded-sm bg-brand-beige/15 text-center">
                        <span className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold mb-1">Abandonment Rate</span>
                        <span className="font-serif-cinzel text-lg sm:text-xl font-bold text-brand-crimson">{metrics.cartAbandonmentRate}%</span>
                      </div>
                      <div className="border border-brand-gold/15 p-4 rounded-sm bg-brand-crimson/5 text-center">
                        <span className="text-[9px] text-brand-crimson uppercase tracking-widest block font-bold mb-1">Lost Revenue</span>
                        <span className="font-serif-cinzel text-lg sm:text-xl font-bold text-brand-crimson">₹{metrics.lostRevenue.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Timelines and Pie chart split */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                      
                      {/* Area Chart: Revenue Trend */}
                      <div className="border border-brand-gold/15 p-4 bg-white space-y-4">
                        <h4 className="font-serif-cinzel text-[10px] tracking-widest text-brand-gold uppercase font-bold">Revenue Timeline</h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={charts.salesTimeline}>
                              <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#063C21" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#063C21" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="date" stroke="#c5a880" fontSize={10} tickLine={false} />
                              <YAxis stroke="#c5a880" fontSize={10} tickLine={false} />
                              <Tooltip formatter={(value) => [`₹${value ? Number(value).toLocaleString() : '0'}`, 'Revenue']} />
                              <Area type="monotone" dataKey="revenue" stroke="#063C21" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Pie Chart: Categories distribution */}
                      <div className="border border-brand-gold/15 p-4 bg-white space-y-4">
                        <h4 className="font-serif-cinzel text-[10px] tracking-widest text-brand-gold uppercase font-bold">Category Distribution</h4>
                        <div className="h-64 flex flex-col justify-center items-center">
                          {charts.topCategories.length === 0 ? (
                            <p className="text-xs text-neutral-400 italic">No sales logs to display splits.</p>
                          ) : (
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={charts.topCategories}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {charts.topCategories.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`₹${value ? Number(value).toLocaleString() : '0'}`, 'Sales']} />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                          <div className="flex flex-wrap justify-center gap-3 text-[9px] uppercase tracking-widest font-bold mt-2">
                            {charts.topCategories.map((c: any, i: number) => (
                              <span key={`${c.name}-${i}`} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                {c.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  </>
                )}
              </div>
            )}

            {/* 2. PRODUCT CATALOG MANAGEMENT PANEL */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gold/20 pb-4">
                  <h3 className="font-serif-cinzel text-sm font-bold tracking-widest text-brand-gold uppercase">Garment Collection</h3>
                  <button
                    onClick={handleOpenAddProduct}
                    className="bg-brand-green hover:bg-brand-gold text-brand-beige hover:text-brand-green font-bold text-xs uppercase tracking-widest px-4 py-2 flex items-center gap-1 border border-brand-green transition-all"
                  >
                    <Plus size={14} /> Add Design
                  </button>
                </div>

                {/* Inventory Alerts Indicators */}
                <div className="flex flex-wrap gap-4 text-xs">
                  {productsList.some((p: any) => p.stock === 0) && (
                    <span className="flex items-center gap-1.5 text-brand-crimson bg-brand-crimson/5 px-2.5 py-1 border border-brand-crimson/20 rounded-sm uppercase tracking-wider font-bold">
                      <AlertTriangle size={14} /> Out of stock items detected
                    </span>
                  )}
                  {productsList.some((p: any) => p.stock > 0 && p.stock <= 3) && (
                    <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 border border-amber-200 rounded-sm uppercase tracking-wider font-bold">
                      <AlertCircle size={14} /> Low stock items detected
                    </span>
                  )}
                </div>

                {/* Search Bar */}
                <div className="flex border border-brand-gold/30 px-3 py-2 text-xs uppercase bg-white max-w-sm rounded-sm">
                  <Search size={14} className="text-brand-gold mr-2 self-center" />
                  <input
                    type="text"
                    placeholder="Search by Design Name or SKU..."
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    className="bg-transparent border-none focus:outline-none w-full uppercase"
                  />
                </div>

                {prodsLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-neutral-100" />
                    <div className="h-10 bg-neutral-100" />
                  </div>
                ) : (
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-brand-green text-brand-beige font-serif-cinzel uppercase">
                          <th className="p-3 border border-brand-gold/20 text-left">Product</th>
                          <th className="p-3 border border-brand-gold/20 text-left">Category</th>
                          <th className="p-3 border border-brand-gold/20 text-left">SKU</th>
                          <th className="p-3 border border-brand-gold/20 text-right">Price</th>
                          <th className="p-3 border border-brand-gold/20 text-center">Stock</th>
                          <th className="p-3 border border-brand-gold/20 text-center">Best Selling</th>
                          <th className="p-3 border border-brand-gold/20 text-center">Premium</th>
                          <th className="p-3 border border-brand-gold/20 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((p: any) => (
                          <tr key={p.id} className="hover:bg-brand-beige/10">
                            <td className="p-3 border border-brand-gold/10 flex items-center gap-3">
                              <img src={p.images?.[0]} className="w-8 h-10 object-cover border" />
                              <div>
                                <span className="font-bold text-brand-green block uppercase tracking-wide">{p.name}</span>
                                <span className="text-[10px] text-neutral-400 block">{p.fabric}</span>
                              </div>
                            </td>
                            <td className="p-3 border border-brand-gold/10">
                              <span className="text-[10px] font-semibold text-brand-gold uppercase tracking-wider">
                                {(categories as any[]).find((c: any) => c.id === p.category_id)?.name || '—'}
                              </span>
                            </td>
                            <td className="p-3 border border-brand-gold/10 uppercase font-mono">{p.sku}</td>
                            <td className="p-3 border border-brand-gold/10 text-right font-semibold">₹{p.price.toLocaleString('en-IN')}</td>
                            <td className="p-3 border border-brand-gold/10 text-center font-bold">
                              {p.stock === 0 ? (
                                <span className="text-brand-crimson bg-brand-crimson/10 px-2 py-0.5 rounded-sm">OUT</span>
                              ) : p.stock <= 3 ? (
                                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-sm">LOW ({p.stock})</span>
                              ) : (
                                <span className="text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-sm">{p.stock}</span>
                              )}
                            </td>
                            <td className="p-3 border border-brand-gold/10 text-center">
                              <button
                                onClick={() => handleToggleFlag(p, 'is_bestseller')}
                                title={p.is_bestseller ? 'Remove from Best Selling' : 'Add to Best Selling'}
                                className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded-sm border transition-all ${
                                  p.is_bestseller
                                    ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                                    : 'bg-transparent text-neutral-400 border-neutral-200 hover:border-amber-400 hover:text-amber-500'
                                }`}
                              >
                                {p.is_bestseller ? '★ On' : '☆ Off'}
                              </button>
                            </td>
                            <td className="p-3 border border-brand-gold/10 text-center">
                              <button
                                onClick={() => handleToggleFlag(p, 'is_premium')}
                                title={p.is_premium ? 'Remove from Premium' : 'Add to Premium'}
                                className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded-sm border transition-all ${
                                  p.is_premium
                                    ? 'bg-brand-gold text-brand-green border-brand-gold hover:bg-brand-gold-hover'
                                    : 'bg-transparent text-neutral-400 border-neutral-200 hover:border-brand-gold hover:text-brand-gold'
                                }`}
                              >
                                {p.is_premium ? '◆ On' : '◇ Off'}
                              </button>
                            </td>
                            <td className="p-3 border border-brand-gold/10 text-center space-x-2">
                              <button onClick={() => handleOpenEditProduct(p)} className="p-1 text-brand-green hover:text-brand-gold transition-colors">
                                <Edit size={14} />
                              </button>
                              <button onClick={() => handleDeleteProduct(p.id)} className="p-1 text-neutral-400 hover:text-brand-crimson transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 3. CATEGORY MANAGEMENT PANEL */}
            {activeTab === 'categories' && (
              <div className="space-y-6">
                <h3 className="font-serif-cinzel text-sm font-bold tracking-widest text-brand-gold uppercase border-b border-brand-gold/20 pb-2">Category Structure</h3>

                {/* Add Category Form */}
                <form onSubmit={handleAddCategory} className="bg-brand-cream/10 border border-brand-gold/15 p-4 rounded-sm text-xs space-y-3 max-w-md">
                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-[9px] uppercase tracking-widest text-neutral-500 mb-1">Category Name</label>
                      <input
                        type="text"
                        required
                        placeholder="New Category Name (e.g. Silk Sarees)"
                        value={catName}
                        onChange={(e) => setCatName(e.target.value)}
                        className="w-full bg-white border border-brand-gold/30 px-3 py-2 text-xs tracking-widest uppercase focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[9px] uppercase tracking-widest text-neutral-500 mb-1">Cover Image</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setCatImage(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full bg-white border border-brand-gold/30 px-3 py-1.5 text-xs tracking-widest focus:outline-none focus:border-brand-gold file:mr-4 file:py-1 file:px-3 file:border-0 file:text-[10px] file:font-semibold file:bg-brand-green file:text-brand-beige hover:file:bg-brand-gold hover:file:text-brand-green file:cursor-pointer"
                        />
                        {catImage && (
                          <img src={catImage} className="w-8 h-8 object-cover border border-brand-gold/20" alt="Preview" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-brand-green hover:bg-brand-gold hover:text-brand-green text-brand-beige font-semibold py-2.5 text-xs tracking-widest uppercase border border-brand-gold transition-colors">
                      {editingCategory ? 'Save Changes' : 'Add Category'}
                    </button>
                    {editingCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(null);
                          setCatName('');
                          setCatImage('');
                        }}
                        className="bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold py-2.5 px-4 text-xs tracking-widest uppercase border border-neutral-300 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                <div className="space-y-3 max-w-md">
                  {categories.map((cat: any) => (
                    <div key={cat.id} className="flex justify-between items-center bg-brand-beige/5 border border-brand-gold/15 p-3 rounded-sm text-xs">
                      <div className="flex items-center gap-3">
                        {cat.image && (
                          <img src={cat.image} className="w-10 h-10 object-cover border border-brand-gold/20" alt={cat.name} />
                        )}
                        <div>
                          <span className="font-bold text-brand-green uppercase tracking-wide block">{cat.name}</span>
                          <span className="text-[10px] text-neutral-400 block font-mono">slug: {cat.slug}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenEditCategory(cat)} className="text-brand-green hover:text-brand-gold p-1" title="Edit Category">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-neutral-400 hover:text-brand-crimson p-1" title="Delete Category">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. COUPONS PANEL */}
            {activeTab === 'coupons' && (
              <div className="space-y-6">
                <h3 className="font-serif-cinzel text-sm font-bold tracking-widest text-brand-gold uppercase border-b border-brand-gold/20 pb-2">Coupons Configuration</h3>

                {/* Add Coupon Form */}
                <form onSubmit={handleAddCoupon} className="bg-brand-cream/20 border border-brand-gold/15 p-4 rounded-sm text-xs space-y-4 max-w-md">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[9px] uppercase tracking-widest text-neutral-500 mb-1">Coupon Code</label>
                      <input
                        type="text"
                        required
                        placeholder="WELCOME15"
                        value={cpnCode}
                        onChange={(e) => setCpnCode(e.target.value)}
                        className="w-full bg-white border border-brand-gold/30 px-3 py-1.5 uppercase focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[9px] uppercase tracking-widest text-neutral-500 mb-1">Discount Type</label>
                      <select
                        value={cpnType}
                        onChange={handleCouponTypeChange}
                        className="w-full bg-white border border-brand-gold/30 px-3 py-1.5 focus:outline-none font-semibold uppercase"
                      >
                        <option value="percentage">Percentage %</option>
                        <option value="flat">Flat ₹</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-[9px] uppercase tracking-widest text-neutral-500 mb-1">
                        Discount Value ({cpnType === 'percentage' ? '%' : '₹'})
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max={cpnType === 'percentage' ? 99.99 : undefined}
                        placeholder={cpnType === 'percentage' ? 'e.g. 10' : 'e.g. 2000'}
                        value={cpnValue}
                        onChange={handleCouponValueChange}
                        className="w-full bg-white border border-brand-gold/30 px-3 py-1.5 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[9px] uppercase tracking-widest text-neutral-500 mb-1">Min Spend (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 5000"
                        value={cpnMin}
                        onChange={(e) => setCpnMin(e.target.value)}
                        className="w-full bg-white border border-brand-gold/30 px-3 py-1.5 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Applicability configuration */}
                  <div className="space-y-3 border-t border-brand-gold/15 pt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-[9px] uppercase tracking-widest text-neutral-500 mb-1">Applicable To</label>
                        <select
                          value={cpnApplicableType}
                          onChange={(e: any) => {
                            setCpnApplicableType(e.target.value);
                            setCpnApplicableId('');
                            setCpnApplicableProductId('');
                          }}
                          className="w-full bg-white border border-brand-gold/30 px-3 py-1.5 focus:outline-none font-semibold uppercase"
                        >
                          <option value="all">All Products</option>
                          <option value="category">Specific Category</option>
                        </select>
                      </div>

                      {cpnApplicableType === 'category' && (
                        <div>
                          <label className="block font-bold text-[9px] uppercase tracking-widest text-neutral-500 mb-1">Select Category</label>
                          <select
                            required
                            value={cpnApplicableId}
                            onChange={(e) => {
                              setCpnApplicableId(e.target.value);
                              setCpnApplicableProductId('');
                            }}
                            className="w-full bg-white border border-brand-gold/30 px-3 py-1.5 focus:outline-none font-semibold uppercase"
                          >
                            <option value="">-- Choose Category --</option>
                            {categories.map((c: any) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Product picker — shown when a category is selected */}
                    {cpnApplicableType === 'category' && cpnApplicableId && (() => {
                      const catProducts = productsList.filter((p: any) => p.category_id === cpnApplicableId);
                      return catProducts.length > 0 ? (
                        <div>
                          <label className="block font-bold text-[9px] uppercase tracking-widest text-neutral-500 mb-1">
                            Specific Product in Category{' '}
                            <span className="text-brand-gold/70 normal-case font-normal">(optional — leave blank to apply to whole category)</span>
                          </label>
                          <div className="border border-brand-gold/20 rounded-sm bg-white max-h-40 overflow-y-auto divide-y divide-brand-gold/10">
                            {/* 'All in category' option */}
                            <label className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-brand-gold/5 transition-colors ${
                              cpnApplicableProductId === '' ? 'bg-brand-green/5' : ''
                            }`}>
                              <input
                                type="radio"
                                name="cpn-product"
                                value=""
                                checked={cpnApplicableProductId === ''}
                                onChange={() => setCpnApplicableProductId('')}
                                className="accent-brand-green"
                              />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-green">All products in category</span>
                            </label>
                            {catProducts.map((p: any) => (
                              <label key={p.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-brand-gold/5 transition-colors ${
                                cpnApplicableProductId === p.id ? 'bg-brand-green/5' : ''
                              }`}>
                                <input
                                  type="radio"
                                  name="cpn-product"
                                  value={p.id}
                                  checked={cpnApplicableProductId === p.id}
                                  onChange={() => setCpnApplicableProductId(p.id)}
                                  className="accent-brand-green"
                                />
                                <img src={p.images?.[0]} className="w-7 h-8 object-cover border border-brand-gold/20 flex-shrink-0" alt="" />
                                <div className="min-w-0">
                                  <span className="block font-semibold text-brand-green uppercase tracking-wide truncate">{p.name}</span>
                                  <span className="block text-[9px] text-neutral-400 font-mono">ID: {p.id}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-neutral-400 italic">No products found in this category.</p>
                      );
                    })()}
                  </div>

                  <button type="submit" className="w-full bg-brand-green hover:bg-brand-gold text-brand-beige hover:text-brand-green font-semibold py-2.5 uppercase tracking-widest font-bold border border-brand-green transition-colors">
                    Create Coupon
                  </button>
                </form>

                {/* Stored Coupons List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(coupons as any[]).map((cpn: any) => (
                    <div key={cpn.id} className={`border p-4 rounded-sm text-xs relative space-y-1 transition-all ${
                      cpn.display_on_site
                        ? 'border-brand-gold bg-brand-gold/5 shadow-sm'
                        : 'border-brand-gold/15'
                    }`}>
                      <p className="font-bold text-brand-green uppercase tracking-wider">{cpn.code}</p>
                      <p className="text-neutral-500">
                        Type: <span className="font-bold text-neutral-700">{cpn.discount_type.toUpperCase()}</span>
                      </p>
                      <p className="text-neutral-600">
                        Value: <span className="font-bold text-brand-green">{cpn.discount_type === 'percentage' ? `${cpn.value}% OFF` : `₹${cpn.value} OFF`}</span>
                      </p>
                      <p className="text-neutral-600">Minimum spend requirement: ₹{cpn.min_cart_value || '0'}</p>
                      <p className="text-neutral-600">
                        Applicable to:{' '}
                        <span className="font-bold text-brand-green uppercase">
                          {cpn.applicable_type === 'category'
                            ? `Category: ${categories.find((c: any) => c.id === cpn.applicable_id)?.name || cpn.applicable_id}`
                            : 'All Products'}
                        </span>
                      </p>
                      {cpn.applicable_type === 'category' && cpn.applicable_product_id && (() => {
                        const prod = productsList.find((p: any) => p.id === cpn.applicable_product_id);
                        return prod ? (
                          <p className="text-neutral-500 text-[10px]">
                            Specific product:{' '}
                            <span className="font-bold text-brand-green">{prod.name}</span>
                            <span className="font-mono text-neutral-400 ml-1">(ID: {prod.id})</span>
                          </p>
                        ) : null;
                      })()}

                      {/* Display on site toggle */}
                      <label className="flex items-center gap-2 mt-2 cursor-pointer select-none group">
                        <input
                          type="checkbox"
                          checked={!!cpn.display_on_site}
                          onChange={() => handleSetDisplayCoupon(cpn)}
                          className="accent-brand-green w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className={`text-[10px] uppercase tracking-widest font-bold transition-colors ${
                          cpn.display_on_site ? 'text-brand-green' : 'text-neutral-400 group-hover:text-brand-green'
                        }`}>
                          {cpn.display_on_site ? '✓ Displaying on site' : 'Display on site'}
                        </span>
                      </label>

                      <button onClick={() => handleDeleteCoupon(cpn.id)} className="absolute top-4 right-4 text-neutral-400 hover:text-brand-crimson p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. ORDERS PANEL */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <h3 className="font-serif-cinzel text-sm font-bold tracking-widest text-brand-gold uppercase border-b border-brand-gold/20 pb-2">Client Orders List</h3>

                {/* Orders Table */}
                <div className="overflow-x-auto text-xs">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-brand-green text-brand-beige font-serif-cinzel uppercase">
                        <th className="p-3 border border-brand-gold/20 text-left">Order Details</th>
                        <th className="p-3 border border-brand-gold/20 text-left">Client</th>
                        <th className="p-3 border border-brand-gold/20 text-right">Amount</th>
                        <th className="p-3 border border-brand-gold/20 text-center">Status</th>
                        <th className="p-3 border border-brand-gold/20 text-center">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersLoading ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center italic text-neutral-400 bg-brand-beige/5">
                            Loading client orders from database...
                          </td>
                        </tr>
                      ) : adminOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center italic text-neutral-400 bg-brand-beige/5">
                            No client orders found in the database.
                          </td>
                        </tr>
                      ) : (
                        adminOrders.map((order: any) => (
                          <tr key={order.id} className="hover:bg-brand-beige/10">
                            <td className="p-3 border border-brand-gold/10">
                              <span className="font-bold text-brand-green uppercase tracking-wide block text-xs">{order.id}</span>
                              <div className="mt-2 bg-brand-green/5 border border-brand-gold/20 rounded-sm px-2.5 py-2 inline-block">
                                <span className="font-bold text-brand-green block text-sm tracking-wide">
                                  {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                <span className="text-[11px] text-neutral-500 font-medium block mt-0.5">
                                  {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                </span>
                              </div>
                              <span className="text-[9px] text-brand-gold uppercase font-bold block mt-1.5">{(order.payment_method || 'cod').toUpperCase()}</span>
                            </td>
                            <td className="p-3 border border-brand-gold/10">
                              <span className="font-semibold text-neutral-700 block">{order.shipping_address?.name || order.guest_name || 'Guest User'}</span>
                              <span className="text-[10px] text-neutral-400 block">{order.guest_email || order.shipping_address?.email || order.guest_phone || order.shipping_address?.phone}</span>
                            </td>
                            <td className="p-3 border border-brand-gold/10 text-right font-semibold">₹{(order.final_amount || order.total_amount)?.toLocaleString('en-IN')}</td>
                            <td className="p-3 border border-brand-gold/10 text-center">
                              <select
                                value={order.order_status}
                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                className="bg-white border border-brand-gold/30 px-2 py-1 focus:outline-none font-semibold uppercase text-[10px] tracking-wider text-brand-green"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="p-3 border border-brand-gold/10 text-center">
                              <button
                                onClick={() => window.open(api.getInvoiceUrl(order.id), '_blank')}
                                className="flex flex-col items-center gap-0.5 text-brand-gold hover:text-brand-green transition-colors mx-auto"
                                title="Download PDF Receipt"
                              >
                                <FileText size={18} />
                                <span className="text-[8px] uppercase tracking-widest font-bold">PDF</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. USER ACCOUNTS PANEL */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <h3 className="font-serif-cinzel text-sm font-bold tracking-widest text-brand-gold uppercase border-b border-brand-gold/20 pb-2">Client Accounts Registry</h3>

                <div className="space-y-3 max-w-lg">
                  {userAccounts.map((acct: any) => (
                    <div key={acct.id} className="bg-brand-beige/5 border border-brand-gold/15 p-4 rounded-sm text-xs space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-brand-green uppercase tracking-wide block">{acct.name}</span>
                          <span className="text-[10px] text-neutral-500 block font-mono">{acct.email}</span>
                          {acct.phone && <span className="text-[10px] text-neutral-500 block font-mono">Phone: {acct.phone}</span>}
                          <span className="text-[9px] text-brand-gold uppercase font-semibold mt-1 block">Role: {acct.role.toUpperCase()}</span>
                        </div>
                        
                        {acct.role !== 'admin' && (
                          <button onClick={() => handleDeleteUser(acct.id)} className="text-neutral-400 hover:text-brand-crimson p-1">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      {/* Saved Addresses display */}
                      {acct.addresses && acct.addresses.length > 0 ? (
                        <div className="border-t border-brand-gold/10 pt-2.5 mt-2 space-y-2">
                          <span className="text-[9px] tracking-widest text-brand-gold uppercase font-bold block">Saved Addresses ({acct.addresses.length})</span>
                          <div className="grid grid-cols-1 gap-2">
                            {acct.addresses.map((addr: any) => (
                              <div key={addr.id} className="bg-white border border-brand-gold/10 p-2.5 rounded-sm space-y-0.5 text-[11px] text-neutral-600">
                                <p className="font-semibold text-neutral-800 uppercase tracking-wide">{addr.name} ({addr.phone})</p>
                                <p>{addr.address_line1}</p>
                                {addr.address_line2 && <p>{addr.address_line2}</p>}
                                <p>{addr.city}, {addr.state} - {addr.postal_code}</p>
                                <p className="font-medium text-neutral-500 uppercase text-[10px]">{addr.country}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        acct.role !== 'admin' && (
                          <p className="text-[9px] text-neutral-400 italic pt-2 mt-1 border-t border-brand-gold/5">No saved addresses</p>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. CART ABANDONMENT SYSTEM PANEL */}
            {activeTab === 'abandonment' && (() => {
              const realAbandonedSessions = abandonedSessions.filter((sess: any) =>
                sess.lostRevenue > 0 &&
                sess.items && sess.items.length > 0
              );
              return (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex justify-between items-center border-b border-brand-gold/20 pb-3">
                    <div>
                      <h3 className="font-serif-cinzel text-sm font-bold tracking-widest text-brand-gold uppercase">Abandoned Shopping Carts</h3>
                      <p className="text-[10px] text-neutral-400 mt-0.5 tracking-wide">Customers who added items but didn't complete their purchase</p>
                    </div>
                    <span className="text-[10px] tracking-widest font-bold uppercase text-brand-green bg-brand-green/5 px-3 py-1.5 border border-brand-green/20 rounded-sm">
                      {statsLoading ? '...' : `${realAbandonedSessions.length} Session${realAbandonedSessions.length !== 1 ? 's' : ''}`}
                    </span>
                  </div>

                  {statsLoading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-32 bg-neutral-100 rounded-sm" />
                      <div className="h-32 bg-neutral-100 rounded-sm" />
                    </div>
                  ) : realAbandonedSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center mb-4">
                        <ShoppingCart size={24} className="text-brand-gold/50" />
                      </div>
                      <p className="text-sm font-serif-cinzel text-neutral-400 uppercase tracking-widest">No Abandoned Carts</p>
                      <p className="text-[10px] text-neutral-300 mt-1">All shopping sessions have been completed or cleared</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {realAbandonedSessions.map((sess: any) => (
                        <div key={sess.id} className="bg-white border border-brand-gold/20 shadow-sm rounded-sm overflow-hidden hover:shadow-md transition-shadow">
                          {/* Card Header: Stage badge + session meta + delete button */}
                          <div className="flex items-center justify-between px-5 py-3 bg-brand-beige/40 border-b border-brand-gold/15">
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                                sess.step === 'recovered'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : sess.step === 'checkout_initiated'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  sess.step === 'recovered' ? 'bg-emerald-500' : sess.step === 'checkout_initiated' ? 'bg-amber-500' : 'bg-rose-500'
                                }`} />
                                {sess.step === 'checkout_initiated' ? 'Reached Checkout' : sess.step === 'recovered' ? 'Recovered' : 'Added to Cart'}
                              </span>
                              <span className="text-[9px] text-neutral-400 font-mono">
                                {sess.sessionId}
                              </span>
                              <span className="text-[9px] text-neutral-400">
                                {sess.created_at ? new Date(sess.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteAbandonedSession(sess.id)}
                              className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 hover:border-rose-400 px-2.5 py-1.5 rounded-sm transition-all"
                              title="Delete this abandoned session"
                            >
                              <Trash2 size={11} />
                              Delete
                            </button>
                          </div>

                          {/* Card Body: Customer + Items + Value */}
                          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-brand-gold/10">

                            {/* Column 1: Customer Details */}
                            <div className="p-5">
                              <p className="text-[9px] uppercase tracking-widest text-brand-gold font-bold mb-3">Customer</p>
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-gold/30 to-brand-green/20 text-brand-green flex items-center justify-center font-bold text-base uppercase shadow-sm border border-brand-gold/30 flex-shrink-0">
                                  {sess.customerName ? sess.customerName[0] : 'A'}
                                </div>
                                <div>
                                  <p className="font-bold text-neutral-800 text-sm uppercase tracking-wide leading-tight">
                                    {sess.customerName || 'Anonymous'}
                                  </p>
                                  {!sess.customerName && (
                                    <p className="text-[9px] text-neutral-400 italic mt-0.5">Details not yet collected</p>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-2">
                                {sess.customerEmail ? (
                                  <div className="flex items-center gap-2 bg-brand-beige/50 px-3 py-2 rounded-sm border border-brand-gold/10">
                                    <Mail size={11} className="text-brand-gold flex-shrink-0" />
                                    <span className="text-[11px] text-neutral-700 font-mono truncate">{sess.customerEmail}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-sm border border-neutral-100">
                                    <Mail size={11} className="text-neutral-300 flex-shrink-0" />
                                    <span className="text-[10px] text-neutral-300 italic">Email not captured</span>
                                  </div>
                                )}
                                {sess.customerPhone ? (
                                  <div className="flex items-center gap-2 bg-brand-beige/50 px-3 py-2 rounded-sm border border-brand-gold/10">
                                    <span className="text-brand-gold text-[10px] flex-shrink-0">📞</span>
                                    <span className="text-[11px] text-neutral-700 font-mono font-semibold">{sess.customerPhone}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-sm border border-neutral-100">
                                    <span className="text-neutral-300 text-[10px] flex-shrink-0">📞</span>
                                    <span className="text-[10px] text-neutral-300 italic">Phone not captured</span>
                                  </div>
                                )}
                              </div>

                              {/* Action Button */}
                              <div className="mt-4">
                                {sess.step === 'recovered' ? (
                                  <span className="w-full inline-flex items-center justify-center gap-1.5 text-emerald-700 font-bold uppercase tracking-widest text-[9px] bg-emerald-50 px-3 py-2 rounded-sm border border-emerald-200">
                                    ✓ Order Recovered
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => alert(`Reminder email queued for ${sess.customerEmail || 'visitor'} — ₹${sess.lostRevenue?.toLocaleString('en-IN')} potential recovery!`)}
                                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-brand-gold text-brand-green hover:bg-brand-gold hover:text-brand-green transition-all uppercase tracking-widest font-bold text-[9px] rounded-sm"
                                  >
                                    <Mail size={11} /> Send Recovery Email
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Column 2: Abandoned Items */}
                            <div className="p-5">
                              <p className="text-[9px] uppercase tracking-widest text-brand-gold font-bold mb-3">
                                Abandoned Items ({sess.items.length})
                              </p>
                              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                {sess.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-3 bg-brand-beige/20 p-2.5 rounded-sm border border-brand-gold/10">
                                    {item.image ? (
                                      <img src={item.image} className="w-10 h-12 object-cover border border-brand-gold/20 shadow-sm rounded-sm flex-shrink-0" alt="" />
                                    ) : (
                                      <div className="w-10 h-12 bg-brand-beige border border-brand-gold/20 flex items-center justify-center text-[8px] text-neutral-400 flex-shrink-0 rounded-sm">No img</div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className="font-bold text-brand-green uppercase truncate text-[10px] leading-tight" title={item.product_name || item.name}>
                                        {item.product_name || item.name || 'Unknown Product'}
                                      </p>
                                      <p className="text-[9px] text-neutral-400 mt-0.5">Qty: {item.quantity}</p>
                                      <p className="text-[11px] text-neutral-700 font-bold mt-0.5">₹{item.price?.toLocaleString('en-IN')}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Column 3: Lost Value */}
                            <div className="p-5 flex flex-col justify-between">
                              <div>
                                <p className="text-[9px] uppercase tracking-widest text-brand-gold font-bold mb-3">Lost Revenue</p>
                                <div className="text-center py-4">
                                  <p className="text-[9px] text-neutral-400 uppercase tracking-widest mb-1">Potential Value</p>
                                  <p className="font-serif-cinzel font-bold text-brand-crimson text-2xl leading-tight">
                                    ₹{sess.lostRevenue?.toLocaleString('en-IN')}
                                  </p>
                                  <p className="text-[9px] text-neutral-400 mt-1">{sess.items?.length} item{sess.items?.length !== 1 ? 's' : ''} in cart</p>
                                </div>
                              </div>
                              <div className="mt-4 text-center">
                                <p className="text-[8px] uppercase tracking-widest text-neutral-300 mb-1">Cart Stage</p>
                                <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border ${
                                  sess.step === 'recovered'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : sess.step === 'checkout_initiated'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                  {sess.step === 'checkout_initiated' ? 'Checkout' : sess.step === 'recovered' ? 'Recovered ✓' : 'In Cart'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

          </div>
        </div>
      </main>

      {/* CREATE / EDIT PRODUCT SLIDING MODAL DIALOG */}
      <AnimatePresence>
        {isProductModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProductModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.4 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-xl bg-brand-beige border-l border-brand-gold shadow-2xl p-6 overflow-y-auto flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-brand-gold/20 pb-4 mb-6">
                  <h2 className="font-serif-cinzel text-lg tracking-widest text-brand-green uppercase font-bold">
                    {editingProduct ? 'Modify Bridal Design' : 'Add New Bridal Design'}
                  </h2>
                  <button onClick={() => setIsProductModalOpen(false)} className="text-brand-green hover:text-brand-gold p-1">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] tracking-widest uppercase font-bold text-neutral-500 mb-1">Design Name</label>
                      <input
                        type="text"
                        required
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                        className="w-full bg-white border border-brand-gold/30 px-3 py-2 focus:outline-none focus:border-brand-gold uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] tracking-widest uppercase font-bold text-neutral-500 mb-1">SKU Code</label>
                      <input
                        type="text"
                        required
                        placeholder="PR-LH-100"
                        value={prodSku}
                        onChange={(e) => setProdSku(e.target.value)}
                        className="w-full bg-white border border-brand-gold/30 px-3 py-2 focus:outline-none focus:border-brand-gold uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] tracking-widest uppercase font-bold text-neutral-500 mb-1">Category</label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="w-full bg-white border border-brand-gold/30 px-3 py-2 focus:outline-none"
                      >
                        {categories.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] tracking-widest uppercase font-bold text-neutral-500 mb-1">Subcategory</label>
                      <input
                        type="text"
                        placeholder="Royal Collection"
                        value={prodSub}
                        onChange={(e) => setProdSub(e.target.value)}
                        className="w-full bg-white border border-brand-gold/30 px-3 py-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] tracking-widest uppercase font-bold text-neutral-500 mb-1">Fabric Details</label>
                      <input
                        type="text"
                        placeholder="Raw Silk / Velvet"
                        value={prodFabric}
                        onChange={(e) => setProdFabric(e.target.value)}
                        className="w-full bg-white border border-brand-gold/30 px-3 py-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] tracking-widest uppercase font-bold text-neutral-500 mb-1">Price (₹)</label>
                      <input
                        type="number"
                        required
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                        className="w-full bg-white border border-brand-gold/30 px-3 py-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] tracking-widest uppercase font-bold text-neutral-500 mb-1">Sale Price (₹, Optional)</label>
                      <input
                        type="number"
                        value={prodSale}
                        onChange={(e) => setProdSale(e.target.value)}
                        className="w-full bg-white border border-brand-gold/30 px-3 py-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] tracking-widest uppercase font-bold text-neutral-500 mb-1">Stock Level</label>
                      <input
                        type="number"
                        required
                        value={prodStock}
                        onChange={(e) => setProdStock(e.target.value)}
                        className="w-full bg-white border border-brand-gold/30 px-3 py-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] tracking-widest uppercase font-bold text-neutral-500 mb-1">Description</label>
                    <textarea
                      rows={3}
                      required
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      className="w-full bg-white border border-brand-gold/30 px-3 py-2 focus:outline-none"
                    />
                  </div>


                  {/* Sizes Section */}
                  <div className="space-y-3">
                    <label className="block text-[9px] tracking-widest uppercase font-bold text-neutral-500">Available Sizes</label>
                    {/* Quick-pick standard sizes */}
                    <div className="flex flex-wrap gap-2">
                      {['S', 'M', 'L', 'XL', '2XL', 'Free Size'].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            setProdSizes((prev) =>
                              prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz]
                            );
                          }}
                          className={`px-3 py-1.5 border text-[10px] tracking-wider uppercase font-bold transition-all ${
                            prodSizes.includes(sz)
                              ? 'bg-brand-green text-brand-beige border-brand-green'
                              : 'bg-white text-neutral-500 border-brand-gold/30 hover:border-brand-gold'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                    {/* Custom size input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Custom size (e.g. 38, XXS)"
                        value={prodSizeInput}
                        onChange={(e) => setProdSizeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const sz = prodSizeInput.trim().toUpperCase();
                            if (sz && !prodSizes.includes(sz)) setProdSizes((prev) => [...prev, sz]);
                            setProdSizeInput('');
                          }
                        }}
                        className="flex-1 bg-white border border-brand-gold/30 px-3 py-1.5 text-xs focus:outline-none focus:border-brand-gold uppercase"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const sz = prodSizeInput.trim().toUpperCase();
                          if (sz && !prodSizes.includes(sz)) setProdSizes((prev) => [...prev, sz]);
                          setProdSizeInput('');
                        }}
                        className="bg-brand-green text-brand-beige px-3 py-1.5 text-xs uppercase tracking-widest font-bold border border-brand-green hover:bg-brand-gold hover:text-brand-green"
                      >
                        Add
                      </button>
                    </div>
                    {prodSizes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {prodSizes.map((sz) => (
                          <span key={sz} className="flex items-center gap-1 bg-brand-gold/10 border border-brand-gold/30 px-2 py-0.5 text-[10px] font-bold text-brand-green uppercase">
                            {sz}
                            <button type="button" onClick={() => setProdSizes((prev) => prev.filter((s) => s !== sz))} className="text-brand-crimson ml-1 font-bold hover:text-red-700">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Color-wise image uploads */}
                  <div className="space-y-3">
                    <label className="block text-[9px] tracking-widest uppercase font-bold text-neutral-500">Colors & Shade Images</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add shade name"
                        value={prodColorInput}
                        onChange={(e) => setProdColorInput(e.target.value)}
                        className="flex-1 bg-white border border-brand-gold/30 px-3 py-2 focus:outline-none focus:border-brand-gold uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleAddProductColor}
                        className="bg-brand-green text-brand-beige px-4 py-2 uppercase tracking-widest font-bold border border-brand-green hover:bg-brand-gold hover:text-brand-green"
                      >
                        Add
                      </button>
                    </div>

                    <div className="space-y-3">
                      {prodColors.length === 0 && (
                        <p className="border border-dashed border-brand-gold/30 bg-white/60 px-3 py-4 text-[10px] uppercase tracking-widest text-neutral-400">
                          Add a shade to upload images for that color.
                        </p>
                      )}
                      {prodColors.map((color) => (
                        <div key={color} className="border border-brand-gold/25 rounded-sm overflow-hidden">
                          {/* Color header bar */}
                          <div className="flex items-center justify-between px-4 py-2.5 bg-brand-green/5 border-b border-brand-gold/20">
                            <span className="font-bold text-brand-green uppercase tracking-widest text-[11px]">{color}</span>
                            {prodColors.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveProductColor(color)}
                                className="text-[10px] text-neutral-400 hover:text-brand-crimson uppercase font-bold transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="bg-white p-3 space-y-3">
                            {/* Sizes available for this color */}
                            <div>
                              <label className="block text-[9px] tracking-widest uppercase font-bold text-neutral-500 mb-1.5">
                                Sizes Available for This Shade
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {(prodSizes.length > 0 ? prodSizes : ['S', 'M', 'L', 'XL', '2XL', 'Free Size']).map((sz) => {
                                  const isChecked = (prodColorSizes[color] || []).includes(sz);
                                  return (
                                    <button
                                      key={sz}
                                      type="button"
                                      onClick={() => {
                                        setProdColorSizes((prev) => ({
                                          ...prev,
                                          [color]: isChecked
                                            ? (prev[color] || []).filter((s) => s !== sz)
                                            : [...(prev[color] || []), sz]
                                        }));
                                      }}
                                      className={`px-2.5 py-1 border text-[9px] tracking-wider uppercase font-bold transition-all ${
                                        isChecked
                                          ? 'bg-brand-green text-brand-beige border-brand-green'
                                          : 'bg-brand-beige/30 text-neutral-400 border-brand-gold/20 hover:border-brand-gold'
                                      }`}
                                    >
                                      {sz}
                                    </button>
                                  );
                                })}
                              </div>
                              {(prodColorSizes[color] || []).length === 0 && (
                                <p className="text-[9px] text-neutral-400 mt-1 italic">Select sizes available for {color}</p>
                              )}
                            </div>

                             {/* Stock quantity per size */}
                             <div>
                               <label className="block text-[9px] tracking-widest uppercase font-bold text-neutral-500 mb-1.5">
                                 Stock Quantity per Size
                               </label>
                               <div className="space-y-2">
                                 {(prodColorSizes[color] || []).length === 0 ? (
                                   <p className="text-[10px] text-neutral-400 italic">Select sizes above to set stock for each size.</p>
                                 ) : (
                                   (prodColorSizes[color] || []).map((sz) => (
                                     <div key={sz} className="flex items-center gap-3">
                                       <span className="w-12 text-[10px] uppercase font-bold text-brand-green bg-brand-gold/10 px-2 py-1 text-center border border-brand-gold/20">{sz}</span>
                                       <input
                                         type="number"
                                         min="0"
                                         placeholder="Qty"
                                         value={prodColorStock[`${color}-${sz}`] ?? 0}
                                         onChange={(e) => setProdColorStock((prev) => ({
                                           ...prev,
                                           [`${color}-${sz}`]: parseInt(e.target.value, 10) || 0
                                         }))}
                                         className="flex-1 bg-brand-beige/30 border border-brand-gold/40 px-3 py-1.5 focus:outline-none focus:border-brand-gold text-xs font-bold text-brand-green"
                                       />
                                     </div>
                                   ))
                                 )}
                               </div>
                             </div>

                            {/* Image upload */}
                            <div>
                              <label className="block text-[9px] tracking-widest uppercase font-bold text-neutral-500 mb-1.5">
                                Shade Images
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                  handleColorImageUpload(color, e.target.files);
                                  e.target.value = '';
                                }}
                                className="w-full bg-brand-beige/30 border border-brand-gold/30 px-3 py-1.5 focus:outline-none file:mr-4 file:py-1 file:px-3 file:border-0 file:text-[10px] file:font-semibold file:bg-brand-green file:text-brand-beige hover:file:bg-brand-gold hover:file:text-brand-green file:cursor-pointer"
                              />
                            </div>

                            {/* Image previews */}
                            {(prodColorImages[color] || []).length > 0 && (
                              <div className="flex gap-2 flex-wrap pt-1">
                                {(prodColorImages[color] || []).map((img, idx) => (
                                  <div key={`${color}-${idx}`} className="relative w-14 h-18 border border-brand-gold/20 rounded-sm overflow-hidden" style={{ height: '4.5rem' }}>
                                    <img src={img} className="w-full h-full object-cover" alt={`${color} preview`} />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveColorImage(color, idx)}
                                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-xs font-bold opacity-0 hover:opacity-100 transition-opacity"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-green hover:bg-brand-gold text-brand-beige hover:text-brand-green font-bold py-3 uppercase tracking-widest border border-brand-green transition-all"
                  >
                    Save Couture Design
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer className="w-full bg-brand-green text-brand-beige py-6 px-6 text-center border-t border-brand-gold/15 text-[10px] tracking-widest uppercase font-light">
        <p>&copy; {new Date().getFullYear()} Paree Wedding Boutique. Admin Portal Panel.</p>
      </footer>
    </div>
  );
}
