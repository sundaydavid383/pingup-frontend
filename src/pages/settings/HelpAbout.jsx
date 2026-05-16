import React from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_NAME } from '../../constants/appConfig';
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
    name: APP_NAME,
    version: '1.0.0',
    buildNumber: '2026.02.01',
    lastUpdated: 'February 1, 2026'
  };

  return (
    <div className="sr-page sr-stagger">
      {!isEmbedded && (
        <div className="max-w-2xl mx-auto p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: 'var(--form-bg)',
                border: '1px solid var(--input-border)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
              }}
            >
              <ArrowLeft
                className="w-5 h-5"
                style={{ color: 'var(--text-main)' }}
              />
            </button>

            <div>
              <h1
                className="text-2xl md:text-3xl font-bold"
                style={{
                  color: 'var(--text-main)',
                  letterSpacing: '-0.03em'
                }}
              >
                Help & About
              </h1>

              <p
                className="text-sm mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Support resources and app information
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={!isEmbedded ? 'max-w-2xl mx-auto p-4 md:p-6' : ''}>
        {/* Help Section */}
        <div className="mb-10">
          <p className="sr-section-heading">Need Help?</p>

          <div className="flex flex-col gap-3 mt-4">
            {helpLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:scale-[1.015] active:scale-[0.99]"
                style={{
                  background: 'var(--form-bg)',
                  border: '1px solid var(--input-border)',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.06)'
                }}
              >
                <div className="min-w-0">
                  <span
                    className="block font-semibold"
                    style={{
                      color: 'var(--text-main)',
                      fontSize: '0.96rem'
                    }}
                  >
                    {link.label}
                  </span>

                  <span
                    className="block mt-1 text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {link.description}
                  </span>
                </div>

                <ExternalLink
                  size={18}
                  style={{
                    color: 'var(--text-secondary)',
                    flexShrink: 0
                  }}
                />
              </a>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div
          className="my-8"
          style={{
            height: '1px',
            background:
              'linear-gradient(90deg, transparent, var(--input-border), transparent)'
          }}
        />

        {/* About Section */}
        <div>
          <p className="sr-section-heading">
            About {appInfo.name}
          </p>

          <div
            className="mt-4 rounded-3xl p-6 text-center"
            style={{
              background: 'var(--form-bg)',
              border: '1px solid var(--input-border)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
            }}
          >
            <h2
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: '1.7rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                letterSpacing: '-0.04em',
                marginBottom: '12px'
              }}
            >
              {appInfo.name}
            </h2>

            <div
              className="flex flex-col gap-2"
              style={{
                color: 'var(--text-secondary)',
                fontSize: '.88rem'
              }}
            >
              <span>
                <strong style={{ color: 'var(--text-main)' }}>
                  Version:
                </strong>{' '}
                {appInfo.version}
              </span>

              <span>
                <strong style={{ color: 'var(--text-main)' }}>
                  Build:
                </strong>{' '}
                {appInfo.buildNumber}
              </span>

              <span>
                <strong style={{ color: 'var(--text-main)' }}>
                  Last Updated:
                </strong>{' '}
                {appInfo.lastUpdated}
              </span>
            </div>

            <div
              className="my-5"
              style={{
                height: '1px',
                background:
                  'linear-gradient(90deg, transparent, var(--input-border), transparent)'
              }}
            />

            <p
              className="whitespace-pre-wrap leading-relaxed text-[0.9rem]"
              style={{
                color: 'var(--text-secondary)'
              }}
            >
              Connecting spiritually, sharing scriptures, and growing together with {APP_NAME}.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p
            className="text-xs"
            style={{
              color: 'var(--text-secondary)',
              opacity: 0.85
            }}
          >
            © 2024–2026 Newsprings Youth. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpAbout;