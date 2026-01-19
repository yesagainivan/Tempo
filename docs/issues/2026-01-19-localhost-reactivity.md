# Issue: Localhost Task Reactivity (Ghost Tasks)

## Description
When running locally (localhost) without being signed in (using local-only PowerSync), adding a new task results in the task being added to the DOM (it interacts/clicks) but not appearing visually immediately.

## Context
-   **Environment**: Localhost, Strict Mode (likely), No Auth (Local DB).
-   **Behavior**: Task is added, list updates, but item is invisible or not rendering correctly.
-   **Comparison**: Deployed version (Auth enabled) works correctly.

## Attempts
-   Simplifying `TaskItem` animations (removing `animate={{ opacity }}`) did not resolve the issue.

## Potential Causes
1.  **Framer Motion / Layout Animations**: `AnimatePresence` or `layout` props in `DayAgenda` might be conflicting with the initial state of the new item in this specific environment.
2.  **PowerSync Local Latency**: The local SQLite (WASM) might have a slight delay or behavior difference in notifying the `useQuery` hook compared to the connected mode, causing a render blink.
3.  **Strict Mode**: React Strict Mode double-invokes effects, which might be messing up an animation initialization.

## Next Steps
-   Investigate `DayAgenda` list rendering.
-   Check if `completed` state is defaulting strangely.
-   Profile the DOM when the "ghost" task is present to see if it has `opacity: 0` or `height: 0`.
