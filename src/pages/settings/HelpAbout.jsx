import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const HelpAbout = ({ isEmbedded = false }) => {
  const navigate = useNavigate();

  const helpLinks = [
    {
      id: 'help-center',
      label: 'Help Center',
      description: 'Browse FAQs and guides',
      url: 'https://help.example.com'
    },
    {
      id: 'contact-support',
      label: 'Contact Support',
      description: 'Get help from our team',
      url: 'mailto:support@example.com'
    },
    {
      id: 'terms',
      label: 'Terms & Conditions',
      description: 'Read our terms of service',
      url: 'https://example.com/terms'
    },
    {
      id: 'privacy',
      label: 'Privacy Policy',
      description: 'Review our privacy practices',
      url: 'https://example.com/privacy'
    }
  ];

  const appInfo = {
    name: 'SpringsConnect',
    version: '1.0.0',
    buildNumber: '2026.02.01',
    lastUpdated: 'February 1, 2026'
  };

  return (
    <div>
      {!isEmbedded && (
        <div className="max-w-2xl mx-auto p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:opacity-70 transition"
              style={{ backgroundColor: 'var(--form-bg)' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-main)' }}>
              Help & About
            </h1>
          </div>
        </div>
      )}
      <div className={!isEmbedded ? 'max-w-2xl mx-auto p-4 md:p-6' : ''}>
        {/* Help Links */}
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-main)' }}>
            Need Help?
          </h2>
          <div className="space-y-3">
            {helpLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-lg transition hover:scale-[1.02]"
                style={{
                  backgroundColor: 'var(--form-bg)',
                  border: '1px solid var(--input-border)'
                }}
              >
                <div className="text-left">
                  <p className="font-medium" style={{ color: 'var(--text-main)' }}>
                    {link.label}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {link.description}
                  </p>
                </div>
                <ExternalLink className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
              </a>
            ))}
          </div>
        </div>

        {/* About App */}
        <div className="border-t pt-8" style={{ borderColor: 'var(--input-border)' }}>
          <h2 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-main)' }}>
            About {appInfo.name}
          </h2>
          <div
            className="p-6 rounded-lg text-center space-y-3"
            style={{
              backgroundColor: 'var(--form-bg)',
              border: '1px solid var(--input-border)'
            }}
          >
            <h3 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>
              {appInfo.name}
            </h3>
            <div className="space-y-2" style={{ color: 'var(--text-secondary)' }}>
              <p>
                <span className="font-medium">Version:</span> {appInfo.version}
              </p>
              <p>
                <span className="font-medium">Build:</span> {appInfo.buildNumber}
              </p>
              <p>
                <span className="font-medium">Last Updated:</span> {appInfo.lastUpdated}
              </p>
            </div>
            <p
              className="text-sm pt-4"
              style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--input-border)' }}
            >
              Connecting spiritually, sharing scriptures, and growing with SpringsConnect.
            </p>
          </div>
        </div>

        {/* Development Info */}
        <div className="mt-8 text-center">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            © 2024-2026 Newsprings Youth. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );

export default HelpAbout;
