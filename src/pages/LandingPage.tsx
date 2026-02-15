import React, { useEffect } from 'react';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import CreatorPreview from '@/components/landing/CreatorPreview';
import Footer from '@/components/landing/Footer';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

const LandingPage: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/dashboard');
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="min-h-screen bg-swiss-white dark:bg-swiss-darkBg selection:bg-swiss-blue selection:text-white dark:selection:bg-swiss-vibrantBlue transition-colors duration-300">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <CreatorPreview />

        {/* CTA Section */}
        <div className="py-32 bg-swiss-blue dark:bg-swiss-vibrantBlue border-b-2 border-black dark:border-white relative overflow-hidden transition-colors">
          {/* Abstract Shape */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-black/10 dark:bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl"></div>

          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-8">
              Ready to Upgrade<br />Your Firmware?
            </h2>
            <p className="text-white/80 font-mono text-lg mb-10 max-w-xl mx-auto">
              Join 10,000+ students mastering new skills daily. No credit card required for the starter tier.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/sign-up">
                <button className="bg-white text-black font-mono font-bold uppercase px-8 py-4 border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000] transition-all dark:bg-black dark:text-white dark:border-white dark:shadow-[4px_4px_0px_0px_#FFF] dark:hover:shadow-[6px_6px_0px_0px_#FFF]">
                  Create Free Account
                </button>
              </Link>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
