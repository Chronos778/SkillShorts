
export interface MockVideo {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    video_url?: string;
    duration_seconds: number;
    view_count: number;
    progress?: number;
    category?: {
        name: string;
    };
    creator?: {
        name: string;
        avatar_url?: string;
    };
}

export const MOCK_CONTINUE_WATCHING: MockVideo = {
    id: "cw-1",
    title: "Advanced React Patterns",
    description: "Learn about compound components and more.",
    thumbnail_url: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
    duration_seconds: 1200,
    view_count: 5430,
    progress: 45,
    category: { name: "Development" },
    creator: { name: "Sarah Drasner" }
};

export const MOCK_TRENDING_TOPICS = [
    "JavaScript", "Python", "Machine Learning", "Design Systems", "CSS Grid", "Next.js"
];

export const MOCK_CREATORS = [
    { id: "c1", name: "Jack Herrington", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack" },
    { id: "c2", name: "Web Dev Simplified", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=WebDev" },
    { id: "c3", name: "Fireship", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fireship" },
];
