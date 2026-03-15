import React from 'react';
import { APP_NAME } from '../../constants/appConfig';

const ScriptureImpact = ({ onAuthClick }) => {
  return (
    <section id="bible" className="relative py-24 bg-gradient-to-b from-[var(--bg-main)] via-blue-900/20 to-[var(--bg-main)] overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-blue-600/5 to-blue-500/5"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Quoted Scripture */}
        <div className="text-center space-y-8">
          <blockquote className="space-y-4">
            <p className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-white">
              "For where two or three gather in My name, there am I with them."
            </p>
            <p className="text-xl text-blue-400 font-semibold">
              — Matthew 18:20
            </p>
          </blockquote>

          {/* Impact text */}
          <div className="space-y-4">
            <p className="text-xl md:text-2xl text-gray-300">
              Now imagine thousands gathering daily.
            </p>
            <p className="text-gray-400 max-w-2xl mx-auto">
              On {APP_NAME}, believers from around the world connect, pray, and grow together. Every shared scripture, every encouraging comment, and every prayer request builds our global faith community.
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => onAuthClick && onAuthClick('signup')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-10 py-4 rounded-lg font-semibold transition transform hover:scale-105 active:scale-95 inline-block mt-8"
          >
            Join the Gathering
          </button>
        </div>
      </div>
    </section>
  );
};

export default ScriptureImpact;
