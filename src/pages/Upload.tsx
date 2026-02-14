import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCategories, createVideo, uploadVideoFile, uploadImageFile } from "@/services/videos";
import { getUserByClerkId, syncUserFromClerk, canCreateContent } from "@/services/users";
import {
  Upload as UploadIcon, Video, Plus, Trash2,
  CheckCircle, AlertCircle, Loader2, Link as LinkIcon, Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Category } from "@/types";

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: number;
}

export default function Upload() {
  const { user: clerkUser, isLoaded } = useUser();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [duration, setDuration] = useState(180); // 3 minutes default
  const [videoInputMode, setVideoInputMode] = useState<'link' | 'file'>('link');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [thumbnailInputMode, setThumbnailInputMode] = useState<'link' | 'file'>('file');
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadedThumbName, setUploadedThumbName] = useState("");
  const [thumbUploadError, setThumbUploadError] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    { question: "", options: ["", "", "", ""], correct_answer: 0 },
  ]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdVideoId, setCreatedVideoId] = useState<string | null>(null);

  // Get user from database
  const { data: dbUser, isLoading: userLoading } = useQuery({
    queryKey: ['user', clerkUser?.id],
    queryFn: async () => {
      if (!clerkUser) return null;
      return syncUserFromClerk(
        clerkUser.id,
        clerkUser.emailAddresses[0]?.emailAddress || '',
        clerkUser.fullName || clerkUser.firstName || 'User',
        clerkUser.imageUrl
      );
    },
    enabled: isLoaded && !!clerkUser?.id,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 300000,
  });

  // Video creation mutation
  const createVideoMutation = useMutation({
    mutationFn: async () => {
      if (!dbUser?.id) {
        throw new Error('Please wait for your account to sync with the database. If this persists, try refreshing the page.');
      }
      return createVideo({
        title,
        description,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl || undefined,
        duration_seconds: duration,
        category_id: categoryId,
        quiz_questions: quizQuestions.map(q => ({
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          order: 0
        }))
      }, dbUser.id);
    },
    onSuccess: (video) => {
      if (video) {
        setCreatedVideoId(video.id);
        setIsSubmitted(true);
        toast.success("Video published! 🎉");
      } else {
        toast.error("Failed to create video. Please try again.");
      }
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error(error.message || "Error creating video. Please try again.");
    }
  });

  const addQuestion = () => {
    if (quizQuestions.length >= 3) {
      toast.error("Maximum 3 questions per video");
      return;
    }
    setQuizQuestions([
      ...quizQuestions,
      { question: "", options: ["", "", "", ""], correct_answer: 0 },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (quizQuestions.length <= 1) {
      toast.error("At least 1 question is required");
      return;
    }
    setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...quizQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setQuizQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...quizQuestions];
    updated[qIndex].options[oIndex] = value;
    setQuizQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is synced to database
    if (!dbUser?.id) {
      toast.error("Please wait for your account to sync. If this persists, refresh the page.");
      return;
    }

    if (uploadingFile) {
      toast.error("Please wait for the video upload to finish");
      return;
    }

    if (!title || !description || !categoryId || !videoUrl) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!quizQuestions.every(q => q.question && q.options.every(o => o))) {
      toast.error("Please complete all quiz questions and options");
      return;
    }

    createVideoMutation.mutate();
  };

  // Helper: get duration from MP4 file using a temporary video element
  async function getFileDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      try {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = url;
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(url);
          resolve(video.duration || 0);
        };
        video.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(0);
        };
      } catch {
        resolve(0);
      }
    });
  }

  // Helper: generate thumbnail from a local MP4 file
  async function generateThumbnailFromVideoFile(file: File): Promise<File | null> {
    return new Promise((resolve) => {
      try {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = url;
        video.muted = true;
        video.onloadedmetadata = () => {
          const seekTime = Math.min(1, Math.max(0.1, (video.duration || 10) * 0.1));
          video.currentTime = seekTime;
        };
        video.onseeked = async () => {
          try {
            const canvas = document.createElement('canvas');
            const maxWidth = 1280;
            const width = Math.min(maxWidth, video.videoWidth || 1280);
            const height = Math.round(width * ((video.videoHeight || 720) / (video.videoWidth || 1280)));
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas unsupported');
            ctx.drawImage(video, 0, 0, width, height);
            const blob = await new Promise<Blob | null>((r) => canvas.toBlob((b) => r(b), 'image/png', 0.92));
            URL.revokeObjectURL(url);
            if (!blob) return resolve(null);
            const thumbFile = new File([blob], `thumbnail-${Date.now()}.png`, { type: 'image/png' });
            resolve(thumbFile);
          } catch {
            URL.revokeObjectURL(url);
            resolve(null);
          }
        };
        video.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });
  }

  // Helper: extract YouTube ID for thumbnail generation
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

  // Helper: default placeholder when no thumbnail can be derived
  function getDefaultPlaceholder(): string {
    return 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&h=450&fit=crop';
  }

  // Loading state
  if (!isLoaded || userLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 md:pt-24 pb-24 px-4 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  // Check if user can create content
  const userCanCreate = canCreateContent(dbUser);

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 md:pt-24 pb-24 px-4 flex items-center justify-center">
          <div className="max-w-md text-center animate-pop">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Published! 🎉
            </h1>
            <p className="text-muted-foreground mb-8">
              Your video is live and visible in Browse, search, and your Creator dashboard.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => {
                setIsSubmitted(false);
                setTitle("");
                setDescription("");
                setCategoryId("");
                setVideoUrl("");
                setThumbnailUrl("");
                setQuizQuestions([{ question: "", options: ["", "", "", ""], correct_answer: 0 }]);
              }} variant="hero">
                Submit Another Video
              </Button>
              {createdVideoId ? (
                <Button onClick={() => navigate(`/video/${createdVideoId}`)} variant="secondary">
                  View Video
                </Button>
              ) : (
                <Button onClick={() => navigate('/browse')} variant="secondary">
                  Browse Videos
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 md:pt-24 pb-24 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Share Your Skills 🎬
            </h1>
            <p className="text-muted-foreground">
              Create a 2-5 minute skill video with a quiz
            </p>
          </div>

          {/* User Sync Status */}
          {userLoading && (
            <div className="bg-info/10 border border-info/20 rounded-xl p-4 mb-8">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-info animate-spin shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Syncing your account...</p>
                  <p className="text-muted-foreground">Please wait a moment</p>
                </div>
              </div>
            </div>
          )}

          {/* Creator Access Notice */}
          {!userCanCreate && !userLoading && (
            <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">Become a Creator</p>
                  <p className="text-muted-foreground">
                    You can submit videos and they’ll publish instantly. A verified creator badge may be granted later.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Guidelines */}
          <div className="bg-info/10 border border-info/20 rounded-xl p-4 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-info shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Video Guidelines</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Duration: 2-5 minutes</li>
                  <li>• Focus on teaching one specific skill</li>
                  <li>• Include 1-3 quiz questions</li>
                  <li>• Videos publish instantly</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Video URL */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
              <h2 className="font-bold text-foreground mb-4">📹 Video</h2>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={videoInputMode === 'link' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setVideoInputMode('link')}
                    className="rounded-full"
                  >
                    Use Link
                  </Button>
                  <Button
                    type="button"
                    variant={videoInputMode === 'file' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setVideoInputMode('file')}
                    className="rounded-full"
                  >
                    Upload MP4
                  </Button>
                </div>

                {videoInputMode === 'link' ? (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Video URL *
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?v=... or direct video URL"
                        className="pl-10 rounded-xl"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Paste a YouTube link or direct MP4 URL
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Upload MP4 *
                    </label>
                    <Input
                      type="file"
                      accept="video/mp4"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadError("");
                        if (file.type !== 'video/mp4') {
                          setUploadError("Please upload an MP4 file");
                          return;
                        }
                        if (file.size > 200 * 1024 * 1024) {
                          setUploadError("File size must be under 200MB");
                          return;
                        }
                        try {
                          setUploadingFile(true);
                          setUploadedFileName(file.name);
                          // Extract duration from file metadata
                          const fileDuration = await getFileDuration(file);
                          if (isFinite(fileDuration) && fileDuration > 0) {
                            setDuration(Math.min(300, Math.max(120, Math.round(fileDuration))));
                          }
                          const url = await uploadVideoFile(file);
                          setVideoUrl(url);
                          // Auto-generate thumbnail from the uploaded MP4 if none provided
                          if (!thumbnailUrl) {
                            const thumbFile = await generateThumbnailFromVideoFile(file);
                            if (thumbFile) {
                              try {
                                setUploadingThumb(true);
                                setUploadedThumbName(thumbFile.name);
                                const thumbUrl = await uploadImageFile(thumbFile);
                                setThumbnailUrl(thumbUrl);
                                toast.success("Thumbnail generated from video");
                              } catch (err: any) {
                                console.error(err);
                                setThumbnailUrl(getDefaultPlaceholder());
                              } finally {
                                setUploadingThumb(false);
                              }
                            } else {
                              setThumbnailUrl(getDefaultPlaceholder());
                            }
                          }
                          toast.success("Upload complete");
                        } catch (err: any) {
                          console.error(err);
                          setUploadError(err?.message || "Upload failed");
                          setVideoUrl("");
                          setUploadedFileName("");
                        } finally {
                          setUploadingFile(false);
                        }
                      }}
                      className="rounded-xl"
                    />
                    {uploadingFile && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                      </div>
                    )}
                    {uploadedFileName && !uploadingFile && videoUrl && (
                      <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2 border border-border/60">
                        <span className="truncate">{uploadedFileName}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setVideoUrl("");
                            setUploadedFileName("");
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                    {uploadError && (
                      <p className="text-sm text-destructive">{uploadError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      MP4 only, up to 200MB. Uploaded files are stored securely and publish instantly.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={thumbnailInputMode === 'file' ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => setThumbnailInputMode('file')}
                      className="rounded-full"
                    >
                      Upload Image
                    </Button>
                    <Button
                      type="button"
                      variant={thumbnailInputMode === 'link' ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => setThumbnailInputMode('link')}
                      className="rounded-full"
                    >
                      Use Link
                    </Button>
                  </div>

                  {thumbnailInputMode === 'file' ? (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">
                        Thumbnail Image
                      </label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setThumbUploadError("");
                          if (!(file.type || '').startsWith('image/')) {
                            setThumbUploadError("Please upload an image file (PNG/JPEG)");
                            return;
                          }
                          if (file.size > 5 * 1024 * 1024) {
                            setThumbUploadError("Image must be under 5MB");
                            return;
                          }
                          try {
                            setUploadingThumb(true);
                            setUploadedThumbName(file.name);
                            const url = await uploadImageFile(file);
                            setThumbnailUrl(url);
                            toast.success("Thumbnail uploaded");
                          } catch (err: any) {
                            console.error(err);
                            setThumbUploadError(err?.message || "Thumbnail upload failed");
                            setThumbnailUrl("");
                            setUploadedThumbName("");
                          } finally {
                            setUploadingThumb(false);
                          }
                        }}
                        className="rounded-xl"
                      />
                      {uploadingThumb && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" /> Uploading thumbnail...
                        </div>
                      )}
                      {uploadedThumbName && !uploadingThumb && thumbnailUrl && (
                        <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2 border border-border/60">
                          <span className="truncate">{uploadedThumbName}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setThumbnailUrl("");
                              setUploadedThumbName("");
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                      {thumbUploadError && (
                        <p className="text-sm text-destructive">{thumbUploadError}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        PNG or JPEG, up to 5MB.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Thumbnail URL (optional)
                      </label>
                      <Input
                        value={thumbnailUrl}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (!val && videoUrl) {
                            const ytId = extractYouTubeId(videoUrl);
                            if (ytId) {
                              setThumbnailUrl(`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`);
                            } else {
                              setThumbnailUrl(getDefaultPlaceholder());
                            }
                          }
                        }}
                        placeholder="https://example.com/thumbnail.jpg (leave blank to auto)"
                        className="rounded-xl"
                      />
                    </div>
                  )}
                </div>

                {/* Duration UI removed: duration handled automatically for MP4 and estimated for links */}
              </div>
            </div>

            {/* Details */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
              <h2 className="font-bold text-foreground mb-4">📝 Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Title *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Master CSS Flexbox in 3 Minutes"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description *
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What will learners gain from this video?"
                    className="rounded-xl resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Category *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryId(cat.id)}
                        className={cn(
                          "p-3 rounded-xl text-sm font-medium transition-all",
                          categoryId === cat.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {cat.emoji} {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quiz */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-foreground">🧠 Quiz Questions</h2>
                <span className="text-sm text-muted-foreground">
                  {quizQuestions.length}/3 questions
                </span>
              </div>

              <div className="space-y-6">
                {quizQuestions.map((q, qIndex) => (
                  <div key={qIndex} className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-foreground">
                        Question {qIndex + 1}
                      </span>
                      {quizQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIndex)}
                          className="text-destructive hover:text-destructive/80 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <Input
                      value={q.question}
                      onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                      placeholder="Enter your question"
                      className="mb-3 rounded-xl"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((option, oIndex) => (
                        <div key={oIndex} className="relative">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            placeholder={`Option ${oIndex + 1}`}
                            className={cn(
                              "rounded-xl pr-10",
                              q.correct_answer === oIndex && "border-success"
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => updateQuestion(qIndex, "correct_answer", oIndex)}
                            className={cn(
                              "absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 transition-colors flex items-center justify-center",
                              q.correct_answer === oIndex
                                ? "border-success bg-success text-success-foreground"
                                : "border-muted-foreground/30 hover:border-success"
                            )}
                          >
                            {q.correct_answer === oIndex && (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Click the circle to mark the correct answer
                    </p>
                  </div>
                ))}
              </div>

              {quizQuestions.length < 3 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addQuestion}
                  className="w-full mt-4 rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  Add Question
                </Button>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="hero"
              size="xl"
              className="w-full"
              disabled={createVideoMutation.isPending || !dbUser?.id}
            >
              {createVideoMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : !dbUser?.id ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Syncing Account...
                </>
              ) : (
                <>
                  <UploadIcon className="w-5 h-5" />
                  Publish Video
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
