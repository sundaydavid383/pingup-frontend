import React from 'react';
import { APP_NAME } from '../../constants/appConfig';

const FinalCTA = ({ onAuthClick }) => {

  return (
    <section className="py-20 bg-gradient-to-b from-[var(--bg-main)] via-blue-900/10 to-[var(--bg-main)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-2xl p-12 md:p-20 text-center hover:border-white/20 transition duration-300 hover:shadow-xl hover:shadow-blue-500/20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Grow Spiritually?
          </h2>

          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join {APP_NAME} Today — Free.
          </p>

          <button
            onClick={() => onAuthClick && onAuthClick('signup')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-10 py-4 rounded-lg font-bold text-lg transition transform hover:scale-105 active:scale-95 inline-block"
          >
            Create Free Account
          </button>

          <p className="text-gray-400 text-sm mt-6">
            No credit card required. Join thousands of believers already growing spiritually.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
