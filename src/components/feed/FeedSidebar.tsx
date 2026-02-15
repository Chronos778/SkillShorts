import React from 'react';
import { MOCK_CONTINUE_WATCHING, MOCK_TRENDING_TOPICS, MOCK_CREATORS } from '@/data/mockFeed';
import { Play, TrendingUp, User, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const FeedSidebar: React.FC = () => {
    return (
        <div className="hidden lg:block w-80 space-y-8 sticky top-24 h-fit">

            {/* Continue Watching */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-swiss-white dark:bg-swiss-black/40 border border-black/10 dark:border-white/10 rounded-xl p-5"
            >
                <div className="flex items-center gap-2 mb-4 text-swiss-blue dark:text-swiss-vibrantBlue">
                    <Play className="w-4 h-4" />
                    <h4 className="font-bold uppercase text-xs tracking-widest">Continue Watching</h4>
                </div>

                <div className="group cursor-pointer">
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-neutral-800">
                        <img src={MOCK_CONTINUE_WATCHING.thumbnail_url} className="w-full h-full object-cover opacity-80" />
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                            <div className="h-full bg-swiss-blue dark:bg-swiss-vibrantBlue" style={{ width: '45%' }} />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center">
                                <Play className="w-4 h-4 fill-white text-white" />
                            </div>
                        </div>
                    </div>
                    <h5 className="font-bold text-sm leading-tight mb-1">{MOCK_CONTINUE_WATCHING.title}</h5>
                    <p className="text-xs text-muted-foreground mb-3">{MOCK_CONTINUE_WATCHING.creator?.name}</p>
                    <Link to={`/video/${MOCK_CONTINUE_WATCHING.id}`}>
                        <Button size="sm" variant="outline" className="w-full text-xs h-8">Resume</Button>
                    </Link>
                </div>
            </motion.div>

            {/* Trending Topics */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-swiss-white dark:bg-swiss-black/40 border border-black/10 dark:border-white/10 rounded-xl p-5"
            >
                <div className="flex items-center gap-2 mb-4 text-swiss-red">
                    <TrendingUp className="w-4 h-4" />
                    <h4 className="font-bold uppercase text-xs tracking-widest">Trending Topics</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                    {MOCK_TRENDING_TOPICS.map(topic => (
                        <div key={topic} className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full text-xs font-mono cursor-pointer hover:bg-swiss-blue hover:text-white transition-colors">
                            {topic}
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Top Creators */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-swiss-white dark:bg-swiss-black/40 border border-black/10 dark:border-white/10 rounded-xl p-5"
            >
                <div className="flex items-center gap-2 mb-4">
                    <User className="w-4 h-4" />
                    <h4 className="font-bold uppercase text-xs tracking-widest">Top Creators</h4>
                </div>
                <div className="space-y-4">
                    {MOCK_CREATORS.map(creator => (
                        <div key={creator.id} className="flex items-center gap-3 group cursor-pointer">
                            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                                <img src={creator.avatar_url} />
                            </div>
                            <div className="flex-1">
                                <h6 className="text-sm font-bold group-hover:text-swiss-blue transition-colors">{creator.name}</h6>
                                <p className="text-[10px] text-muted-foreground uppercase">Development</p>
                            </div>
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                        </div>
                    ))}
                </div>
            </motion.div>

        </div>
    );
}

export default FeedSidebar;
