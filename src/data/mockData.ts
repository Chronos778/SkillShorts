export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  category: string;
  categoryEmoji: string;
  creator: {
    name: string;
    avatar: string;
  };
  views: number;
  completions: number;
  quiz: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  description: string;
  videoCount: number;
  color: string;
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  earned: boolean;
  earnedDate?: string;
}

export interface UserProgress {
  totalPoints: number;
  level: number;
  levelName: string;
  videosCompleted: number;
  quizAccuracy: number;
  currentStreak: number;
  badges: Badge[];
  skillProgress: { category: string; progress: number; emoji: string }[];
}

export const categories: Category[] = [
  { id: "coding", name: "Coding", emoji: "💻", description: "Learn programming & development", videoCount: 24, color: "from-blue-500 to-cyan-500" },
  { id: "cooking", name: "Cooking", emoji: "🍳", description: "Master culinary skills", videoCount: 18, color: "from-orange-500 to-red-500" },
  { id: "photography", name: "Photography", emoji: "📸", description: "Capture perfect moments", videoCount: 15, color: "from-purple-500 to-pink-500" },
  { id: "diy", name: "DIY & Crafts", emoji: "🔨", description: "Build & create things", videoCount: 21, color: "from-amber-500 to-yellow-500" },
  { id: "academic", name: "Academic", emoji: "📚", description: "Study smarter, not harder", videoCount: 32, color: "from-green-500 to-emerald-500" },
  { id: "music", name: "Music", emoji: "🎵", description: "Learn instruments & theory", videoCount: 12, color: "from-indigo-500 to-violet-500" },
];

export const videos: Video[] = [
  {
    id: "1",
    title: "CSS Flexbox in 3 Minutes",
    description: "Master CSS Flexbox layout with this quick tutorial. Learn align-items, justify-content, and flex-direction.",
    thumbnail: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=400&h=225&fit=crop",
    duration: "3:24",
    category: "coding",
    categoryEmoji: "💻",
    creator: { name: "Sarah Chen", avatar: "https://i.pravatar.cc/100?img=1" },
    views: 1250,
    completions: 890,
    quiz: [
      { id: "q1", question: "What property centers items horizontally in a flex container?", options: ["align-items", "justify-content", "flex-wrap", "flex-direction"], correctIndex: 1 },
      { id: "q2", question: "Which value makes flex items stack vertically?", options: ["row", "column", "wrap", "center"], correctIndex: 1 },
    ],
  },
  {
    id: "2",
    title: "Perfect Scrambled Eggs",
    description: "The secret to restaurant-quality scrambled eggs. Creamy, fluffy, and delicious every time.",
    thumbnail: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=225&fit=crop",
    duration: "4:12",
    category: "cooking",
    categoryEmoji: "🍳",
    creator: { name: "Chef Marco", avatar: "https://i.pravatar.cc/100?img=3" },
    views: 2340,
    completions: 1567,
    quiz: [
      { id: "q1", question: "At what heat should you cook scrambled eggs?", options: ["High heat", "Medium-low heat", "Maximum heat", "No heat"], correctIndex: 1 },
      { id: "q2", question: "When should you season the eggs?", options: ["Before cooking", "During cooking", "After cooking", "Never"], correctIndex: 2 },
    ],
  },
  {
    id: "3",
    title: "Golden Hour Photography Tips",
    description: "Capture stunning photos during the magic hour. Learn composition, exposure, and editing basics.",
    thumbnail: "https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=400&h=225&fit=crop",
    duration: "4:45",
    category: "photography",
    categoryEmoji: "📸",
    creator: { name: "Alex Rivera", avatar: "https://i.pravatar.cc/100?img=5" },
    views: 1890,
    completions: 1234,
    quiz: [
      { id: "q1", question: "When is the golden hour?", options: ["Noon", "Shortly after sunrise or before sunset", "Midnight", "Any time"], correctIndex: 1 },
      { id: "q2", question: "What creates the warm tones in golden hour?", options: ["Camera settings", "Filters", "Sunlight angle through atmosphere", "Post-processing"], correctIndex: 2 },
    ],
  },
  {
    id: "4",
    title: "Build a Floating Shelf",
    description: "Create a minimalist floating shelf with hidden brackets. No visible hardware!",
    thumbnail: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=400&h=225&fit=crop",
    duration: "5:00",
    category: "diy",
    categoryEmoji: "🔨",
    creator: { name: "Mike Builder", avatar: "https://i.pravatar.cc/100?img=7" },
    views: 980,
    completions: 654,
    quiz: [
      { id: "q1", question: "What type of bracket hides inside the shelf?", options: ["L-bracket", "Floating bracket", "Corner bracket", "Angle bracket"], correctIndex: 1 },
    ],
  },
  {
    id: "5",
    title: "Memorize Anything with Memory Palace",
    description: "Ancient technique used by memory champions. Remember lists, speeches, and more.",
    thumbnail: "https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?w=400&h=225&fit=crop",
    duration: "3:30",
    category: "academic",
    categoryEmoji: "📚",
    creator: { name: "Dr. Emily Stone", avatar: "https://i.pravatar.cc/100?img=9" },
    views: 3210,
    completions: 2456,
    quiz: [
      { id: "q1", question: "What do you use as 'locations' in a memory palace?", options: ["Random words", "Familiar places", "Numbers", "Colors"], correctIndex: 1 },
      { id: "q2", question: "How should you visualize items?", options: ["Plain and simple", "Vivid and exaggerated", "Black and white", "Blurry"], correctIndex: 1 },
    ],
  },
  {
    id: "6",
    title: "Basic Guitar Chords for Beginners",
    description: "Learn 5 essential chords that let you play hundreds of songs. G, C, D, Em, Am.",
    thumbnail: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=225&fit=crop",
    duration: "4:50",
    category: "music",
    categoryEmoji: "🎵",
    creator: { name: "Jake Melody", avatar: "https://i.pravatar.cc/100?img=11" },
    views: 1670,
    completions: 1123,
    quiz: [
      { id: "q1", question: "How many strings does a standard guitar have?", options: ["4", "5", "6", "8"], correctIndex: 2 },
      { id: "q2", question: "Which finger is used for the 'root note' in G chord?", options: ["Index", "Middle", "Ring", "Pinky"], correctIndex: 2 },
    ],
  },
];

