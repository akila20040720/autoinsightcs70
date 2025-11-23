

/**
 * Footer (plain CSS version)
 * - Uses your design tokens / semantic classes (pro-footer, footer-inner, f-col, etc.)
 * - Does NOT rely on Tailwind
 * - Drop this component into your app and include the CSS you provided
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="footer pro-footer"
      role="contentinfo"
      aria-label="AutoInsight footer"
    >
      <div className="footer-inner">
        <div className="footer-top">
          {/* Brand */}
          <div className="footer-brand">
            <h3 className="footer-logo" aria-label="AutoInsight brand">
              AutoInsight
            </h3>
            <p className="footer-tagline">
              Vehicle market analytics for Sri Lanka — pricing, trends &amp;
              actionable insights.
            </p>

            <div className="footer-social">
              <div className="social-row" aria-hidden>
                <a
                  className="social"
                  href="https://www.linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  {/* linkedin svg */}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <rect width="24" height="24" rx="4" fill="url(#gLinked)" />
                    <path
                      d="M8 17H5.5V9H8v8Zm-1.25-9.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5ZM19 17h-2.4v-4.1c0-1.01-.37-1.7-1.29-1.7-.7 0-1.12.47-1.3.93-.07.16-.09.39-.09.62V17h-2.4V9H14v1.13c.32-.5.9-1.3 2.17-1.3 1.58 0 2.83.98 2.83 3.3V17Z"
                      fill="#fff"
                    />
                    <defs>
                      <linearGradient
                        id="gLinked"
                        x1="0"
                        y1="0"
                        x2="24"
                        y2="24"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#3681f7" />
                        <stop offset="0.6" stopColor="#8b5cf6" />
                        <stop offset="1" stopColor="#f9d97c" />
                      </linearGradient>
                    </defs>
                  </svg>
                </a>

                <a
                  className="social"
                  href="https://www.instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  {/* instagram svg */}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <defs>
                      <linearGradient id="ig" x1="0" y1="0" x2="24" y2="24">
                        <stop stopColor="#f9d97c" />
                        <stop offset="0.5" stopColor="#8b5cf6" />
                        <stop offset="1" stopColor="#3681f7" />
                      </linearGradient>
                    </defs>
                    <rect width="24" height="24" rx="6" fill="url(#ig)" />
                    <path
                      fill="#fff"
                      d="M12 8.9A3.1 3.1 0 1 0 12 15a3.1 3.1 0 0 0 0-6.2Zm0 5A1.9 1.9 0 1 1 12 9a1.9 1.9 0 0 1 0 3.8Zm3.6-5.7a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0Z"
                    />
                  </svg>
                </a>

                <a
                  className="social"
                  href="https://www.youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                >
                  {/* youtube svg */}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <defs>
                      <linearGradient id="yt" x1="0" y1="0" x2="24" y2="24">
                        <stop stopColor="#3681f7" />
                        <stop offset="0.5" stopColor="#8b5cf6" />
                        <stop offset="1" stopColor="#f9d97c" />
                      </linearGradient>
                    </defs>
                    <rect width="24" height="24" rx="4" fill="url(#yt)" />
                    <path d="M10 15.5v-7l6 3.5-6 3.5Z" fill="#fff" />
                  </svg>
                </a>
              </div>

              <div className="footer-contact">
                <a href="mailto:info@autoinsight.lk">info@autoinsight.lk</a>
              </div>
            </div>
          </div>

          {/* Sitemap columns */}
          <div className="f-col">
            <h4>Product</h4>
            <ul>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
              <li>
                <a href="#api">API</a>
              </li>
              <li>
                <a href="#guides">Guides</a>
              </li>
            </ul>
          </div>

          <div className="f-col">
            <h4>Resources</h4>
            <ul>
              <li>
                <a href="#blog">Blog</a>
              </li>
              <li>
                <a href="#sources">Data Sources</a>
              </li>
              <li>
                <a href="#faq">FAQ</a>
              </li>
              <li>
                <a href="#status">Status</a>
              </li>
            </ul>
          </div>

          <div className="f-col">
            <h4>Company</h4>
            <ul>
              <li>
                <a href="#about">About</a>
              </li>
              <li>
                <a href="#contact">Contact</a>
              </li>
              <li>
                <a href="#legal">Legal</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="legal">
            © {year} AutoInsight. All rights reserved.
          </div>

          <div className="policies">
            <a href="#terms">Terms</a>
            <a href="#privacy">Privacy</a>
            <a href="#cookies">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
