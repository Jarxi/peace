import { Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function Footer() {
  return (
    <footer className="bg-black text-white w-full">
      <div className="content-container flex flex-col w-full">
        {/* Main footer navigation - 4 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12 border-b border-gray-700">
          {/* Shop Column */}
          <div className="flex flex-col gap-y-4">
            <h3 className="text-base font-semibold">Shop</h3>
            <ul className="flex flex-col gap-y-2 text-sm">
              <li>
                <LocalizedClientLink href="/categories/mens" className="hover:underline">
                  Mens
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/categories/womens" className="hover:underline">
                  Womens
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/categories/workwear" className="hover:underline">
                  Workwear
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/categories/kids" className="hover:underline">
                  Kids
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/gift-cards" className="hover:underline">
                  Gift Cards
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/promotions" className="hover:underline">
                  Discounts & Promotions
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/pro" className="hover:underline">
                  Outfit Your Work Crew with Rockrooster PRO
                </LocalizedClientLink>
              </li>
            </ul>
          </div>

          {/* Get Help Column */}
          <div className="flex flex-col gap-y-4">
            <h3 className="text-base font-semibold">Get Help</h3>
            <ul className="flex flex-col gap-y-2 text-sm">
              <li>
                <LocalizedClientLink href="/account/orders" className="hover:underline">
                  Order Status
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/returns" className="hover:underline">
                  Returns
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/contact" className="hover:underline">
                  Contact Us
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/help" className="hover:underline">
                  Help Center
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/shipping" className="hover:underline">
                  Shipping
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/warranty" className="hover:underline">
                  Warranty
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/accessibility" className="hover:underline">
                  Accessibility
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/privacy-choices" className="hover:underline">
                  Your Privacy Choices
                </LocalizedClientLink>
              </li>
            </ul>
          </div>

          {/* My Account Column */}
          <div className="flex flex-col gap-y-4">
            <h3 className="text-base font-semibold">My Account</h3>
            <ul className="flex flex-col gap-y-2 text-sm">
              <li>
                <LocalizedClientLink href="/community" className="hover:underline">
                  Rockrooster Community
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/account/orders" className="hover:underline">
                  Order Status
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/returns" className="hover:underline">
                  Returns
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/account/favorites" className="hover:underline">
                  Favorites
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/birthday-discount" className="hover:underline">
                  Birthday Discount
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/account" className="hover:underline">
                  Sign In
                </LocalizedClientLink>
              </li>
            </ul>
          </div>

          {/* About Column */}
          <div className="flex flex-col gap-y-4">
            <h3 className="text-base font-semibold">About</h3>
            <ul className="flex flex-col gap-y-2 text-sm">
              <li>
                <LocalizedClientLink href="/about" className="hover:underline">
                  Our Story
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/responsibility" className="hover:underline">
                  Responsibility
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/releases" className="hover:underline">
                  Releases
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/newsroom" className="hover:underline">
                  Newsroom
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/careers" className="hover:underline">
                  Careers
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/investors" className="hover:underline">
                  Investor Relations
                </LocalizedClientLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Find a Store & Social Media Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 py-12 border-b border-gray-700">
          {/* Find a Store */}
          <div className="flex flex-col gap-y-3">
            <h3 className="text-lg font-semibold">Find a Store</h3>
            <p className="text-sm text-gray-400">Find a Rockrooster store nearby</p>
            <LocalizedClientLink
              href="/stores"
              className="bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-gray-200 inline-block text-center max-w-fit"
            >
              Store Locator
            </LocalizedClientLink>
          </div>

          {/* Social Media */}
          <div className="flex flex-col gap-y-3">
            <h3 className="text-lg font-semibold">Follow Rockrooster</h3>
            <div className="flex gap-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-400"
                aria-label="Facebook"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-400"
                aria-label="Instagram"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-400"
                aria-label="YouTube"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Legal Links & Bottom */}
        <div className="flex flex-col gap-y-4 py-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-x-2">
            <LocalizedClientLink
              href="/"
              className="text-xl font-bold hover:text-gray-400"
            >
              Rockrooster
            </LocalizedClientLink>
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-400">
            <LocalizedClientLink href="/trademarks" className="hover:underline">
              Trademarks
            </LocalizedClientLink>
            <LocalizedClientLink href="/patents" className="hover:underline">
              Patents
            </LocalizedClientLink>
            <LocalizedClientLink href="/terms" className="hover:underline">
              Terms of Use
            </LocalizedClientLink>
            <LocalizedClientLink href="/privacy" className="hover:underline">
              Privacy
            </LocalizedClientLink>
            <LocalizedClientLink href="/security" className="hover:underline">
              Security
            </LocalizedClientLink>
            <LocalizedClientLink href="/counterfeit" className="hover:underline">
              Counterfeit Reporting
            </LocalizedClientLink>
            <LocalizedClientLink href="/ca-supply-chains" className="hover:underline">
              CA Supply Chains Act
            </LocalizedClientLink>
            <LocalizedClientLink href="/slavery-act" className="hover:underline">
              US Slavery Act
            </LocalizedClientLink>
            <LocalizedClientLink href="/modern-slavery" className="hover:underline">
              Modern Slavery Statement
            </LocalizedClientLink>
          </div>

          {/* Privacy Choices & Notice */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-400">
            <LocalizedClientLink href="/privacy-choices" className="hover:underline flex items-center gap-x-1">
              Your Privacy Choices
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </LocalizedClientLink>
            <LocalizedClientLink href="/notice-collection" className="hover:underline">
              Notice at Collection
            </LocalizedClientLink>
          </div>

          {/* Country Selector & Copyright */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-700">
            <Text className="text-xs text-gray-400">
              © {new Date().getFullYear()} Rockrooster Store. All rights reserved.
            </Text>
            <button className="flex items-center gap-x-2 text-xs text-gray-400 hover:text-white">
              <span className="text-base">🇺🇸</span>
              <span>EN | Change Location</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
