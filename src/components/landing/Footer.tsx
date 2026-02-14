import React, { useEffect, useState } from 'react';
import { Github, Twitter, Linkedin, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check initial theme
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

  return (
    <footer className="bg-swiss-black dark:bg-[#050505] text-white py-16 border-t-2 border-black dark:border-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-swiss-blue dark:bg-swiss-vibrantBlue border-2 border-white flex items-center justify-center">
                 <span className="text-white font-bold font-mono text-lg">S</span>
              </div>
              <span className="font-sans font-black text-2xl uppercase tracking-tighter">SkillClip</span>
            </div>
            <p className="font-mono text-sm text-gray-400 max-w-sm mb-6">
              A verified educational platform designed for the modern attention span.
              Learn fast, test often, retain more.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 border border-gray-600 hover:bg-white hover:text-black transition-colors"><Twitter size={18} /></a>
              <a href="#" className="p-2 border border-gray-600 hover:bg-white hover:text-black transition-colors"><Github size={18} /></a>
              <a href="#" className="p-2 border border-gray-600 hover:bg-white hover:text-black transition-colors"><Linkedin size={18} /></a>
            </div>
          </div>

          <div>
            <h4 className="font-mono font-bold text-swiss-blue dark:text-swiss-vibrantBlue mb-6 uppercase">Platform</h4>
            <ul className="space-y-3 font-sans text-sm text-gray-300">
              <li><Link to="/browse" className="hover:text-white hover:underline decoration-2 underline-offset-4">Browse Skills</Link></li>
              <li><Link to="/dashboard" className="hover:text-white hover:underline decoration-2 underline-offset-4">Leaderboard</Link></li>
              <li><Link to="/pricing" className="hover:text-white hover:underline decoration-2 underline-offset-4">Pricing</Link></li>
              <li><Link to="/teams" className="hover:text-white hover:underline decoration-2 underline-offset-4">For Teams</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono font-bold text-swiss-blue dark:text-swiss-vibrantBlue mb-6 uppercase">Legal</h4>
            <ul className="space-y-3 font-sans text-sm text-gray-300">
              <li><Link to="/privacy" className="hover:text-white hover:underline decoration-2 underline-offset-4">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white hover:underline decoration-2 underline-offset-4">Terms of Service</Link></li>
              <li><Link to="/cookies" className="hover:text-white hover:underline decoration-2 underline-offset-4">Cookie Data</Link></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center font-mono text-xs text-gray-500 uppercase">
          <div>© 2024 SkillClip Inc. All Rights Reserved.</div>
          <div className="mt-4 md:mt-0 flex gap-4 items-center">
            <span>System Status: <span className="text-green-500">Normal</span></span>
            <span className="hidden sm:inline">|</span>
            <button 
                onClick={toggleTheme} 
                className="flex items-center gap-2 hover:text-white transition-colors"
                aria-label="Toggle Dark Mode"
            >
                {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
                <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
