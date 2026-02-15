import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getApprovedVideos } from '@/services/videos';
import ReelCard from '@/components/feed/ReelCard';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['feed-videos'],
    queryFn: getApprovedVideos
  });

  return (
    <div className="h-[calc(100vh-4rem)] bg-swiss-white dark:bg-swiss-darkBg text-black dark:text-white transition-colors duration-300 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-full">
        <div className="flex flex-col lg:flex-row gap-12 h-full">

          {/* Main Feed Column - Scroll Snapping */}
          <div className="flex-1 min-w-0 h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar scroll-smooth">

            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-swiss-red" />
              </div>
            ) : (
              <div className="py-4 space-y-4"> {/* Padding to avoid cutting off shadows/content */}
                {videos.map((video) => (
                  <div key={video.id} className="snap-center h-[calc(100vh-6rem)] flex items-center justify-center">
                    <ReelCard video={video} />
                  </div>
                ))}

                {videos.length === 0 && (
                  <div className="h-full flex items-center justify-center font-mono text-sm text-muted-foreground">
                    No videos found. Check back later.
                  </div>
                )}

                <div className="snap-center h-24 flex items-center justify-center text-gray-500 font-mono text-sm">
                  <span>You're all caught up.</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Index;
