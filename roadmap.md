# Tempo Roadmap

> **Tagline:** *Time is the only folder.*

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | React 18 + TypeScript | Familiarity, ecosystem, complex state management |
| **Styling** | TailwindCSS + custom design tokens | Rapid development, 2026 aesthetic |
| **Animations** | Framer Motion | Squishy interactions, bloom effects |
| **Storage** | Dexie.js (IndexedDB) | Local-first, offline support |
| **Markdown** | unified/remark ecosystem | Flexible, extensible parsing |
| **Date Handling** | date-fns | Lightweight, tree-shakeable |
| **Build** | Vite | Fast HMR, modern bundling |

---

## MVP Features (Phase 1)

### 1. Infinite Timeline (Chronicle) ⏳
The signature feature. Vertical scrolling through past, present, future.

**Requirements:**
- [ ] Virtualized rendering (react-window or custom)
- [ ] Bi-directional infinite scroll
- [ ] Day headers with date formatting
- [ ] Smooth scroll to "today" on load
- [ ] Visual distinction for past/present/future

**Performance Target:** 60fps scrolling, <16ms render per frame

---

### 2. Quick Tasks ⏳
Simple, fast task capture anchored to time.

**Requirements:**
- [ ] Inline task creation on timeline
- [ ] Checkbox with satisfying completion animation
- [ ] Drag to reschedule (stretch goal)
- [ ] Task text editing

---

### 3. Deep Tasks (Markdown Notes) ⏳
Tasks that expand into full context documents.

**Requirements:**
- [ ] "Bloom" animation to expand task into editor
- [ ] Markdown rendering (headings, lists, code, links)
- [ ] `[ ]` checkbox syntax creates interactive subtasks
- [ ] Collapse back to single-line task view
- [ ] YAML frontmatter for metadata (due date, priority)

---

### 4. Command Bar ⏳
Lightning-fast creation via `Cmd/Ctrl + K`.

**Requirements:**
- [ ] Global keyboard shortcut listener
- [ ] Fuzzy search through existing tasks
- [ ] Natural language parsing: `/task Buy milk tomorrow`
- [ ] Quick actions: create task, jump to date, search

---

### 5. Today View (Bento-lite) ⏳
Single dashboard for daily focus.

**Requirements:**
- [ ] Grid layout with key information
- [ ] Today's tasks list
- [ ] Optional: upcoming deadlines preview
- [ ] Clean, calm aesthetic

---

## Design System

### Colors (Dark Mode First)
```css
--bg-primary: #0a0a0f;
--bg-secondary: #12121a;
--bg-glass: rgba(255, 255, 255, 0.03);
--text-primary: #f0f0f5;
--text-secondary: #8888a0;
--accent-primary: #7c5cff;
--accent-glow: rgba(124, 92, 255, 0.3);
--success: #4ade80;
--warning: #fbbf24;
```

### Typography
- **Headings:** Inter or Outfit (Google Fonts)
- **Body:** System font stack for performance
- **Mono:** JetBrains Mono (for code blocks)

### Interactions
- Task completion: Scale down + checkmark draw animation
- Bloom: Physics-based spring expansion
- Glass effects: Backdrop blur on overlays

---

## Project Structure

```
tempo-web/
├── src/
│   ├── components/
│   │   ├── timeline/        # Infinite scroll, day views
│   │   ├── tasks/           # Quick & Deep task components
│   │   ├── command-bar/     # Cmd+K interface
│   │   ├── today/           # Bento dashboard
│   │   └── ui/              # Shared primitives (buttons, inputs)
│   ├── hooks/               # Custom React hooks
│   ├── stores/              # State management (Zustand or context)
│   ├── lib/
│   │   ├── db/              # Dexie.js schemas & queries
│   │   ├── markdown/        # Parsing & rendering
│   │   └── dates/           # Date utilities
│   ├── styles/              # Tailwind config, global CSS
│   └── App.tsx
├── public/
├── index.html
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## Implementation Order

1. **Project scaffold** — Vite + React + TS + Tailwind
2. **Design system** — Colors, typography, base components
3. **Data layer** — Dexie schemas for tasks
4. **Infinite Timeline** — Core scroll behavior
5. **Quick Tasks** — CRUD on timeline
6. **Deep Tasks** — Markdown expansion
7. **Command Bar** — Global shortcut + actions
8. **Today View** — Dashboard assembly
9. **Polish** — Animations, glass effects, transitions

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ⏳ | Not started |
| 🔄 | In progress |
| ✅ | Complete |
| 🐛 | Has known issues |

---

## Notes

- **No stubs, no workarounds** — Production code only
- **Local-first** — Must work offline from day one
- **Performance budget** — 60fps scroll, <100ms interaction response
- **Accessibility** — Keyboard navigation, screen reader support
