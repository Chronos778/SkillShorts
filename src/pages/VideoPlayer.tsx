import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { getVideoById, incrementViewCount, getVideoReactionInfo, setUserVideoReaction, getVideoComments, addVideoComment } from "@/services/videos";
import { getUserByClerkId } from "@/services/users";
import { markVideoWatched, submitQuiz } from "@/services/progress";
import {
  Play, ArrowLeft, CheckCircle,
  XCircle, Clock, BookOpen, Trophy, Loader2,
  ThumbsUp, ThumbsDown, MessageSquare, Info,
  Share2, MoreVertical, Send, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function VideoPlayer() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user: clerkUser, isSignedIn } = useUser();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoComplete, setVideoComplete] = useState(false);

  // Quiz State
  const [activeTab, setActiveTab] = useState("info");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>();
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [newComment, setNewComment] = useState("");

  // Fetch video from database
  const { data: videoData, isLoading } = useQuery({
    queryKey: ['video', id],
    queryFn: () => getVideoById(id!),
    enabled: !!id,
  });

  // Get database user
  const { data: dbUser } = useQuery({
    queryKey: ['user', clerkUser?.id],
    queryFn: () => getUserByClerkId(clerkUser!.id),
    enabled: !!clerkUser?.id,
  });

  // Reactions
  const { data: reactionInfo = { likes: 0, dislikes: 0, userReaction: undefined } } = useQuery({
    queryKey: ['reactionInfo', id, dbUser?.id],
    queryFn: () => getVideoReactionInfo(id!, dbUser?.id || undefined),
    enabled: !!id,
  });

  const reactionMutation = useMutation({
    mutationFn: async (reaction: 'like' | 'dislike' | null) => {
      if (!dbUser?.id || !id) throw new Error('Not authenticated');
      return setUserVideoReaction(id, dbUser.id, reaction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactionInfo'] });
    }
  });

  // Comments
  const { data: comments = [] } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => getVideoComments(id!),
    enabled: !!id,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!dbUser?.id || !id) throw new Error('Not authenticated');
      return addVideoComment(id!, dbUser.id, content);
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    }
  });

  // Quiz submission mutation
  const submitQuizMutation = useMutation({
    mutationFn: async (answers: number[]) => {
      if (!dbUser?.id || !id) throw new Error('Not authenticated');
      return submitQuiz(dbUser.id, { video_id: id, answers });
    },
    onSuccess: (result) => {
      if (result) {
        setPointsEarned(result.pointsEarned);
        queryClient.invalidateQueries({ queryKey: ['user'] });
      }
    }
  });


  // Transform database video to display format
  const video = videoData?.video ? {
    id: videoData.video.id,
    title: videoData.video.title,
    description: videoData.video.description,
    thumbnail: videoData.video.thumbnail_url || "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=400&h=225&fit=crop",
    duration: `${Math.floor(videoData.video.duration_seconds / 60)}:${String(videoData.video.duration_seconds % 60).padStart(2, '0')}`,
    category: videoData.video.category_id,
    categoryEmoji: videoData.video.category?.emoji || "📚",
    categoryName: videoData.video.category?.name || "General",
    creator: {
      name: videoData.video.creator?.name || "Unknown",
      avatar: videoData.video.creator?.avatar_url || "https://i.pravatar.cc/100"
    },
    views: videoData.video.view_count,
    quiz: videoData.questions.map((q, i) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctIndex: q.correct_answer
    }))
  } : null;

  // Increment view count
  useEffect(() => {
    if (videoData?.video?.id) incrementViewCount(videoData.video.id);
  }, [videoData?.video?.id]);

  // Video Progress Handler
  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    const dur = v.duration || 1;
    const pct = Math.min(100, Math.max(0, (v.currentTime / dur) * 100));
    setVideoProgress(pct);
    if (pct >= 99 && !videoComplete) {
      setVideoComplete(true);
      setIsPlaying(false);
      setActiveTab("quiz"); // Auto-switch to quiz
      if (dbUser?.id && id) markVideoWatched(dbUser.id, id);
    }
  };

  // Quiz Handlers
  const handleAnswerSelect = async (index: number) => {
    if (selectedAnswer !== null || !video) return;
    setSelectedAnswer(index);

    const isCorrect = index === video.quiz[currentQuestion].correctIndex;
    const newAnswers = [...(answers || []), isCorrect];
    const newUserAnswers = [...userAnswers, index];
    setAnswers(newAnswers);
    setUserAnswers(newUserAnswers);

    setTimeout(async () => {
      if (currentQuestion < video.quiz.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        setQuizComplete(true);
        if (isSignedIn && dbUser?.id) {
          try {
            await submitQuizMutation.mutateAsync(newUserAnswers);
            toast.success(`Quiz Complete!`);
          } catch (e) {
            // Fallback points
            const correctCount = newAnswers.filter(Boolean).length;
            setPointsEarned(correctCount * 50 + 25);
          }
        }
      }
    }, 1000);
  };


  if (isLoading || !video) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  const correctCount = (answers || []).filter(Boolean).length;
  const accuracy = quizComplete && video.quiz.length > 0 ? Math.round((correctCount / video.quiz.length) * 100) : 0;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-black text-foreground animate-in-fade">

      {/* -------------------------------------------------------------------------- */
      /*                                VIDEO STAGE                                  */
      /* -------------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col bg-black relative">
        <div className="flex-none p-4 flex items-center justify-between border-b border-white/10 lg:hidden text-white">
          <Link to="/browse" className="flex items-center gap-2 text-sm font-bold uppercase"><ArrowLeft className="w-4 h-4" /> Back</Link>
        </div>

        <div className="flex-1 flex items-center justify-center relative bg-neutral-900 overflow-hidden">
          {videoData?.video?.video_url && /(youtube\.com|youtu\.be)/i.test(videoData.video.video_url) ? (
            <iframe
              title={video.title}
              src={`https://www.youtube.com/embed/${extractYouTubeId(videoData.video.video_url)}?rel=0&autoplay=1`}
              className="w-full h-full aspect-video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              ref={videoRef}
              src={videoData?.video?.video_url}
              poster={video.thumbnail}
              controls
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          )}
        </div>

        {/* Video Controls / Info for Mobile could go here */}
      </div>

      {/* -------------------------------------------------------------------------- */
      /*                                SIDEBAR PANEL                                */
      /* -------------------------------------------------------------------------- */}
      <div className="w-full lg:w-[400px] border-l border-border bg-background flex flex-col h-full lg:h-auto z-10">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link to="/browse" className="hidden lg:flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3 h-3" /> Return
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied to clipboard!");
            }}>
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info("More options coming soon!")}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full grid grid-cols-3 rounded-none border-b border-border p-0 h-12 bg-muted/20">
            <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background h-full text-xs font-bold uppercase tracking-wider">Info</TabsTrigger>
            <TabsTrigger value="quiz" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background h-full text-xs font-bold uppercase tracking-wider flex gap-2 items-center">
              Quiz
              {videoComplete && !quizComplete && <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />}
            </TabsTrigger>
            <TabsTrigger value="chat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background h-full text-xs font-bold uppercase tracking-wider">Chat</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            {/* INFO TAB */}
            <TabsContent value="info" className="p-6 m-0 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                    {video.categoryEmoji} {video.categoryName}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {video.views.toLocaleString()} VIEWS
                  </span>
                </div>
                <h1 className="text-2xl font-black uppercase leading-tight mb-4 tracking-tight">{video.title}</h1>
                <p className="text-sm text-muted-foreground leading-relaxed font-mono">{video.description}</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-none border border-border">
                <div className="flex items-center gap-3">
                  <img src={video.creator.avatar} className="w-10 h-10 border border-border" />
                  <div>
                    <div className="text-sm font-bold uppercase">{video.creator.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">AUTHOR</div>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-[10px] uppercase font-bold rounded-none">Follow</Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className={cn("flex-1 h-10 rounded-none uppercase font-bold text-xs gap-2", reactionInfo.userReaction === 'like' && "bg-primary/10 border-primary text-primary")}
                  onClick={() => reactionMutation.mutate(reactionInfo.userReaction === 'like' ? null : 'like')}
                >
                  <ThumbsUp className="w-4 h-4" /> {reactionInfo.likes}
                </Button>
                <Button
                  variant="outline"
                  className={cn("flex-1 h-10 rounded-none uppercase font-bold text-xs gap-2", reactionInfo.userReaction === 'dislike' && "bg-destructive/10 border-destructive text-destructive")}
                  onClick={() => reactionMutation.mutate(reactionInfo.userReaction === 'dislike' ? null : 'dislike')}
                >
                  <ThumbsDown className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            {/* QUIZ TAB */}
            <TabsContent value="quiz" className="p-6 m-0 h-full">

              {!videoComplete ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-center p-4 opacity-50">
                  <Loader2 className="w-8 h-8 mb-4 animate-spin" />
                  <h3 className="font-bold uppercase">Locked</h3>
                  <p className="text-xs font-mono mt-2">WATCH VIDEO TO UNLOCK</p>
                </div>
              ) : video.quiz.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center animate-in-fade opacity-50">
                  <BookOpen className="w-12 h-12 mb-4" />
                  <h3 className="font-bold uppercase">No Quiz</h3>
                  <p className="text-xs font-mono mt-2">This video has no quiz questions.</p>
                </div>
              ) : quizComplete ? (
                <div className="flex flex-col items-center justify-center py-10 text-center animate-in-fade">
                  <div className="w-20 h-20 bg-accent/10 border border-accent rounded-full flex items-center justify-center mb-6">
                    <Trophy className="w-10 h-10 text-accent" />
                  </div>
                  <h2 className="text-2xl font-black uppercase mb-2">Quiz Complete</h2>
                  <div className="text-4xl font-mono font-bold mb-6">{accuracy}% <span className="text-sm text-muted-foreground font-sans font-normal">ACCURACY</span></div>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="p-4 bg-muted/30 border border-border">
                      <div className="text-2xl font-bold">+{pointsEarned}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">XP EARNED</div>
                    </div>
                    <div className="p-4 bg-muted/30 border border-border">
                      <div className="text-2xl font-bold">{correctCount}/{video.quiz?.length}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">CORRECT</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in-slide-right">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                    <span>Question {currentQuestion + 1} / {video.quiz?.length}</span>
                    <span>Test Video Knowledge</span>
                  </div>

                  <div className="h-1 w-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((currentQuestion) / (video.quiz?.length || 1)) * 100}%` }} />
                  </div>

                  <h3 className="text-lg font-bold leading-snug">{video.quiz[currentQuestion].question}</h3>

                  <div className="space-y-2">
                    {video.quiz[currentQuestion].options.map((option, idx) => {
                      const isSelected = selectedAnswer === idx;
                      const isCorrect = idx === video.quiz[currentQuestion].correctIndex;
                      const showResult = selectedAnswer !== null;

                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswerSelect(idx)}
                          disabled={selectedAnswer !== null}
                          className={cn(
                            "w-full text-left p-4 border border-border text-sm font-medium transition-all hover:bg-muted/50 relative overflow-hidden",
                            showResult && isCorrect && "border-green-500 bg-green-500/10 text-green-500",
                            showResult && isSelected && !isCorrect && "border-red-500 bg-red-500/10 text-red-500"
                          )}
                        >
                          <div className="flex items-center justify-between relative z-10">
                            <span>{option}</span>
                            {showResult && isCorrect && <Check className="w-4 h-4" />}
                            {showResult && isSelected && !isCorrect && <XCircle className="w-4 h-4" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* CHAT TAB */}
            <TabsContent value="chat" className="p-0 m-0 h-full flex flex-col">
              <div className="flex-1 p-4 space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-10 opacity-50">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs font-mono uppercase">No Messages</p>
                  </div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex gap-3 text-sm">
                      <img src={c.user.avatar_url} className="w-8 h-8 bg-muted" />
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold uppercase text-xs">{c.user.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-muted-foreground mt-0.5">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-border bg-background">
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-muted/50 border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors placeholder:uppercase placeholder:text-[10px]"
                    placeholder="Enter message..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && newComment.trim() && addCommentMutation.mutate(newComment)}
                  />
                  <Button
                    size="icon"
                    onClick={() => newComment.trim() && addCommentMutation.mutate(newComment)}
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                    className="rounded-none w-10 h-10"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}

function extractYouTubeId(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    const v = u.searchParams.get('v');
    if (v) return v;
    const parts = u.pathname.split('/');
    return parts[parts.length - 1];
  } catch {
    return '';
  }
}
