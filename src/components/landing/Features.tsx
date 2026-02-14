import React from 'react';
import SwissCard from './ui/SwissCard';
import { Video, Brain, Trophy, Upload, Activity, MessageSquare } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: <Video size={24} className="group-hover:scale-110 transition-transform duration-300" />,
      title: "Micro-Learning",
      subtitle: "Video Module",
      description: "2-5 minute skill-based content. No fluff, just hard skills delivered efficiently.",
      stat: "MP4 / YT"
    },
    {
      icon: <Brain size={24} className="group-hover:rotate-12 transition-transform duration-300" />,
      title: "Mandatory Quizzes",
      subtitle: "Verification",
      description: "Active recall is enforced. You cannot complete a module without passing the quiz.",
      stat: "REQ: 100%"
    },
    {
      icon: <Trophy size={24} className="group-hover:-translate-y-1 transition-transform duration-300" />,
      title: "Gamification",
      subtitle: "Incentive Layer",
      description: "Earn XP, unlock verified badges, and compete on the global leaderboard.",
      stat: "Lvl 99+"
    },
    {
      icon: <Upload size={24} className="group-hover:scale-110 transition-transform duration-300" />,
      title: "Creator Mode",
      subtitle: "Contribution",
      description: "Upload content with auto-thumbnail generation. Contribute to the knowledge base.",
      stat: "UPLOAD"
    },
    {
      icon: <Activity size={24} className="group-hover:skew-x-6 transition-transform duration-300" />,
      title: "Progress Analytics",
      subtitle: "Data Viz",
      description: "Detailed skill trees and progress bars to monitor your development velocity.",
      stat: "D3.js"
    },
    {
      icon: <MessageSquare size={24} className="group-hover:translate-x-1 transition-transform duration-300" />,
      title: "Engagement",
      subtitle: "Community",
      description: "Peer-review system with comments, likes, and quality ratings.",
      stat: "SOC_NET"
    }
  ];

  return (
    <div id="features" className="py-24 bg-swiss-gray dark:bg-[#121212] border-b-2 border-black dark:border-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 md:flex md:justify-between md:items-end">
          <div>
            <span className="font-mono text-swiss-blue dark:text-swiss-vibrantBlue font-bold uppercase tracking-widest text-sm mb-2 block">System Capabilities</span>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter dark:text-white">Core Features</h2>
          </div>
          <div className="mt-4 md:mt-0 font-mono text-xs text-right hidden md:block dark:text-gray-400">
            INDEX: 01-06<br/>
            STATUS: ACTIVE
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <SwissCard 
              key={index}
              title={feature.title} 
              subtitle={feature.subtitle}
              footer={
                <>
                  <span className="flex items-center gap-2 group-hover:text-swiss-blue dark:group-hover:text-swiss-vibrantBlue transition-colors">{feature.icon} {feature.stat}</span>
                  <span>ID_0{index + 1}</span>
                </>
              }
              className="h-full"
            >
              {feature.description}
            </SwissCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
