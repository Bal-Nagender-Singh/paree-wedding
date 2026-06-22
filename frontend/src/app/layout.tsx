import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import AnnouncementBar from '@/components/AnnouncementBar';

export const metadata: Metadata = {
  title: 'Paree | Luxury Bridal & Wedding Couture Boutique',
  description: 'Step into a vision of elegance. Discover premium bridal lehengas, heritage Banarasi sarees, and custom wedding gown collections hand-crafted by expert artisans.',
  keywords: 'bridal lehenga, designer wedding sarees, luxury bridal boutique, bridal gowns, bridesmaids collections, indian wedding dress, designer suits, luxury accessories',
  openGraph: {
    title: 'Paree | Luxury Bridal & Wedding Couture',
    description: 'Bespoke hand-embroidered bridal collections representing royal heritage and contemporary glamour.',
    url: 'https://paree-couture.com',
    siteName: 'Paree Bridal',
    locale: 'en_IN',
    type: 'website'
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-beige text-brand-green-light font-sans-montserrat flex flex-col">
        <Providers>
          <AnnouncementBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
