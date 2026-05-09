import { TripZyncLogo } from '@/components/TripZyncLogo'

const SITE_LINKS = [
  {
    heading: 'Product',
    links: [
      { label: 'Plan a Trip', href: '/plan' },
      { label: 'Guest Preview', href: '/home' },
      { label: 'Sign In', href: '/login' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  },
  {
    heading: 'Sitemap',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Plan', href: '/plan' },
      { label: 'Login', href: '/login' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Cookies', href: '/cookies' },
    ],
  },
]

export default function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        {/* Brand */}
        <div className="sf-brand">
          <TripZyncLogo href="/" />
          <p className="sf-tagline">
            Your personal travel companion. Plan smarter, explore further, remember every moment.
          </p>
          <div className="sf-badges">
            <span className="sf-badge">PDPA Compliant</span>
            <span className="sf-badge">GDPR Ready</span>
          </div>
        </div>

        {/* Link columns */}
        {SITE_LINKS.map(col => (
          <div key={col.heading} className="sf-col">
            <div className="sf-col-head">{col.heading}</div>
            <ul className="sf-links">
              {col.links.map(l => (
                <li key={l.href}>
                  <a href={l.href} className="sf-link">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="sf-bottom">
        <span>© {year} TripZync. All rights reserved.</span>
        <span className="sf-bottom-links">
          <a href="/privacy" className="sf-bottom-link">Privacy Policy</a>
          <span className="sf-dot">·</span>
          <a href="/cookies" className="sf-bottom-link">Cookie Policy</a>
          <span className="sf-dot">·</span>
          <span>Protected under Thailand PDPA B.E. 2562</span>
        </span>
      </div>
    </footer>
  )
}
