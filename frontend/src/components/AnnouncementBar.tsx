'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';

export default function AnnouncementBar() {
  const pathname = usePathname();

  // Fetch display-active coupons from the server/mock database
  const { data: coupons = [] } = useQuery<any[]>({
    queryKey: ['active-coupons'],
    queryFn: api.getActiveCoupons,
    refetchInterval: 5000 // Poll every 5 seconds to sync cross-tab/updates
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: api.getCategories,
    enabled: coupons.length > 0
  });

  const { data: productsResponse } = useQuery<any>({
    queryKey: ['announcement-products'],
    queryFn: () => api.getProducts({}),
    enabled: coupons.some((cpn: any) => cpn.applicable_type === 'category' && cpn.applicable_product_id)
  });

  const products = Array.isArray(productsResponse)
    ? productsResponse
    : productsResponse?.products || [];

  const getCouponScope = (cpn: any) => {
    if (cpn.applicable_type === 'category') {
      const categoryName = categories.find((cat: any) => cat.id === cpn.applicable_id)?.name || cpn.applicable_id;
      const productName = cpn.applicable_product_id
        ? products.find((prod: any) => prod.id === cpn.applicable_product_id)?.name || cpn.applicable_product_id
        : '';

      return productName
        ? `on Category: ${categoryName} - Product: ${productName}`
        : `on Category: ${categoryName}`;
    }

    if (cpn.applicable_type === 'collection') {
      return `on Collection: ${cpn.applicable_id}`;
    }

    return 'on All Products';
  };

  const getCouponMeta = (cpn: any) => {
    const minSpend = Number(cpn.min_cart_value || 0);
    return minSpend > 0 ? `Min Spend \u20b9${minSpend.toLocaleString('en-IN')}` : 'No Min Spend';
  };

  // Don't show on admin pages
  if (pathname.startsWith('/admin') || coupons.length === 0) return null;

  const speedClass =
    coupons.length >= 3 ? 'ticker-track-fast' : coupons.length === 1 ? 'ticker-track-slow' : '';

  return (
    <div className="w-full bg-brand-green text-brand-beige py-2.5 overflow-hidden border-b border-brand-gold/30 relative select-none z-50">
      {/* Fade edges */}
      <div
        className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #063C21 0%, transparent 100%)' }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #063C21 0%, transparent 100%)' }}
      />

      {/* Ticker - items duplicated for seamless infinite loop */}
      <div className={`ticker-track ${speedClass}`}>
        {[...coupons, ...coupons].map((cpn, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-10 text-[11px] tracking-[0.18em] font-sans-montserrat uppercase"
          >
            <span className="text-brand-gold text-base leading-none">{'\u2726'}</span>
            <span className="text-brand-beige/80">Use Code</span>
            <span className="text-brand-gold font-bold">{cpn.code}</span>
            <span className="text-brand-beige/80">for</span>
            <span className="text-brand-gold font-bold">
              {cpn.discount_type === 'percentage'
                ? `${cpn.value}% OFF`
                : `\u20b9${cpn.value} OFF`}
            </span>
            <span className="text-brand-beige/80">{getCouponScope(cpn)}</span>
            <span className="text-brand-gold/90 font-semibold">{getCouponMeta(cpn)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
