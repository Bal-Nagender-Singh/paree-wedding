'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-brand-green text-brand-beige pt-16 pb-8 px-6 md:px-12 border-t-2 border-brand-gold">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        
        {/* Column 1: Brand Info */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-brand-gold bg-white flex items-center justify-center p-0.5">
              <img src="/logo.jpg" alt="Paree Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif-cinzel text-lg font-bold tracking-widest text-brand-beige uppercase">
                Paree
              </span>
              <span className="font-serif-cormorant italic text-[9px] tracking-wider text-brand-gold -mt-0.5">
                Fashion for angels...
              </span>
            </div>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed font-light">
            A bridal atelier crafting heirloom couture, pure raw silks, age-old dori embellishments, and bespoke wedding ensembles.
          </p>
        </div>

        {/* Column 2: Explore Collections */}
        <div className="space-y-4">
          <h3 className="font-serif-cinzel text-xs font-bold tracking-widest text-brand-gold uppercase border-b border-brand-gold/20 pb-2">Explore</h3>
          <ul className="space-y-2.5 text-xs text-neutral-300 font-light uppercase tracking-wider">
            <li><Link href="/shop" className="hover:text-brand-gold transition-colors">All Collections</Link></li>
            <li><Link href="/shop?category=cat-1" className="hover:text-brand-gold transition-colors">Bridal Lehengas</Link></li>
            <li><Link href="/shop?category=cat-2" className="hover:text-brand-gold transition-colors">Designer Sarees</Link></li>
            <li><Link href="/shop?category=cat-3" className="hover:text-brand-gold transition-colors">Gowns &amp; Anarkalis</Link></li>
            <li><Link href="/shop?category=cat-4" className="hover:text-brand-gold transition-colors">Luxury Jewellery</Link></li>
          </ul>
        </div>

        {/* Column 3: Client Care */}
        <div className="space-y-4">
          <h3 className="font-serif-cinzel text-xs font-bold tracking-widest text-brand-gold uppercase border-b border-brand-gold/20 pb-2">Care &amp; Services</h3>
          <ul className="space-y-2.5 text-xs text-neutral-300 font-light uppercase tracking-wider">
            <li><Link href="/shop" className="hover:text-brand-gold transition-colors">Shipping &amp; Returns</Link></li>
            <li><Link href="/shop" className="hover:text-brand-gold transition-colors">Bespoke &amp; Made to Measure</Link></li>
            <li><Link href="/shop" className="hover:text-brand-gold transition-colors">Sizing Consultations</Link></li>
            <li><Link href="/shop" className="hover:text-brand-gold transition-colors">Care Instructions</Link></li>
            <li><Link href="/shop" className="hover:text-brand-gold transition-colors">Virtual Store Tour</Link></li>
          </ul>
        </div>

        {/* Column 4: Contact & Locations */}
        <div className="space-y-4">
          <h3 className="font-serif-cinzel text-xs font-bold tracking-widest text-brand-gold uppercase border-b border-brand-gold/20 pb-2">Visit the Atelier</h3>
          <ul className="space-y-3.5 text-xs text-neutral-300 font-light">
            <li className="flex items-start gap-2.5">
              <MapPin size={16} className="text-brand-gold flex-shrink-0 mt-0.5" />
              <a
                href="https://maps.app.goo.gl/CE1wvSb1d9yLy7ST8"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-gold transition-colors leading-relaxed"
              >
                Metro Ln, Old Kattal Mandi, Abids,<br />Hyderabad, Telangana 500001
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone size={14} className="text-brand-gold flex-shrink-0" />
              <span>040 24655786, 9100430686</span>
            </li>
            <li className="flex items-center gap-2.5 pt-2">
              <svg className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              <a href="https://www.instagram.com/paree_wedding/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-gold underline uppercase tracking-widest text-[10px] font-bold">
                @paree_wedding
              </a>
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-brand-gold/15 flex flex-col sm:flex-row items-center justify-between text-[10px] text-neutral-400 tracking-widest uppercase">
        <p>&copy; {new Date().getFullYear()} Paree Wedding Boutique. All Rights Reserved.</p>
        <p className="mt-2 sm:mt-0">EST. PAREE · Designed for Royal Elegance</p>
      </div>
    </footer>
  );
}
