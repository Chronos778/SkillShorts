import React from 'react';
import { MOCK_FEED_VIDEOS } from '@/data/mockFeed';
import ReelCard from '@/components/feed/ReelCard';
import FeedSidebar from '@/components/feed/FeedSidebar';

const Index = () => {
  return (
    <div className="h-[calc(100vh-4rem)] bg-swiss-white dark:bg-swiss-darkBg text-black dark:text-white transition-colors duration-300 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-full">
        <div className="flex flex-col lg:flex-row gap-12 h-full">

          {/* Main Feed Column - Scroll Snapping */}
          <div className="flex-1 min-w-0 h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar scroll-smooth">

            <div className="py-4 space-y-4"> {/* Padding to avoid cutting off shadows/content */}
              {MOCK_FEED_VIDEOS.map((video) => (
                <div key={video.id} className="snap-center h-[calc(100vh-6rem)] flex items-center justify-center">
                  <ReelCard video={video} />
                </div>
              ))}

              <div className="snap-center h-24 flex items-center justify-center text-gray-500 font-mono text-sm">
                <span>You're all caught up.</span>
              </div>
            </div>
          </div>



        </div>
      </div>
    </div>
  );
};

export default Index;
