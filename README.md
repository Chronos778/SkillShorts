<div align="center">

<img src="public/skilllo.png" alt="SkillShorts Logo" width="120" style="border-radius: 20px"/>

# ⚡ SkillShorts

> **Learn Fast. Test Often. Retain More.**
>
> A verified educational platform designed for the modern attention span. Vertical short-form videos meets mandatory interactive quizzes.

</div>

<br />

![App Screenshot](public/og-image.png)

## 🌟 Features

- **📱 Vertical Shorts Feed** - Immersive, scroll-snapping feed optimized for quick learning (YouTube Shorts style).
- **🧠 Interactive Quizzes** - Mandatory quizzes after every video to ensure comprehension.
- **🏆 Gamification System** - Earn points, climb the leaderboard, and unlock badges.
- **🎬 Creator Studio** - Upload vertical videos or import from YouTube with auto-thumbnails.
- **📊 Detailed Analytics** - Track your learning progress and skill acquisition.
- **💬 Social Engagement** - Like, comment, and share valuable learning nuggets.
- **🔐 Enterprise-Grade Auth** - Secure authentication powered by Clerk.

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui + Framer Motion
- **Animations**: motion (Framer Motion v12)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk
- **State Management**: TanStack React Query
- **Routing**: React Router v6

## 📋 Prerequisites

- Node.js 18+ and npm
- Clerk account
- Supabase account

## ⚙️ Setup

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/skillshorts.git
cd skillshorts
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

## 📁 Project Structure

```
skillshorts/
├── src/
│   ├── components/       # UI components (Feed, Navbar, etc.)
│   ├── pages/           # Route pages (Index, Browse, Upload)
│   ├── services/        # API integration (Supabase, Clerk)
│   ├── hook/            # Custom React hooks
│   ├── lib/             # Utilities
│   └── types/           # TS definitions
├── supabase/
│   └── migrations/      # Database schema
└── public/              # Static assets
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ by the SkillShorts Team.</sub>
</div>