export const userProgress: UserProgress = {
  totalPoints: 2450,
  level: 5,
  levelName: "Rising Star",
  videosCompleted: 23,
  quizAccuracy: 87,
  currentStreak: 7,
  badges: [
    { id: "1", name: "First Video", emoji: "🎬", description: "Complete your first video", earned: true, earnedDate: "2024-01-15" },
    { id: "2", name: "Week Warrior", emoji: "🔥", description: "7-day learning streak", earned: true, earnedDate: "2024-01-22" },
    { id: "3", name: "Quiz Master", emoji: "🧠", description: "Score 100% on 5 quizzes", earned: true, earnedDate: "2024-01-28" },
    { id: "4", name: "Explorer", emoji: "🗺️", description: "Try 3 different categories", earned: true, earnedDate: "2024-02-01" },
    { id: "5", name: "Skill Master", emoji: "🏆", description: "Complete all videos in a category", earned: false },
    { id: "6", name: "Century Club", emoji: "💯", description: "Earn 10,000 points", earned: false },
  ],
  skillProgress: [
    { category: "Coding", progress: 65, emoji: "💻" },
    { category: "Cooking", progress: 40, emoji: "🍳" },
    { category: "Photography", progress: 25, emoji: "📸" },
    { category: "Academic", progress: 80, emoji: "📚" },
  ],
};

export const levelThresholds = [
  { level: 1, name: "Newcomer", minPoints: 0, emoji: "🌱" },
  { level: 2, name: "Learner", minPoints: 100, emoji: "📖" },
  { level: 3, name: "Explorer", minPoints: 500, emoji: "🧭" },
  { level: 4, name: "Achiever", minPoints: 1000, emoji: "⭐" },
  { level: 5, name: "Rising Star", minPoints: 2000, emoji: "🌟" },
  { level: 6, name: "Expert", minPoints: 5000, emoji: "🎓" },
  { level: 7, name: "Master", minPoints: 10000, emoji: "👑" },
  { level: 8, name: "Legend", minPoints: 25000, emoji: "🏆" },
];
