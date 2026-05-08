import type { MetadataRoute } from 'next'

const BASE = 'https://tripzync.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/plan', '/home', '/login', '/privacy', '/cookies'],
        disallow: ['/api/', '/dashboard', '/trips/', '/settings', '/invite/'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
