'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown, Heart, Eye } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/lib/api';
import { useApp } from '@/context/AppContext';

function ShopContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toggleWishlist, isWishlisted, addToCart } = useApp();

  // Filter & Sorting state from URL params
  const activeCategory = (params?.id as string) || searchParams.get('category') || '';
  const searchVal = searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState(activeCategory);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedFabric, setSelectedFabric] = useState('');
  const [priceRange, setPriceRange] = useState(150000);
  const [sortOption, setSortOption] = useState('newest');
  const [page, setPage] = useState(1);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Quick view preview modal
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [qvSize, setQvSize] = useState('');
  const [qvColor, setQvColor] = useState('');

  const qvAvailableSizes = React.useMemo(() => {
    if (!quickViewProduct) return [];
    if (qvColor && quickViewProduct.color_sizes?.[qvColor]) {
      return quickViewProduct.color_sizes[qvColor];
    }
    return quickViewProduct.sizes || [];
  }, [quickViewProduct, qvColor]);

  useEffect(() => {
    if (quickViewProduct) {
      const defaultColor = quickViewProduct.colors?.length > 0 ? quickViewProduct.colors[0] : '';
      setQvColor(defaultColor);
      const sizesForColor = (defaultColor && quickViewProduct.color_sizes?.[defaultColor]) 
        ? quickViewProduct.color_sizes[defaultColor] 
        : (quickViewProduct.sizes || []);
      if (sizesForColor.length > 0) {
        setQvSize(sizesForColor[0]);
      } else {
        setQvSize('');
      }
    } else {
      setQvSize('');
      setQvColor('');
    }
  }, [quickViewProduct]);

  useEffect(() => {
    if (quickViewProduct && qvColor) {
      const sizesForColor = quickViewProduct.color_sizes?.[qvColor] || quickViewProduct.sizes || [];
      if (sizesForColor.length > 0) {
        if (!sizesForColor.includes(qvSize)) {
          setQvSize(sizesForColor[0]);
        }
      } else {
        setQvSize('');
      }
    }
  }, [qvColor, quickViewProduct]);

  // Update selected category when URL param changes
  useEffect(() => {
    setSelectedCategory(activeCategory);
  }, [activeCategory]);

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories
  });

  // Fetch Products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', selectedCategory, selectedSize, selectedColor, selectedFabric, priceRange, sortOption, searchVal, page],
    queryFn: () => api.getProducts({
      category: selectedCategory,
      size: selectedSize,
      color: selectedColor,
      fabric: selectedFabric,
      maxPrice: priceRange,
      sort: sortOption,
      search: searchVal,
      page
    })
  });

  const productsList = productsData?.products || [];
  const totalPages = productsData?.totalPages || 1;

  // Filter options config
  const sizes = ['S', 'M', 'L', 'XL', 'Free Size'];
  const colors = ['Red', 'Green', 'Maroon', 'Ivory', 'Champagne', 'Pink'];
  const fabrics = ['Silk', 'Velvet', 'Georgette', 'Organza', 'Chiffon'];

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSize('');
    setSelectedColor('');
    setSelectedFabric('');
    setPriceRange(150000);
    setSortOption('newest');
    router.push('/shop');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Hero Banner header */}
      <section className="bg-brand-green text-brand-beige py-12 text-center border-b border-brand-gold/30">
        <span className="text-[9px] tracking-widest uppercase text-brand-gold font-bold">The Royal Atelier</span>
        <h1 className="font-serif-cinzel text-3xl font-light uppercase tracking-widest mt-1">Our Collections</h1>
        {searchVal && (
          <p className="text-xs text-neutral-300 mt-2 uppercase tracking-widest">Search results for "{searchVal}"</p>
        )}
      </section>

      {/* Main Shop View */}
      <main className="max-w-7xl mx-auto w-full py-12 px-6 md:px-12 flex-1">
        
        {/* Controls Bar */}
        <div className="flex items-center justify-between border-b border-brand-gold/20 pb-4 mb-8">
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-brand-green hover:text-brand-gold transition-colors"
          >
            <Filter size={16} /> Filters
          </button>
          
          <div className="flex items-center gap-4">
            <span className="text-xs text-neutral-500 uppercase tracking-widest hidden sm:inline">
              {productsList.length} items found
            </span>
            <div className="relative flex items-center border-b border-brand-gold/30">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-transparent text-xs text-brand-green font-sans-montserrat font-semibold uppercase tracking-wider pr-6 focus:outline-none cursor-pointer appearance-none py-1"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popularity">Popularity</option>
              </select>
              <ChevronDown size={14} className="absolute right-0 text-brand-gold pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="animate-pulse space-y-4">
                <div className="bg-neutral-200 h-[320px] w-full" />
                <div className="h-4 bg-neutral-200 w-2/3" />
                <div className="h-4 bg-neutral-200 w-1/3" />
              </div>
            ))}
          </div>
        ) : productsList.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-brand-gold/30">
            <p className="font-serif-cormorant italic text-xl text-neutral-600">No couture designs match your selected filters.</p>
            <button
              onClick={clearFilters}
              className="mt-6 bg-brand-green text-brand-beige font-semibold px-6 py-3 text-xs tracking-widest uppercase border border-brand-gold hover:bg-brand-gold hover:text-brand-green transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {productsList.map((prod: any, idx: number) => (
              <div key={prod.id} className="group flex flex-col bg-white border border-brand-gold/15 p-3 hover:shadow-lg transition-all duration-300">
                <div className="relative h-[320px] overflow-hidden bg-brand-beige">
                  <img
                    src={prod.images?.[0] || 'https://images.unsplash.com/photo-1594552072238-b8a33785b261'}
                    alt={prod.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {prod.is_featured && (
                    <span className="absolute top-3 left-3 bg-brand-green text-brand-beige text-[8px] font-bold tracking-widest uppercase px-2 py-1 rounded-sm">
                      Couture
                    </span>
                  )}

                  {/* Hover Quick Actions */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setQuickViewProduct(prod)}
                      className="p-2.5 bg-white text-brand-green hover:bg-brand-gold hover:text-white rounded-full shadow-lg transition-colors"
                      title="Quick Preview"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => toggleWishlist(prod)}
                      className={`p-2.5 rounded-full shadow-lg transition-colors ${
                        isWishlisted(prod.id)
                          ? 'bg-brand-crimson text-white'
                          : 'bg-white text-brand-green hover:bg-brand-gold hover:text-white'
                      }`}
                      title="Add to Wishlist"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] tracking-widest text-neutral-400 uppercase font-semibold block">
                      {categories.find((c: any) => c.id === prod.category_id)?.name || 'Couture'}
                    </span>
                    <h3
                      onClick={() => router.push(`/shop/${prod.id}`)}
                      className="font-serif-cinzel text-xs font-bold text-brand-green uppercase tracking-wide cursor-pointer hover:text-brand-gold line-clamp-1"
                    >
                      {prod.name}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-brand-gold/10 mt-3 flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-brand-green">₹{prod.price.toLocaleString('en-IN')}</span>
                      {prod.sale_price && (
                        <span className="text-[10px] text-neutral-400 line-through">₹{prod.sale_price.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        addToCart({
                          product_id: prod.id,
                          product_name: prod.name,
                          sku: prod.sku,
                          price: prod.price,
                          image: prod.images?.[0],
                          size: prod.sizes?.[0] || 'M',
                          color: prod.colors?.[0] || 'Default',
                          category_id: prod.category_id,
                          collection: prod.collection
                        }, 1);
                      }}
                      className="text-[9px] tracking-widest uppercase font-bold text-brand-gold hover:text-brand-green transition-colors"
                    >
                      + Add to Bag
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-16 font-sans-montserrat">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="text-xs uppercase tracking-widest font-bold text-brand-green disabled:text-neutral-300 hover:text-brand-gold transition-colors"
            >
              Previous
            </button>
            <span className="text-xs font-semibold">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="text-xs uppercase tracking-widest font-bold text-brand-green disabled:text-neutral-300 hover:text-brand-gold transition-colors"
            >
              Next
            </button>
          </div>
        )}

      </main>

      {/* FILTER SLIDEOUT DRAWER (AnimatePresence) */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.4 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-full max-w-sm bg-brand-beige border-r border-brand-gold shadow-2xl p-6 overflow-y-auto flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-brand-gold/20 pb-4 mb-6">
                  <h2 className="font-serif-cinzel text-lg tracking-widest text-brand-green uppercase font-bold">Filter Catalogue</h2>
                  <button onClick={() => setIsFilterDrawerOpen(false)} className="text-brand-green hover:text-brand-gold p-1">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Category Filter */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] tracking-widest uppercase font-bold text-brand-gold">Category</h4>
                    <div className="space-y-1.5 flex flex-col">
                      <button
                        onClick={() => setSelectedCategory('')}
                        className={`text-left text-xs uppercase tracking-wide py-1 ${selectedCategory === '' ? 'text-brand-green font-bold pl-2 border-l-2 border-brand-gold' : 'text-neutral-500 hover:text-brand-green'}`}
                      >
                        All Categories
                      </button>
                      {categories.map((cat: any) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`text-left text-xs uppercase tracking-wide py-1 ${selectedCategory === cat.id ? 'text-brand-green font-bold pl-2 border-l-2 border-brand-gold' : 'text-neutral-500 hover:text-brand-green'}`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size Filter */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] tracking-widest uppercase font-bold text-brand-gold">Size</h4>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map(sz => (
                        <button
                          key={sz}
                          onClick={() => setSelectedSize(selectedSize === sz ? '' : sz)}
                          className={`px-3 py-1.5 border text-xs tracking-wider uppercase font-semibold ${selectedSize === sz ? 'bg-brand-green text-brand-beige border-brand-green' : 'bg-white text-brand-green border-brand-gold/30 hover:border-brand-gold'}`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Filter */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] tracking-widest uppercase font-bold text-brand-gold">Color</h4>
                    <div className="flex flex-wrap gap-2">
                      {colors.map(col => (
                        <button
                          key={col}
                          onClick={() => setSelectedColor(selectedColor === col ? '' : col)}
                          className={`px-3 py-1.5 border text-xs tracking-wider uppercase font-semibold ${selectedColor === col ? 'bg-brand-green text-brand-beige border-brand-green' : 'bg-white text-brand-green border-brand-gold/30 hover:border-brand-gold'}`}
                        >
                          {col}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fabric Filter */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] tracking-widest uppercase font-bold text-brand-gold">Fabric</h4>
                    <div className="flex flex-wrap gap-2">
                      {fabrics.map(fab => (
                        <button
                          key={fab}
                          onClick={() => setSelectedFabric(selectedFabric === fab ? '' : fab)}
                          className={`px-3 py-1.5 border text-xs tracking-wider uppercase font-semibold ${selectedFabric === fab ? 'bg-brand-green text-brand-beige border-brand-green' : 'bg-white text-brand-green border-brand-gold/30 hover:border-brand-gold'}`}
                        >
                          {fab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] tracking-widest uppercase font-bold text-brand-gold">Max Price</h4>
                      <span className="text-xs font-semibold">₹{priceRange.toLocaleString('en-IN')}</span>
                    </div>
                    <input
                      type="range"
                      min="10000"
                      max="150000"
                      step="5000"
                      value={priceRange}
                      onChange={(e) => setPriceRange(parseInt(e.target.value))}
                      className="w-full h-1 bg-brand-gold/30 rounded-lg appearance-none cursor-pointer accent-brand-green focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-brand-gold/20 pt-4 mt-8 flex gap-3">
                <button
                  onClick={clearFilters}
                  className="flex-1 border border-brand-gold text-brand-green hover:bg-brand-gold hover:text-brand-green py-3 text-xs tracking-widest uppercase font-bold transition-all duration-300"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="flex-1 bg-brand-green text-brand-beige py-3 text-xs tracking-widest uppercase font-bold border border-brand-green hover:bg-brand-gold hover:text-brand-green transition-all duration-300"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* QUICK VIEW PREVIEW MODAL */}
      <AnimatePresence>
        {quickViewProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickViewProduct(null)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-3xl bg-brand-beige border border-brand-gold shadow-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-8 rounded-sm"
            >
              {/* Product Media */}
              <div className="h-[300px] md:h-[400px] overflow-hidden border border-brand-gold/10">
                <img
                  src={
                    (qvColor && quickViewProduct.color_images?.[qvColor]?.length > 0)
                      ? quickViewProduct.color_images[qvColor][0]
                      : quickViewProduct.images?.[0] || 'https://images.unsplash.com/photo-1594552072238-b8a33785b261'
                  }
                  alt={quickViewProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Details */}
              <div className="flex flex-col justify-between py-2">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[9px] tracking-widest text-brand-gold uppercase font-bold block">{quickViewProduct.collection}</span>
                      <h2 className="font-serif-cinzel text-lg font-bold text-brand-green uppercase tracking-wide mt-0.5">{quickViewProduct.name}</h2>
                    </div>
                    <button onClick={() => setQuickViewProduct(null)} className="text-brand-green hover:text-brand-gold p-1">
                      <X size={20} />
                    </button>
                  </div>

                  <p className="text-xs text-neutral-500 font-light mt-3 leading-relaxed line-clamp-4">
                    {quickViewProduct.description}
                  </p>

                  <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-base font-bold text-brand-green">₹{quickViewProduct.price.toLocaleString('en-IN')}</span>
                    {quickViewProduct.sale_price && (
                      <span className="text-xs text-neutral-400 line-through">₹{quickViewProduct.sale_price.toLocaleString('en-IN')}</span>
                    )}
                  </div>

                  {/* Select Shade */}
                  {quickViewProduct.colors && quickViewProduct.colors.length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      <span className="text-[10px] tracking-widest text-neutral-500 uppercase font-semibold block">Select Shade:</span>
                      <div className="flex flex-wrap gap-2">
                        {quickViewProduct.colors.map((col: string) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setQvColor(col)}
                            className={`px-3 py-1.5 border text-[10px] tracking-wider uppercase font-semibold transition-all ${
                              qvColor === col
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

                  {/* Select Size */}
                  {qvAvailableSizes && qvAvailableSizes.length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      <span className="text-[10px] tracking-widest text-neutral-500 uppercase font-semibold block">Select Size:</span>
                      <div className="flex flex-wrap gap-2">
                        {qvAvailableSizes.map((sz: string) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setQvSize(sz)}
                            className={`px-3 py-1.5 border text-[10px] tracking-wider uppercase font-semibold transition-all ${
                              qvSize === sz
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
                </div>

                <div className="mt-6 flex gap-4">
                  <button
                    onClick={() => {
                      addToCart({
                        product_id: quickViewProduct.id,
                        product_name: quickViewProduct.name,
                        sku: quickViewProduct.sku,
                        price: quickViewProduct.price,
                        image: (qvColor && quickViewProduct.color_images?.[qvColor]?.length > 0)
                          ? quickViewProduct.color_images[qvColor][0]
                          : quickViewProduct.images?.[0] || 'https://images.unsplash.com/photo-1594552072238-b8a33785b261',
                        size: qvSize || 'M',
                        color: qvColor || 'Default',
                        category_id: quickViewProduct.category_id,
                        collection: quickViewProduct.collection
                      }, 1);
                      setQuickViewProduct(null);
                    }}
                    className="flex-1 bg-brand-green hover:bg-brand-gold text-brand-beige hover:text-brand-green font-semibold py-3 text-xs tracking-widest uppercase border border-brand-gold transition-all duration-300"
                  >
                    Add to Bag
                  </button>
                  <button
                    onClick={() => {
                      router.push(`/shop/${quickViewProduct.id}`);
                      setQuickViewProduct(null);
                    }}
                    className="px-4 border border-brand-gold text-brand-green hover:bg-brand-gold hover:text-brand-green font-bold text-xs uppercase tracking-widest transition-all duration-300"
                  >
                    View Details
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

export default function Shop() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-brand-beige">
        <Header />
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-green" />
        </div>
        <Footer />
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
