import React, { useState } from 'react';
import { MockVideo } from '@/data/mockFeed';
import { Play, Heart, MessageCircle, Share2, MoreHorizontal, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ReelCardProps {
    video: MockVideo;
}

const ReelCard: React.FC<ReelCardProps> = ({ video }) => {
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);

    return (
        <div className="relative w-full max-w-[400px] h-full max-h-[800px] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex-shrink-0 group">

            {/* Video Placeholder */}
            <div className="absolute inset-0 cursor-pointer" onClick={() => setIsPlaying(!isPlaying)}>
                <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover opacity-90"
                />
                {/* Play/Pause Overlay Icon */}
                {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Play className="w-16 h-16 fill-white text-white opacity-80" />
                    </div>
                )}
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90 pointer-events-none" />

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-20 flex flex-col gap-6 items-center z-20">
                <div className="flex flex-col items-center gap-1">
                    <Button size="icon" variant="ghost" className="rounded-full w-12 h-12 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm">
                        <Heart className="w-6 h-6 fill-white/20" />
                    </Button>
                    <span className="text-xs font-bold text-white shadow-black drop-shadow-md">
                        {Intl.NumberFormat('en-US', { notation: "compact" }).format(video.view_count || 0)}
                    </span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <Button size="icon" variant="ghost" className="rounded-full w-12 h-12 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm">
                        <MessageCircle className="w-6 h-6" />
                    </Button>
                    <span className="text-xs font-bold text-white shadow-black drop-shadow-md">124</span>
                </div>

                <Button size="icon" variant="ghost" className="rounded-full w-12 h-12 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm">
                    <Share2 className="w-6 h-6" />
                </Button>

                <Button size="icon" variant="ghost" className="rounded-full w-12 h-12 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm">
                    <MoreHorizontal className="w-6 h-6" />
                </Button>

                <div className="w-10 h-10 rounded-lg border-2 border-white/80 overflow-hidden mt-4">
                    <img src={video.thumbnail_url} className="w-full h-full object-cover" />
                </div>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 right-16 p-6 z-20 pb-8 text-white">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full border border-white/50 overflow-hidden bg-neutral-800">
                        <img src={video.creator?.avatar_url} alt={video.creator?.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-bold text-sm">{video.creator?.name}</span>
                    <Button size="sm" variant="secondary" className="h-7 text-xs font-bold px-3 bg-white text-black hover:bg-gray-200">
                        Subscribe
                    </Button>
                </div>

                <h3 className="text-lg font-bold leading-tight mb-2 line-clamp-2 pr-4">{video.title}</h3>
                <p className="text-sm text-gray-200 line-clamp-1 mb-2 font-mono">
                    {video.description}
                </p>

                <div className="flex items-center gap-2 text-xs font-mono text-white/80 bg-white/10 w-fit px-2 py-1 rounded backdrop-blur-sm">
                    <Play className="w-3 h-3" />
                    {video.category?.name}
                </div>
            </div>

            {/* Progress Bar (Fake) */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 z-30">
                <motion.div
                    className="h-full bg-swiss-red"
                    initial={{ width: "0%" }}
                    whileInView={{ width: "100%" }}
                    transition={{ duration: video.duration_seconds, ease: "linear" }}
                />
            </div>

        </div>
    );
};

export default ReelCard;
