# Tempo

> **Time is the only folder.**

Tempo is a temporal-first agenda app that anchors everything to time. It combines the elegance of calendar planning with the depth of Markdown notes — built for thoughtful makers who want honest, visual planning without the overhead of complex productivity systems.

---

## Philosophy

**Three Core Principles:**

1. **Temporal Anchoring** — Time is your primary organizational axis, not folders or tags
2. **Task-Note Singularity** — Every task can expand into full context when needed
3. **Visual Honesty** — The interface shows you the truth about your capacity

[Read the full philosophy →](docs/PHILOSOPHY.md)

---

## Current Status

### ✅ Implemented
- **Home Dashboard** — Bento-style layout with calendar, today's tasks, and upcoming preview
- **Calendar View** — Compact month grid with task indicators
- **Day Agenda** — Focused view for a single day's tasks
- **Quick Tasks** — Fast capture with editing modal and completion animations
- **Command Bar** — `Cmd+K` with natural language date parsing

### ⏳ Coming Next
- **Deep Tasks** — Markdown notes that "bloom" from tasks

[See the full roadmap →](roadmap.md)

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/tempo.git
cd tempo

# Install dependencies
cd tempo-web
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 18 + TypeScript |
| **Styling** | TailwindCSS v4 |
| **Animations** | Framer Motion |
| **Storage** | Dexie.js (IndexedDB) |
| **Build** | Vite |

---

## Documentation

| Document | Description |
|----------|-------------|
| [PHILOSOPHY.md](docs/PHILOSOPHY.md) | Core vision and design principles |
| [SPEC.md](docs/SPEC.md) | Feature specifications |
| [COMMAND_SYNTAX.md](docs/COMMAND_SYNTAX.md) | Command bar usage guide |
| [roadmap.md](roadmap.md) | Implementation status |

---

## License

MIT
