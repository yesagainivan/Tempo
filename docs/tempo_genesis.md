# Tempo: Product Proposition

**Tagline:** *Time is the only folder.*

**Positioning:** The first agenda app designed for how attention actually works in 2026.

---

## The Problem

Modern productivity apps force you to choose:
- **Heavy ecosystems** (Notion) that require constant maintenance
- **Simple task lists** that lack context and nuance
- **Calendar apps** that ignore capacity and energy
- **Note apps** that disconnect planning from doing

The result? People spend more time organizing their productivity system than being productive.

---

## The Tempo Solution

Tempo is a **temporal-first planning app** that anchors everything to time, treats tasks as living documents, and provides honest visual feedback about your capacity.

### Core Philosophy: Three Principles

1. **Temporal Anchoring** — Time is the primary organizational axis, not folders or tags
2. **Task-Note Singularity** — Every task can expand into full context when needed
3. **Visual Honesty** — The interface shows you the truth about your capacity and patterns

---

## Key Features

### 1. The Infinite Timeline (Chronicle)
- Vertical scrolling through past, present, and future
- Every note and task lives at a point in time
- Scroll up for history, down for planning
- No folders, no complex hierarchies—just time

### 2. Two-Tier Task System

**Quick Tasks** — Simple, fast capture
- Just text: "Buy milk"
- Lives on the timeline at the date you specify
- Check it off and move on

**Deep Tasks** — Expandable Markdown notes
- Click any task to "bloom" it into full editor
- Add context, links, subtasks, code blocks
- The task *is* the note—move one, move both
- Agenda-style: notes anchor to calendar events

**Promotion Flow:** Quick tasks can be upgraded to Deep tasks with one click when you need more context.

### 3. The Bento Dashboard (Today View)

A customizable grid showing your daily essentials. Ships with three opinionated presets:

**Maker Mode**
- Deep work blocks (large tile)
- Energy level indicator
- Top 3 focus tasks
- Minimal meeting preview

**Manager Mode**
- Meeting notes (expandable)
- Quick task pipeline
- Team context tiles
- Calendar overview

**Hybrid Mode**
- Balanced layout
- Morning/afternoon split
- Context-switching support
- Flexible task zones

Users can customize from these foundations, not from scratch.

### 4. Visual Capacity Indicators

**Load Visualization**
- Days "glow" or increase weight as you add tasks
- Visual warning when over-scheduled
- Historical patterns: "You typically complete 5 tasks/day, you've scheduled 12"

**Energy Tracking** (Future AI Feature)
- Learns when you actually complete tasks
- Suggests optimal timing for deep work
- Warns: "You're scheduling focus work at 2pm, but you historically struggle then"

### 5. The Daily Ritual: "Clear the Deck"

Every morning (or session start), Tempo presents unfinished work from yesterday:

