import React from 'react';
import { Link } from 'react-router-dom';
import Button from './ui/Button';
import { Play, TrendingUp, Smartphone, Zap } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <div className="relative bg-swiss-white dark:bg-swiss-darkBg border-b-2 border-black dark:border-white overflow-hidden transition-colors duration-300">
      {/* Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-100 dark:opacity-20" 
           style={{
             backgroundImage: 'linear-gradient(#f0f0f0 1px, transparent 1px), linear-gradient(90deg, #f0f0f0 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }}>
      </div>
      {/* Dark Mode Grid Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none hidden dark:block" 
           style={{
             backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }}>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 flex flex-col items-center text-center">
        


        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black font-sans tracking-tighter uppercase leading-[0.9] mb-8 text-swiss-black dark:text-white transition-colors">
          Learn Skills<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-swiss-blue to-swiss-blue/70 dark:from-swiss-vibrantBlue dark:to-blue-400 stroke-black dark:stroke-white text-stroke-1 dark:text-stroke-white" style={{WebkitTextStroke: '1px currentColor'}}>Not Scroll</span>
        </h1>

        <p className="max-w-2xl text-lg md:text-xl text-swiss-darkGray dark:text-gray-300 font-mono mb-10 leading-relaxed border-l-4 border-swiss-blue dark:border-swiss-vibrantBlue pl-6 text-left md:text-center md:border-l-0 md:pl-0 transition-colors">
          Short-form educational videos with mandatory quizzes. 
          <br className="hidden md:block" />
          Earn points, unlock badges, and actually learn something.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link to="/sign-up">
            <Button size="lg">Start Learning</Button>
          </Link>
          <Button variant="outline" size="lg">
            <Play size={16} className="mr-2" />
            Watch Demo
          </Button>
        </div>

        {/* Stats Strip */}
        <div className="mt-20 w-full grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-black dark:border-white shadow-hard dark:shadow-hard-white bg-white dark:bg-swiss-darkBg transition-colors">
          {/* Trend Up Box */}
          <div className="p-6 flex flex-col items-center justify-center border-b-2 md:border-b-0 md:border-r-2 border-black dark:border-white hover:bg-swiss-gray dark:hover:bg-swiss-darkGray transition-colors group stat-card">
            <div className="relative overflow-hidden mb-2">
              <TrendingUp size={32} className="text-black dark:text-white group-hover:text-swiss-blue dark:group-hover:text-swiss-vibrantBlue transition-colors animate-draw" />
            </div>
            <span className="font-sans font-black text-3xl dark:text-white">2-5m</span>
            <span className="font-mono text-xs uppercase text-gray-500 dark:text-gray-400">Video Duration</span>
          </div>

          {/* Award Box (Achievements) -> Now Smartphone (Engagement) */}
          <div className="p-6 flex flex-col items-center justify-center border-b-2 md:border-b-0 md:border-r-2 border-black dark:border-white hover:bg-swiss-gray dark:hover:bg-swiss-darkGray transition-colors group stat-card">
            <div className="relative mb-2">
              <Smartphone size={32} className="text-black dark:text-white group-hover:text-swiss-blue dark:group-hover:text-swiss-vibrantBlue transition-colors animate-vibrate relative z-10" />
            </div>
            <span className="font-sans font-black text-3xl dark:text-white">100%</span>
            <span className="font-mono text-xs uppercase text-gray-500 dark:text-gray-400">Engagement</span>
          </div>

          {/* Zap Box (XP) */}
          <div className="p-6 flex flex-col items-center justify-center hover:bg-swiss-gray dark:hover:bg-swiss-darkGray transition-colors group stat-card">
            <div className="zap-wrapper mb-2">
              {/* Base icon (solid to match others) */}
              <Zap size={32} className="text-black dark:text-white transition-colors" />
              {/* Fill layer */}
              <div className="zap-fill-layer flex items-center justify-center">
                <Zap size={32} className="text-yellow-400 fill-yellow-400" />
              </div>
            </div>
            <span className="font-sans font-black text-3xl dark:text-white">XP</span>
            <span className="font-mono text-xs uppercase text-gray-500 dark:text-gray-400">Gamified Growth</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
