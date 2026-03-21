

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
              <div className="social-row">
                <a
                  className="social"
                  href="https://www.instagram.com/info.autoinsight"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  {/* instagram svg */}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 640 640"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                    style={{ pointerEvents: 'none' }}
                  >
                    <defs>
                      <linearGradient id="ig" x1="0" y1="0" x2="640" y2="640">
                        <stop stopColor="#48CAE4" />
                        <stop offset="0.5" stopColor="#0077B6" />
                        <stop offset="1" stopColor="#023e8a" />
                      </linearGradient>
                    </defs>
                    <rect width="640" height="640" rx="120" fill="url(#ig)" />
                    <path
                      fill="#fff"
                      d="M320.3 205C256.8 204.8 205.2 256.2 205 319.7C204.8 383.2 256.2 434.8 319.7 435C383.2 435.2 434.8 383.8 435 320.3C435.2 256.8 383.8 205.2 320.3 205zM319.7 245.4C360.9 245.2 394.4 278.5 394.6 319.7C394.8 360.9 361.5 394.4 320.3 394.6C279.1 394.8 245.6 361.5 245.4 320.3C245.2 279.1 278.5 245.6 319.7 245.4zM413.1 200.3C413.1 185.5 425.1 173.5 439.9 173.5C454.7 173.5 466.7 185.5 466.7 200.3C466.7 215.1 454.7 227.1 439.9 227.1C425.1 227.1 413.1 215.1 413.1 200.3zM542.8 227.5C541.1 191.6 532.9 159.8 506.6 133.6C480.4 107.4 448.6 99.2 412.7 97.4C375.7 95.3 264.8 95.3 227.8 97.4C192 99.1 160.2 107.3 133.9 133.5C107.6 159.7 99.5 191.5 97.7 227.4C95.6 264.4 95.6 375.3 97.7 412.3C99.4 448.2 107.6 480 133.9 506.2C160.2 532.4 191.9 540.6 227.8 542.4C264.8 544.5 375.7 544.5 412.7 542.4C448.6 540.7 480.4 532.5 506.6 506.2C532.8 480 541 448.2 542.8 412.3C544.9 375.3 544.9 264.5 542.8 227.5zM495 452C487.2 471.6 472.1 486.7 452.4 494.6C422.9 506.3 352.9 503.6 320.3 503.6C287.7 503.6 217.6 506.2 188.2 494.6C168.6 486.8 153.5 471.7 145.6 452C133.9 422.5 136.6 352.5 136.6 319.9C136.6 287.3 134 217.2 145.6 187.8C153.4 168.2 168.5 153.1 188.2 145.2C217.7 133.5 287.7 136.2 320.3 136.2C352.9 136.2 423 133.6 452.4 145.2C472 153 487.1 168.1 495 187.8C506.7 217.3 504 287.3 504 319.9C504 352.5 506.7 422.6 495 452z"
                    />
                  </svg>
                </a>

                <a
                  className="social"
                  href="https://www.facebook.com/share/1AnksNyKh6/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                >
                  {/* facebook svg */}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 640 640"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                    style={{ pointerEvents: 'none' }}
                  >
                    <defs>
                      <linearGradient id="fb" x1="0" y1="0" x2="640" y2="640">
                        <stop stopColor="#023e8a" />
                        <stop offset="0.6" stopColor="#0077B6" />
                        <stop offset="1" stopColor="#48CAE4" />
                      </linearGradient>
                    </defs>
                    <rect width="640" height="640" rx="120" fill="url(#fb)" />
                    <path
                      fill="#fff"
                      d="M160 96C124.7 96 96 124.7 96 160L96 480C96 515.3 124.7 544 160 544L258.2 544L258.2 398.2L205.4 398.2L205.4 320L258.2 320L258.2 286.3C258.2 199.2 297.6 158.8 383.2 158.8C399.4 158.8 427.4 162 438.9 165.2L438.9 236C432.9 235.4 422.4 235 409.3 235C367.3 235 351.1 250.9 351.1 292.2L351.1 320L434.7 320L420.3 398.2L351 398.2L351 544L480 544C515.3 544 544 515.3 544 480L544 160C544 124.7 515.3 96 480 96L160 96z"
                    />
                  </svg>
                </a>

                <a
                  className="social"
                  href="https://www.linkedin.com/company/infoautoinsight/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  {/* linkedin svg */}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 640 640"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                    style={{ pointerEvents: 'none' }}
                  >
                    <defs>
                      <linearGradient id="in" x1="0" y1="0" x2="640" y2="640">
                        <stop stopColor="#023e8a" />
                        <stop offset="0.6" stopColor="#0077B6" />
                        <stop offset="1" stopColor="#48CAE4" />
                      </linearGradient>
                    </defs>
                    <rect width="640" height="640" rx="120" fill="url(#in)" />
                    <path
                      fill="#fff"
                      d="M160 96C124.7 96 96 124.7 96 160L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 160C544 124.7 515.3 96 480 96L160 96zM165 266.2L231.5 266.2L231.5 480L165 480L165 266.2zM236.7 198.5C236.7 219.8 219.5 237 198.2 237C176.9 237 159.7 219.8 159.7 198.5C159.7 177.2 176.9 160 198.2 160C219.5 160 236.7 177.2 236.7 198.5zM413.9 480L413.9 376C413.9 351.2 413.4 319.3 379.4 319.3C344.8 319.3 339.5 346.3 339.5 374.2L339.5 480L273.1 480L273.1 266.2L336.8 266.2L336.8 295.4L337.7 295.4C346.6 278.6 368.3 260.9 400.6 260.9C467.8 260.9 480.3 305.2 480.3 362.8L480.3 480L413.9 480z"
                    />
                  </svg>
                </a>
              </div>

              <div className="footer-contact">
                <a href="mailto:info.autoinsight@gmail.com">info.autoinsight@gmail.com</a>
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
