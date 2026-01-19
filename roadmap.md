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

### 1. Calendar View ✅
Monthly calendar grid as the primary landing experience.

**Requirements:**
- [x] Month grid with day cells
- [x] Task count indicators per day (dots)
- [x] Click to navigate to Day Agenda
- [x] Month navigation (prev/next)
- [ ] Week view toggle (stretch)

---

### 2. Day Agenda View ✅
Focused view for a single day's tasks.

**Requirements:**
- [x] Full task list for selected day
- [x] Day navigation (prev/today/next)
- [x] Back to calendar navigation
- [x] Stats display (completed/total)
- [x] Glassmorphic design with today highlight

---

### 3. Quick Tasks ✅
Simple, fast task capture anchored to time.

**Requirements:**
- [x] Inline task creation (InlineTaskCreator)
- [x] Checkbox with completion animation
- [x] Task text display
- [x] Task editing modal (title + reschedule)
- [ ] Drag to reschedule (stretch goal)

---

### 4. Deep Tasks (Markdown Notes) ✅
Tasks that expand into full context documents.

**Requirements:**
- [x] "Bloom" animation to expand task into editor
- [x] Markdown rendering (headings, lists, code, links)
- [x] `[ ]` checkbox syntax creates interactive subtasks
- [x] Collapse back to single-line task view
- [ ] YAML frontmatter for metadata (due date, priority)

---

### 5. Command Bar ✅
Lightning-fast creation via `Cmd/Ctrl + K`.

**Requirements:**
- [x] Global keyboard shortcut listener
- [x] Fuzzy search through existing tasks
- [x] Natural language parsing: `/task Buy milk tomorrow`
- [x] Quick actions: create task, jump to date, search

---

### 5. Home Dashboard (Bento Layout) ✅
Dashboard with calendar, today's tasks, and upcoming preview.

**Requirements:**
- [x] Bento grid layout with elegant tiles
- [x] Compact calendar tile
- [x] Today's tasks tile with quick add
- [x] Upcoming tasks preview (next 7 days)
- [x] Clean, glassmorphic aesthetic

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

## Phase 2 Features (Post-MVP)

### 6. Stats & Insights 📊 (Complete)
Visualizing progress to build momentum.

**Requirements:**
- [x] Task completion history
- [x] "Streak" counter (consecutive days)
- [x] Weekly/Monthly completion rates
- [x] Activity Heatmap (GitHub style) days/times)
- [ ] Weekly summary view

---

### 7. Recurring Tasks 🔄 (Mostly Complete)
Tasks that repeat on a schedule.

**Requirements:**
- [x] Recurrence patterns: daily, weekly, monthly, yearly
- [x] Custom intervals (every N days/weeks)
- [x] Day-of-week selection for weekly tasks
- [x] Optional end date or "X occurrences"
- [x] Skip instance functionality (Simlified: "Series Only" deletion strategy)
- [x] Natural language: `/task Water plants every 3 days`

Remaining Work
 Instance generation on task query (currently schema-only) -- DONE
 End date / occurrence limit in RecurrencePicker -- DONE

assess what to do with `{/* Today accent line */}`

**Schema:**
```typescript
recurrence?: {
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  endDate?: number;
}
```

---

### 8. Multi-Day Tasks ⏳
Tasks that span multiple days (projects, events).

**Requirements:**
- [ ] Optional start date (current dueDate becomes end date)
- [ ] Show on all days in range with "ongoing" indicator
- [ ] Progress tracking across the span
- [ ] Calendar visualization (task bars across days)

---

### 9. Time-of-Day Sections ⏳
Organize tasks by morning, afternoon, evening.

**Requirements:**
- [ ] Automatic grouping based on time hints
- [ ] Manual drag between sections
- [ ] Collapsible sections
- [ ] Optional time estimates per task

---

### 5.5. Hover card ⏳
Introduce hover cards when hovering over dates in the timeline for task details.

---

### 10. Tags & Labels ⏳
Categorize tasks with color-coded tags.

**Requirements:**
- [ ] Create/edit/delete custom tags
- [ ] Filter by tag in all views
- [ ] Multi-tag support per task
- [ ] Tag color picker

---

### 11. Keyboard Power User Mode ⏳
Vim-style navigation for speed.

**Requirements:**
- [ ] `j/k` — Move between tasks
- [ ] `x` — Toggle complete
- [ ] `d` — Delete (with confirmation skip option)
- [ ] `e` — Edit task
- [ ] `n` — New task
- [ ] `?` — Show keyboard shortcuts overlay

---

### 12. Quick Reschedule ⏳
Fast task postponement.

**Requirements:**
- [ ] "Tomorrow" quick action (one click/key)
- [ ] "Next week" quick action
- [ ] Right-click context menu with date options
- [ ] Swipe gesture on mobile

---

### 13. End-of-Day Review ⏳
Prompt to handle incomplete tasks.

**Requirements:**
- [ ] Evening notification/modal trigger
- [ ] List incomplete tasks for today
- [ ] Quick actions: reschedule to tomorrow, delete, mark done
- [ ] Optional daily notes/reflection field

---

### 14. Focus Mode ⏳
Distraction-free today view.

**Requirements:**
- [ ] Hide calendar and sidebar
- [ ] Show only today's tasks
- [ ] Minimal chrome, maximum focus
- [ ] Keyboard shortcut to toggle (`f`)

---

### 15. PWA & Notifications ⏳
Installable app with reminders.

**Requirements:**
- [ ] Service worker for offline caching
- [ ] Install prompt on supported browsers
- [ ] Optional push notifications for due tasks
- [ ] Configurable reminder times

---

## Stretch Goals

| Feature | Description |
|---------|-------------|
| Week view toggle | Alternative calendar display |
| Drag to reschedule | Reorder/move tasks between days |
| YAML frontmatter | Parse metadata from deep task content |
| Cloud sync | Optional backup to user's cloud storage |
| Themes | Light mode, custom accent colors |
| Export/Import | JSON, Markdown, or calendar formats |

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