**Reflection, not cleanup:**
- Drag tasks to today (commit)
- Move to future dates (defer intentionally)
- Send to Orbit (acknowledge it's not priority)

**Pattern insights:**
- "You've moved this task 3 times—is it actually important?"
- "You completed everything Monday-Wednesday, then nothing Thursday-Friday"
- Visual trends, not shame

### 6. The Orbit (Non-Temporal Space)

For things that don't map to dates:
- Reference notes ("How to use espresso machine")
- Someday/Maybe items
- Project brainstorms not yet scheduled

**Relationship to Timeline:** Orbit items can be "pulled into orbit" of specific dates—they hover nearby without hard anchoring.

### 7. The Command Bar (`Cmd/Ctrl + K`)

Lightning-fast creation:
- `/task Buy milk tomorrow` → Creates quick task
- `/meeting 3pm Project X` → Creates deep task with template
- `/note Design principles` → Creates orbit note
- Natural language parsing for dates/times

### 8. Markdown-Native Throughout

- All deep tasks use standard Markdown
- `[ ]` checkbox syntax auto-creates subtasks
- Code blocks, tables, links all supported
- Export to plain `.md` files anytime

---

## What Makes Tempo Different

| Aspect | Traditional Apps | Tempo |
|--------|-----------------|-------|
| **Organization** | Folders, tags, databases | Single timeline + Orbit |
| **Tasks** | Simple checkboxes or heavy project management | Two-tier: Quick + Deep (Markdown) |
| **Planning** | Static lists | Visual capacity + energy awareness |
| **Feel** | Rigid and work-like | Tactile, fluid, honest |
| **Philosophy** | "Organize everything" | "Plan what matters, when it matters" |

---

## Design Principles (2026 Aesthetic)

### Calm UI + Tactile Maximalism

**Visual Language:**
- Glassmorphic depth: Completed tasks recede into blurred background
- Squishy interactions: Checkboxes have haptic resistance
- Ambient gradients: Energy levels glow with color
- Spatial transitions: Tasks "bloom" with physics-based animation

**Interaction Philosophy:**
- Every action should feel satisfying
- Visual feedback is immediate and honest
- The UI shows capacity, not just content
- Beauty serves function, never obscures it

### Performance Targets
- Infinite scroll must be buttery (virtualized rendering)
- Markdown rendering instant (<16ms)
- Local-first: works offline, syncs seamlessly
- Export to plain text always available

---

## Technical Foundation

### Data Architecture
- **Local-first:** Plain Markdown files stored locally
- **Sync layer:** Optional cloud sync (encrypted)
- **Format:** Standard `.md` with YAML frontmatter for metadata
- **Portability:** Users own their data, can export anytime

### Platform Strategy
- **Phase 1:** Desktop (Electron or Tauri for native feel)
- **Phase 2:** Mobile (iOS/Android) with adapted UI
- **Phase 3:** Web app for quick access

### Mobile Adaptation
- Timeline becomes horizontal swipe through days
- Bento grid collapses to vertical cards
- Command bar becomes bottom sheet
- Quick capture prioritized over deep editing

---

## Competitive Positioning

### Not Competing Directly With:
- **Notion/Anytype:** Too heavy, database-focused
- **Obsidian:** Pure knowledge management, not planning-first
- **Todoist/Things:** Too simple, no context

### Head-to-Head With:
- **Sunsama/Akiflow:** Similar calm productivity focus
- **Amie:** Visual, joyful planning
- **Structured:** Timeline-based task management

### Tempo's Advantages:
1. **Markdown-native** (appeals to developers, writers, knowledge workers)
2. **Two-tier system** (flexibility without complexity)
3. **Visual honesty** (capacity awareness built-in)
4. **Local-first** (privacy, speed, ownership)
5. **Temporal anchoring** (time as organizational principle)

---

## User Personas

### Primary: "The Thoughtful Maker"
- Knowledge worker (developer, designer, writer)
- Values context and deep work
- Currently uses Obsidian + calendar, frustrated by disconnect
- Wants beauty but refuses complexity
- Age: 25-45, tech-comfortable

### Secondary: "The Intentional Manager"
- Leads team, many meetings
- Drowning in tasks from multiple sources
- Wants to be strategic, not just reactive
- Needs quick capture with option for depth
- Age: 30-50, values calm over chaos

### Tertiary: "The Creative Hybrid"
- Freelancer or multi-hyphenate
- Projects vary wildly day-to-day
- Needs flexible planning that adapts
- Aesthetic matters (tool as environment)
- Age: 22-40, values personality in tools

---

## Monetization Strategy

### Freemium Model

**Free Tier:**
- Unlimited quick tasks
- 50 deep tasks (Markdown notes)
- Local storage only
- Basic Bento dashboard
- Community templates

**Pro Tier ($8/month or $80/year):**
- Unlimited deep tasks
- Cloud sync across devices
- All Bento presets + custom layouts
- Energy tracking & AI insights
- Advanced templates & workflows
- Priority support

**Team Tier ($12/user/month):**
- Shared team Orbit (reference docs)
- Meeting note collaboration
- Team capacity views
- Admin controls
- SSO (for enterprise)

---

## Success Metrics

### Engagement
- **Daily Active Usage:** 5+ days/week target
- **Task Completion Rate:** Track honesty of planning vs. doing
- **Retention:** 60% monthly retention in first 6 months

### Product Health
- **Quick vs. Deep Task Ratio:** Monitor balance (target 70/30)
- **Bento Customization:** % who customize vs. use presets
- **Clear the Deck Completion:** % who engage with daily ritual

### Business
- **Free-to-Pro Conversion:** 5% target in first year
- **Churn:** <5% monthly for Pro tier
- **NPS:** 50+ (productivity apps average 30-40)

---

## Roadmap

### Phase 1: MVP (Months 1-4)
- Infinite timeline with basic navigation
- Quick task creation + two-tier system
- One Bento preset (Hybrid mode)
- Local storage only
- Command bar with basic parsing
- macOS/Windows desktop app

### Phase 2: Visual Polish (Months 5-6)
- All three Bento presets
- Squishy UI interactions
- Glassmorphic design system
- Orbit space for non-temporal notes
- Clear the Deck ritual
- Markdown export

### Phase 3: Intelligence (Months 7-9)
- Pattern recognition for capacity
- Energy level tracking
- Smart scheduling suggestions
- Recurring task templates
- Cloud sync (Pro tier launch)

### Phase 4: Mobile (Months 10-12)
- iOS app with adapted UI
- Quick capture widgets
- Mobile-optimized Bento
- Cross-platform sync

### Phase 5: Collaboration Light (Year 2)
- Shared Orbit for teams
- Meeting note collaboration
- External task bridges (Slack, email)
- Team capacity views

---

## Why Tempo Will Win

1. **Opinionated, not infinite:** We solve one workflow brilliantly, not everything poorly
2. **Markdown appeals to builders:** The people who influence tool choices love Markdown
3. **Visual honesty is novel:** No one else shows capacity this clearly
4. **Local-first builds trust:** Privacy and speed matter more in 2026
5. **Calm vs. chaos:** We're anti-anxiety in an anxiety-inducing category

---

## The Tempo Promise

**We help you plan with honesty, work with context, and reflect with compassion.**

Not another productivity system. A thinking environment that respects time.