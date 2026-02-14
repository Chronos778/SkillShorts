# SkillShorts UI/UX Design System: "Swiss Modernism"

## 1. Design Philosophy
The UI follows a **Swiss International Style** (Die Neue Grafik) philosophy. It prioritizes technical precision, monochromatic high-contrast layouts, and a "brutalist-lite" aesthetic that feels professional and industrial.

## 2. Core Color Palette
| Token | Light Mode (Default) | Dark Mode |
| :--- | :--- | :--- |
| **Primary** | #000000 (Pure Black) | #FAFAFA (Pure White) |
| **Secondary** | #F5F5F5 (Light Gray) | #1A1A1A (Dark Gray) |
| **Accent** | #002FA7 (Klein Blue) | #3366FF (Vibrant Blue) |
| **Background** | #FFFFFF (Pure White) | #0D0D0D (Deep Black) |

## 3. Visual Language
- **Corner Radius**: 0px (Hard edge). Everything is squared off to emphasize the technical, architectural feel.
- **Borders**: 2px solid strokes. Used primarily for containers and active states to create depth without using shadows.
- **Shadows**: "Neo-brutalist" style. Instead of soft blurs, we use hard offset shadows: `shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`.
- **Typography**: 
  - **Sans**: *Inter* (System UI feel)
  - **Mono**: *Roboto Mono* (Technical/Code feel, used for metadata and search).
  - **Case**: Strategic use of `UPPERCASE` for navigation items and headers to mimic industrial signage.

## 4. Key Components

### A. The SwissShell (Main Navigation)
- **Sidebar**: A fixed 64px width panel on the left.
- **Active State**: Inverted colors (White text on Black background) with a hard 2px offset shadow.
- **Interaction**: Features a **Shine Animation**—a full-width light beam that sweeps across the active button on hover, adding a premium microscopic detail.

### B. Header / System Dashboard
- **Hierarchy Path**: Displayed in Mono font (e.g., `SYSTEM / FEED`).
- **Search Bar**: 
  - Monospaced placeholder: `SEARCH DATABASE...`
  - Keyboard accessibility: **Ctrl+K** / **Cmd+K** shortcut.
  - UI hint: Includes a `⌘K` micro-badge for power users.

### C. Video Interface
- **Feed**: High-contrast cards with sharp borders.
- **Metadata**: Uses monospaced font for views/points to emphasize "data" over just content.

## 5. Global Animations
- **Fade In**: Smooth 0.4s cubic-bezier opacity transition for page loads.
- **Slide Up**: Subtle 0.5s vertical entrance for dashboard items.
- **Pop**: Micro-pop effect for navigation icons to provide tactile feedback.

---
*This document serves as the source of truth for UI consistency across the SkillShorts platform.*
