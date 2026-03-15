import React from 'react';
import { APP_NAME } from '../../constants/appConfig';

const LandingFooter = () => {
  const footerLinks = {
    Product: ['Features', 'Bible', 'Community'],
    Company: ['About', 'Contact', 'Privacy Policy', 'Terms'],
  };

  const handleScroll = (id) => {
    const section = document.getElementById(id.toLowerCase());
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="border-t border-white/10 bg-[var(--bg-main)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">

          {/* Logo & Tagline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 flex items-center justify-center">
                <img 
                  src="/icons/icon-192.png" 
                  alt="{APP_NAME} Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-bold text-lg hidden sm:inline text-white">{APP_NAME}</span>
            </div>
            <p className="text-gray-400 text-sm">
              Where faith meets community. Connect spiritually, grow together.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Product</h3>
            <ul className="space-y-2">
              {footerLinks.Product.map((link, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => handleScroll(link)}
                    className="text-gray-400 hover:text-white transition"
                  >
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Company</h3>
            <ul className="space-y-2">
              {footerLinks.Company.map((link, idx) => (
                <li key={idx}>
                  <a 
                    href={`/${link.toLowerCase().replace(/\s/g,'-')}`} 
                    className="text-gray-400 hover:text-white transition"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Connect</h3>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition">
                <span className="text-sm font-bold">f</span>
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition">
                <span className="text-sm font-bold">𝕏</span>
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition">
                <span className="text-sm font-bold">in</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Divider */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>© 2026 {APP_NAME}. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="/privacy-policy" className="hover:text-white transition">Privacy Policy</a>
              <a href="/terms-of-service" className="hover:text-white transition">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
