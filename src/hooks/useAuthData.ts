import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { getUserByClerkId } from "@/services/users";
import { getUserBadges } from "@/services/badges";
import { getSkillProgress, getCompletedVideosCount, getAverageQuizAccuracy } from "@/services/progress";
import type { User, Badge, SkillProgress } from "@/types";

interface UseAuthDataResult {
  user: User | null;
  badges: Badge[];
  skillProgress: SkillProgress[];
  videosCompleted: number;
  quizAccuracy: number;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuthData(): UseAuthDataResult {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();

  const { data: dbUser, isLoading: userLoading } = useQuery({
    queryKey: ['user', clerkUser?.id],
    queryFn: () => getUserByClerkId(clerkUser!.id),
    enabled: isLoaded && isSignedIn && !!clerkUser?.id,
    staleTime: 60000, // 1 minute
  });

  const { data: badges = [], isLoading: badgesLoading } = useQuery({
    queryKey: ['badges', dbUser?.id],
    queryFn: () => getUserBadges(dbUser!.id),
    enabled: !!dbUser?.id,
    staleTime: 60000,
  });

  const { data: skillProgress = [], isLoading: skillLoading } = useQuery({
    queryKey: ['skillProgress', dbUser?.id],
    queryFn: () => getSkillProgress(dbUser!.id),
    enabled: !!dbUser?.id,
    staleTime: 60000,
  });

  const { data: videosCompleted = 0 } = useQuery({
    queryKey: ['videosCompleted', dbUser?.id],
    queryFn: () => getCompletedVideosCount(dbUser!.id),
    enabled: !!dbUser?.id,
    staleTime: 60000,
  });

  const { data: quizAccuracy = 0 } = useQuery({
    queryKey: ['quizAccuracy', dbUser?.id],
    queryFn: () => getAverageQuizAccuracy(dbUser!.id),
    enabled: !!dbUser?.id,
    staleTime: 60000,
  });

  return {
    user: dbUser ?? null,
    badges,
    skillProgress,
    videosCompleted,
    quizAccuracy,
    isLoading: !isLoaded || userLoading || badgesLoading || skillLoading,
    isAuthenticated: isSignedIn ?? false,
  };
}
