import { useQuery } from '@powersync/react';
import { useMemo } from 'react';
import { startOfDay, subDays, differenceInDays } from 'date-fns';

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
    // 1. Fetch Aggregated Stats directly from SQL
    // completed_at is stored as a timestamp (ms)
    // We group by day to build the heatmap efficiently
    // date(completed_at / 1000, 'unixepoch') gives YYYY-MM-DD
    const { data: dailyCounts } = useQuery(`
        SELECT 
            date(completed_at / 1000, 'unixepoch', 'localtime') as day,
            count(*) as count 
        FROM tasks 
        WHERE completed = 1 AND completed_at IS NOT NULL
        GROUP BY day
        ORDER BY day DESC
    `);

    // 2. Fetch Completion Rates (Aggregates)
    const now = useMemo(() => new Date(), []);
    const weekAgo = subDays(now, 7).getTime();
    const monthAgo = subDays(now, 30).getTime();

    const { data: ratesRows } = useQuery(
        `SELECT 
            SUM(CASE WHEN due_date >= ? THEN 1 ELSE 0 END) as weeklyTotal,
            SUM(CASE WHEN completed = 1 AND completed_at >= ? THEN 1 ELSE 0 END) as weeklyDone,
            SUM(CASE WHEN due_date >= ? THEN 1 ELSE 0 END) as monthlyTotal,
            SUM(CASE WHEN completed = 1 AND completed_at >= ? THEN 1 ELSE 0 END) as monthlyDone
        FROM tasks`,
        [weekAgo, weekAgo, monthAgo, monthAgo]
    );

    const rates = useMemo(() => {
        const r = (ratesRows || [])[0];
        return (r || { weeklyTotal: 0, weeklyDone: 0, monthlyTotal: 0, monthlyDone: 0 }) as {
            weeklyTotal: number;
            weeklyDone: number;
            monthlyTotal: number;
            monthlyDone: number;
        };
    }, [ratesRows]);


    return useMemo(() => {
        const today = startOfDay(now);

        // --- Heatmap Data & Streak Calculation ---
        const activityMap = new Map<string, number>();
        const uniqueDayTimestamps: number[] = [];
        let totalCompleted = 0;

        // Process SQL results (already aggregated by day)
        // dailyCounts is [{ day: '2023-01-01', count: 5 }, ...]
        if (dailyCounts) {
            dailyCounts.forEach((row: { day: string; count: number }) => {
                const count = row.count;
                const dayStr = row.day;

                activityMap.set(dayStr, count);
                totalCompleted += count;

                // row.day is YYYY-MM-DD
                // const date = new Date(dayStr); // Unused

                // Adjust for timezone potentially? 
                // 'localtime' in SQL might help matching local date
                // But new Date(YYYY-MM-DD) is UTC usually. 
                // Let's ensure consistency.
                // If SQL returned '2025-02-11', new Date('2025-02-11') is UTC.
                // But we want local start of day for differenceInDays.
                // Actually, simplest is to just parse YYYY, MM, DD and make local date.
                const [y, m, d] = dayStr.split('-').map(Number);
                const localDate = new Date(y, m - 1, d);

                uniqueDayTimestamps.push(localDate.getTime());
            });
        }

        // --- Streak Calculation (O(N) on Active Days) ---
        let currentStreak = 0;
        let longestStreak = 0;

        if (uniqueDayTimestamps.length > 0) {
            // Check if active today or yesterday
            // uniqueDayTimestamps are sorted DESC by query
            const mostRecentTs = uniqueDayTimestamps[0];
            const mostRecentDate = new Date(mostRecentTs);
            const diff = differenceInDays(today, mostRecentDate);

            if (diff <= 1) {
                currentStreak = 1;
                let prevDate = mostRecentDate;

                for (let i = 1; i < uniqueDayTimestamps.length; i++) {
                    const currentDate = new Date(uniqueDayTimestamps[i]);
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
            if (uniqueDayTimestamps.length > 0) {
                let prevDate = new Date(uniqueDayTimestamps[0]);
                longestStreak = 1; // At least 1 if we have data

                for (let i = 1; i < uniqueDayTimestamps.length; i++) {
                    const currentDate = new Date(uniqueDayTimestamps[i]);
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
            totalCompleted,
            completionRate: {
                weekly: calcRate(rates.weeklyDone, rates.weeklyTotal),
                monthly: calcRate(rates.monthlyDone, rates.monthlyTotal)
            },
            heatmap: activityMap
        };

    }, [dailyCounts, rates, now]);
}
