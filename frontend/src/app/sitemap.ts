import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://paree-couture.com';

  // Static URLs
  const routes = [
    '',
    '/shop',
    '/wishlist',
    '/dashboard'
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8
  }));

  // Emulate dynamic category routes mapping
  const categories = ['bridal-lehengas', 'wedding-sarees', 'gowns-anarkalis', 'jewellery'].map(slug => ({
    url: `${baseUrl}/shop?category=${slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.6
  }));

  return [...routes, ...categories];
}
