import { supabase } from '@/lib/supabase';
import type { Video, Category, QuizQuestion, VideoSubmission, VideoComment, VideoReaction } from '@/types';

/**
 * Upload a raw video file (mp4) to Supabase Storage and return a public URL
 */
export async function uploadVideoFile(file: File): Promise<string> {
  const bucket = 'videos';
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `uploads/${timestamp}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'video/mp4',
    });

  if (uploadError) {
    console.error('Video upload failed:', uploadError);
    throw new Error(uploadError.message || 'Video upload failed');
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error('Unable to generate video URL');
  }

  return data.publicUrl;
}

/**
 * Upload a thumbnail image to Supabase Storage and return a public URL
 */
export async function uploadImageFile(file: File): Promise<string> {
  const bucket = 'thumbnails';
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `uploads/${timestamp}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/png',
    });

  if (uploadError) {
    console.error('Image upload failed:', uploadError);
    throw new Error(uploadError.message || 'Image upload failed');
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error('Unable to generate image URL');
  }

  return data.publicUrl;
}

/**
 * Get reaction counts and current user's reaction for a video
 */
export async function getVideoReactionInfo(videoId: string, userId?: string): Promise<{ likes: number; dislikes: number; userReaction?: VideoReaction }> {
  const { data, error } = await supabase
    .from('video_reactions')
    .select('reaction, user_id')
    .eq('video_id', videoId);
  if (error) return { likes: 0, dislikes: 0, userReaction: undefined };
  const likes = (data || []).filter((r: any) => r.reaction === 'like').length;
  const dislikes = (data || []).filter((r: any) => r.reaction === 'dislike').length;
  const userReaction = userId ? (data || []).find((r: any) => r.user_id === userId)?.reaction : undefined;
  return { likes, dislikes, userReaction } as { likes: number; dislikes: number; userReaction?: VideoReaction };
}

/**
 * Set or update user's reaction for a video
 */
export async function setUserVideoReaction(videoId: string, userId: string, reaction: VideoReaction | null): Promise<boolean> {
  console.log('[Videos] setUserVideoReaction', { videoId, userId, reaction });

  if (reaction === null) {
    const { error, count } = await supabase
      .from('video_reactions')
      .delete({ count: 'exact' })
      .eq('video_id', videoId)
      .eq('user_id', userId);

    if (error) {
      console.error('[Videos] setUserVideoReaction DELETE error:', error);
    } else {
      console.log('[Videos] setUserVideoReaction DELETE success count:', count);
    }
    return !error;
  }

  const { error } = await supabase
    .from('video_reactions')
    .upsert({ video_id: videoId, user_id: userId, reaction }, { onConflict: 'video_id,user_id' });

  if (error) {
    console.error('[Videos] setUserVideoReaction UPSERT error:', error);
  }
  return !error;
}

/**
 * Comments: list and add
 */
