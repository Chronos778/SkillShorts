import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './ui/Button';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-swiss-white/90 dark:bg-swiss-darkBg/90 backdrop-blur-md border-b-2 border-black dark:border-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
              <div className="w-10 h-10 bg-swiss-blue dark:bg-swiss-vibrantBlue border-2 border-black dark:border-white flex items-center justify-center shadow-hard-sm dark:shadow-hard-sm-white group-hover:shadow-hard dark:group-hover:shadow-hard-white transition-all">
                <span className="text-white font-bold font-mono text-xl">S</span>
              </div>
              <div className="flex flex-col">
                <span className="font-sans font-black text-xl tracking-tighter uppercase leading-none dark:text-white">SkillShorts</span>
                <span className="font-mono text-[10px] text-swiss-darkGray dark:text-gray-400">SYSTEM / v2.0</span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="font-mono text-xs text-gray-400">CMD_K</span>
              </div>
              <input
                type="text"
                disabled
                placeholder="SEARCH DATABASE..."
                className="pl-16 pr-4 py-2 border-2 border-black dark:border-white font-mono text-xs w-64 bg-swiss-gray dark:bg-swiss-darkGray dark:text-white focus:outline-none cursor-not-allowed opacity-70"
              />
            </div>

            <a href="#features" className="font-mono text-sm uppercase hover:text-swiss-blue dark:text-gray-200 dark:hover:text-swiss-vibrantBlue transition-colors font-bold">Features</a>
            <a href="#creators" className="font-mono text-sm uppercase hover:text-swiss-blue dark:text-gray-200 dark:hover:text-swiss-vibrantBlue transition-colors font-bold">Creators</a>
            <div className="h-6 w-[2px] bg-black dark:bg-white mx-4"></div>
            <Link to="/sign-in" className="font-mono text-sm uppercase hover:text-swiss-blue dark:text-gray-200 dark:hover:text-swiss-vibrantBlue transition-colors font-bold">Log In</Link>
            <Link to="/sign-up">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 border-2 border-black dark:border-white dark:text-white hover:bg-swiss-gray dark:hover:bg-swiss-darkGray"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t-2 border-black dark:border-white bg-swiss-white dark:bg-swiss-darkBg absolute w-full shadow-hard dark:shadow-hard-white">
          <div className="px-4 pt-4 pb-6 space-y-4">
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="SEARCH DATABASE..."
                className="w-full pl-4 pr-4 py-3 border-2 border-black dark:border-white font-mono text-xs bg-swiss-gray dark:bg-swiss-darkGray dark:text-white focus:outline-none"
              />
            </div>
            <a href="#features" className="block px-3 py-2 text-base font-bold font-mono uppercase border-l-4 border-transparent hover:border-swiss-blue dark:text-white hover:bg-swiss-gray dark:hover:bg-swiss-darkGray">Features</a>
            <a href="#creators" className="block px-3 py-2 text-base font-bold font-mono uppercase border-l-4 border-transparent hover:border-swiss-blue dark:text-white hover:bg-swiss-gray dark:hover:bg-swiss-darkGray">Creators</a>
            <Link to="/sign-in" className="block px-3 py-2 text-base font-bold font-mono uppercase border-l-4 border-transparent hover:border-swiss-blue dark:text-white hover:bg-swiss-gray dark:hover:bg-swiss-darkGray">Log In</Link>
            <div className="pt-4">
              <Link to="/sign-up" className="w-full block">
                <Button fullWidth>Initialize System</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
