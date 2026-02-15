import { supabase } from '@/lib/supabase';
import { updateUserPoints, updateUserStreak } from './users';
import { checkAndAwardBadges } from './badges';
import type { Progress, QuizResult, QuizSubmission, SkillProgress, Category } from '@/types';
import { POINTS, calculateQuizScore } from '@/types';

/**
 * Get user's progress on a specific video
 */
export async function getVideoProgress(userId: string, videoId: string): Promise<Progress | null> {
  const { data, error } = await supabase
    .from('progress')
    .select(`
      *,
      video:videos(*)
    `)
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .single();

  if (error || !data) return null;
  return data as Progress;
}

/**
 * Mark video as watched (does NOT mark as completed - only quiz submission does that)
 */
export async function markVideoWatched(userId: string, videoId: string): Promise<boolean> {
  // Check if progress exists
  const { data: existing } = await supabase
    .from('progress')
    .select('id, watched')
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .single();

  if (existing) {
    // Only update watched status, never set completed directly
    const { error } = await supabase
      .from('progress')
      .update({
        watched: true,
        // Explicitly ensure completed stays false
        // Only submitQuiz can set completed to true
      })
      .eq('id', existing.id);
    return !error;
  } else {
    // Create new progress entry (watched but not completed)
    const { error } = await supabase
      .from('progress')
      .insert({
        user_id: userId,
        video_id: videoId,
        watched: true,
        quiz_score: 0,
        completed: false, // Explicitly set to false
        points_earned: 0
      });
    return !error;
  }
}

/**
 * Submit quiz answers and calculate score
 */
export async function submitQuiz(userId: string, submission: QuizSubmission): Promise<QuizResult | null> {
  // Get quiz questions
  const { data: questions, error: questionsError } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('video_id', submission.video_id)
    .order('order_index');

  if (questionsError || !questions || questions.length === 0) {
    console.error('Error fetching quiz questions:', questionsError);
    throw new Error('Cannot submit quiz: No quiz questions found for this video');
  }

  // Validate quiz answers
  const { validateQuizAnswers } = await import('./validation');
  const validation = validateQuizAnswers(submission.answers, questions.length);

  if (!validation.isValid) {
    const { formatValidationErrors } = await import('./validation');
    const errorMessage = formatValidationErrors(validation.errors);
    console.error('Quiz validation failed:', errorMessage);
    throw new Error(`Quiz validation failed:\n${errorMessage}`);
  }

  // Calculate score
  const correct: number[] = [];
  const incorrect: number[] = [];

  questions.forEach((q, index) => {
    if (submission.answers[index] === q.correct_answer) {
      correct.push(index);
    } else {
      incorrect.push(index);
    }
  });

  const score = calculateQuizScore(correct.length, questions.length);
  const isPerfect = correct.length === questions.length;

  // Calculate points
  let pointsEarned = POINTS.VIDEO_COMPLETION;
  pointsEarned += correct.length * POINTS.QUIZ_CORRECT_ANSWER;
  if (isPerfect) {
    pointsEarned += POINTS.PERFECT_QUIZ;
  }

  // Update streak and apply bonus
  const newStreak = await updateUserStreak(userId);
  if (newStreak > 1) {
    pointsEarned += POINTS.STREAK_BONUS;
  }

  // Save progress
  const { data: existingProgress } = await supabase
    .from('progress')
    .select('id')
    .eq('user_id', userId)
    .eq('video_id', submission.video_id)
    .single();

  if (existingProgress) {
    await supabase
      .from('progress')
      .update({
        quiz_score: score,
        quiz_answers: submission.answers,
        completed: true,
        points_earned: pointsEarned,
        completed_at: new Date().toISOString()
      })
      .eq('id', existingProgress.id);
  } else {
    await supabase
      .from('progress')
      .insert({
        user_id: userId,
        video_id: submission.video_id,
        watched: true,
        quiz_score: score,
        quiz_answers: submission.answers,
        completed: true,
        points_earned: pointsEarned,
        completed_at: new Date().toISOString()
      });
  }

  // Update user points
  await updateUserPoints(userId, pointsEarned);

  // Increment video completion count
  const { data: videoData } = await supabase
    .from('videos')
    .select('completion_count')
    .eq('id', submission.video_id)
    .single();

  if (videoData) {
    await supabase
      .from('videos')
      .update({ completion_count: videoData.completion_count + 1 })
      .eq('id', submission.video_id);
  }

  // Check and award badges
  const badgesEarned = await checkAndAwardBadges(userId);

  return {
    score,
    total: questions.length,
    correct,
    incorrect,
    pointsEarned,
    badgesEarned
  };
}

/**
 * Get all progress for a user
 */
export async function getUserProgress(userId: string): Promise<Progress[]> {
  const { data, error } = await supabase
    .from('progress')
    .select(`
      *,
      video:videos(
        *,
        category:categories(*)
      )
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error || !data) return [];
  return data as Progress[];
}

/**
 * Get completed videos count
 */
export async function getCompletedVideosCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('completed', true);

  if (error) return 0;
  return count || 0;
}

/**
 * Get average quiz accuracy
 */
export async function getAverageQuizAccuracy(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('progress')
    .select('quiz_score')
    .eq('user_id', userId)
    .eq('completed', true);

  if (error || !data || data.length === 0) return 0;

  const total = data.reduce((sum, p) => sum + (p.quiz_score || 0), 0);
  return Math.round(total / data.length);
}

/**
 * Get skill-wise progress
 */
export async function getSkillProgress(userId: string): Promise<SkillProgress[]> {
  // Get all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*');

  if (!categories) return [];

  // Get user's completed videos by category
  const { data: completedVideos } = await supabase
    .from('progress')
    .select(`
      quiz_score,
      video:videos(category_id)
    `)
    .eq('user_id', userId)
    .eq('completed', true);

  // Get total approved videos per category
  const { data: videosByCategory } = await supabase
    .from('videos')
    .select('category_id')
    .eq('status', 'approved');

  // Calculate progress per category
  const skillProgress: SkillProgress[] = categories.map(category => {
    const totalVideos = videosByCategory?.filter(v => v.category_id === category.id).length || 0;
    const completed = completedVideos?.filter(p => {
      const video = p.video as unknown as { category_id: string } | null;
      return video?.category_id === category.id;
    }) || [];
    const videosCompleted = completed.length;
    const averageScore = completed.length > 0
      ? Math.round(completed.reduce((sum, p) => sum + (p.quiz_score || 0), 0) / completed.length)
      : 0;

    return {
      category: category as Category,
      videosCompleted,
      totalVideos,
      averageScore
    };
  });

  return skillProgress;
}

/**
 * Get recent progress (last 5 completed videos)
 */
export async function getRecentProgress(userId: string): Promise<Progress[]> {
  const { data, error } = await supabase
    .from('progress')
    .select(`
      *,
      video:videos(
        *,
        category:categories(*)
      )
    `)
    .eq('user_id', userId)
    .eq('completed', true)
    .order('completed_at', { ascending: false })
    .limit(5);

  if (error || !data) return [];
  return data as Progress[];
}
