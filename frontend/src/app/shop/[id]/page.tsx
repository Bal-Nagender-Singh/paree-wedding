'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, ArrowLeft, Ruler, Shield, Truck, Sparkles, Star } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/lib/api';
import { useApp } from '@/context/AppContext';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetail({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const { addToCart, toggleWishlist, isWishlisted } = useApp();

  // Active product image index
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'shipping' | 'care'>('details');

  // Magnifier zoom state
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ display: 'none' });

  // Fetch product data
  const { data, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.getProductById(productId)
  });

  const product = data?.product;
  const similarProducts = data?.similar || [];
  const colorImages = product?.color_images || {};
  const selectedColorImages = selectedColor ? colorImages[selectedColor] : [];
  const currentImages = selectedColorImages?.length ? selectedColorImages : product?.images || [];

  const availableSizes = React.useMemo(() => {
    if (!product) return [];
    if (selectedColor && product.color_sizes?.[selectedColor]) {
      return product.color_sizes[selectedColor];
    }
    return product.sizes || [];
  }, [product, selectedColor]);

  // Setup default size and color once product loads
  React.useEffect(() => {
    if (product) {
      const defaultColor = product.colors?.length > 0 ? product.colors[0] : '';
      setSelectedColor(defaultColor);
      const sizesForColor = (defaultColor && product.color_sizes?.[defaultColor]) 
        ? product.color_sizes[defaultColor] 
        : (product.sizes || []);
      if (sizesForColor.length > 0) {
        setSelectedSize(sizesForColor[0]);
      } else {
        setSelectedSize('');
      }
      setActiveImgIdx(0);
    }
  }, [product]);

  React.useEffect(() => {
    setActiveImgIdx(0);
    if (product && selectedColor) {
      const sizesForColor = product.color_sizes?.[selectedColor] || product.sizes || [];
      if (sizesForColor.length > 0) {
        if (!sizesForColor.includes(selectedSize)) {
          setSelectedSize(sizesForColor[0]);
        }
      } else {
        setSelectedSize('');
      }
    }
  }, [selectedColor, product]);

  // Zoom magnifier handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    
    setZoomStyle({
      display: 'block',
      backgroundPosition: `${x}% ${y}%`,
      backgroundImage: `url(${currentImages?.[activeImgIdx]})`,
      backgroundSize: '200%'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none' });
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      price: product.price,
      image: currentImages?.[0] || 'https://images.unsplash.com/photo-1594552072238-b8a33785b261',
      size: selectedSize,
      color: selectedColor,
      category_id: product.category_id,
      collection: product.collection
    }, 1);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-brand-beige">
        <Header />
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col min-h-screen bg-brand-beige">
        <Header />
        <div className="flex-1 text-center py-24 max-w-lg mx-auto">
          <h2 className="font-serif-cinzel text-xl text-brand-green uppercase font-bold">Product Not Found</h2>
          <p className="text-xs text-neutral-500 mt-2 uppercase tracking-widest">The luxury design you are looking for has expired or is unavailable.</p>
          <button onClick={() => router.push('/shop')} className="mt-8 bg-brand-green text-brand-beige py-3 px-6 text-xs uppercase tracking-widest font-semibold border border-brand-gold">
            Return to Catalogue
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-brand-beige">
      <Header />

      <main className="max-w-7xl mx-auto w-full py-12 px-6 md:px-12 flex-1">
        
        {/* Back Link */}
        <button
          onClick={() => router.push('/shop')}
          className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-neutral-500 hover:text-brand-gold transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Back to Catalog
        </button>

        {/* Product Details Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
          
          {/* Column 1: Image Gallery (5 cols) */}
          <div className="lg:col-span-7 grid grid-cols-12 gap-4">
            {/* Thumbnails Sidebar */}
            <div className="col-span-2 flex flex-col gap-3">
              {currentImages?.map((img: string, idx: number) => (
                <button
                  key={img}
                  onClick={() => setActiveImgIdx(idx)}
                  className={`w-full aspect-[3/4] overflow-hidden border p-0.5 transition-colors ${
                    activeImgIdx === idx ? 'border-brand-gold' : 'border-brand-gold/10 hover:border-brand-gold/40'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Image View with Magnifier Zoom */}
            <div className="col-span-10 relative aspect-[3/4] border border-brand-gold/20 overflow-hidden bg-white">
              <div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="w-full h-full cursor-zoom-in relative"
              >
                <img
                  src={currentImages?.[activeImgIdx] || 'https://images.unsplash.com/photo-1594552072238-b8a33785b261'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Floating zoom lens */}
                <div
                  style={zoomStyle}
                  className="absolute inset-0 pointer-events-none border border-brand-gold bg-no-repeat"
                />
              </div>
            </div>
          </div>

          {/* Column 2: Selection Form (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Product Info */}
              <div className="space-y-2">
                <span className="text-[10px] tracking-widest text-brand-gold uppercase font-bold block">
                  {product.collection} · {product.sub_category}
                </span>
                <h1 className="font-serif-cinzel text-2xl sm:text-3xl font-normal text-brand-green uppercase tracking-wide">
                  {product.name}
                </h1>
                <p className="text-xs text-neutral-400">SKU: {product.sku}</p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-2xl font-bold text-brand-green">₹{product.price.toLocaleString('en-IN')}</span>
                {product.sale_price && (
                  <span className="text-sm text-neutral-400 line-through">₹{product.sale_price.toLocaleString('en-IN')}</span>
                )}
                <span className="text-[10px] uppercase text-brand-gold tracking-widest border border-brand-gold/30 px-2 py-0.5 rounded-sm">
                  18% GST Inc.
                </span>
              </div>

              <hr className="border-brand-gold/15" />

              {/* Size Select */}
              {availableSizes && availableSizes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] tracking-widest text-neutral-500 uppercase font-semibold">Select Size</label>
                    <button
                      onClick={() => setIsSizeChartOpen(true)}
                      className="text-[10px] tracking-widest uppercase font-bold text-brand-gold hover:text-brand-green flex items-center gap-1.5"
                    >
                      <Ruler size={12} /> Sizing Chart
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {availableSizes.map((sz: string) => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`px-4 py-2 border text-xs tracking-wider uppercase font-semibold transition-all ${
                          selectedSize === sz
                            ? 'bg-brand-green text-brand-beige border-brand-green'
                            : 'bg-white text-brand-green border-brand-gold/30 hover:border-brand-gold'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Select */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-3">
                  <label className="text-[10px] tracking-widest text-neutral-500 uppercase font-semibold block">Select Shade</label>
                  <div className="flex gap-2">
                    {product.colors.map((col: string) => (
                      <button
                        key={col}
                        onClick={() => setSelectedColor(col)}
                        className={`px-4 py-2 border text-xs tracking-wider uppercase font-semibold transition-all ${
                          selectedColor === col
                            ? 'bg-brand-green text-brand-beige border-brand-green'
                            : 'bg-white text-brand-green border-brand-gold/30 hover:border-brand-gold'
                        }`}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Core Features list */}
              <div className="space-y-3 bg-brand-cream/40 p-4 border border-brand-gold/15 rounded-sm text-xs">
                <div className="flex items-center gap-3 text-brand-green">
                  <Sparkles size={16} className="text-brand-gold flex-shrink-0" />
                  <span>Handcrafted embroidery in {product.fabric || 'pure silk and velvet materials'}.</span>
                </div>
                <div className="flex items-center gap-3 text-brand-green">
                  <Truck size={16} className="text-brand-gold flex-shrink-0" />
                  <span>Complimentary white-glove courier across India. Ships in 15-20 days.</span>
                </div>
                <div className="flex items-center gap-3 text-brand-green">
                  <Shield size={16} className="text-brand-gold flex-shrink-0" />
                  <span>100% custom made-to-measure sizing available.</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-8 space-y-4">
              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-brand-green hover:bg-brand-gold text-brand-beige hover:text-brand-green font-semibold py-4 text-xs tracking-widest uppercase border border-brand-gold transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={14} /> Add to Bag
                </button>
                <button
                  onClick={() => toggleWishlist({ ...product, size: selectedSize, color: selectedColor })}
                  className={`px-4 border transition-colors ${
                    isWishlisted(product.id)
                      ? 'bg-brand-crimson text-white border-brand-crimson'
                      : 'bg-white border-brand-gold text-brand-green hover:bg-brand-gold hover:text-brand-green'
                  }`}
                  title="Bookmark"
                >
                  <Heart size={16} className={isWishlisted(product.id) ? 'fill-current' : ''} />
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                className="w-full bg-brand-gold hover:bg-brand-gold-hover text-brand-green font-semibold py-4 text-xs tracking-widest uppercase border border-brand-gold transition-all duration-300"
              >
                Buy Now
              </button>
            </div>

          </div>
        </div>

        {/* Product Details Tabs Section */}
        <section className="mb-20">
          <div className="flex border-b border-brand-gold/20 gap-8 font-sans-montserrat text-xs tracking-widest uppercase font-bold mb-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 ${activeTab === 'details' ? 'border-b-2 border-brand-gold text-brand-green' : 'text-neutral-400 hover:text-brand-green'}`}
            >
              Description & Fabric
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`pb-3 ${activeTab === 'shipping' ? 'border-b-2 border-brand-gold text-brand-green' : 'text-neutral-400 hover:text-brand-green'}`}
            >
              Delivery & Returns
            </button>
            <button
              onClick={() => setActiveTab('care')}
              className={`pb-3 ${activeTab === 'care' ? 'border-b-2 border-brand-gold text-brand-green' : 'text-neutral-400 hover:text-brand-green'}`}
            >
              Care Instructions
            </button>
          </div>

          <div className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-light max-w-3xl">
            {activeTab === 'details' && (
              <div className="space-y-4">
                <p>{product.description}</p>
                <p><strong>Fabric Specification:</strong> Raw silk, fine organza, premium silk georgette details, and soft cotton satin linings.</p>
                <p><strong>Ornamentation:</strong> Hand-embellished zardozi gold threading, seed pearl patterns, glass beads, and metallic borders.</p>
              </div>
            )}
            {activeTab === 'shipping' && (
              <div className="space-y-4">
                <p>Each bridal wear order is custom-made to ensure Sabyasachi-grade perfection. Please allow 15 to 21 working days for our master artisans to complete the tailoring.</p>
                <p><strong>White-Glove Shipping:</strong> We provide premium box shipping with temperature-regulated vehicles globally. Standard shipping is complimentary for orders above ₹50,000.</p>
                <p><strong>Returns:</strong> Due to the bespoke made-to-measure nature of our bridal wear, order cancellations are only supported within 24 hours of checkout. Alterations are offered free of charge.</p>
              </div>
            )}
            {activeTab === 'care' && (
              <div className="space-y-4">
                <p>To preserve the delicate hand embroidery and real gold zari threads, please follow these guidelines:</p>
                <p>1. Dry clean only. Use a certified professional luxury garment cleaner.</p>
                <p>2. Store in the supplied breathable muslin storage cover. Avoid hanging velvet and raw silk outfits for prolonged durations to prevent shape warping.</p>
                <p>3. Iron on low heat settings using a protective pressing cloth. Never iron directly onto embroidery or pearl decorations.</p>
              </div>
            )}
          </div>
        </section>

        {/* Reviews Section */}
        <section className="mb-20 border-t border-brand-gold/15 pt-12">
          <h2 className="font-serif-cinzel text-lg tracking-widest text-brand-green uppercase mb-8">Artisan Reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-brand-cream/25 border border-brand-gold/15 p-6 rounded-sm text-center space-y-3">
              <h3 className="font-serif-cinzel text-3xl font-bold text-brand-green">4.9</h3>
              <div className="flex justify-center gap-1 text-brand-gold">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-current" />)}
              </div>
              <p className="text-[10px] text-neutral-400 tracking-widest uppercase font-semibold">Based on 14 Verified Brides</p>
            </div>
            
            <div className="md:col-span-2 space-y-6">
              <div className="border-b border-brand-gold/10 pb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-sans-montserrat text-xs font-bold uppercase">Radhika Malhotra</h4>
                  <span className="text-[10px] text-neutral-400">June 2026</span>
                </div>
                <div className="flex gap-1 text-brand-gold mb-2">
                  {[...Array(5)].map((_, i) => <Star key={i} size={10} className="fill-current" />)}
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">The zardozi work is absolutely outstanding. It sparkles beautifully under lights. Standard sizing was a perfect fit for me. Worth every single penny!</p>
              </div>
            </div>
          </div>
        </section>

        {/* Similar Products Grid */}
        {similarProducts.length > 0 && (
          <section className="border-t border-brand-gold/15 pt-12">
            <h2 className="font-serif-cinzel text-lg tracking-widest text-brand-green uppercase text-center mb-8">Complementary Creations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((simProd: any) => (
                <div
                  key={simProd.id}
                  onClick={() => {
                    router.push(`/shop/${simProd.id}`);
                    setActiveImgIdx(0);
                  }}
                  className="group flex flex-col bg-white border border-brand-gold/15 p-3 hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <div className="h-[260px] overflow-hidden bg-brand-beige relative">
                    <img src={simProd.images?.[0]} alt={simProd.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="mt-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[8px] tracking-widest text-neutral-400 uppercase font-semibold block">{simProd.sub_category}</span>
                      <h3 className="font-serif-cinzel text-[11px] font-bold text-brand-green uppercase tracking-wide group-hover:text-brand-gold line-clamp-1">{simProd.name}</h3>
                    </div>
                    <span className="text-xs font-semibold text-brand-green block mt-3">₹{simProd.price.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* SIZING CHART OVERLAY MODAL */}
      <AnimatePresence>
        {isSizeChartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSizeChartOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-brand-beige border border-brand-gold shadow-2xl p-6 rounded-sm"
            >
              <div className="flex justify-between items-center border-b border-brand-gold/20 pb-4 mb-6">
                <h3 className="font-serif-cinzel text-md font-bold text-brand-green uppercase tracking-widest">Bridal Sizing Reference</h3>
                <button onClick={() => setIsSizeChartOpen(false)} className="text-brand-green hover:text-brand-gold">
                  Ruler
                </button>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-brand-green text-brand-beige font-serif-cinzel uppercase">
                      <th className="p-2.5 border border-brand-gold/30">Size</th>
                      <th className="p-2.5 border border-brand-gold/30">Bust (in)</th>
                      <th className="p-2.5 border border-brand-gold/30">Waist (in)</th>
                      <th className="p-2.5 border border-brand-gold/30">Hips (in)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="p-2.5 border border-brand-gold/30 text-center font-bold">S</td>
                      <td className="p-2.5 border border-brand-gold/30 text-center">34</td>
                      <td className="p-2.5 border border-brand-gold/30 text-center">26</td>
                      <td className="p-2.5 border border-brand-gold/30 text-center">36</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border border-brand-gold/30 text-center font-bold">M</td>
                      <td className="p-2.5 border border-brand-gold/30 text-center">36</td>
                      <td className="p-2.5 border border-brand-gold/30 text-center">28</td>
                      <td className="p-2.5 border border-brand-gold/30 text-center">38</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-2.5 border border-brand-gold/30 text-center font-bold">L</td>
                      <td className="p-2.5 border border-brand-gold/30 text-center">38</td>
                      <td className="p-2.5 border border-brand-gold/30 text-center">30</td>
                      <td className="p-2.5 border border-brand-gold/30 text-center">40</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border border-brand-gold/30 text-center font-bold">XL</td>
                      <td className="p-2.5 border border-brand-gold/30 text-center">40</td>
                      <td className="p-2.5 border border-brand-gold/30 text-center">32</td>
                      <td className="p-2.5 border border-brand-gold/30 text-center">42</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-[10px] text-neutral-400 mt-4 leading-relaxed font-light">
                * Note: Sabyasachi & Manish Malhotra couture items generally follow this layout. Custom tailors are available on email after booking to record your exact neck depth, sleeves length, and height specifications.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
