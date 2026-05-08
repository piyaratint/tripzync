import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'TripZync Cookie Policy — what cookies we use, why we use them, and how you can manage your preferences in compliance with Thailand PDPA B.E. 2562.',
}

const EFFECTIVE_DATE = '1 May 2025'

export default function CookiesPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav className="ob-nav">
        <a href="/" className="ob-nav-logo" style={{ textDecoration: 'none' }}>TRIPZYNC</a>
        <a href="/login" className="ob-nav-link">Sign in ↗</a>
      </nav>

      <article className="policy-page">
        <h1>Cookie Policy</h1>
        <div className="policy-meta">
          <span>Effective: {EFFECTIVE_DATE}</span>
          <span className="policy-badge">PDPA B.E. 2562</span>
          <span className="policy-badge">GDPR Ready</span>
        </div>

        <div className="policy-box">
          <p>
            This Cookie Policy explains what cookies and similar technologies TripZync uses, why we use them, and how you can control them. It supplements our <a href="/privacy">Privacy Policy</a> and complies with the <strong>Thailand Personal Data Protection Act B.E. 2562 (PDPA)</strong>.
          </p>
        </div>

        {/* 1. What are cookies */}
        <h2>1. What Are Cookies?</h2>
        <p>
          Cookies are small text files placed on your device by a website when you visit it. They allow the website to remember information about your visit — such as your preferred language or login state — making your next visit easier and more useful.
        </p>
        <p>
          We also use <strong>localStorage</strong>, a browser-based storage mechanism that works similarly to cookies but is never automatically sent to our servers. It is used exclusively to preserve your trip-planning progress within your browser.
        </p>

        {/* 2. Types of cookies */}
        <h2>2. Types of Cookies We Use</h2>

        <h3>2.1 Strictly Necessary Cookies</h3>
        <div className="policy-box">
          <p>
            <strong>Legal basis:</strong> Legitimate interest / Contractual necessity — these cookies are essential for the service to function. They do not require your consent under PDPA.
          </p>
        </div>
        <ul>
          <li>
            <strong>next-auth.session-token</strong> — Manages your authenticated session after sign-in. Expires when you sign out or after 30 days. Set by NextAuth.js.
          </li>
          <li>
            <strong>next-auth.csrf-token</strong> — Protects against Cross-Site Request Forgery (CSRF) attacks. Session-scoped.
          </li>
          <li>
            <strong>next-auth.callback-url</strong> — Remembers the page you were on before signing in to redirect you back. Session-scoped.
          </li>
        </ul>

        <h3>2.2 Functional Cookies &amp; Local Storage</h3>
        <div className="policy-box">
          <p>
            <strong>Legal basis:</strong> Legitimate interest — used to preserve your experience and planning progress.
          </p>
        </div>
        <ul>
          <li>
            <strong>tripzync_onboarding</strong> (localStorage) — Stores your in-progress trip plan (destination, cities, places, dates, hotel preferences) locally in your browser. <em>This data never leaves your device unless you create an account.</em> Persists until you clear browser storage or create an account.
          </li>
          <li>
            <strong>tripzync_theme</strong> (localStorage) — Stores your colour theme preference (e.g. default, ember, forest). Session-persistent.
          </li>
        </ul>

        <h3>2.3 Analytics Cookies (Optional)</h3>
        <div className="policy-box">
          <p>
            <strong>Legal basis:</strong> Consent — these require your explicit opt-in. You can withdraw consent at any time via the cookie preference panel.
          </p>
        </div>
        <p>
          TripZync currently uses only privacy-friendly, server-side analytics without third-party tracking scripts. If third-party analytics (e.g. Google Analytics) are introduced in future, this policy will be updated and your consent will be re-requested before activation.
        </p>

        <h3>2.4 Marketing Cookies (Not Used)</h3>
        <p>
          TripZync does <strong>not</strong> currently use any marketing, retargeting, or advertising cookies. We do not share your browsing behaviour with any advertising networks.
        </p>

        {/* 3. Third-party technologies */}
        <h2>3. Third-Party Technologies</h2>
        <p>The following third-party services may set their own cookies or access data when you use TripZync:</p>
        <ul>
          <li>
            <strong>Google Sign-In (accounts.google.com)</strong> — When you sign in with Google, Google may set cookies on its own domain to manage the OAuth flow. These are governed by <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google&apos;s Privacy Policy</a>.
          </li>
          <li>
            <strong>Google Fonts (fonts.googleapis.com)</strong> — Loads typefaces used in the app. Google may log the request. No personal data from TripZync is shared. See Google&apos;s policy for details.
          </li>
          <li>
            <strong>open-meteo.com</strong> — Receives your destination city name (not your personal identity) to return weather data. No cookies are set by this service on your device.
          </li>
          <li>
            <strong>Nominatim / OpenStreetMap</strong> — Receives a place name to return geographic coordinates for weather display. No cookies are set. Governed by the <a href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer">OSM Privacy Policy</a>.
          </li>
          <li>
            <strong>Vercel (hosting)</strong> — May set performance and security cookies as part of infrastructure operation. These are strictly necessary and governed by <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel&apos;s Privacy Policy</a>.
          </li>
        </ul>

        {/* 4. Your consent and rights */}
        <h2>4. Your Consent and Rights</h2>
        <p>
          Under Thailand PDPA, you have the right to consent to or refuse non-essential cookies and to withdraw that consent at any time without affecting the lawfulness of prior processing.
        </p>
        <p>
          When you first visit TripZync, a cookie notice will inform you of the cookies in use. Strictly necessary cookies are activated without consent; optional categories require your opt-in.
        </p>

        {/* 5. How to manage cookies */}
        <h2>5. How to Manage or Delete Cookies</h2>

        <h3>5.1 Browser Settings</h3>
        <p>
          You can control cookies directly through your browser settings. Most browsers allow you to:
        </p>
        <ul>
          <li>View all cookies currently stored</li>
          <li>Delete specific cookies or all cookies</li>
          <li>Block third-party cookies</li>
          <li>Set cookies to expire when you close the browser</li>
        </ul>
        <p>Refer to your browser&apos;s help documentation for instructions:</p>
        <ul>
          <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
          <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
          <li><strong>Firefox:</strong> Options → Privacy &amp; Security → Cookies and Site Data</li>
          <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
        </ul>

        <h3>5.2 Clearing localStorage</h3>
        <p>
          To remove TripZync&apos;s local storage data (your offline trip plan), open browser Developer Tools (F12), go to <em>Application → Local Storage → [tripzync domain]</em>, and delete the <code>tripzync_onboarding</code> key, or clear all site data.
        </p>

        <h3>5.3 Effect of Blocking Cookies</h3>
        <p>
          Blocking strictly necessary cookies will prevent you from signing in and using personalised features. Optional cookies can be blocked without affecting core functionality.
        </p>

        {/* 6. Data retention */}
        <h2>6. Cookie Retention Periods</h2>
        <ul>
          <li><strong>next-auth.session-token:</strong> 30 days (or until sign-out)</li>
          <li><strong>next-auth.csrf-token:</strong> Session</li>
          <li><strong>next-auth.callback-url:</strong> Session</li>
          <li><strong>tripzync_onboarding (localStorage):</strong> Until cleared by user or account creation</li>
          <li><strong>tripzync_theme (localStorage):</strong> Indefinite (user preference)</li>
        </ul>

        {/* 7. Changes */}
        <h2>7. Changes to This Cookie Policy</h2>
        <p>
          We will update this Cookie Policy whenever we add, change, or remove cookies. Material changes will be communicated via a notice on our website and, where applicable, via email. The effective date at the top of this page will always reflect the latest version.
        </p>

        {/* 8. Contact */}
        <h2>8. Contact Us</h2>
        <div className="policy-box">
          <p>
            For questions about this Cookie Policy or to exercise your PDPA rights:<br />
            <strong>Email:</strong> <a href="mailto:privacy@tripzync.com">privacy@tripzync.com</a><br />
            <strong>Subject:</strong> Cookie Policy — [Your Question]<br /><br />
            You may also refer to our full <a href="/privacy">Privacy Policy</a> for broader data protection information.
          </p>
        </div>
      </article>
    </div>
  )
}
