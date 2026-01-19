import { useQuery } from '@powersync/tanstack-react-query';
import { startOfDay, subDays, differenceInDays } from 'date-fns';
import { useMemo } from 'react';

// =================================================================
// STATS HOOK
// =================================================================

export interface StatsData {
    currentStreak: number;
    longestStreak: number;
    totalCompleted: number;
    completionRate: {
        weekly: number; // Percentage 0-100
        monthly: number; // Percentage 0-100
    };
    heatmap: Map<string, number>; // Date string (YYYY-MM-DD) -> Count
}

export function useStats(): StatsData {
    // 1. Fetch Streak Data (Lightweight: just timestamps of completed tasks)
    // We strictly use completed_at for streaks.
    // Optimization: Only fetch `completed_at` column. sorting in SQL is fast.
    const { data: completedTimestamps = [] } = useQuery({
        queryKey: ['stats', 'timestamps'],
        query: `
            SELECT completed_at 
            FROM tasks 
            WHERE completed = 1 AND completed_at IS NOT NULL
            ORDER BY completed_at DESC
        `,
        initialData: [],
        select: (rows: any[]) => rows.map((r) => r.completed_at as number)
    });

    // 2. Fetch Completion Rates (Aggregates)
    // We need Total Created vs Total Completed in the last 7/30 days.
    // Note: This approximates "Total Created" using `created_at` or `due_date`?
    // "Completion Rate" usually implies: Of the tasks expected to be done this week, how many did you do?
    // Let's use `due_date` for the "denominator" (Planned) and `completed_at` for "numerator" (Effort).
    // Or simpler: Total tasks that exist vs Total tasks completed.

    // SQLite doesn't have great date functions in all versions, but PowerSync's usually supports strftime.
    // However, storing dates as ISO strings or timestamps matters. We store timestamps (presumably ms).
    // A safe efficient way is to compute the cutoff timestamp in JS and query against it.

    const now = new Date();
    const weekAgo = subDays(now, 7).getTime();
    const monthAgo = subDays(now, 30).getTime();

    const { data: ratesData } = useQuery({
        queryKey: ['stats', 'rates'],
        query: `
            SELECT 
                SUM(CASE WHEN due_date >= ? THEN 1 ELSE 0 END) as weeklyTotal,
                SUM(CASE WHEN completed = 1 AND completed_at >= ? THEN 1 ELSE 0 END) as weeklyDone,
                SUM(CASE WHEN due_date >= ? THEN 1 ELSE 0 END) as monthlyTotal,
                SUM(CASE WHEN completed = 1 AND completed_at >= ? THEN 1 ELSE 0 END) as monthlyDone
            FROM tasks
            WHERE deleted = 0
        `,
        parameters: [weekAgo, weekAgo, monthAgo, monthAgo],
        select: (rows: any[]) => {
            const r = rows[0];
            return r || { weeklyTotal: 0, weeklyDone: 0, monthlyTotal: 0, monthlyDone: 0 };
        }
    });

    const rates = (ratesData || { weeklyTotal: 0, weeklyDone: 0, monthlyTotal: 0, monthlyDone: 0 }) as {
        weeklyTotal: number;
        weeklyDone: number;
        monthlyTotal: number;
        monthlyDone: number;
    };


    return useMemo(() => {
        const today = startOfDay(now);

        // --- Heatmap Data ---
        // We can build this from the timestamps array efficiently
        const activityMap = new Map<string, number>();
        const uniqueDayTimestamps: number[] = [];

        completedTimestamps.forEach((ts) => {
            const date = new Date(ts);
            const dateStr = date.toISOString().split('T')[0];
            const dayStart = startOfDay(date).getTime();

            activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);

            // Dedup days for streak calc only (already sorted DESC)
            // Since completedTimestamps is sorted DESC, we only add if it's a new day.
            if (uniqueDayTimestamps.length === 0 || uniqueDayTimestamps[uniqueDayTimestamps.length - 1] !== dayStart) {
                uniqueDayTimestamps.push(dayStart);
            }
        });


        // --- Streak Calculation (O(N) on Days) ---
        // Since we have deduped, sorted timestamps, this loop is extremely efficient (N = number of active days).
        let currentStreak = 0;
        let longestStreak = 0;

        if (uniqueDayTimestamps.length > 0) {
            // Check if active today or ended yesterday
            const mostRecent = uniqueDayTimestamps[0];
            const diff = differenceInDays(today, mostRecent);

            // Streak is alive if most recent was Today (0) or Yesterday (1)
            if (diff <= 1) {
                currentStreak = 1;
                let prevDate = mostRecent;

                for (let i = 1; i < uniqueDayTimestamps.length; i++) {
                    const currentDate = uniqueDayTimestamps[i];
                    const dayDiff = differenceInDays(prevDate, currentDate);

                    if (dayDiff === 1) {
                        currentStreak++;
                        prevDate = currentDate;
                    } else {
                        break;
                    }
                }
            }

            // Longest Streak
            let tempStreak = 1;
            // If there's only one unique day, longest streak is 1.
            // The loop below correctly handles this if uniqueDayTimestamps.length > 0.
            if (uniqueDayTimestamps.length > 0) {
                let prevDate = uniqueDayTimestamps[0];
                for (let i = 1; i < uniqueDayTimestamps.length; i++) {
                    const currentDate = uniqueDayTimestamps[i];
                    const dayDiff = differenceInDays(prevDate, currentDate);

                    if (dayDiff === 1) {
                        tempStreak++;
                    } else {
                        longestStreak = Math.max(longestStreak, tempStreak);
                        tempStreak = 1;
                    }
                    prevDate = currentDate;
                }
                longestStreak = Math.max(longestStreak, tempStreak);
            }
        }

        // --- Rate Calculation ---
        const calcRate = (done: number, total: number) => {
            if (total === 0) return 0;
            return Math.round((done / total) * 100);
        };

        return {
            currentStreak,
            longestStreak,
            totalCompleted: completedTimestamps.length,
            completionRate: {
                weekly: calcRate(rates.weeklyDone, rates.weeklyTotal),
                monthly: calcRate(rates.monthlyDone, rates.monthlyTotal)
            },
            heatmap: activityMap
        };

    }, [completedTimestamps, rates]);
}
