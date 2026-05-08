import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'TripZync Privacy Policy — how we collect, use, and protect your personal data in compliance with Thailand PDPA B.E. 2562 and international standards.',
}

const EFFECTIVE_DATE = '1 May 2025'
const REVIEW_DATE   = '1 May 2026'

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav className="ob-nav">
        <a href="/" className="ob-nav-logo" style={{ textDecoration: 'none' }}>TRIPZYNC</a>
        <a href="/login" className="ob-nav-link">Sign in ↗</a>
      </nav>

      <article className="policy-page">
        <h1>Privacy Policy</h1>
        <div className="policy-meta">
          <span>Effective: {EFFECTIVE_DATE}</span>
          <span>·</span>
          <span>Next review: {REVIEW_DATE}</span>
          <span className="policy-badge">PDPA B.E. 2562</span>
          <span className="policy-badge">GDPR Ready</span>
        </div>

        <div className="policy-box">
          <p>
            TripZync (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting your personal data. This Policy explains what data we collect, why we collect it, how we use and protect it, and the rights you have under the <strong>Thailand Personal Data Protection Act B.E. 2562 (PDPA)</strong> and other applicable laws.
          </p>
        </div>

        {/* 1. Data Controller */}
        <h2>1. Data Controller</h2>
        <p>The data controller responsible for your personal data is:</p>
        <div className="policy-box">
          <p>
            <strong>TripZync</strong><br />
            Contact: <a href="mailto:privacy@tripzync.com">privacy@tripzync.com</a><br />
            For PDPA inquiries or to exercise your rights, please email the address above with the subject line &ldquo;PDPA Request&rdquo;.
          </p>
        </div>

        {/* 2. Data We Collect */}
        <h2>2. Personal Data We Collect</h2>
        <h3>2.1 Data You Provide Directly</h3>
        <ul>
          <li><strong>Account information:</strong> name, email address, profile photo (via Google Sign-In)</li>
          <li><strong>Trip information:</strong> destinations, travel dates, cities, places of interest</li>
          <li><strong>Preferences:</strong> hotel loyalty program memberships, travel style preferences</li>
          <li><strong>User-generated content:</strong> logbook entries, expense records, notes</li>
        </ul>

        <h3>2.2 Data Collected Automatically</h3>
        <ul>
          <li><strong>Device &amp; browser information:</strong> browser type, operating system, screen resolution</li>
          <li><strong>Usage data:</strong> pages visited, features used, session duration, click interactions</li>
          <li><strong>Technical data:</strong> IP address, time zone, language settings</li>
          <li><strong>Cookies &amp; local storage:</strong> session tokens, onboarding state, user preferences (see <a href="/cookies">Cookie Policy</a>)</li>
        </ul>

        <h3>2.3 Data from Third Parties</h3>
        <ul>
          <li><strong>Google OAuth:</strong> when you sign in with Google, we receive your name, email, and profile picture as permitted by your Google account settings</li>
          <li><strong>Weather &amp; mapping APIs:</strong> your destination city is sent to open-meteo.com and Nominatim (OpenStreetMap) to display weather — no personal identifier is attached</li>
        </ul>

        {/* 3. Purposes and Legal Basis */}
        <h2>3. Purposes and Legal Basis for Processing</h2>
        <p>Under PDPA Section 24, we process your personal data only when we have a lawful basis:</p>
        <ul>
          <li>
            <strong>Contractual necessity</strong> — to create and manage your account, store your trip plans, and deliver the core service you requested.
          </li>
          <li>
            <strong>Consent</strong> — to send optional email updates, marketing communications, or use non-essential analytics cookies. You may withdraw consent at any time.
          </li>
          <li>
            <strong>Legitimate interests</strong> — to improve product quality, prevent fraud, and ensure platform security, provided these interests do not override your rights.
          </li>
          <li>
            <strong>Legal obligation</strong> — to comply with applicable Thai and international laws when required.
          </li>
        </ul>

        {/* 4. How We Use Your Data */}
        <h2>4. How We Use Your Data</h2>
        <ul>
          <li>Authenticating you and maintaining your session</li>
          <li>Generating personalised trip itineraries and hotel recommendations</li>
          <li>Storing and syncing your trip plans, expenses, and logbook entries</li>
          <li>Displaying real-time weather for your destination cities</li>
          <li>Improving and debugging the platform through aggregated analytics</li>
          <li>Communicating important service updates (no marketing without consent)</li>
          <li>Complying with legal and regulatory requirements</li>
        </ul>

        {/* 5. Data Sharing */}
        <h2>5. Data Sharing and Disclosure</h2>
        <p>We do <strong>not</strong> sell your personal data. We may share data only in the following circumstances:</p>
        <ul>
          <li>
            <strong>Service providers:</strong> Vercel (hosting &amp; infrastructure), Google (authentication), open-meteo.com (weather data), OpenStreetMap/Nominatim (geocoding). These providers act as data processors under contractual obligations.
          </li>
          <li>
            <strong>Legal requirements:</strong> we may disclose data when required by Thai law, court order, or government authority.
          </li>
          <li>
            <strong>Business transfers:</strong> in the event of a merger or acquisition, your data may be transferred; you will be notified in advance.
          </li>
          <li>
            <strong>With your explicit consent:</strong> any other sharing requires your specific, prior consent.
          </li>
        </ul>

        {/* 6. International Transfers */}
        <h2>6. International Data Transfers</h2>
        <p>
          TripZync is hosted on Vercel infrastructure, which may process data outside Thailand (including the United States and European Union). We ensure such transfers comply with PDPA Chapter VI and, where applicable, the EU Standard Contractual Clauses. Your data is subject to appropriate safeguards at all times.
        </p>

        {/* 7. Data Retention */}
        <h2>7. Data Retention</h2>
        <ul>
          <li><strong>Active accounts:</strong> data is retained for as long as your account is active.</li>
          <li><strong>Deleted accounts:</strong> personal data is permanently deleted within 90 days of account deletion, except where retention is required by law.</li>
          <li><strong>Guest / localStorage data:</strong> stored only in your browser and never sent to our servers. It is removed when you clear browser storage.</li>
          <li><strong>Logs:</strong> server and access logs are retained for a maximum of 12 months for security purposes.</li>
        </ul>

        {/* 8. Your Rights */}
        <h2>8. Your Rights Under PDPA</h2>
        <p>As a data subject, you have the following rights under Thailand PDPA Sections 30–43:</p>
        <div className="policy-rights-grid">
          <div className="policy-right">
            <strong>Right to Access</strong>
            <p>Request a copy of the personal data we hold about you.</p>
          </div>
          <div className="policy-right">
            <strong>Right to Rectification</strong>
            <p>Request correction of inaccurate or incomplete data.</p>
          </div>
          <div className="policy-right">
            <strong>Right to Erasure</strong>
            <p>Request deletion of your personal data where there is no lawful basis to retain it.</p>
          </div>
          <div className="policy-right">
            <strong>Right to Restriction</strong>
            <p>Request that we restrict processing of your data in certain circumstances.</p>
          </div>
          <div className="policy-right">
            <strong>Right to Data Portability</strong>
            <p>Receive your data in a structured, machine-readable format.</p>
          </div>
          <div className="policy-right">
            <strong>Right to Object</strong>
            <p>Object to processing based on legitimate interests or for direct marketing.</p>
          </div>
          <div className="policy-right">
            <strong>Right to Withdraw Consent</strong>
            <p>Withdraw consent at any time for consent-based processing, without affecting prior processing.</p>
          </div>
          <div className="policy-right">
            <strong>Right to Lodge a Complaint</strong>
            <p>File a complaint with the Personal Data Protection Committee (PDPC) of Thailand.</p>
          </div>
        </div>
        <p>
          To exercise any right, contact us at <a href="mailto:privacy@tripzync.com">privacy@tripzync.com</a>. We will respond within 30 days. We may need to verify your identity before processing your request.
        </p>

        {/* 9. Security */}
        <h2>9. Security Measures</h2>
        <p>
          We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, loss, or disclosure. These include:
        </p>
        <ul>
          <li>HTTPS/TLS encryption for all data in transit</li>
          <li>Secure OAuth 2.0 authentication via Google (no passwords stored)</li>
          <li>Environment variable isolation for sensitive credentials</li>
          <li>Access controls limiting data access to authorised personnel only</li>
          <li>Regular security reviews of our codebase and infrastructure</li>
        </ul>

        {/* 10. Children */}
        <h2>10. Children&apos;s Privacy</h2>
        <p>
          TripZync is not directed at individuals under the age of 20 (the age of majority in Thailand). We do not knowingly collect personal data from minors. If you believe a minor has provided us with data, please contact us and we will delete it promptly.
        </p>

        {/* 11. Cookies */}
        <h2>11. Cookies</h2>
        <p>
          We use cookies and similar technologies. For full details, including how to manage or opt out of cookies, please read our <a href="/cookies">Cookie Policy</a>.
        </p>

        {/* 12. Changes */}
        <h2>12. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. When we make material changes, we will notify you via email (if you have an account) and update the &ldquo;Effective&rdquo; date at the top. Continued use of TripZync after the effective date constitutes acceptance of the updated policy.
        </p>

        {/* 13. Contact */}
        <h2>13. Contact Us</h2>
        <div className="policy-box">
          <p>
            For any privacy-related questions, requests, or complaints:<br />
            <strong>Email:</strong> <a href="mailto:privacy@tripzync.com">privacy@tripzync.com</a><br />
            <strong>Subject line:</strong> PDPA Request — [Your Request Type]<br /><br />
            You also have the right to lodge a complaint with the <strong>Personal Data Protection Committee (PDPC)</strong> of Thailand if you believe your rights have not been upheld.
          </p>
        </div>
      </article>
    </div>
  )
}
