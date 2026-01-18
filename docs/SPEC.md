# Tempo Feature Specification

Current feature definitions for Tempo. For implementation status, see [roadmap.md](../roadmap.md).

---

## Core Features

### Calendar View ✅

The monthly calendar is Tempo's primary landing experience.

**Behavior:**
- Grid displays the current month with week rows
- Each day cell shows task count indicators (dots for pending, checks for complete)
- Clicking a day navigates to the Day Agenda view
- Arrow buttons navigate between months
- Today is visually highlighted

**Design:**
- Glassmorphic card with subtle backdrop blur
- Accent color highlight on current day
- Task indicators use small dots (1-3) or "+N" for overflow

---

### Day Agenda ✅

Focused view for planning and working on a single day.

**Behavior:**
- Displays all tasks anchored to the selected date
- Navigation arrows move between days
- "Today" button returns to current date
- Stats display shows completion progress (e.g., "3 of 5 completed")
- Back button returns to calendar view

**Design:**
- Full-width task list
- Completion stats with subtle progress indication
- Empty states encourage task creation

---

### Quick Tasks ✅

Fast, lightweight task capture.

**Behavior:**
- Inline creation: type and press Enter
- Checkbox toggles completion
- Completion triggers satisfying animation (checkmark draw, scale)
- Click task text to edit (opens detail view)
- Delete with confirmation dialog

**Data Model:**
```typescript
interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;  // For future Deep Tasks
}
```

---

### Command Bar ✅

Lightning-fast keyboard interface (`Cmd/Ctrl + K`).

**Modes:**
1. **Task Creation** — `/task Buy groceries > tomorrow`
2. **Navigation** — `/go next friday` or `/today`
3. **Search** — Fuzzy search through existing tasks

**Natural Language Parsing:**
- Relative dates: "tomorrow", "next week", "in 3 days"
- Weekdays: "monday", "next friday"
- Explicit: "jan 15", "2026-01-20"
- Time: "at 3pm", "9:00"

**Syntax:**
- Use `>` to separate title from date: `/task My task > monday`
- Without `>`, parser finds date at end of input

[Full syntax guide →](COMMAND_SYNTAX.md)

---

## Planned Features

### Deep Tasks ⏳

Tasks that expand into full Markdown documents.

**Planned Behavior:**
- Click any quick task to "bloom" into full editor
- Markdown rendering: headings, lists, code, links
- `[ ]` syntax creates interactive subtasks
- Collapse back to single-line view
- YAML frontmatter for metadata (priority, tags)

**Interaction:**
- Spring-based "bloom" animation on expand
- Editor appears inline or in side panel
- Auto-save with debounce

---

### Today View (Bento Dashboard) ⏳

Single dashboard for daily focus.

**Planned Layout:**
- Grid of tiles showing key information
- Today's task list (primary tile)
- Upcoming deadlines preview
- Optional: quick capture input
- Optional: "Clear the Deck" for yesterday's unfinished tasks

**Design:**
- Bento-style grid layout
- Clean, calm aesthetic
- Customizable tile arrangement (future)

---

### The Orbit ⏳

Non-temporal space for reference material.

**Planned Behavior:**
- Repository for notes that don't anchor to specific dates
- "Someday/Maybe" items live here
- Reference documents (guides, templates)
- Can "pull" items into the timeline when ready

---

## Design System

### Colors (Dark Mode)

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
--danger: #ef4444;
```

### Typography

- **Headings:** Inter or Outfit (clean, modern)
- **Body:** System font stack (performance)
- **Mono:** JetBrains Mono (code blocks)

### Interactions

| Action | Animation |
|--------|-----------|
| Task completion | Scale down + checkmark draw |
| Task bloom | Physics-based spring expansion |
| Overlays | Backdrop blur + fade in |
| Deletions | Slide out + fade |

### Glass Effects

- Modal overlays use backdrop-filter blur
- Completed tasks may recede visually
- Today surface elevated above past/future

---

## Data Architecture

### Storage

- **Primary:** IndexedDB via Dexie.js
- **Format:** Plain objects with Date fields
- **Offline:** Full functionality without network

### Future: Sync

- Optional cloud sync (not yet implemented)
- Markdown export always available
- User owns their data

---

*For implementation progress, see [roadmap.md](../roadmap.md). For philosophy, see [PHILOSOPHY.md](PHILOSOPHY.md).*