export async function getVideoComments(videoId: string): Promise<VideoComment[]> {
  const { data, error } = await supabase
    .from('video_comments')
    .select('id, video_id, user_id, content, created_at, user:users(id, name, avatar_url)')
    .eq('video_id', videoId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as any as VideoComment[];
}

export async function addVideoComment(videoId: string, userId: string, content: string): Promise<VideoComment | null> {
  const { data, error } = await supabase
    .from('video_comments')
    .insert({ video_id: videoId, user_id: userId, content: content.trim() })
    .select('id, video_id, user_id, content, created_at')
    .single();
  if (error || !data) return null;
  return data as VideoComment;
}

/** Delete a video (creator only). Also removes quiz, reactions, comments and storage files. */
export async function deleteVideo(videoId: string, requesterId: string): Promise<boolean> {
  // Pre-fetch URLs for storage cleanup (should be readable for approved videos)
  let videoUrl: string | null = null;
  let thumbnailUrl: string | null = null;
  try {
    const { data: v } = await supabase
      .from('videos')
      .select('video_url, thumbnail_url')
      .eq('id', videoId)
      .single();
    if (v) {
      videoUrl = (v as any).video_url || null;
      thumbnailUrl = (v as any).thumbnail_url || null;
    }
  } catch { }

  // First try the RPC that bypasses RLS via SECURITY DEFINER
  let rpcSuccess = false;
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('delete_video_cascade', {
      p_video_id: videoId,
      p_requester_id: requesterId,
    });
    if (rpcError) {
      console.error('RPC delete_video_cascade error:', rpcError);
    } else {
      rpcSuccess = Boolean(rpcData);
    }
  } catch (e) {
    console.error('RPC exception:', e);
  }

  if (!rpcSuccess) return false;

  // Fetch video URLs for storage cleanup (now row is deleted, but we need prior info)
  // Attempt to retrieve from storage path inference is not possible without URLs; so we skip if not available
  // Clients can pass URLs; alternatively, consider storing asset paths separately if needed.

  // After DB deletion, attempt to remove storage assets (ignore failures) if we can parse from known pattern.
  function storageFromPublicUrl(url?: string | null): { bucket: string; path: string } | null {
    if (!url) return null;
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(Boolean);
      // Expected: /storage/v1/object/public/<bucket>/<path>
      const idx = parts.findIndex((p) => p === 'object');
      if (idx === -1) return null;
      const bucket = parts[idx + 2];
      const path = decodeURIComponent(parts.slice(idx + 3).join('/'));
      if (!bucket || !path) return null;
      return { bucket, path };
    } catch {
      return null;
    }
  }

  // Attempt storage cleanup now using pre-fetched URLs
  const videoStorage = storageFromPublicUrl(videoUrl || undefined);
  const thumbStorage = storageFromPublicUrl(thumbnailUrl || undefined);
  if (videoStorage) {
    await supabase.storage.from(videoStorage.bucket).remove([videoStorage.path]);
  }
  if (thumbStorage) {
    await supabase.storage.from(thumbStorage.bucket).remove([thumbStorage.path]);
  }

  return true;
}

/**
 * Get all categories with video counts
 */
export async function getCategories(): Promise<Category[]> {
  // Fetch categories
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (catError || !categories) return [];

  // Fetch video counts per category (only approved videos)
  const { data: videoCounts, error: countError } = await supabase
    .from('videos')
    .select('category_id')
    .eq('status', 'approved');

  if (countError || !videoCounts) {
    // Return categories without counts if query fails
    return categories as Category[];
  }

  // Count videos per category
  const countMap = new Map<string, number>();
  for (const v of videoCounts) {
    if (v.category_id) {
      countMap.set(v.category_id, (countMap.get(v.category_id) || 0) + 1);
    }
  }

  // Add video_count to each category
  return categories.map(cat => ({
    ...cat,
    video_count: countMap.get(cat.id) || 0
  })) as Category[];
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Category;
}

/**
 * Get all approved videos
 */
export async function getApprovedVideos(): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      category:categories(*),
      creator:users(id, name, avatar_url)
    `)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Video[];
}

/**
 * Get approved videos by category
 */
export async function getVideosByCategory(categoryId: string): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      category:categories(*),
      creator:users(id, name, avatar_url)
    `)
    .eq('category_id', categoryId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Video[];
}

/**
 * Get video by ID with quiz questions
 */
export async function getVideoById(id: string): Promise<{
  video: Video;
  questions: QuizQuestion[];
} | null> {
  const { data: video, error: videoError } = await supabase
    .from('videos')
    .select(`
      *,
      category:categories(*),
      creator:users(id, name, avatar_url)
    `)
    .eq('id', id)
    .single();

  if (videoError || !video) return null;

  const { data: questions, error: questionsError } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('video_id', id)
    .order('order_index');

  return {
    video: video as Video,
    questions: (questions || []) as QuizQuestion[]
  };
}

/**
 * Create a new video
 */
