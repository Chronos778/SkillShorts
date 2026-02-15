import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCategories, createVideo, uploadVideoFile, uploadImageFile } from "@/services/videos";
import { syncUserFromClerk, canCreateContent } from "@/services/users";
import {
  Upload as UploadIcon, Plus, Trash2,
  CheckCircle, AlertCircle, Loader2, Link as LinkIcon
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
  const [duration, setDuration] = useState(180);
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

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 300000,
  });

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
        quiz_questions: quizQuestions.map((q, i) => ({
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          order_index: i
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

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: string | number) => {
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
    if (!dbUser?.id) return toast.error("Please wait for your account to sync.");
    if (uploadingFile) return toast.error("Please wait for the video upload to finish");
    if (!title || !description || !categoryId || !videoUrl) return toast.error("Please fill in all required fields");
    if (!quizQuestions.every(q => q.question && q.options.every(o => o))) return toast.error("Please complete all quiz questions");
    createVideoMutation.mutate();
  };

  async function getFileDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      try {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = url;
        video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration || 0); };
        video.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
      } catch { resolve(0); }
    });
  }

  async function generateThumbnailFromVideoFile(file: File): Promise<File | null> {
    return new Promise((resolve) => {
      try {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = url;
        video.muted = true;
        video.onloadedmetadata = () => { video.currentTime = Math.min(1, Math.max(0.1, (video.duration || 10) * 0.1)); };
        video.onseeked = async () => {
          try {
            const canvas = document.createElement('canvas');
            const width = Math.min(1280, video.videoWidth || 1280);
            const height = Math.round(width * ((video.videoHeight || 720) / (video.videoWidth || 1280)));
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d')?.drawImage(video, 0, 0, width, height);
            canvas.toBlob((b) => {
              URL.revokeObjectURL(url);
              resolve(b ? new File([b], `thumbnail-${Date.now()}.png`, { type: 'image/png' }) : null);
            }, 'image/png', 0.92);
          } catch { URL.revokeObjectURL(url); resolve(null); }
        };
        video.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      } catch { resolve(null); }
    });
  }

  function extractYouTubeId(url: string): string {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
      const v = u.searchParams.get('v');
      if (v) return v;
      const parts = u.pathname.split('/');
      return parts[parts.length - 1];
    } catch { return ''; }
  }

  function getDefaultPlaceholder(): string {
    return 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&h=450&fit=crop';
  }

  if (!isLoaded || userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground font-mono uppercase">Initializing...</p>
        </div>
      </div>
    );
  }

  const userCanCreate = canCreateContent(dbUser); // Assuming this function exists/works

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center animate-in-fade">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-success/10 border border-success flex items-center justify-center mx-auto mb-6 rounded-none">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-black uppercase text-foreground mb-2 tracking-tight">Published</h1>
          <p className="text-muted-foreground mb-8 font-mono text-sm">Operation Successful</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => {
              setIsSubmitted(false); setTitle(""); setDescription(""); setCategoryId(""); setVideoUrl(""); setThumbnailUrl("");
              setQuizQuestions([{ question: "", options: ["", "", "", ""], correct_answer: 0 }]);
            }} variant="outline" className="uppercase font-bold">New Upload</Button>
            <Button onClick={() => navigate(createdVideoId ? `/video/${createdVideoId}` : '/browse')} variant="default" className="uppercase font-bold text-white">View Content</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-in-fade pb-24">
      <main className="pt-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 border-b-2 border-border pb-4">
            <h1 className="text-3xl font-black uppercase text-foreground mb-1 tracking-tighter">Studio</h1>
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Content Ingestion</p>
          </div>

          {!userCanCreate && (
            <div className="bg-warning/10 border border-warning text-warning p-4 mb-8 text-sm font-mono uppercase">
              <AlertCircle className="w-4 h-4 inline mr-2" /> Creator Status: Unverified (Public Submission)
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Video Source */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold uppercase text-sm tracking-wider">01. Source Material</h2>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant={videoInputMode === 'link' ? 'default' : 'outline'} onClick={() => setVideoInputMode('link')} className="uppercase text-[10px] h-7">Link</Button>
                  <Button type="button" size="sm" variant={videoInputMode === 'file' ? 'default' : 'outline'} onClick={() => setVideoInputMode('file')} className="uppercase text-[10px] h-7">File</Button>
                </div>
              </div>

              <div className="p-6 border border-border bg-muted/20">
                {videoInputMode === 'link' ? (
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="HTTPS://..." className="pl-10 font-mono text-sm" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input type="file" accept="video/mp4" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadingFile(true);
                        try {
                          const url = await uploadVideoFile(file);
                          setVideoUrl(url);
                          setUploadedFileName(file.name);
                          // Auto thumbnail
                          const t = await generateThumbnailFromVideoFile(file);
                          if (t) {
                            setUploadingThumb(true);
                            const tUrl = await uploadImageFile(t);
                            setThumbnailUrl(tUrl);
                            setUploadingThumb(false);
                          }
                        } catch (e) { console.error(e); }
                        setUploadingFile(false);
                      }
                    }} className="font-mono text-sm" />
                    <p className="text-[10px] font-mono text-muted-foreground">MP4 ONLY. MAX 200MB.</p>
                  </div>
                )}
                {(uploadingFile || uploadingThumb) && <p className="text-xs font-mono mt-2 animate-pulse">UPLOADING...</p>}
                {uploadedFileName && <p className="text-xs font-mono mt-2 text-success">READY: {uploadedFileName}</p>}
              </div>
            </div>

            {/* 02. Visuals (Thumbnail) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold uppercase text-sm tracking-wider">02. Visuals</h2>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant={thumbnailInputMode === 'link' ? 'default' : 'outline'} onClick={() => setThumbnailInputMode('link')} className="uppercase text-[10px] h-7">Link</Button>
                  <Button type="button" size="sm" variant={thumbnailInputMode === 'file' ? 'default' : 'outline'} onClick={() => setThumbnailInputMode('file')} className="uppercase text-[10px] h-7">File</Button>
                </div>
              </div>

              <div className="p-6 border border-border bg-muted/20">
                {thumbnailInputMode === 'link' ? (
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="HTTPS://... (IMAGE)" className="pl-10 font-mono text-sm" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input type="file" accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadingThumb(true);
                        try {
                          const url = await uploadImageFile(file);
                          setThumbnailUrl(url);
                          setUploadedThumbName(file.name);
                        } catch (e) {
                          console.error(e);
                          setThumbUploadError("Failed to upload image");
                        }
                        setUploadingThumb(false);
                      }
                    }} className="font-mono text-sm" />
                    <p className="text-[10px] font-mono text-muted-foreground">JPG/PNG. MAX 5MB.</p>
                  </div>
                )}
                {(uploadingThumb) && <p className="text-xs font-mono mt-2 animate-pulse">UPLOADING THUMBNAIL...</p>}
                {uploadedThumbName && !uploadingThumb && <p className="text-xs font-mono mt-2 text-success">READY: {uploadedThumbName}</p>}
                {thumbnailUrl && (
                  <div className="mt-4 w-full aspect-video bg-black rounded overflow-hidden relative group">
                    <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-mono font-bold">PREVIEW</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-4">
              <h2 className="font-bold uppercase text-sm tracking-wider">03. Metadata</h2>
              <div className="grid gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase mb-1 block">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VIDEO TITLE" className="font-bold uppercase" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase mb-1 block">Description</label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="CONTENT DESCRIPTION..." className="font-mono text-sm min-h-[100px] rounded-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase mb-1 block">Category</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {categories.length === 0 ? (
                      <div className="col-span-full text-center py-8 border border-dashed border-border">
                        <p className="text-xs font-mono text-muted-foreground">NO CATEGORIES FOUND</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Please contact your administrator to seed the database.</p>
                      </div>
                    ) : (
                      categories.map((cat) => (
                        <button key={cat.id} type="button" onClick={() => setCategoryId(cat.id)} className={cn("text-[10px] font-bold uppercase p-2 border border-border hover:bg-muted transition-colors text-left", categoryId === cat.id && "bg-foreground text-background border-foreground")}>
                          {cat.emoji} {cat.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quiz */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold uppercase text-sm tracking-wider">04. Quiz Sequence</h2>
                <span className="font-mono text-[10px] text-muted-foreground">{quizQuestions.length}/3 QUESTIONS</span>
              </div>

              <div className="space-y-4">
                {quizQuestions.map((q, i) => (
                  <div key={i} className="p-4 border border-border bg-muted/10 relative">
                    <div className="flex justify-between mb-2">
                      <span className="font-mono text-[10px] font-bold">Q_0{i + 1}</span>
                      {quizQuestions.length > 1 && <Trash2 onClick={() => removeQuestion(i)} className="w-3 h-3 cursor-pointer hover:text-destructive" />}
                    </div>
                    <Input value={q.question} onChange={(e) => updateQuestion(i, "question", e.target.value)} placeholder="QUESTION TEXT" className="mb-2 font-bold text-sm" />
                    <div className="grid grid-cols-1 gap-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className={cn(
                          "flex items-center gap-2 p-2 border rounded cursor-pointer transition-all",
                          q.correct_answer === oIdx
                            ? "border-success bg-success/10"
                            : "border-border hover:border-foreground/30"
                        )} onClick={() => updateQuestion(i, "correct_answer", oIdx)}>
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                            q.correct_answer === oIdx
                              ? "border-success bg-success"
                              : "border-muted-foreground/40"
                          )}>
                            {q.correct_answer === oIdx && (
                              <CheckCircle className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <Input
                            value={opt}
                            onChange={(e) => { e.stopPropagation(); updateOption(i, oIdx, e.target.value); }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder={`Option ${oIdx + 1}`}
                            className="text-xs border-0 bg-transparent p-0 h-auto focus-visible:ring-0 shadow-none"
                          />
                          {q.correct_answer === oIdx && (
                            <span className="text-[9px] font-bold text-success uppercase tracking-wider shrink-0">✓ Correct</span>
                          )}
                        </div>
                      ))}
                      <p className="text-[10px] font-mono text-muted-foreground mt-1">Click an option to mark it as the correct answer</p>
                    </div>
                  </div>
                ))}
              </div>

              {quizQuestions.length < 3 && (
                <Button type="button" variant="outline" size="sm" onClick={addQuestion} className="w-full border-dashed uppercase text-xs">
                  <Plus className="w-3 h-3 mr-2" /> Add Question Node
                </Button>
              )}
            </div>

            <Button type="submit" disabled={createVideoMutation.isPending} className="w-full h-12 text-lg font-black uppercase tracking-tight">
              {createVideoMutation.isPending ? "Processing..." : "Initialise Upload"}
            </Button>

          </form>
        </div>
      </main>
    </div>
  );
}
