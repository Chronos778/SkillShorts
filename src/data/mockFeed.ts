import { Video, User, Category } from "@/types";

export interface MockVideo extends Video {
    aspectRatio: "16:9" | "9:16";
    progress?: number; // 0-100
}

export const MOCK_CREATORS: User[] = [
    { id: "c1", name: "TechMaster", avatar_url: "https://github.com/shadcn.png" } as User,
    { id: "c2", name: "DesignPro", avatar_url: "https://github.com/shadcn.png" } as User,
    { id: "c3", name: "CodeNinja", avatar_url: "https://github.com/shadcn.png" } as User,
];

export const MOCK_CATEGORIES: Category[] = [
    { id: "cat1", name: "Development", slug: "dev" } as Category,
    { id: "cat2", name: "Design", slug: "design" } as Category,
    { id: "cat3", name: "Productivity", slug: "prod" } as Category,
];

export const MOCK_FEED_VIDEOS: MockVideo[] = [
    {
        id: "v2",
        title: "Figma Auto Layout Tips",
        description: "Master auto layout in 60 seconds.",
        video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", // Placeholder
        thumbnail_url: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&q=80",
        duration_seconds: 60,
        creator_id: "c2",
        creator: MOCK_CREATORS[1],
        category_id: "cat2",
        category: MOCK_CATEGORIES[1],
        status: "approved",
        created_at: new Date().toISOString(),
        view_count: 5000,
        aspectRatio: "9:16",
        progress: 0,
    },
    {
        id: "v4",
        title: "Morning Routine for Focus",
        description: "Start your day right.",
        video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", // Placeholder
        thumbnail_url: "https://images.unsplash.com/photo-1499750310159-5b9887039e54?w=800&q=80",
        duration_seconds: 180,
        creator_id: "c1",
        creator: MOCK_CREATORS[0],
        category_id: "cat3",
        category: MOCK_CATEGORIES[2],
        status: "approved",
        created_at: new Date().toISOString(),
        view_count: 3200,
        aspectRatio: "9:16",
        progress: 0,
    },
    {
        id: "v5",
        title: "CSS Grid in 100 Seconds",
        description: "Quick explanation of CSS Grid.",
        video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Placeholder
        thumbnail_url: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&q=80",
        duration_seconds: 100,
        creator_id: "c3",
        creator: MOCK_CREATORS[2],
        category_id: "cat1",
        category: MOCK_CATEGORIES[0],
        status: "approved",
        created_at: new Date().toISOString(),
        view_count: 1500,
        aspectRatio: "9:16",
        progress: 0,
    },
];

export const MOCK_CONTINUE_WATCHING = MOCK_FEED_VIDEOS[0];
export const MOCK_TRENDING_TOPICS = ["#ReactJS", "#UXDesign", "#Productivity", "#AI", "#Web3"];