export async function createVideo(
  submission: VideoSubmission,
  creatorId: string
): Promise<Video | null> {
  // Import validation functions
  const {
    validateVideoDuration,
    validateVideoUrl,
    validateThumbnailUrl,
    validateVideoTitle,
    validateVideoDescription,
    validateQuizQuestions,
    combineValidations,
    formatValidationErrors
  } = await import('./validation');

  // Comprehensive validation
  const validationResults = combineValidations(
    validateVideoDuration(submission.duration_seconds),
    validateVideoUrl(submission.video_url),
    validateThumbnailUrl(submission.thumbnail_url),
    validateVideoTitle(submission.title),
    validateVideoDescription(submission.description),
    validateQuizQuestions(submission.quiz_questions)
  );

  if (!validationResults.isValid) {
    const errorMessage = formatValidationErrors(validationResults.errors);
    console.error('Video validation failed:', errorMessage);
    throw new Error(`Video validation failed:\n${errorMessage}`);
  }

  // Create video
  const { data: video, error: videoError } = await supabase
    .from('videos')
    .insert({
      title: submission.title.trim(),
      description: submission.description.trim(),
      video_url: submission.video_url,
      thumbnail_url: submission.thumbnail_url,
      duration_seconds: submission.duration_seconds,
      category_id: submission.category_id,
      creator_id: creatorId,
      status: 'approved'
    })
    .select()
    .single();

  if (videoError || !video) {
    console.error('Error creating video:', videoError);
    throw new Error(videoError?.message || 'Failed to create video');
  }

  // Create quiz questions
  if (submission.quiz_questions.length > 0) {
    const questionsToInsert = submission.quiz_questions.map((q, index) => ({
      video_id: video.id,
      question: q.question.trim(),
      options: q.options.map(opt => opt.trim()),
      correct_answer: q.correct_answer,
      order_index: index
    }));

    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert);

    if (questionsError) {
      console.error('Error creating quiz questions:', questionsError);
      // Rollback video creation
      await supabase.from('videos').delete().eq('id', video.id);
      throw new Error('Failed to create quiz questions. Video creation rolled back.');
    }
  }

  return video as Video;
}

/**
 * Get videos by creator
 */
export async function getVideosByCreator(creatorId: string): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Video[];
}

/**
 * Increment view count
 */
export async function incrementViewCount(videoId: string): Promise<void> {
  const { data } = await supabase
    .from('videos')
    .select('view_count')
    .eq('id', videoId)
    .single();

  if (data) {
    await supabase
      .from('videos')
      .update({ view_count: data.view_count + 1 })
      .eq('id', videoId);
  }
}

/**
 * Search videos
 */
export async function searchVideos(query: string): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      category:categories(*),
      creator:users(id, name, avatar_url)
    `)
    .eq('status', 'approved')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Video[];
}

/**
 * Get videos by status (for admin)
 */
export async function getVideosByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      category:categories(*),
      creator:users(id, name, avatar_url)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Video[];
}

/**
 * Approve a video (admin only)
 */
export async function approveVideo(videoId: string): Promise<boolean> {
  const { error } = await supabase
    .from('videos')
    .update({ status: 'approved' })
    .eq('id', videoId);

  if (error) {
    console.error('Error approving video:', error);
    return false;
  }
  return true;
}

/**
 * Reject a video (admin only)
 */
export async function rejectVideo(videoId: string): Promise<boolean> {
  const { error } = await supabase
    .from('videos')
    .update({ status: 'rejected' })
    .eq('id', videoId);

  if (error) {
    console.error('Error rejecting video:', error);
    return false;
  }
  return true;
}

/**
 * Update a video
 */
export async function updateVideo(videoId: string, updates: Partial<Video>): Promise<boolean> {
  const { error } = await supabase
    .from('videos')
    .update(updates)
    .eq('id', videoId);

  if (error) {
    console.error('Error updating video:', error);
    return false;
  }
  return true;
}
