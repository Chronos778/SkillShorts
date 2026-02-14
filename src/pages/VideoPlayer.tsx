import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { getVideoById, incrementViewCount, getVideoReactionInfo, setUserVideoReaction, getVideoComments, addVideoComment } from "@/services/videos";
import { getUserByClerkId } from "@/services/users";
import { markVideoWatched, submitQuiz } from "@/services/progress";
import {
  Play, Pause, ArrowLeft, CheckCircle,
  XCircle, Clock, BookOpen, Trophy, Loader2,
  ThumbsUp, ThumbsDown, MessageSquarePlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function VideoPlayer() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user: clerkUser, isSignedIn } = useUser();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoComplete, setVideoComplete] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
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
        // Invalidate user data to refresh points and progress
        queryClient.invalidateQueries({ queryKey: ['user'] });
        queryClient.invalidateQueries({ queryKey: ['badges'] });
        queryClient.invalidateQueries({ queryKey: ['videosCompleted'] });
        queryClient.invalidateQueries({ queryKey: ['skillProgress'] });
        queryClient.invalidateQueries({ queryKey: ['quizAccuracy'] });
      }
    }
  });


  // Transform database video to display format (real data only)
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
    completions: videoData.video.completion_count,
    quiz: videoData.questions.map((q, i) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctIndex: q.correct_answer
    }))
  } : null;

  // Increment view count on mount
  useEffect(() => {
    if (videoData?.video?.id) {
      incrementViewCount(videoData.video.id);
    }
  }, [videoData?.video?.id]);

  // Track video progress from actual playback
  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setVideoProgress(0);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    const dur = v.duration || 1;
    const pct = Math.min(100, Math.max(0, (v.currentTime / dur) * 100));
    setVideoProgress(pct);
    if (pct >= 99 && !videoComplete) {
      setVideoComplete(true);
      setIsPlaying(false);
      if (dbUser?.id && id) {
        markVideoWatched(dbUser.id, id);
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading video...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-2xl font-bold mb-2">Video not found</h2>
          <Button asChild>
            <Link to="/browse">Browse Videos</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleAnswerSelect = async (index: number) => {
    if (selectedAnswer !== null) return;
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
        // Quiz complete - submit to database if authenticated
        setQuizComplete(true);

        if (isSignedIn && dbUser?.id) {
          try {
            const result = await submitQuizMutation.mutateAsync(newUserAnswers);
            if (result) {
              toast.success(`🎉 Quiz Complete! +${result.pointsEarned} points`);
            }
          } catch (error) {
            // Fall back to local calculation
            const correctCount = newAnswers.filter(Boolean).length;
            const points = correctCount * 50 + 25;
            setPointsEarned(points);
            toast.success(`🎉 Quiz Complete! +${points} points`);
          }
        } else {
          const correctCount = newAnswers.filter(Boolean).length;
          const points = correctCount * 50 + 25;
          setPointsEarned(points);
          toast.success(`🎉 Quiz Complete! +${points} points`);
        }
      }
    }, 1500);
  };

  const correctCount = (answers || []).filter(Boolean).length;
  const accuracy = quizComplete ? Math.round((correctCount / video.quiz.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16 md:pt-20 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Browse
          </Link>

          {/* Video Player */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-foreground/10 mb-6 shadow-lg">
            {videoData?.video?.video_url && /(youtube\.com|youtu\.be)/i.test(videoData.video.video_url) ? (
              <iframe
                title={video.title}
                src={`https://www.youtube.com/embed/${extractYouTubeId(videoData.video.video_url)}?rel=0`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                ref={videoRef}
                src={videoData?.video?.video_url}
                poster={video.thumbnail}
                controls
                className="w-full h-full object-contain bg-black"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            )}

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-foreground/20">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${videoProgress}%` }}
              />
            </div>

            {/* Duration Badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-foreground/80 text-background text-sm font-medium">
              <Clock className="w-4 h-4" />
              {video.duration}
            </div>
          </div>

          {/* Video Info */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                {video.categoryEmoji} {video.categoryName || video.category}
              </span>
              <span className="text-muted-foreground text-sm">•</span>
              <span className="text-muted-foreground text-sm">{video.views.toLocaleString()} views</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 break-words">
              {video.title}
            </h1>
            <p className="text-muted-foreground break-words whitespace-pre-wrap">{video.description}</p>

            {/* Reactions */}
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors", reactionInfo.userReaction === 'like' ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted")}
                onClick={() => reactionMutation.mutate(reactionInfo.userReaction === 'like' ? null : 'like')}
                disabled={!isSignedIn}
              >
                <ThumbsUp className="w-4 h-4" />
                <span className="text-sm">{reactionInfo.likes}</span>
              </button>
              <button
                type="button"
                className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors", reactionInfo.userReaction === 'dislike' ? "border-destructive bg-destructive/10 text-destructive" : "border-border hover:bg-muted")}
                onClick={() => reactionMutation.mutate(reactionInfo.userReaction === 'dislike' ? null : 'dislike')}
                disabled={!isSignedIn}
              >
                <ThumbsDown className="w-4 h-4" />
                <span className="text-sm">{reactionInfo.dislikes}</span>
              </button>
            </div>

            {/* Creator */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
              <img
                src={video.creator.avatar}
                alt={video.creator.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium text-foreground">{video.creator.name}</p>
                <p className="text-sm text-muted-foreground">Creator</p>
              </div>
            </div>
          </div>

          {/* Quiz Section */}
          {!quizStarted && videoComplete && !quizComplete && video.quiz && video.quiz.length > 0 && (
            <div className="bg-card rounded-2xl p-6 shadow-md border border-border/50 text-center animate-slide-up">
              <div className="text-5xl mb-4">🧠</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Quiz Time!</h2>
              <p className="text-muted-foreground mb-6">
                Answer {video.quiz.length} question{video.quiz.length > 1 ? "s" : ""} to complete this video and earn points
              </p>
              <Button
                variant="hero"
                size="lg"
                onClick={() => setQuizStarted(true)}
              >
                <BookOpen className="w-5 h-5" />
                Start Quiz
              </Button>
            </div>
          )}

          {/* Quiz Questions */}
          {quizStarted && !quizComplete && video.quiz && video.quiz.length > 0 && (
            <div className="bg-card rounded-2xl p-6 shadow-md border border-border/50 animate-fade-in">
              {/* Progress */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestion + 1} of {video.quiz.length}
                </span>
                <div className="flex gap-1">
                  {video.quiz.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-8 h-2 rounded-full transition-colors",
                        i < currentQuestion
                          ? answers && answers[i]
                            ? "bg-success"
                            : "bg-destructive"
                          : i === currentQuestion
                            ? "bg-primary"
                            : "bg-muted"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Question */}
              <h3 className="text-xl font-bold text-foreground mb-6">
                {video.quiz[currentQuestion].question}
              </h3>

              {/* Options */}
              <div className="space-y-3">
                {video.quiz[currentQuestion].options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = index === video.quiz[currentQuestion].correctIndex;
                  const showResult = selectedAnswer !== null;

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={selectedAnswer !== null}
                      className={cn(
                        "w-full p-4 rounded-xl text-left font-medium transition-all duration-200 border-2",
                        showResult
                          ? isCorrect
                            ? "bg-success/10 border-success text-success"
                            : isSelected
                              ? "bg-destructive/10 border-destructive text-destructive"
                              : "bg-muted/50 border-transparent text-muted-foreground"
                          : "bg-muted/50 border-transparent hover:bg-primary/10 hover:border-primary text-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {showResult && isCorrect && (
                          <CheckCircle className="w-5 h-5 text-success" />
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-destructive" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quiz Complete */}
          {quizComplete && (
            <div className="bg-card rounded-2xl p-8 shadow-md border border-border/50 text-center animate-pop">
              <div className="text-6xl mb-4 animate-bounce-gentle">🎉</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Quiz Complete!
              </h2>
              <p className="text-muted-foreground mb-6">
                You got {correctCount} out of {video.quiz?.length || 0} correct
              </p>

              {/* Stats */}
              <div className="flex justify-center gap-8 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{accuracy}%</div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">+{pointsEarned}</div>
                  <div className="text-sm text-muted-foreground">Points</div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button asChild variant="secondary" size="lg">
                  <Link to="/browse">
                    Browse More
                  </Link>
                </Button>
                <Button asChild variant="hero" size="lg">
                  <Link to="/dashboard">
                    <Trophy className="w-5 h-5" />
                    View Progress
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Locked Quiz Message */}
          {!videoComplete && !quizStarted && video.quiz && video.quiz.length > 0 && (
            <div className="bg-muted/50 rounded-2xl p-6 border border-border/50 text-center">
              <div className="text-4xl mb-3 opacity-50">🔒</div>
              <h3 className="font-bold text-foreground mb-1">Quiz Locked</h3>
              <p className="text-sm text-muted-foreground">
                Complete the video to unlock the quiz
              </p>
            </div>
          )}

          {/* No Quiz Message */}
          {videoComplete && (!video.quiz || video.quiz.length === 0) && (
            <div className="bg-card rounded-2xl p-6 shadow-md border border-border/50 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Video Complete!</h2>
              <p className="text-muted-foreground mb-6">
                Great job watching this video!
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild variant="secondary" size="lg">
                  <Link to="/browse">Browse More</Link>
                </Button>
                <Button asChild variant="hero" size="lg">
                  <Link to="/dashboard">
                    <Trophy className="w-5 h-5" />
                    View Progress
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Comments</h3>
              <span className="text-sm text-muted-foreground">{comments.length}</span>
            </div>

            {isSignedIn ? (
              <div className="flex items-center gap-2 mb-4">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment"
                  className="flex-1 px-3 py-2 rounded-xl border border-border/60 bg-background"
                />
                <Button
                  onClick={() => newComment.trim() && addCommentMutation.mutate(newComment)}
                  disabled={addCommentMutation.isPending || !newComment.trim()}
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  Post
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">Sign in to comment.</p>
            )}

            <div className="space-y-4">
              {comments.length > 0 ? comments.map((c) => (
                <div key={c.id} className="flex items-start gap-3">
                  <img src={c.user?.avatar_url || 'https://i.pravatar.cc/60'} alt={c.user?.name || 'User'} className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{c.user?.name || 'User'}</span>
                      <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-foreground break-words whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper: extract YouTube video ID from URL
function extractYouTubeId(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.slice(1);
    }
    const v = u.searchParams.get('v');
    if (v) return v;
    const parts = u.pathname.split('/');
    return parts[parts.length - 1];
  } catch {
    return '';
  }
}
