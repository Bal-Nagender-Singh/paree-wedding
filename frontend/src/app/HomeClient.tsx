'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, MapPin, Phone } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/lib/api';
import { useApp } from '@/context/AppContext';

export default function HomeClient() {
  const router = useRouter();
  const { toggleWishlist, isWishlisted, addToCart } = useApp();

  // Fetch freshly uploaded products
  const { data, isLoading } = useQuery({
    queryKey: ['freshly-uploaded-products'],
    queryFn: () => api.getProducts({ sort: 'newest', limit: 4 })
  });

  // Fetch categories dynamically
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories
  });

  // Fetch bestseller products
  const { data: bestsellerData } = useQuery({
    queryKey: ['bestseller-products'],
    queryFn: () => api.getProducts({ isBestseller: 'true' })
  });

  // Fetch premium products
  const { data: premiumData } = useQuery({
    queryKey: ['premium-products'],
    queryFn: () => api.getProducts({ isPremium: 'true' })
  });

  const featuredProducts = (data?.products || []).slice(0, 4);
  const categoriesList = categoriesData || [];
  const bestsellerProducts = bestsellerData?.products || [];
  const premiumProducts = premiumData?.products || [];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Header */}
      <Header />

      {/* 1. Fullscreen Hero Section */}
      <section className="relative w-full bg-brand-green text-brand-beige py-16 md:py-24 px-6 md:px-12 overflow-hidden border-b border-brand-gold/30">
        {/* Subtle geometric background overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FAF8F5_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6 md:space-y-8"
          >
            <div className="space-y-2">
              <span className="text-[10px] tracking-widest text-brand-gold uppercase font-bold border-l-2 border-brand-gold pl-3">
                Bridal Couture · Est. Paree
              </span>
              <h1 className="font-serif-cinzel text-4xl sm:text-5xl lg:text-6xl font-normal leading-tight">
                For the bride who <br />
                <span className="font-serif-cormorant italic text-brand-gold font-light tracking-wide">walks</span> as a vision.
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-light max-w-lg">
              Heirloom-grade hand embroidery, age-old silks and a couture promise. Discover the new <strong className="text-brand-gold font-serif-cinzel font-normal">Mehfil</strong> bridal edit.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => router.push('/shop')}
                className="bg-brand-gold hover:bg-brand-gold-hover text-brand-green font-semibold py-4 px-8 text-xs tracking-widest uppercase transition-all duration-300 border border-brand-gold hover:scale-[1.02]"
              >
                Shop the Edit
              </button>
              <button
                onClick={() => router.push('/shop?category=cat-1')}
                className="bg-transparent hover:bg-brand-beige hover:text-brand-green text-brand-gold font-semibold py-4 px-8 text-xs tracking-widest uppercase border border-brand-gold transition-all duration-300 hover:scale-[1.02]"
              >
                The Atelier
              </button>
            </div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center"
          >
            <div className="relative w-full max-w-md h-[400px] sm:h-[500px] border border-brand-gold/40 p-3 bg-brand-green-light">
              <div className="w-full h-full overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&q=80&w=800"
                  alt="Paree Royal Bride Lehenga"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-green/45 to-transparent pointer-events-none" />
              </div>
              {/* Floating emblem */}
              <div className="absolute -bottom-4 -left-4 bg-brand-gold text-brand-green p-3 border border-brand-beige shadow-lg text-center font-serif-cinzel uppercase text-[9px] tracking-widest font-semibold">
                Pure Zari Brocade
              </div>
            </div>
          </motion.div>
        </div>

        {/* Hero Bottom Stats */}
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-brand-gold/20 grid grid-cols-3 gap-4 text-center md:text-left">
          <div className="space-y-1">
            <h4 className="font-serif-cinzel text-lg sm:text-2xl font-bold text-brand-gold">480+</h4>
            <p className="text-[9px] sm:text-xs text-neutral-300 uppercase tracking-widest font-light">Handcrafted Motifs</p>
          </div>
          <div className="space-y-1 border-x border-brand-gold/20 px-2">
            <h4 className="font-serif-cinzel text-lg sm:text-2xl font-bold text-brand-gold">1.2K+</h4>
            <p className="text-[9px] sm:text-xs text-neutral-300 uppercase tracking-widest font-light">Happy Brides</p>
          </div>
          <div className="space-y-1">
            <h4 className="font-serif-cinzel text-lg sm:text-2xl font-bold text-brand-gold">100%</h4>
            <p className="text-[9px] sm:text-xs text-neutral-300 uppercase tracking-widest font-light">Heirloom Quality Silk</p>
          </div>
        </div>
      </section>

      {/* 2. Shop by Category Grid Section */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="text-center mb-8 space-y-2">
          <span className="text-[10px] tracking-widest text-brand-gold uppercase font-bold">Curated Collections</span>
          <h2 className="font-serif-cinzel text-2xl sm:text-4xl text-brand-green font-normal uppercase tracking-widest">
            Shop by Category
          </h2>
          <div className="w-16 h-0.5 bg-brand-gold mx-auto" />
        </div>

        {/* Category pill navigation */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 max-w-4xl mx-auto">
          {categoriesList.map((cat: any) => (
            <Link
              key={cat.id}
              href={`/shop/category/${cat.id}`}
              className="bg-transparent border border-brand-gold/40 hover:bg-brand-green hover:text-brand-beige hover:border-brand-green text-brand-green font-sans-montserrat font-medium text-[10px] tracking-widest uppercase py-2.5 px-6 transition-all duration-300 rounded-sm hover:scale-[1.03]"
            >
              {cat.name}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categoriesList.map((cat: any, idx: number) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              onClick={() => router.push(`/shop/category/${cat.id}`)}
              className="group cursor-pointer relative h-[360px] overflow-hidden border border-brand-gold/15 bg-white flex flex-col justify-end p-6"
            >
              <img
                src={cat.image || 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&q=80&w=600'}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Bottom gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-green via-brand-green/20 to-transparent opacity-85 pointer-events-none transition-opacity duration-300" />
              
              <div className="relative z-10 space-y-2">
                <h3 className="font-serif-cinzel text-lg text-brand-beige font-semibold uppercase tracking-wider">{cat.name}</h3>
                <span className="flex items-center text-[10px] text-brand-gold uppercase tracking-widest font-bold group-hover:underline">
                  Explore <ArrowRight size={12} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── BEST SELLING ── */}
      {bestsellerProducts.length > 0 && (
        <section className="py-20 px-6 md:px-12 bg-[#FFF9F0] border-t border-amber-100">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-12 border-b border-amber-200/60 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] tracking-widest text-amber-600 uppercase font-bold">Crowd Favourites</span>
                <h2 className="font-serif-cinzel text-2xl sm:text-4xl text-brand-green font-normal uppercase">Best Selling</h2>
              </div>
              <Link href="/shop" className="text-xs text-amber-600 font-bold tracking-widest uppercase flex items-center gap-1 hover:text-brand-green transition-colors">
                View All <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestsellerProducts.map((prod: any, idx: number) => (
                <motion.div
                  key={prod.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="group flex flex-col bg-white border border-amber-100 p-3 hover:shadow-lg transition-all duration-300"
                >
                  <div
                    onClick={() => router.push(`/shop/${prod.id}`)}
                    className="relative h-[300px] overflow-hidden bg-brand-beige cursor-pointer"
                  >
                    <img src={prod.images?.[0]} alt={prod.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute top-3 left-3 bg-amber-500 text-white text-[8px] font-bold tracking-widest uppercase px-2 py-1 rounded-sm">Best Seller</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(prod); }}
                      className={`absolute top-3 right-3 p-1.5 rounded-full shadow-md transition-colors ${
                        isWishlisted(prod.id) ? 'bg-brand-crimson text-white' : 'bg-white/80 hover:bg-white text-brand-green'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                    </button>
                  </div>
                  <div className="mt-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[9px] tracking-widest text-neutral-400 uppercase font-semibold block">{prod.sub_category}</span>
                      <h3 onClick={() => router.push(`/shop/${prod.id}`)} className="font-serif-cinzel text-xs font-bold text-brand-green uppercase tracking-wide cursor-pointer hover:text-amber-600 line-clamp-1">{prod.name}</h3>
                    </div>
                    <div className="pt-3 border-t border-amber-100 mt-3 flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-brand-green">₹{prod.price.toLocaleString('en-IN')}</span>
                        {prod.sale_price && <span className="text-[10px] text-neutral-400 line-through">₹{prod.sale_price.toLocaleString('en-IN')}</span>}
                      </div>
                      <button onClick={() => addToCart({ product_id: prod.id, product_name: prod.name, sku: prod.sku, price: prod.price, image: prod.images?.[0], size: prod.sizes?.[0] || 'M', color: prod.colors?.[0] || 'Default', category_id: prod.category_id, collection: prod.collection }, 1)} className="text-[9px] tracking-widest uppercase font-bold text-amber-600 hover:text-brand-green transition-colors">
                        + Quick Add
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PREMIUM PICKS ── */}
      {premiumProducts.length > 0 && (
        <section className="py-20 px-6 md:px-12 bg-brand-green">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-12 border-b border-brand-gold/30 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] tracking-widest text-brand-gold uppercase font-bold">Exclusive Atelier</span>
                <h2 className="font-serif-cinzel text-2xl sm:text-4xl text-brand-beige font-normal uppercase">Premium Picks</h2>
              </div>
              <Link href="/shop" className="text-xs text-brand-gold font-bold tracking-widest uppercase flex items-center gap-1 hover:text-brand-beige transition-colors">
                View All <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {premiumProducts.map((prod: any, idx: number) => (
                <motion.div
                  key={prod.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="group flex flex-col bg-brand-green-light/30 border border-brand-gold/20 p-3 hover:shadow-2xl hover:border-brand-gold/60 transition-all duration-300"
                >
                  <div
                    onClick={() => router.push(`/shop/${prod.id}`)}
                    className="relative h-[300px] overflow-hidden bg-brand-green/50 cursor-pointer"
                  >
                    <img src={prod.images?.[0]} alt={prod.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute top-3 left-3 bg-brand-gold text-brand-green text-[8px] font-bold tracking-widest uppercase px-2 py-1 rounded-sm">Premium</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(prod); }}
                      className={`absolute top-3 right-3 p-1.5 rounded-full shadow-md transition-colors ${
                        isWishlisted(prod.id) ? 'bg-brand-crimson text-white' : 'bg-white/20 hover:bg-white/40 text-brand-beige'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                    </button>
                  </div>
                  <div className="mt-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[9px] tracking-widest text-brand-gold/70 uppercase font-semibold block">{prod.sub_category}</span>
                      <h3 onClick={() => router.push(`/shop/${prod.id}`)} className="font-serif-cinzel text-xs font-bold text-brand-beige uppercase tracking-wide cursor-pointer hover:text-brand-gold line-clamp-1">{prod.name}</h3>
                    </div>
                    <div className="pt-3 border-t border-brand-gold/20 mt-3 flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-brand-gold">₹{prod.price.toLocaleString('en-IN')}</span>
                        {prod.sale_price && <span className="text-[10px] text-brand-beige/40 line-through">₹{prod.sale_price.toLocaleString('en-IN')}</span>}
                      </div>
                      <button onClick={() => addToCart({ product_id: prod.id, product_name: prod.name, sku: prod.sku, price: prod.price, image: prod.images?.[0], size: prod.sizes?.[0] || 'M', color: prod.colors?.[0] || 'Default', category_id: prod.category_id, collection: prod.collection }, 1)} className="text-[9px] tracking-widest uppercase font-bold text-brand-gold hover:text-brand-beige transition-colors">
                        + Quick Add
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20 bg-brand-beige border-t border-brand-gold/20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12 border-b border-brand-gold/20 pb-4">
            <div className="space-y-1">
              <span className="text-[10px] tracking-widest text-brand-gold uppercase font-bold">The Mehfil Edit</span>
              <h2 className="font-serif-cinzel text-2xl sm:text-4xl text-brand-green font-normal uppercase">
                Couture, freshly draped
              </h2>
            </div>
            <Link href="/shop" className="text-xs text-brand-gold font-bold tracking-widest uppercase flex items-center gap-1 hover:text-brand-green transition-colors">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="animate-pulse space-y-4">
                  <div className="bg-neutral-200 h-[320px] w-full" />
                  <div className="h-4 bg-neutral-200 w-2/3" />
                  <div className="h-4 bg-neutral-200 w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((prod: any, idx: number) => {
                const isFeaturedBadge = prod.is_featured && idx === 0;
                const isBestsellerBadge = prod.is_bestseller && idx === 1;
                const isNewBadge = idx === 2;

                return (
                  <motion.div
                    key={prod.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="group flex flex-col h-full bg-white border border-brand-gold/15 p-3 hover:shadow-lg transition-all duration-300"
                  >
                    <div
                      onClick={() => router.push(`/shop/${prod.id}`)}
                      className="relative h-[320px] overflow-hidden bg-brand-beige cursor-pointer"
                    >
                      <img
                        src={prod.images?.[0]}
                        alt={prod.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      
                      {/* Interactive Badges */}
                      {isFeaturedBadge && (
                        <span className="absolute top-3 left-3 bg-brand-green text-brand-beige text-[8px] font-bold tracking-widest uppercase px-2 py-1 rounded-sm">
                          Couture
                        </span>
                      )}
                      {isBestsellerBadge && (
                        <span className="absolute top-3 left-3 bg-brand-green text-brand-beige text-[8px] font-bold tracking-widest uppercase px-2 py-1 rounded-sm">
                          Bestseller
                        </span>
                      )}
                      {isNewBadge && (
                        <span className="absolute top-3 left-3 bg-brand-green text-brand-beige text-[8px] font-bold tracking-widest uppercase px-2 py-1 rounded-sm">
                          New
                        </span>
                      )}

                      {/* Heart Wishlist Trigger */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(prod);
                        }}
                        className={`absolute top-3 right-3 p-1.5 rounded-full shadow-md transition-colors ${
                          isWishlisted(prod.id)
                            ? 'bg-brand-crimson text-white'
                            : 'bg-white/80 hover:bg-white text-brand-green'
                        }`}
                        title={isWishlisted(prod.id) ? 'Remove from wishlist' : 'Save for later'}
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] tracking-widest text-neutral-400 uppercase font-semibold block">{prod.sub_category}</span>
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
                          + Quick Add
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 4. The Paree Promise */}
      <section className="py-16 bg-brand-green text-brand-beige px-6 md:px-12 border-y border-brand-gold/30">
        <div className="max-w-7xl mx-auto text-center space-y-10">
          <div className="space-y-2">
            <span className="font-serif-cormorant italic text-sm tracking-widest text-brand-gold">The Paree Promise</span>
            <h2 className="font-serif-cinzel text-xl sm:text-2xl font-light uppercase tracking-widest">
              Every stitch tells the story of <span className="font-serif-cormorant italic text-brand-gold font-light lowercase">her</span> day.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-3 p-4 border border-brand-gold/10 hover:border-brand-gold/35 transition-colors rounded-sm">
              <h3 className="font-serif-cinzel text-xs font-bold text-brand-gold tracking-widest uppercase">Hand Embroidered</h3>
              <p className="text-xs text-neutral-300 font-light leading-relaxed">
                Every motif laid by artisan hands across Lucknow & Surat, preserving traditional gold thread zardozi heritage.
              </p>
            </div>
            <div className="space-y-3 p-4 border border-brand-gold/10 hover:border-brand-gold/35 transition-colors rounded-sm">
              <h3 className="font-serif-cinzel text-xs font-bold text-brand-gold tracking-widest uppercase">Made to Measure</h3>
              <p className="text-xs text-neutral-300 font-light leading-relaxed">
                Bespoke fittings at our studio or virtually from anywhere in the world, overseen by master draping designers.
              </p>
            </div>
            <div className="space-y-3 p-4 border border-brand-gold/10 hover:border-brand-gold/35 transition-colors rounded-sm">
              <h3 className="font-serif-cinzel text-xs font-bold text-brand-gold tracking-widest uppercase">Heirloom Quality</h3>
              <p className="text-xs text-neutral-300 font-light leading-relaxed">
                Pure silks, real metallic zari threads, and a lifetime care guarantee to preserve your gown for generations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Visit the Atelier */}
      <section className="py-20 bg-[#FAF8F5] border-t border-brand-gold/10 px-6 md:px-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-[10px] tracking-widest text-brand-gold uppercase font-bold">Discover Paree</span>
            <h2 className="font-serif-cinzel text-2xl sm:text-3xl text-brand-green font-normal uppercase tracking-widest">
              Our Flagship Atelier
            </h2>
            <div className="w-16 h-0.5 bg-brand-gold mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border border-brand-gold/25 shadow-2xl max-w-4xl mx-auto overflow-hidden bg-white rounded-sm group">
            {/* Design Column (Left) */}
            <div className="md:col-span-6 bg-brand-beige p-8 sm:p-12 flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[350px]">
              {/* CSS Decorative background design: geometric gold circles and fine lines */}
              <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#8C7248_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-brand-gold/10 pointer-events-none scale-90" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-brand-gold/5 pointer-events-none scale-95" />
              
              <div className="my-auto space-y-6 relative z-10">
                <span className="text-[10px] tracking-[0.25em] text-brand-gold uppercase font-bold block">
                  Heritage Showroom
                </span>
                
                {/* CSS Styled Emblem */}
                <div className="w-16 h-16 rounded-full border border-brand-gold/30 flex items-center justify-center mx-auto bg-white/50 backdrop-blur-sm group-hover:scale-105 transition-transform duration-500">
                  <span className="font-serif-cinzel text-lg text-brand-green font-normal tracking-wider">P</span>
                </div>

                <h3 className="font-serif-cinzel text-xl text-brand-green font-normal uppercase tracking-widest leading-relaxed">
                  Paree <br />
                  <span className="font-serif-cormorant italic text-brand-gold text-lg capitalize font-light">Abids Atelier</span>
                </h3>
                
                <p className="font-sans text-xs text-neutral-600 leading-relaxed font-light max-w-xs mx-auto">
                  Experience personal bridal draping, bespoke consultation, and explore hand-embroidered wedding couture.
                </p>
              </div>
            </div>

            {/* Address Column (Right) */}
            <div className="md:col-span-6 bg-brand-green text-brand-beige p-8 sm:p-12 flex flex-col justify-between relative border-t md:border-t-0 md:border-l border-brand-gold/10">
              {/* Decorative Corner Borders for Premium feel */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-brand-gold/30" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-brand-gold/30" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-brand-gold/30" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-brand-gold/30" />

              <div className="space-y-6 relative z-10">
                <div>
                  <h3 className="font-serif-cinzel text-lg text-brand-gold uppercase tracking-wider font-semibold">
                    Paree Wedding Collection
                  </h3>
                  <p className="font-serif-cormorant italic text-xs text-neutral-300 mt-1">
                    Atelier & Bridal Showroom
                  </p>
                </div>

                <div className="space-y-4 text-xs text-neutral-200 leading-relaxed font-light">
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-brand-gold shrink-0 mt-0.5" />
                    <span>
                      Metro Ln, Old Kattal Mandi, Abids,<br />
                      Hyderabad, Telangana 500001
                    </span>
                  </div>
                  
                  <div className="border-t border-brand-gold/15 pt-4 mt-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <Phone size={14} className="text-brand-gold shrink-0" />
                      <span className="font-sans text-xs text-neutral-200">
                        040 24655786, 9100430686
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 font-light leading-relaxed border-t border-brand-gold/15 pt-4">
                  Step into our private showroom to explore hand-embroidered heritage couture, schedule custom fittings, and design your bespoke dream ensemble.
                </p>
              </div>

              <a 
                href="https://maps.app.goo.gl/CE1wvSb1d9yLy7ST8" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-8 bg-brand-gold hover:bg-brand-gold-hover text-brand-green font-semibold py-4 px-8 text-[9px] tracking-widest uppercase transition-all duration-300 border border-brand-gold hover:scale-[1.02] inline-flex items-center justify-center gap-2 relative z-10"
              >
                Get Directions
                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
