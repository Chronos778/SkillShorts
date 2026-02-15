import React from 'react';
import { MockVideo } from '@/data/mockFeed';
import { Play, Clock, MoreVertical } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface VideoCardProps {
    video: MockVideo;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="group flex flex-col md:flex-row gap-4 mb-8 bg-swiss-white dark:bg-swiss-black/50 p-4 rounded-xl border border-transparent hover:border-swiss-gray/20 dark:hover:border-white/10 transition-colors"
        >
            {/* Thumbnail Container */}
            <Link to={`/video/${video.id}`} className="relative block w-full md:w-[320px] aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-neutral-900">
                <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Progress Bar */}
                {video.progress && video.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                        <div className="h-full bg-swiss-blue dark:bg-swiss-vibrantBlue" style={{ width: `${video.progress}%` }} />
                    </div>
                )}
                {/* Dynamic Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ opacity: 1, scale: 1 }}
                        className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                        <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                    </motion.div>
                </div>
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-[10px] font-mono font-bold text-white">
                    {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}
                </div>
            </Link>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-start py-1">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <Link to={`/video/${video.id}`}>
                            <h3 className="text-xl font-bold leading-tight group-hover:text-swiss-blue dark:group-hover:text-swiss-vibrantBlue transition-colors line-clamp-2">
                                {video.title}
                            </h3>
                        </Link>
                        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-wide">
                            <span>{video.category?.name}</span>
                            <span>•</span>
                            <span>{video.creator?.name}</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                </div>

                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 max-w-2xl">
                    {video.description}
                </p>

                {/* Action / State */}
                <div className="mt-auto pt-4 flex items-center gap-4">
                    {video.progress ? (
                        <span className="text-xs font-semibold text-swiss-blue dark:text-swiss-vibrantBlue flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            RESUME {video.progress}%
                        </span>
                    ) : (
                        <span className="text-xs text-muted-foreground">
                            {Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(video.view_count || 0)} views
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default VideoCard;
